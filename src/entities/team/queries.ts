/**
 * entities/team/queries.ts
 * Acceso de lectura a DB para la entidad Team.
 * Las operaciones de escritura viven en features/team-management/actions.ts.
 */

import { db, teams, leagues, inscriptions, leagueMembers, globalPlayers } from "@/db";
import { eq, ne, and, asc, desc, sql, ilike } from "drizzle-orm";
import type { AnyColumn, SQLWrapper } from "drizzle-orm";
import type { Team } from "@/db";
import type { RosterEntry, TeamWithLeague } from "./model";
import type { ListQuery, SortRule } from "@/shared/lib/list-query";
import { buildWhere } from "@/shared/lib/list-query";
import { orgTeamFilters } from "./filters";

export async function getTeam(id: string): Promise<Team | null> {
	const row = await db.query.teams.findFirst({ where: eq(teams.id, id) });
	return row ?? null;
}

export async function getTeamWithLeague(id: string): Promise<TeamWithLeague | null> {
	const rows = await db
		.select({
			id: teams.id,
			name: teams.name,
			nameCanonical: teams.nameCanonical,
			status: teams.status,
			leagueId: teams.leagueId,
			color: teams.color,
			sourceTeamId: teams.sourceTeamId,
			joinedAtMatchday: teams.joinedAtMatchday,
			createdAt: teams.createdAt,
			leagueName: leagues.name,
			leagueSeason: leagues.season,
			leagueDayOfWeek: leagues.dayOfWeek,
		})
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.where(eq(teams.id, id))
		.limit(1);

	return rows[0] ?? null;
}

export async function listTeamsByLeague(leagueId: string): Promise<Team[]> {
	return db.query.teams.findMany({
		where: eq(teams.leagueId, leagueId),
		orderBy: (t, { asc }) => [asc(t.name)],
	});
}

/** Equipos disponibles como destino de transferencia (misma liga, distinto equipo). */
export async function getTeamsForTransfer(
	leagueId: string,
	excludeTeamId: string,
): Promise<Team[]> {
	return db.query.teams.findMany({
		where: and(eq(teams.leagueId, leagueId), ne(teams.id, excludeTeamId)),
		orderBy: (t, { asc }) => [asc(t.name)],
	});
}

/** Roster V2: inscriptions -> league_members -> global_players. */
export async function getTeamRoster(teamId: string): Promise<RosterEntry[]> {
	const rows = await db
		.select({
			inscriptionId: inscriptions.id,
			memberId: leagueMembers.id,
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			dorsal: leagueMembers.dorsal,
			status: leagueMembers.status,
			inscriptionDate: leagueMembers.inscriptionDate,
		})
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.where(eq(inscriptions.teamId, teamId))
		.orderBy(asc(leagueMembers.dorsal), asc(globalPlayers.fullName));

	return rows.map((r) => ({
		inscriptionId: r.inscriptionId,
		memberId: r.memberId,
		globalPlayerId: r.globalPlayerId,
		fullName: r.fullName,
		birthDate: r.birthDate,
		avatarUrl: r.avatarUrl ?? null,
		dorsal: r.dorsal ?? null,
		status: r.status as RosterEntry["status"],
		inscriptionDate: r.inscriptionDate,
	}));
}

// ---------------------------------------------------------------------------
// Lista de equipos de la organización — vista organizador en /admin/teams
//
// Espejo de listOrgPlayers/countOrgPlayers (entities/player/queries.ts).
// Contrato ListQuery: filtros/orden llegan ya normalizados desde
// parseListQuery en la page.
//
// "estado" (active/disbanded) es filtrable, pero a diferencia de jugadores
// tiene un default explícito: si la URL no trae ?estado=, solo se muestran
// equipos activos (decisión de producto — un equipo disuelto es "ruido" en
// el día a día). El usuario puede pedir disbanded/ambos explícitamente.
// ---------------------------------------------------------------------------

export type OrgTeamRow = {
	id: string;
	name: string;
	leagueId: string;
	leagueName: string;
	playerCount: number;
	status: string;
};

