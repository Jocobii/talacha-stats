/**
 * entities/search/queries.ts
 *
 * Buscador universal por organización (docs/UNIVERSAL-SEARCH.md). Server-only
 * — importa `@/db`, por eso nunca se re-exporta desde `index.ts` (barrel
 * client/server split, memoria del proyecto). Se importa por ruta directa:
 * `@/entities/search/queries`, mismo patrón que otras entities server-only.
 *
 * Motor: pg_trgm `similarity()` sobre las columnas `*_canonical` ya pobladas
 * por `sanitizeToCanonical()` (§4.1 del doc) — mismo criterio que
 * `searchOrgTeams` / `searchOrgGlobalPlayers`, extendido a UNION ALL
 * multi-entidad con ranking uniforme.
 *
 * Toda rama va escopada a una sola organización (AGENTS.md §14): `player`
 * replica el criterio EXISTS de `searchOrgGlobalPlayers` (solo jugadores que
 * la org dio de alta, vía `league_members` o `registered_by_organization_id`).
 *
 * Sin rama `rule` (reglamento): hoy no existe columna de texto libre de
 * reglamento en el schema — `league_config`/`organization_config` son
 * parámetros estructurados, no prosa (docs/UNIVERSAL-SEARCH.md §8.3,
 * confirmado jul 2026). Se agrega cuando exista ese campo.
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import type { SearchHit, SearchHitKind } from "./model";

const SIMILARITY_THRESHOLD = 0.2;
const PER_TYPE_LIMIT = 5;
const DEFAULT_TOTAL_LIMIT = 20;

const ALL_TYPES: SearchHitKind[] = ["team", "league", "player", "suspension", "venue"];

export type SearchOrgUniversalOptions = {
	/** Subconjunto de kinds a buscar. Default: todos. */
	types?: SearchHitKind[];
	/** Límite total de resultados (después de mezclar todas las ramas). */
	limit?: number;
};

type SearchHitRow = {
	kind: SearchHitKind;
	id: string;
	title: string;
	subtitle: string | null;
	url: string;
	score: number;
};

/**
 * Busca equipos, ligas, jugadores, sancionados y canchas de UNA organización
 * en un solo UNION ALL rankeado por similarity() descendente.
 *
 * @param orgId - organización a la que se escopa toda la búsqueda.
 * @param q - término crudo del usuario (se normaliza internamente).
 */
export async function searchOrgUniversal(
	orgId: string,
	q: string,
	opts: SearchOrgUniversalOptions = {},
): Promise<SearchHit[]> {
	const canonical = sanitizeToCanonical(q.trim());
	if (canonical.length < 2) return [];

	const types = opts.types?.length ? opts.types : ALL_TYPES;
	const totalLimit = opts.limit ?? DEFAULT_TOTAL_LIMIT;

	const branches = types
		.map((kind) => buildBranch(kind, orgId, canonical))
		.filter((b): b is ReturnType<typeof sql> => b !== null);

	if (branches.length === 0) return [];

	const unioned = sql.join(
		branches.map((b) => sql`(${b})`),
		sql` UNION ALL `,
	);

	const { rows } = await db.execute<SearchHitRow>(sql`
		SELECT * FROM (${unioned}) hits
		ORDER BY score DESC
		LIMIT ${totalLimit}
	`);

	return rows.map(rowToSearchHit);
}

