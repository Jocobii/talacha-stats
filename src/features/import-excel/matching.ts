/**
 * features/import-excel/matching.ts
 *
 * Motor de matching por capas (Historia 03).
 * Reemplaza la lógica de resolver.ts para el flujo basado en player_profiles.
 *
 * Pipeline por fila:
 *   L1 — Exact intra-league:   normalized_name + league_id   → auto_resolved L1
 *   L2 — Exact intra-org:      normalized_name + org_id       → auto_resolved L2
 *   L3 — Fuzzy intra-org:      pg_trgm similarity > threshold → intra_org_doubt
 *   L4 — Exact cross-org:      players.normalized_name global → cross_org_suggestion
 *                               (feature flag CROSS_ORG_SUGGESTIONS)
 *   L5 — Default:              → create_new
 *
 * Exportaciones públicas:
 *   matchRows(rows, ctx)  → MatchOutcome[]   (batch — máximo 4 queries independiente del tamaño)
 *   matchRow(row, ctx)    → MatchOutcome     (unitaria — delega a matchRows)
 *
 * Implementación batch:
 *   En lugar de N queries por fila (una por jugador), ejecuta:
 *     Q1 — L1 bulk: todos los nombres contra player_profiles de la misma liga
 *     Q2 — L2 bulk: nombres sin L1 contra player_profiles de la misma org
 *     Q3 — L3 bulk: nombres sin L1/L2 con pg_trgm similarity (unnest)
 *     Q4 — L4 bulk: nombres sin match intra-org contra players globales (si flag ON)
 *   + enrich: una query para obtener leagueName de cada candidato
 */

import { sql, eq, and, inArray } from "drizzle-orm";
import { db, playerProfiles, playerRegistrations, leagues, players } from "@/db";
import { normalizePlayerName, fingerprintPlayer } from "@/shared/lib/normalize";
import { flags } from "@/shared/config/flags";
import type { ParsedRow, MatchOutcome, ProfileCandidate, GlobalCandidate } from "./types";

// ---------------------------------------------------------------------------
// Constantes de matching
// ---------------------------------------------------------------------------

/** Umbral de similitud trigrama para L3. Probado en resolver.ts con SIMILARITY_THRESHOLD=0.45.
 *  Para L3 usamos 0.35 (más permisivo) porque el universo ya está scoped a la org. */
const L3_SIMILARITY_THRESHOLD = 0.35;

/** Score mínimo para incluir un candidato L3 en la lista de dudas (0-100). */
const L3_SCORE_MIN = 50;

/** Máximo de candidatos L3 por fila. */
const L3_MAX_CANDIDATES = 10;

/** Máximo de candidatos L4 por fila. */
const L4_MAX_CANDIDATES = 3;

// ---------------------------------------------------------------------------
// Contexto de matching
// ---------------------------------------------------------------------------

