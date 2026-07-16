/**
 * entities/league/queries.ts
 * Acceso a DB para ligas. Server-only — no re-exportar desde index.ts hacia
 * el bundle cliente (regla del split barrel entity, ver AGENTS.md §3).
 */

import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import type { AnyColumn, SQLWrapper } from "drizzle-orm";
import { db, leagues, organizations, teams } from "@/db";
import type { ListQuery, SortRule } from "@/shared/lib/list-query";
import { buildWhere } from "@/shared/lib/list-query";
import { leagueFilters } from "./filters";

export type LeagueOption = { id: string; name: string };

/**
 * Ligas de una organización, para poblar selects (ej. filtro "Liga" en
 * /admin/players y /admin/teams). Solo id + name — el resto de campos no
 * aplica a un control de FilterBar. Solo activas: son módulos ajenos a ligas
 * (jugadores/equipos) y las ligas terminadas quedan como histórico, fuera del
 * flujo de día a día.
 */
export async function listOrgLeagueOptions(organizationId: string): Promise<LeagueOption[]> {
	const rows = await db.query.leagues.findMany({
		where: and(eq(leagues.organizationId, organizationId), eq(leagues.status, "active")),
		orderBy: [asc(leagues.name)],
		columns: { id: true, name: true },
	});
	return rows;
}

// ---------------------------------------------------------------------------
// Lista administrativa de ligas — /admin/leagues (owner y organizador)
//
// Espejo de listOrgTeams (entities/team/queries.ts). El scope de negocio
// (ciudad para el owner, organización para el organizador) se combina aparte
// — nunca es un filtro de usuario. Orden por defecto: estado (activas
// primero, alfabético "active" < "finished") y luego nombre — lo resuelve
// features/league-admin vía defaultSort en parseListQuery.
// ---------------------------------------------------------------------------

export type LeagueAdminRow = {
	id: string;
	name: string;
	dayOfWeek: string;
	season: string;
	status: string;
	teamCount: number;
	organizationName: string | null;
};

export type LeagueAdminScope = { city?: string; organizationId?: string };

export async function listLeaguesAdmin(
	scope: LeagueAdminScope,
	query: ListQuery,
): Promise<{ rows: LeagueAdminRow[]; total: number }> {
	const where = buildLeagueScopeWhere(scope, query.filters);
	const offset = (query.page - 1) * query.pageSize;

	const inner = db
		.select({
			id: leagues.id,
			// leagues.name y organizations.name colisionan (ambas se llaman "name"
			// en su tabla) — sin alias explícito, Postgres las expone sin
			// distinguir y falla al envolver esto en una subquery reusada desde
			// afuera (mismo problema documentado en entities/team/queries.ts).
			name: sql<string>`${leagues.name}`.as("league_name"),
			dayOfWeek: leagues.dayOfWeek,
			season: leagues.season,
			status: leagues.status,
			organizationName: sql<string | null>`${organizations.name}`.as("organization_name"),
			teamCount: sql<number>`COUNT(DISTINCT ${teams.id})::int`.as("team_count"),
		})
		.from(leagues)
		.leftJoin(organizations, eq(organizations.id, leagues.organizationId))
		.leftJoin(teams, eq(teams.leagueId, leagues.id))
		.where(where)
		.groupBy(leagues.id, organizations.name)
		.as("admin_leagues");

	const outerOrderBy = buildLeaguesOrderBy(inner, query.sort);

	const [rowsResult, countResult] = await Promise.all([
		db
			.select()
			.from(inner)
			.orderBy(...outerOrderBy)
			.limit(query.pageSize)
			.offset(offset),
		db.select({ total: sql<number>`COUNT(*)::int` }).from(inner),
	]);

	return {
		rows: rowsResult.map((r) => ({
			id: r.id,
			name: r.name,
			dayOfWeek: r.dayOfWeek,
			season: r.season,
			status: r.status,
			teamCount: r.teamCount,
			organizationName: r.organizationName,
		})),
		total: countResult[0]?.total ?? 0,
	};
}

/**
 * Orden de la query externa a listLeaguesAdmin. No usa buildOrderBy genérico
 * porque los campos ordenables viven en la subquery "admin_leagues" (alias),
 * no en las columnas originales del FilterMap (mismo motivo que
 * buildOrgTeamsOrderBy en entities/team/queries.ts).
 */
function buildLeaguesOrderBy(
	inner: { name: AnyColumn | SQLWrapper; status: AnyColumn | SQLWrapper },
	sort: SortRule[],
) {
	const clauses = sort.flatMap((rule) => {
		const dir = rule.dir === "desc" ? desc : asc;
		if (rule.field === "nombre") return [dir(inner.name)];
		if (rule.field === "estado") return [dir(inner.status)];
		return [];
	});
	return clauses.length > 0 ? clauses : [asc(inner.status), asc(inner.name)];
}

function buildLeagueScopeWhere(
	scope: LeagueAdminScope,
	filters: ListQuery["filters"],
): SQL | undefined {
	const filterWhere = buildWhere(leagueFilters, filters);
	const conditions = [
		scope.city ? eq(leagues.city, scope.city) : undefined,
		scope.organizationId ? eq(leagues.organizationId, scope.organizationId) : undefined,
		filterWhere,
	].filter((c): c is SQL => c !== undefined);
	return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Cuenta ligas del scope — total sin filtros, usado para distinguir "vacío
 * sin datos" de "vacío por filtros" y para el countLabel.
 */
export async function countLeaguesAdmin(scope: LeagueAdminScope): Promise<number> {
	const where = buildLeagueScopeWhere(scope, []);
	const rows = await db
		.select({ total: sql<number>`COUNT(*)::int` })
		.from(leagues)
		.where(where);
	return rows[0]?.total ?? 0;
}