function buildBranch(kind: SearchHitKind, orgId: string, canonical: string) {
	switch (kind) {
		case "team":
			return sql`
				SELECT
					'team' AS kind,
					t.id::text AS id,
					t.name AS title,
					l.name AS subtitle,
					('/' || l.slug) AS url,
					similarity(t.name_canonical, ${canonical}) AS score
				FROM teams t
				INNER JOIN leagues l ON l.id = t.league_id
				WHERE l.organization_id = ${orgId}
					AND l.status = 'active'
					AND t.status = 'active'
					AND similarity(t.name_canonical, ${canonical}) > ${SIMILARITY_THRESHOLD}
				ORDER BY score DESC
				LIMIT ${PER_TYPE_LIMIT}
			`;
		case "league":
			return sql`
				SELECT
					'league' AS kind,
					l.id::text AS id,
					l.name AS title,
					NULL::text AS subtitle,
					('/' || l.slug) AS url,
					similarity(l.name_canonical, ${canonical}) AS score
				FROM leagues l
				WHERE l.organization_id = ${orgId}
					AND l.status = 'active'
					AND similarity(l.name_canonical, ${canonical}) > ${SIMILARITY_THRESHOLD}
				ORDER BY score DESC
				LIMIT ${PER_TYPE_LIMIT}
			`;
		case "player":
			// Scope AGENTS.md §14: solo jugadores que ESTA org dio de alta —
			// mismo criterio EXISTS que searchOrgGlobalPlayers (entities/player/queries.ts).
			return sql`
				SELECT
					'player' AS kind,
					gp.id::text AS id,
					gp.full_name AS title,
					NULL::text AS subtitle,
					('/player/' || gp.id) AS url,
					similarity(COALESCE(gp.full_name_canonical, LOWER(gp.full_name)), ${canonical}) AS score
				FROM global_players gp
				WHERE (
					EXISTS (
						SELECT 1 FROM league_members lm
						INNER JOIN leagues l ON l.id = lm.league_id
						WHERE lm.global_player_id = gp.id AND l.organization_id = ${orgId}
					)
					OR gp.registered_by_organization_id = ${orgId}
				)
				AND similarity(COALESCE(gp.full_name_canonical, LOWER(gp.full_name)), ${canonical}) > ${SIMILARITY_THRESHOLD}
				ORDER BY score DESC
				LIMIT ${PER_TYPE_LIMIT}
			`;
		case "suspension":
			// Solo suspensiones vigentes (status = 'active') — el intent del
			// usuario es "¿quién está suspendido AHORA?", no historial. Público
			// por decisión de Jocobi (docs/UNIVERSAL-SEARCH.md §8.1).
			return sql`
				SELECT
					'suspension' AS kind,
					s.id::text AS id,
					gp.full_name AS title,
					l.name AS subtitle,
					('/' || l.slug || '?tab=sancionados') AS url,
					similarity(COALESCE(gp.full_name_canonical, LOWER(gp.full_name)), ${canonical}) AS score
				FROM suspensions s
				INNER JOIN global_players gp ON gp.id = s.global_player_id
				INNER JOIN leagues l ON l.id = s.league_id
				WHERE l.organization_id = ${orgId}
					AND s.status = 'active'
					AND similarity(COALESCE(gp.full_name_canonical, LOWER(gp.full_name)), ${canonical}) > ${SIMILARITY_THRESHOLD}
				ORDER BY score DESC
				LIMIT ${PER_TYPE_LIMIT}
			`;
		case "venue":
			// TODO(jocobi): no existe todavía una página pública de detalle de
			// cancha (la demo tiene CanchasTab, la real (public) league page no).
			// `url` apunta al home de la org como placeholder hasta que se
			// decida la superficie pública (docs/UNIVERSAL-SEARCH.md §8, no
			// cubierto por las decisiones ya tomadas).
			return sql`
				SELECT
					'venue' AS kind,
					v.id::text AS id,
					v.name AS title,
					NULL::text AS subtitle,
					'/' AS url,
					similarity(v.name_canonical, ${canonical}) AS score
				FROM venues v
				WHERE v.organization_id = ${orgId}
					AND similarity(v.name_canonical, ${canonical}) > ${SIMILARITY_THRESHOLD}
				ORDER BY score DESC
				LIMIT ${PER_TYPE_LIMIT}
			`;
		default:
			return null;
	}
}

function rowToSearchHit(row: SearchHitRow): SearchHit {
	return {
		kind: row.kind,
		id: row.id,
		title: row.title,
		subtitle: row.subtitle,
		url: row.url,
		score: Number(row.score),
	} as SearchHit;
}