export type MatchContext = {
	organizationId: string;
	leagueId: string;
	/** Si true, activa L4 cross-org suggestions. Controlado por flags.CROSS_ORG_SUGGESTIONS. */
	crossOrgEnabled?: boolean;
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Procesa un array de filas contra la DB en batch.
 * Número de queries constante (≤ 4) independiente del tamaño del input.
 */
export async function matchRows(rows: ParsedRow[], ctx: MatchContext): Promise<MatchOutcome[]> {
	if (rows.length === 0) return [];

	const crossOrgEnabled = ctx.crossOrgEnabled ?? flags.CROSS_ORG_SUGGESTIONS;

	// Mapa de trabajo: normalized_name → rows[] (puede haber duplicados de nombre)
	const byName = new Map<string, ParsedRow[]>();
	for (const row of rows) {
		const list = byName.get(row.normalizedName) ?? [];
		list.push(row);
		byName.set(row.normalizedName, list);
	}

	const allNames = [...byName.keys()];

	// Outcomes finales — se irán rellenando capa por capa
	const outcomes = new Map<string, MatchOutcome>(); // key: fingerprint

	// ── L1: Exact intra-league ────────────────────────────────────────────────
	const l1Results = await queryExactIntraLeague(allNames, ctx.organizationId, ctx.leagueId);
	const l1ByName = new Map(l1Results.map((r) => [r.normalized_name, r.profile_id]));

	for (const [name, rowList] of byName) {
		if (l1ByName.has(name)) {
			for (const row of rowList) {
				outcomes.set(row.fingerprint, {
					kind: "auto_resolved",
					profileId: l1ByName.get(name)!,
					via: "L1",
					crossLeagueLink: false,
					row,
				});
			}
		}
	}

	// ── L2: Exact intra-org cross-league ──────────────────────────────────────
	const unresolvedAfterL1 = allNames.filter((n) => !l1ByName.has(n));
	if (unresolvedAfterL1.length > 0) {
		const l2Results = await queryExactIntraOrg(
			unresolvedAfterL1,
			ctx.organizationId,
			ctx.leagueId,
		);

		for (const result of l2Results) {
			const rowList = byName.get(result.normalized_name) ?? [];
			for (const row of rowList) {
				if (!outcomes.has(row.fingerprint)) {
					if (result.count === 1) {
						// Único match → auto-link L2
						outcomes.set(row.fingerprint, {
							kind: "auto_resolved",
							profileId: result.profile_id,
							via: "L2",
							crossLeagueLink: true,
							row,
						});
					} else {
						// Múltiples perfiles con el mismo nombre → tratar como duda
						// (raro pero defensivo: dos hermanos con mismo apellido en la misma org)
						outcomes.set(row.fingerprint, {
							kind: "intra_org_doubt",
							candidates: result.candidates,
							row,
						});
					}
				}
			}
		}
	}

	// ── L3: Fuzzy intra-org ───────────────────────────────────────────────────
	const unresolvedAfterL2 = rows.filter((r) => !outcomes.has(r.fingerprint));
	const unresolvedNamesL3 = [...new Set(unresolvedAfterL2.map((r) => r.normalizedName))];

	if (unresolvedNamesL3.length > 0) {
		const l3Results = await queryFuzzyIntraOrg(unresolvedNamesL3, ctx.organizationId);
		const l3ByName = new Map<string, ProfileCandidate[]>();
		for (const result of l3Results) {
			const list = l3ByName.get(result.query_name) ?? [];
			list.push(result.candidate);
			l3ByName.set(result.query_name, list);
		}

		for (const row of unresolvedAfterL2) {
			if (outcomes.has(row.fingerprint)) continue;
			const candidates = (l3ByName.get(row.normalizedName) ?? [])
				.filter((c) => c.score >= L3_SCORE_MIN)
				.sort((a, b) => b.score - a.score)
				.slice(0, L3_MAX_CANDIDATES);

			if (candidates.length > 0) {
				outcomes.set(row.fingerprint, {
					kind: "intra_org_doubt",
					candidates,
					row,
				});
			}
		}
	}

	// ── L4: Exact cross-org (feature flag) ────────────────────────────────────
	if (crossOrgEnabled) {
		const unresolvedAfterL3 = rows.filter((r) => !outcomes.has(r.fingerprint));
		const unresolvedNamesL4 = [...new Set(unresolvedAfterL3.map((r) => r.normalizedName))];

		if (unresolvedNamesL4.length > 0) {
			const l4Results = await queryCrossOrg(unresolvedNamesL4, ctx.organizationId);
			const l4ByName = new Map<string, GlobalCandidate[]>();
			for (const result of l4Results) {
				const list = l4ByName.get(result.query_name) ?? [];
				list.push(result.candidate);
				l4ByName.set(result.query_name, list);
			}

			for (const row of unresolvedAfterL3) {
				if (outcomes.has(row.fingerprint)) continue;
				const candidates = (l4ByName.get(row.normalizedName) ?? []).slice(0, L4_MAX_CANDIDATES);
				if (candidates.length > 0) {
					outcomes.set(row.fingerprint, {
						kind: "cross_org_suggestion",
						candidates,
						row,
					});
				}
			}
		}
	}

	// ── L5: Default — create_new ──────────────────────────────────────────────
	for (const row of rows) {
		if (!outcomes.has(row.fingerprint)) {
			outcomes.set(row.fingerprint, { kind: "create_new", row });
		}
	}

	// Preservar orden original del input
	return rows.map((row) => outcomes.get(row.fingerprint)!);
}

/**
 * Procesa una sola fila. Delega a matchRows (una query por capa).
 * Para procesar múltiples filas preferir matchRows() directamente.
 */
export async function matchRow(row: ParsedRow, ctx: MatchContext): Promise<MatchOutcome> {
	const [outcome] = await matchRows([row], ctx);
	return outcome;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Calcula un score 0-100 para un candidato intra-org dado una fila del Excel.
 * Se complementa con el similarity score de pg_trgm (que ya aporta la base).
 */
export function scoreCandidate(
	row: ParsedRow,
	candidate: { normalizedName: string; alias: string | null; fingerprint: string },
	trigramScore: number, // 0-1, de pg_trgm
): number {
	let score = Math.round(trigramScore * 60); // base: trigram aporta hasta 60 puntos

	// Apellido coincide (primera palabra del nombre normalizado)
	const rowLastName = row.normalizedName.split(" ")[0];
	const candidateLastName = candidate.normalizedName.split(" ")[0];
	if (rowLastName && candidateLastName && rowLastName === candidateLastName) score += 20;

	// Alias coincide
	if (candidate.alias && row.alias && normalizePlayerName(candidate.alias) === normalizePlayerName(row.alias)) {
		score += 10;
	}

	// Dorsal coincide (tie-breaker)
	if (row.jerseyNumber != null) {
		const candidateJersey = candidate.fingerprint.split("::")[1];
		if (candidateJersey && parseInt(candidateJersey, 10) === row.jerseyNumber) score += 10;
	}

	return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Queries privadas
// ---------------------------------------------------------------------------

type L1Result = { normalized_name: string; profile_id: string };

/** L1: busca coincidencias exactas de normalized_name dentro de la liga actual. */
async function queryExactIntraLeague(
	names: string[],
	organizationId: string,
	leagueId: string,
): Promise<L1Result[]> {
	if (names.length === 0) return [];

	const rows = await db
		.select({
			normalizedName: playerProfiles.normalizedName,
			profileId: playerProfiles.id,
		})
		.from(playerProfiles)
		.innerJoin(
			playerRegistrations,
			and(
				eq(playerRegistrations.playerProfileId, playerProfiles.id),
				eq(playerRegistrations.leagueId, leagueId),
			),
		)
		.where(
			and(
				eq(playerProfiles.organizationId, organizationId),
				inArray(playerProfiles.normalizedName, names),
			),
		);

	return rows.map((r) => ({
		normalized_name: r.normalizedName,
		profile_id: r.profileId,
	}));
}

type L2Candidate = ProfileCandidate;
type L2Result = {
	normalized_name: string;
	profile_id: string;
	count: number;
	candidates: L2Candidate[];
};

/** L2: busca coincidencias exactas de normalized_name dentro de la org (cualquier liga). */
async function queryExactIntraOrg(
	names: string[],
	organizationId: string,
	leagueId: string,
): Promise<L2Result[]> {
	if (names.length === 0) return [];

	// Obtener todos los perfiles con ese nombre dentro de la org
	const rows = await db
		.select({
			normalizedName: playerProfiles.normalizedName,
			profileId: playerProfiles.id,
			fullName: playerProfiles.fullName,
			alias: playerProfiles.alias,
			fingerprint: playerProfiles.fingerprint,
		})
		.from(playerProfiles)
		.where(
			and(
				eq(playerProfiles.organizationId, organizationId),
				inArray(playerProfiles.normalizedName, names),
			),
		);

	if (rows.length === 0) return [];

	// Enrich con leagueName (última liga de cada perfil, scoped a la org)
	const profileIds = rows.map((r) => r.profileId);
	const leagueNames = await enrichWithLeagueNames(profileIds, organizationId);

	// Agrupar por normalized_name
	const byName = new Map<string, typeof rows>();
	for (const row of rows) {
		const list = byName.get(row.normalizedName) ?? [];
		list.push(row);
		byName.set(row.normalizedName, list);
	}

	const results: L2Result[] = [];
	for (const [name, profiles] of byName) {
		const candidates: L2Candidate[] = profiles.map((p) => ({
			profileId: p.profileId,
			fullName: p.fullName,
			alias: p.alias,
			leagueName: leagueNames.get(p.profileId) ?? "",
			score: 100, // exact match
			reason: "coincidencia exacta en otra liga de la misma organización",
		}));

		results.push({
			normalized_name: name,
			profile_id: profiles[0].profileId,
			count: profiles.length,
			candidates,
		});
	}

	return results;
}

type L3ResultRow = { query_name: string; candidate: ProfileCandidate };

/**
 * L3: fuzzy intra-org usando pg_trgm similarity sobre normalized_name.
 * Usa unnest para el batch — misma técnica que resolver.ts.
 */
async function queryFuzzyIntraOrg(names: string[], organizationId: string): Promise<L3ResultRow[]> {
	if (names.length === 0) return [];

	const nameArray = `ARRAY[${names.map((n) => `'${escapeSql(n)}'`).join(", ")}]::text[]`;

	const rawRows = await db.execute<{
		query_name: string;
		profile_id: string;
		full_name: string;
		alias: string | null;
		fingerprint: string;
		normalized_name: string;
		score: number;
	}>(sql`
    SELECT DISTINCT ON (query_name, p.id)
      query_name,
      p.id         AS profile_id,
      p.full_name,
      p.alias,
      p.fingerprint,
      p.normalized_name,
      similarity(f_unaccent(p.normalized_name), f_unaccent(query_name)) AS score
    FROM unnest(${sql.raw(nameArray)}) AS query_name
    CROSS JOIN player_profiles p
    WHERE p.organization_id = ${organizationId}
      AND similarity(f_unaccent(p.normalized_name), f_unaccent(query_name)) > ${L3_SIMILARITY_THRESHOLD}
    ORDER BY query_name, p.id, score DESC
  `);

	if (rawRows.rows.length === 0) return [];

	// Enrich con leagueName
	const profileIds = [...new Set(rawRows.rows.map((r) => r.profile_id))];
	const leagueNames = await enrichWithLeagueNames(profileIds, organizationId);

	return rawRows.rows.map((r) => {
		const trigramScore = Number(r.score);
		const candidate: ProfileCandidate = {
			profileId: r.profile_id,
			fullName: r.full_name,
			alias: r.alias,
			leagueName: leagueNames.get(r.profile_id) ?? "",
			score: scoreCandidate(
				// mock ParsedRow para scoring — solo usamos los campos necesarios
				{ normalizedName: r.query_name, alias: undefined, jerseyNumber: undefined, fingerprint: "" } as unknown as ParsedRow,
				{ normalizedName: r.normalized_name, alias: r.alias, fingerprint: r.fingerprint },
				trigramScore,
			),
			reason: `similitud trigrama: ${(trigramScore * 100).toFixed(0)}%`,
		};
		return { query_name: r.query_name, candidate };
	});
}

type L4ResultRow = { query_name: string; candidate: GlobalCandidate };

/**
 * L4: cross-org exact match sobre players (identidades globales).
 * ⚠️ NUNCA devolver nombres de orgs ajenas, ligas ni stats.
 * Solo playerId, canonicalName y conteo agregado de orgs.
 */
async function queryCrossOrg(names: string[], organizationId: string): Promise<L4ResultRow[]> {
	if (names.length === 0) return [];

	const nameArray = `ARRAY[${names.map((n) => `'${escapeSql(n)}'`).join(", ")}]::text[]`;

	const rawRows = await db.execute<{
		query_name: string;
		player_id: string;
		canonical_name: string;
		appearances_count: string;
	}>(sql`
    SELECT
      query_name,
      p.id                                           AS player_id,
      p.full_name                                    AS canonical_name,
      COUNT(DISTINCT pp.organization_id)             AS appearances_count
    FROM unnest(${sql.raw(nameArray)}) AS query_name
    JOIN players p ON f_unaccent(lower(p.full_name)) = f_unaccent(query_name)
    -- Solo incluir si tiene al menos un perfil en OTRA org
    JOIN player_profiles pp ON pp.claimed_player_id = p.id
    WHERE pp.organization_id != ${organizationId}
    -- Excluir si esta org ya tiene un claim verificado para este player
    AND NOT EXISTS (
      SELECT 1 FROM player_profiles pp2
      WHERE pp2.claimed_player_id = p.id
        AND pp2.organization_id = ${organizationId}
        AND pp2.claim_status IN ('verified', 'proposed')
    )
    GROUP BY query_name, p.id, p.full_name
    HAVING COUNT(DISTINCT pp.organization_id) >= 1
    ORDER BY query_name, appearances_count DESC
    LIMIT ${L4_MAX_CANDIDATES * names.length}
  `);

	return rawRows.rows.map((r) => ({
		query_name: r.query_name,
		candidate: {
			playerId: r.player_id,
			canonicalName: r.canonical_name,
			appearancesCount: Number(r.appearances_count),
		},
	}));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Para cada profileId, obtiene el nombre de la última liga activa donde participó.
 * Una query batch para todos los perfiles a la vez.
 */
async function enrichWithLeagueNames(
	profileIds: string[],
	organizationId: string,
): Promise<Map<string, string>> {
	if (profileIds.length === 0) return new Map();

	const rows = await db.execute<{ profile_id: string; league_name: string }>(sql`
    SELECT DISTINCT ON (pr.player_profile_id)
      pr.player_profile_id AS profile_id,
      l.name               AS league_name
    FROM player_registrations pr
    JOIN leagues l ON l.id = pr.league_id
    WHERE pr.player_profile_id = ANY(${sql.raw(`ARRAY[${profileIds.map((id) => `'${escapeSql(id)}'`).join(", ")}]::uuid[]`)}::uuid[])
      AND l.organization_id = ${organizationId}
    ORDER BY pr.player_profile_id, l.created_at DESC
  `);

	return new Map(rows.rows.map((r) => [r.profile_id, r.league_name]));
}

/**
 * Escapa comillas simples para uso seguro en sql.raw().
 * Mismo helper que resolver.ts — solo para arrays literales de PostgreSQL.
 */
function escapeSql(value: string): string {
	return value.replace(/'/g, "''").replace(/\\/g, "\\\\");
}