export async function listOrgTeams(
	organizationId: string,
	query: ListQuery,
): Promise<{ rows: OrgTeamRow[]; total: number }> {
	const filterWhere = buildWhere(orgTeamFilters, query.filters);
	const hasEstadoFilter = query.filters.some((f) => f.field === "estado");
	// El scope de negocio (organización) se combina aparte — nunca es un filtro de usuario.
	// Solo equipos de ligas activas: las de ligas terminadas son histórico y no
	// aplican al día a día de este listado (se consultan liga por liga).
	// Default "solo activos" cuando el usuario no pidió un estado explícito —
	// ver comentario arriba.
	const where = and(
		eq(leagues.organizationId, organizationId),
		eq(leagues.status, "active"),
		hasEstadoFilter ? undefined : eq(teams.status, "active"),
		filterWhere,
	);
	const offset = (query.page - 1) * query.pageSize;

	const inner = db
		.select({
			id: teams.id,
			// teams.name y leagues.name colisionan (ambas se llaman "name" en su
			// tabla) — sin alias explícito, Postgres las expone sin distinguir y
			// falla con "column reference \"name\" is ambiguous" al envolver esto
			// en una subquery reusada desde afuera. .as() fuerza un nombre único
			// (mismo problema documentado en entities/player/queries.ts).
			name: sql<string>`${teams.name}`.as("team_name"),
			leagueId: teams.leagueId,
			leagueName: sql<string>`${leagues.name}`.as("league_name"),
			status: teams.status,
			playerCount: sql<number>`COUNT(DISTINCT ${inscriptions.leagueMemberId})::int`.as(
				"player_count",
			),
		})
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.leftJoin(inscriptions, eq(inscriptions.teamId, teams.id))
		.where(where)
		.groupBy(teams.id, leagues.name)
		.as("org_teams");

	const outerOrderBy = buildOrgTeamsOrderBy(inner, query.sort);

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
			leagueId: r.leagueId,
			leagueName: r.leagueName,
			playerCount: r.playerCount,
			status: r.status,
		})),
		total: countResult[0]?.total ?? 0,
	};
}

/**
 * Orden de la query externa a listOrgTeams. No usa buildOrderBy genérico
 * porque los campos ordenables (nombre, jugadores) viven en la subquery
 * "org_teams" (alias), no en las columnas originales del FilterMap.
 */
function buildOrgTeamsOrderBy(
	inner: {
		name: AnyColumn | SQLWrapper;
		playerCount: AnyColumn | SQLWrapper;
	},
	sort: SortRule[],
) {
	const clauses = sort.flatMap((rule) => {
		const dir = rule.dir === "desc" ? desc : asc;
		if (rule.field === "nombre") return [dir(inner.name)];
		if (rule.field === "jugadores") return [dir(inner.playerCount)];
		return [];
	});
	return clauses.length > 0 ? clauses : [asc(inner.name)];
}

/**
 * Cuenta equipos de la organización — total sin filtros, usado para
 * distinguir "vacío sin datos" de "vacío por filtros" y para el countLabel.
 */
export async function countOrgTeams(organizationId: string): Promise<number> {
	const rows = await db
		.select({ total: sql<number>`COUNT(*)::int` })
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.where(
			and(
				eq(leagues.organizationId, organizationId),
				eq(leagues.status, "active"),
				eq(teams.status, "active"),
			),
		);
	return rows[0]?.total ?? 0;
}

// ---------------------------------------------------------------------------
// Lista de todos los equipos — vista del owner en /admin/teams
// ---------------------------------------------------------------------------

export type GlobalTeamRow = {
	id: string;
	name: string;
	leagueId: string;
	leagueName: string;
	playerCount: number;
};

/**
 * Lista paginada de todos los equipos de la plataforma (vista owner, sin
 * scope de organización). Búsqueda simple por nombre — igual criterio que
 * listAllGlobalPlayers (entities/player/queries.ts): sin FilterBar, fuera
 * del alcance del contrato ListQuery.
 */
export async function listAllTeams(opts: {
	page: number;
	pageSize: number;
	search?: string;
}): Promise<{ rows: GlobalTeamRow[]; total: number }> {
	const { page, pageSize, search } = opts;
	// Solo equipos de ligas activas — mismo criterio que listOrgTeams: las
	// terminadas quedan como histórico, fuera de este listado de día a día.
	// Solo equipos activos: los disueltos no deben aparecer aquí (ver listOrgTeams).
	const whereFilter = and(
		eq(leagues.status, "active"),
		eq(teams.status, "active"),
		search ? ilike(teams.name, `%${search}%`) : undefined,
	);

	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: teams.id,
				// Mismo alias explícito que listOrgTeams — teams.name/leagues.name
				// colisionan, ver comentario ahí.
				name: sql<string>`${teams.name}`.as("team_name"),
				leagueId: teams.leagueId,
				leagueName: sql<string>`${leagues.name}`.as("league_name"),
				playerCount: sql<number>`COUNT(DISTINCT ${inscriptions.leagueMemberId})::int`.as(
					"player_count",
				),
			})
			.from(teams)
			.innerJoin(leagues, eq(leagues.id, teams.leagueId))
			.leftJoin(inscriptions, eq(inscriptions.teamId, teams.id))
			.where(whereFilter)
			.groupBy(teams.id, leagues.name)
			.orderBy(asc(teams.name))
			.limit(pageSize)
			.offset((page - 1) * pageSize),

		db
			.select({ total: sql<number>`COUNT(*)::int` })
			.from(teams)
			.innerJoin(leagues, eq(leagues.id, teams.leagueId))
			.where(whereFilter),
	]);

	return {
		rows: rows.map((r) => ({
			id: r.id,
			name: r.name,
			leagueId: r.leagueId,
			leagueName: r.leagueName,
			playerCount: r.playerCount,
		})),
		total: countResult[0]?.total ?? 0,
	};
}
