/**
 * features/import-excel/resolver.ts
 *
 * Responsabilidad única: dado un conjunto de nombres crudos del Excel,
 * devolver resoluciones de jugadores y equipos consultando la DB en batch.
 *
 * Estrategia de queries (máximo 4, independiente del tamaño del Excel):
 *   1. Batch similarity scoped a ciudad  (unnest — todos los nombres juntos)
 *   2. Batch similarity global fallback  (unnest — solo los no resueltos en #1)
 *   3. Enrich candidatos con equipos activos  (inArray — todos los IDs juntos)
 *   4. Equipos existentes en la liga  (findMany — una query)
 *
 * Antes: N queries de similitud secuenciales (una por jugador).
 * Ahora: 2–4 queries totales sin importar cuántos jugadores haya.
 *
 * Exportaciones públicas:
 *   resolveImportEntities(input) → ResolverOutput
 */

import { sql } from "drizzle-orm";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { db, leagues, playerRegistrations, teams } from "@/db";

// ---------------------------------------------------------------------------
// Constantes de matching
// ---------------------------------------------------------------------------

/** Umbral mínimo de similitud trigrama para considerar un candidato. */
const SIMILARITY_THRESHOLD = 0.45;

/**
 * Score mínimo para que un candidato se considere "dominante".
 * Si el top candidato supera este score Y su ventaja sobre el segundo
 * es ≥ DOMINANT_GAP_MIN, se auto-confirma sin requerir selección manual.
 */
const DOMINANT_SCORE_MIN = 0.65;
const DOMINANT_GAP_MIN = 0.25;

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type CandidateTeam = {
	teamName: string;
	leagueName: string;
};

export type PlayerCandidate = {
	id: string;
	fullName: string;
	alias: string | null;
	teams: CandidateTeam[];
};

export type PlayerResolution = {
	rawName: string;
	teamName: string;
	/** true si se encontró exactamente 1 candidato o hay un candidato dominante */
	found: boolean;
	/** playerId del candidato auto-confirmado (solo si found=true) */
	playerId?: string;
	candidates: PlayerCandidate[];
};

export type ResolverInput = {
	/** Nombres únicos de jugadores tal como vienen del Excel (ya sanitizados) */
	playerNames: string[];
	/** Nombres únicos de equipos tal como vienen del Excel (ya sanitizados) */
	teamNames: string[];
	leagueId: string;
	city: string;
};

export type ResolverOutput = {
	playerResolutions: PlayerResolution[];
	/**
	 * Mapa de nombre normalizado → teamId existente en la liga, o null si no existe.
	 * Los equipos con null deberán crearse durante el confirm.
	 */
	teamMap: Map<string, string | null>;
};

// ---------------------------------------------------------------------------
// Tipo interno para filas de la query de similitud
// ---------------------------------------------------------------------------

type SimilarityRow = {
	query_name: string;
	id: string;
	full_name: string;
	alias: string | null;
	score: number;
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Resuelve jugadores y equipos contra la DB en batch.
 * Máximo 4 queries independientemente del tamaño del input.
 */
export async function resolveImportEntities(
	input: ResolverInput,
): Promise<ResolverOutput> {
	const { playerNames, teamNames, leagueId, city } = input;

	const [playerResolutions, teamMap] = await Promise.all([
		resolvePlayersBatch(playerNames, city),
		resolveTeamsBatch(teamNames, leagueId),
	]);

	return { playerResolutions, teamMap };
}

// ---------------------------------------------------------------------------
// Resolución de jugadores — batch fuzzy matching
// ---------------------------------------------------------------------------

async function resolvePlayersBatch(
	names: string[],
	city: string,
): Promise<PlayerResolution[]> {
	if (names.length === 0) return [];

	// ── Query 1: city-scoped batch similarity ─────────────────────────────────
	// Resuelve todos los nombres en una sola query usando unnest.
	// Drizzle no soporta unnest como función de tabla — usamos db.execute(sql``)
	// que es el patrón aprobado en CLAUDE.md para operaciones no soportadas.
	const cityRows = await db.execute<SimilarityRow>(sql`
    SELECT DISTINCT ON (query_name, p.id)
      query_name,
      p.id,
      p.full_name,
      p.alias,
      GREATEST(
        similarity(f_unaccent(p.full_name), f_unaccent(query_name)),
        COALESCE(similarity(f_unaccent(p.alias), f_unaccent(query_name)), 0)
      ) AS score
    FROM unnest(${sql.raw(`ARRAY[${names.map((n) => `'${escapeSql(n)}'`).join(", ")}]::text[]`)}
    ) AS query_name
    CROSS JOIN players p
    WHERE (
      similarity(f_unaccent(p.full_name), f_unaccent(query_name)) > ${SIMILARITY_THRESHOLD}
      OR (p.alias IS NOT NULL
          AND similarity(f_unaccent(p.alias), f_unaccent(query_name)) > ${SIMILARITY_THRESHOLD})
    )
    AND EXISTS (
      SELECT 1
      FROM player_registrations pr
      JOIN leagues l ON l.id = pr.league_id
      WHERE pr.player_id = p.id
        AND l.city = ${city}
    )
    ORDER BY query_name, p.id, score DESC
  `);

	// Agrupar resultados de city por query_name
	const cityByName = groupByQueryName(cityRows.rows);

	// Identificar nombres sin resultado en city → necesitan fallback global
	const unresolvedNames = names.filter((n) => !cityByName.has(n));

	// ── Query 2: global fallback (solo para nombres no resueltos en ciudad) ───
	let globalByName = new Map<string, SimilarityRow[]>();

	if (unresolvedNames.length > 0) {
		const globalRows = await db.execute<SimilarityRow>(sql`
      SELECT
        query_name,
        p.id,
        p.full_name,
        p.alias,
        GREATEST(
          similarity(f_unaccent(p.full_name), f_unaccent(query_name)),
          COALESCE(similarity(f_unaccent(p.alias), f_unaccent(query_name)), 0)
        ) AS score
      FROM unnest(${sql.raw(`ARRAY[${unresolvedNames.map((n) => `'${escapeSql(n)}'`).join(", ")}]::text[]`)}
      ) AS query_name
      CROSS JOIN players p
      WHERE
        similarity(f_unaccent(p.full_name), f_unaccent(query_name)) > ${SIMILARITY_THRESHOLD}
        OR (p.alias IS NOT NULL
            AND similarity(f_unaccent(p.alias), f_unaccent(query_name)) > ${SIMILARITY_THRESHOLD})
      ORDER BY query_name, score DESC
    `);

		globalByName = groupByQueryName(globalRows.rows);
	}

	// Combinar: city tiene prioridad, global como fallback
	const allMatchesByName = new Map<string, SimilarityRow[]>();
	for (const name of names) {
		allMatchesByName.set(
			name,
			cityByName.get(name) ?? globalByName.get(name) ?? [],
		);
	}

	// ── Query 3: enrich con equipos activos (batch por IDs) ───────────────────
	const allCandidateIds = [
		...new Set([...allMatchesByName.values()].flat().map((r) => r.id)),
	];
	const enrichedCandidates = await enrichWithActiveTeams(allCandidateIds);
	const candidateMap = new Map(enrichedCandidates.map((c) => [c.id, c]));

	// ── Construir resoluciones finales ────────────────────────────────────────
	return names.map((name) => {
		const matches = (allMatchesByName.get(name) ?? [])
			.sort((a, b) => b.score - a.score)
			.slice(0, 5);

		const candidates: PlayerCandidate[] = matches.map((m) => ({
			id: m.id,
			fullName: m.full_name,
			alias: m.alias,
			teams: candidateMap.get(m.id)?.teams ?? [],
		}));

		return classify(name, matches, candidates);
	});
}

// ---------------------------------------------------------------------------
// Resolución de equipos — una query con ilike batch
// ---------------------------------------------------------------------------

async function resolveTeamsBatch(
	teamNames: string[],
	leagueId: string,
): Promise<Map<string, string | null>> {
	const teamMap = new Map<string, string | null>(
		teamNames.map((n) => [n, null]),
	);

	if (teamNames.length === 0) return teamMap;

	// ── Query 4: equipos existentes en la liga ────────────────────────────────
	// Usamos ilike con OR para cubrir variaciones menores de mayúsculas/acentos.
	// Para listas grandes esto sigue siendo una sola query.
	const existingTeams = await db.query.teams.findMany({
		where: and(
			eq(teams.leagueId, leagueId),
			inArray(
				teams.name,
				teamNames, // exact match primero (sanitizeName ya normalizó a lowercase)
			),
		),
		columns: { id: true, name: true },
	});

	// Primer paso: exact match (sanitizeName garantiza lowercase en ambos lados)
	for (const team of existingTeams) {
		teamMap.set(team.name, team.id);
	}

	// Segundo paso: fuzzy ilike para nombres que no matchearon exacto
	// (diferencias de espacios, tildes que no pasaron por sanitizeName, etc.)
	const stillUnresolved = teamNames.filter((n) => teamMap.get(n) === null);

	if (stillUnresolved.length > 0) {
		for (const name of stillUnresolved) {
			const found = await db.query.teams.findFirst({
				where: and(ilike(teams.name, name), eq(teams.leagueId, leagueId)),
				columns: { id: true },
			});
			if (found) teamMap.set(name, found.id);
		}
	}

	return teamMap;
}

// ---------------------------------------------------------------------------
// Enrich con equipos activos — batch por IDs (Query 3)
// ---------------------------------------------------------------------------

async function enrichWithActiveTeams(
	playerIds: string[],
): Promise<PlayerCandidate[]> {
	if (playerIds.length === 0) return [];

	const rows = await db
		.select({
			playerId: playerRegistrations.playerId,
			teamName: teams.name,
			leagueName: leagues.name,
		})
		.from(playerRegistrations)
		.innerJoin(teams, eq(teams.id, playerRegistrations.teamId))
		.innerJoin(leagues, eq(leagues.id, playerRegistrations.leagueId))
		.where(
			and(
				inArray(playerRegistrations.playerId, playerIds),
				eq(leagues.status, "active"),
			),
		)
		.orderBy(desc(leagues.createdAt));

	// Agrupar por playerId
	const teamsByPlayer = new Map<string, CandidateTeam[]>();
	for (const row of rows) {
		const list = teamsByPlayer.get(row.playerId) ?? [];
		list.push({ teamName: row.teamName, leagueName: row.leagueName });
		teamsByPlayer.set(row.playerId, list);
	}

	return playerIds.map((id) => ({
		id,
		fullName: "", // se sobreescribe en el caller con full_name de la query de similitud
		alias: null,
		teams: teamsByPlayer.get(id) ?? [],
	}));
}

// ---------------------------------------------------------------------------
// Clasificar una resolución de jugador
// ---------------------------------------------------------------------------

function classify(
	rawName: string,
	matches: SimilarityRow[],
	candidates: PlayerCandidate[],
): PlayerResolution {
	// Sin candidatos → jugador nuevo
	if (matches.length === 0) {
		return { rawName, teamName: "", found: false, candidates: [] };
	}

	// Match exacto o único candidato → auto-confirmar
	const isExact = matches[0].score >= 0.95;
	const isUnique = matches.length === 1;

	if (isExact || isUnique) {
		return {
			rawName,
			teamName: candidates[0]?.teams[0]?.teamName ?? "",
			found: true,
			playerId: matches[0].id,
			candidates,
		};
	}

	// Candidato dominante: score alto y ventaja clara sobre el segundo
	const isDominant =
		matches[0].score >= DOMINANT_SCORE_MIN &&
		matches[0].score - matches[1].score >= DOMINANT_GAP_MIN;

	if (isDominant) {
		return {
			rawName,
			teamName: candidates[0]?.teams[0]?.teamName ?? "",
			found: true,
			playerId: matches[0].id,
			candidates,
		};
	}

	// Ambiguo → requiere selección manual
	return { rawName, teamName: "", found: false, candidates };
}

// ---------------------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------------------

/** Agrupa filas de similitud por query_name, ordenadas por score desc. */
function groupByQueryName(rows: SimilarityRow[]): Map<string, SimilarityRow[]> {
	const map = new Map<string, SimilarityRow[]>();
	for (const row of rows) {
		const list = map.get(row.query_name) ?? [];
		list.push(row);
		map.set(row.query_name, list);
	}
	// ordenar cada grupo por score desc
	for (const [key, list] of map) {
		map.set(
			key,
			list.sort((a, b) => b.score - a.score),
		);
	}
	return map;
}

/**
 * Escapa comillas simples en strings para inserción segura en sql.raw().
 * Se usa exclusivamente para construir el array literal de PostgreSQL en unnest.
 * Los parámetros $N de Drizzle no soportan unnest como tabla — este es el
 * único lugar donde se construye SQL con valores de usuario.
 */
function escapeSql(value: string): string {
	return value.replace(/'/g, "''").replace(/\\/g, "\\\\");
}
