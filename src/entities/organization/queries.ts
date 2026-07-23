import { db } from "@/db";
import {
	organizations,
	users,
	leagues,
	playerSeasonStats,
	teams,
	globalPlayers,
	matchdays,
	matches,
	matchPlayerStats,
	inscriptions,
	leagueMembers,
	venues,
	leagueVenues,
	venueTimeWindows,
	leaguePlayoffZones,
} from "@/db/schema";
import { eq, asc, desc, and, sql, inArray, isNotNull, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "react";
import type { Organization } from "@/db/schema";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "./model";
import { deriveArranqueState, type ArranqueState } from "./lib/derive-arranque-state";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

// ---------------------------------------------------------------------------
// Helpers V2 — goleo combinado y última jornada, por liga
//
// Auto-contenidos a propósito (no importan entities/player/live-stats.ts):
// FSD (§3.1 AGENTS.md) prohíbe imports laterales entre entities del mismo
// nivel. Duplica el patrón "player_season_stats si existe, si no
// match_player_stats" que ya usa entities/player/live-stats.ts — mismo
// criterio de negocio (§1 AGENTS.md), implementación local.
// (docs/V1-REMOVAL-PLAN.md, Fase 1, P10-P15 — jul 2026)
// ---------------------------------------------------------------------------

const COUNTED_MATCH_STATUSES = ["played", "walkover_home", "walkover_away"] as const;

type LeagueScorerRow = {
	playerId: string; // global_player_id
	fullName: string;
	leagueId: string;
	teamName: string | null;
	goals: number;
	assists: number;
	matchesPlayed: number;
};

async function getLeagueIdsWithSeasonStatsLocal(leagueIds: string[]): Promise<Set<string>> {
	if (leagueIds.length === 0) return new Set();
	const rows = await db
		.selectDistinct({ leagueId: playerSeasonStats.leagueId })
		.from(playerSeasonStats)
		.where(inArray(playerSeasonStats.leagueId, leagueIds));
	return new Set(rows.map((r) => r.leagueId));
}

async function fetchSeasonScorerRows(leagueIds: string[]): Promise<LeagueScorerRow[]> {
	if (leagueIds.length === 0) return [];
	const rows = await db
		.select({
			playerId: playerSeasonStats.globalPlayerId,
			fullName: globalPlayers.fullName,
			leagueId: playerSeasonStats.leagueId,
			teamName: teams.name,
			goals: playerSeasonStats.goals,
			assists: playerSeasonStats.assists,
			matchesPlayed: playerSeasonStats.matchesPlayed,
		})
		.from(playerSeasonStats)
		.innerJoin(globalPlayers, eq(playerSeasonStats.globalPlayerId, globalPlayers.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.where(inArray(playerSeasonStats.leagueId, leagueIds));

	return rows
		.filter((r): r is (typeof rows)[number] & { playerId: string } => r.playerId !== null)
		.map((r) => ({ ...r }));
}

async function fetchLiveScorerRows(leagueIds: string[]): Promise<LeagueScorerRow[]> {
	if (leagueIds.length === 0) return [];
	return db
		.select({
			playerId: leagueMembers.globalPlayerId,
			fullName: globalPlayers.fullName,
			leagueId: leagueMembers.leagueId,
			teamName: teams.name,
			goals: sql<number>`COALESCE(SUM(${matchPlayerStats.goals}), 0)::int`,
			assists: sql<number>`COALESCE(SUM(${matchPlayerStats.assists}), 0)::int`,
			matchesPlayed: sql<number>`COUNT(*) FILTER (WHERE ${matchPlayerStats.isPresent})::int`,
		})
		.from(matchPlayerStats)
		.innerJoin(matches, eq(matchPlayerStats.matchId, matches.id))
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.leftJoin(teams, eq(inscriptions.teamId, teams.id))
		.where(
			and(inArray(matches.leagueId, leagueIds), inArray(matches.status, COUNTED_MATCH_STATUSES)),
		)
		.groupBy(
			leagueMembers.globalPlayerId,
			globalPlayers.fullName,
			leagueMembers.leagueId,
			teams.name,
		);
}

/**
 * Goleo combinado por jugador: `player_season_stats` (Excel, histórico) si la
 * liga lo tiene, o cálculo en vivo desde `match_player_stats` (cédula) si no
 * — nunca ambos para la misma liga (§1 AGENTS.md).
 */
async function getMergedLeagueScorers(leagueIds: string[]): Promise<LeagueScorerRow[]> {
	if (leagueIds.length === 0) return [];
	const withSeasonStats = await getLeagueIdsWithSeasonStatsLocal(leagueIds);
	const seasonIds = leagueIds.filter((id) => withSeasonStats.has(id));
	const liveIds = leagueIds.filter((id) => !withSeasonStats.has(id));

	const [seasonRows, liveRows] = await Promise.all([
		fetchSeasonScorerRows(seasonIds),
		fetchLiveScorerRows(liveIds),
	]);

	return [...seasonRows, ...liveRows];
}

/** Última jornada (matchday.number) con al menos un partido contado, a través de una o más ligas. */
async function getLastJornadaForLeagues(leagueIds: string[]): Promise<number | null> {
	if (leagueIds.length === 0) return null;
	const rows = await db
		.select({ max: sql<number | null>`max(${matchdays.number})` })
		.from(matches)
		.innerJoin(matchdays, eq(matches.matchdayId, matchdays.id))
		.where(
			and(inArray(matches.leagueId, leagueIds), inArray(matches.status, COUNTED_MATCH_STATUSES)),
		);
	return rows[0]?.max ?? null;
}

// ---------------------------------------------------------------------------
// Lectura — Admin
// ---------------------------------------------------------------------------

/** Obtiene una organización por su ID. */
export async function getOrganizationById(id: string): Promise<Organization | null> {
	const row = await db.query.organizations.findFirst({
		where: eq(organizations.id, id),
	});
	return row ?? null;
}

/** Obtiene una organización por su slug (para URLs públicas). */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
	const row = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});
	return row ?? null;
}

/** Lista todas las organizaciones del sistema (solo para owner). */
export async function listOrganizations() {
	return db.query.organizations.findMany({
		orderBy: [asc(organizations.name)],
	});
}

/** Obtiene la organización de un usuario específico. */
export async function getOrganizationByUserId(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: { organization: true },
	});
	return user?.organization ?? null;
}

/** Obtiene una organización con sus ligas y miembros (panel admin). */
export async function getOrganizationWithDetails(id: string) {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, id),
		with: {
			leagues: {
				orderBy: (l, { asc }) => [asc(l.name)],
			},
			members: {
				columns: {
					id: true,
					name: true,
					email: true,
					role: true,
					active: true,
					createdAt: true,
				},
				orderBy: (u, { asc }) => [asc(u.name)],
			},
		},
	});
	return org ?? null;
}

/** Lista los usuarios que pertenecen a una organización. */
export async function getUsersByOrganization(organizationId: string) {
	return db.query.users.findMany({
		where: eq(users.organizationId, organizationId),
		columns: {
			id: true,
			name: true,
			email: true,
			role: true,
			active: true,
			createdAt: true,
		},
		orderBy: [asc(users.name)],
	});
}

/** Lista las ligas de una organización. */
export async function getLeaguesByOrganization(organizationId: string) {
	return db.query.leagues.findMany({
		where: eq(leagues.organizationId, organizationId),
		with: { teams: true },
		orderBy: (l, { desc }) => [desc(l.createdAt)],
	});
}

export type LeagueWithTeamCount = {
	id: string;
	name: string;
	city: string;
	season: string;
	teamCount: number;
	orgName: string | null;
};

/**
 * Todas las ligas del sistema con conteo de equipos — para el selector de
 * "avanzar liga existente" del Organization Simulator (Épica E). Solo
 * consumido desde un contexto owner-only, así que no filtra por org/status.
 */
export async function listAllLeaguesWithTeamCount(): Promise<LeagueWithTeamCount[]> {
	const rows = await db.query.leagues.findMany({
		with: {
			teams: { columns: { id: true } },
			organization: { columns: { name: true } },
		},
		orderBy: (l, { desc }) => [desc(l.createdAt)],
	});

	return rows.map((l) => ({
		id: l.id,
		name: l.name,
		city: l.city,
		season: l.season ?? "",
		teamCount: l.teams.length,
		orgName: l.organization?.name ?? null,
	}));
}

/**
 * Estado de "Onboarding Parte 2" (Arranque: Cancha → Liga → Horario), derivado
 * de conteos en DB (§17: filtrado a nivel de query, no en memoria). Sin
 * columna nueva en `organizations` — ver docs/ONBOARDING-PARTE-2.md §6.
 */
export async function getArranqueState(organizationId: string): Promise<ArranqueState> {
	const [venueRows, leagueRows, scheduledRows] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(venues)
			.where(eq(venues.organizationId, organizationId)),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(leagues)
			.where(eq(leagues.organizationId, organizationId)),
		db
			.select({ count: sql<number>`count(distinct ${leagues.id})::int` })
			.from(leagues)
			.innerJoin(leagueVenues, eq(leagueVenues.leagueId, leagues.id))
			.innerJoin(
				venueTimeWindows,
				and(
					eq(venueTimeWindows.leagueId, leagues.id),
					eq(venueTimeWindows.venueId, leagueVenues.venueId),
				),
			)
			.where(eq(leagues.organizationId, organizationId)),
	]);

	return deriveArranqueState({
		venueCount: venueRows[0]?.count ?? 0,
		leagueCount: leagueRows[0]?.count ?? 0,
		scheduledLeagueCount: scheduledRows[0]?.count ?? 0,
	});
}

// ---------------------------------------------------------------------------
// Lectura — Páginas públicas
// ---------------------------------------------------------------------------

/**
 * Lista todas las organizaciones con sus ligas activas para la página /ligas.
 * Incluye el conteo de equipos de cada liga.
 */
export async function listOrganizationsPublic() {
	return db.query.organizations.findMany({
		// Only verified orgs appear in public directory
		where: eq(organizations.status, "verified"),
		orderBy: [asc(organizations.name)],
		with: {
			leagues: {
				where: eq(leagues.status, "active"),
				orderBy: (l, { asc }) => [asc(l.name)],
				with: { teams: true },
			},
		},
	});
}

// ---------------------------------------------------------------------------
// Público — Hub de Portales (/organizaciones): directorio paginado + filtros
// ---------------------------------------------------------------------------

export type OrgDirectorySort = "name_asc" | "name_desc" | "leagues_desc" | "players_desc";

export type OrgDirectoryItem = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	city: string;
	leagueCount: number;
	teamCount: number;
	playerCount: number;
};

export type OrgDirectoryFilters = {
	/** Sin filtro = todas las ciudades ("Todas" en el dropdown del diseño). */
	city?: string;
	q?: string;
	sort: OrgDirectorySort;
	limit: number;
	offset: number;
};

function buildOrgDirectoryWhere(city?: string, q?: string) {
	const conditions = [eq(organizations.status, "verified")];
	if (city) conditions.push(eq(organizations.city, city));
	// Búsqueda simple por nombre (mismo patrón que searchDirectoryPlayers en
	// entities/player/queries.ts) — no fuzzy/similarity, suficiente para un
	// directorio de decenas/cientos de organizaciones.
	if (q) conditions.push(ilike(organizations.name, `%${q}%`));
	return and(...conditions);
}

// Expresiones de agregado reutilizadas en SELECT y ORDER BY (mismo objeto
// `sql<T>`, no un alias por string) — Drizzle repite la expresión completa en
// el ORDER BY, válido en Postgres para agregados de una query con GROUP BY.
const orgLeagueCountExpr = sql<number>`count(distinct case when ${leagues.status} = 'active' then ${leagues.id} end)::int`;
const orgTeamCountExpr = sql<number>`count(distinct case when ${leagues.status} = 'active' then ${teams.id} end)::int`;
const orgPlayerCountExpr = sql<number>`count(distinct ${leagueMembers.globalPlayerId})::int`;

function orgDirectoryOrderBy(sort: OrgDirectorySort) {
	if (sort === "name_desc") return [desc(organizations.name)];
	if (sort === "leagues_desc") return [desc(orgLeagueCountExpr), asc(organizations.name)];
	if (sort === "players_desc") return [desc(orgPlayerCountExpr), asc(organizations.name)];
	return [asc(organizations.name)];
}

/**
 * Directorio público paginado del Hub de Portales (/organizaciones): filtro
 * de ciudad + búsqueda por nombre + 4 modos de orden, todo a nivel SQL
 * (filtrado/orden/paginación en la query, no en memoria — §17 AGENTS.md).
 *
 * Distinta de `listOrganizationsPublic` (sin filtros/paginado, usada hoy solo
 * por consumidores que quieren TODAS las orgs con sus ligas anidadas, p. ej.
 * `LeaguesTeaser`) — esa función se conserva tal cual.
 *
 * `leagueCount`/`teamCount` cuentan solo ligas/equipos activos; `playerCount`
 * cuenta `league_members` distintos de la organización completa (todas sus
 * ligas), sin importar el estado de la liga — mismo criterio "identidad
 * acumulada de la org" que `getOrgHubStats`.
 */
export async function listOrganizationsPublicPaginated(
	filters: OrgDirectoryFilters,
): Promise<{ rows: OrgDirectoryItem[]; total: number }> {
	const where = buildOrgDirectoryWhere(filters.city, filters.q);

	const [totalRow, rows] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(organizations)
			.where(where),
		db
			.select({
				id: organizations.id,
				name: organizations.name,
				slug: organizations.slug,
				logoUrl: organizations.logoUrl,
				city: organizations.city,
				leagueCount: orgLeagueCountExpr,
				teamCount: orgTeamCountExpr,
				playerCount: orgPlayerCountExpr,
			})
			.from(organizations)
			.leftJoin(leagues, eq(leagues.organizationId, organizations.id))
			.leftJoin(teams, and(eq(teams.leagueId, leagues.id), eq(teams.status, "active")))
			.leftJoin(leagueMembers, eq(leagueMembers.leagueId, leagues.id))
			.where(where)
			.groupBy(organizations.id)
			.orderBy(...orgDirectoryOrderBy(filters.sort))
			.limit(filters.limit)
			.offset(filters.offset),
	]);

	return { rows, total: totalRow[0]?.count ?? 0 };
}

/**
 * Obtiene una organización pública con sus ligas activas + último snapshot de cada liga.
 * Usada en /org/[slug] Y en org/[slug]/layout.tsx (nav público, docs/SUBDOMINIOS-MULTITENANT.md §4).
 *
 * Envuelta en `cache()` de React: layout.tsx y page.tsx la llaman por
 * separado en el mismo request (uno para el nav, otro para el contenido) —
 * sin memoización esto sería una consulta a DB duplicada en cada visita.
 */
export const getPublicOrganization = cache(async function getPublicOrganization(slug: string) {
	const org = await db.query.organizations.findFirst({
		// Trial orgs are not publicly accessible
		// comment only for testing
		// where: and(eq(organizations.slug, slug), eq(organizations.status, "verified")),
		where: and(eq(organizations.slug, slug)),
		with: {
			leagues: {
				where: eq(leagues.status, "active"),
				orderBy: (l, { asc }) => [asc(l.name)],
				with: { teams: true },
			},
		},
	});
	return org ?? null;
});

/**
 * Obtiene una liga pública por slug de org + slug de liga.
 * Incluye equipos para la tabla de posiciones.
 * Usada en /org/[slug]/[leagueSlug].
 */
export async function getPublicLeague(orgSlug: string, leagueSlug: string) {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.slug, orgSlug),
		columns: { id: true, name: true, slug: true, logoUrl: true, city: true, status: true },
	});
	if (!org) return null;

	const league = await db.query.leagues.findFirst({
		where: and(eq(leagues.organizationId, org.id), eq(leagues.slug, leagueSlug)),
		with: { teams: true },
	});
	if (!league) return null;

	return { org, league };
}

/**
 * Obtiene la tabla de posiciones para la vista pública de una liga, calculada
 * en vivo desde partidos capturados. Cuenta played + walkover_home +
 * walkover_away + completed (este último es status legacy de partidos reales
 * en `matches` desde el import de Excel, no infra V1 — se conserva). Los W.O.
 * se contabilizan como 3-0 para el ganador.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P10/D1): antes
 * priorizaba `team_standings_snapshot` (V1) sobre este cálculo. Se retiró esa
 * prioridad — sin backfill (D1), una liga cuyo único historial vive en el
 * snapshot ahora no tiene tabla de posiciones. `jornada` ya no sale siempre
 * `null`: se calcula desde `matchdays` (última jornada con partido contado).
 */
export async function getLatestStandings(leagueId: string) {
	const COUNTED_STATUSES = ["played", "walkover_home", "walkover_away", "completed"] as const;

	const [leagueTeams, countedMatches, jornada] = await Promise.all([
		db.query.teams.findMany({
			where: and(eq(teams.leagueId, leagueId), eq(teams.status, "active")),
			columns: { id: true, name: true },
		}),
		db.query.matches.findMany({
			where: and(eq(matches.leagueId, leagueId), inArray(matches.status, [...COUNTED_STATUSES])),
			columns: {
				id: true,
				homeTeamId: true,
				awayTeamId: true,
				homeScore: true,
				awayScore: true,
				status: true,
			},
		}),
		getLastJornadaForLeagues([leagueId]),
	]);

	if (countedMatches.length === 0) return { standings: [], jornada: null };

	const rows = leagueTeams.map((team) => {
		let wins = 0,
			draws = 0,
			losses = 0,
			goalsFor = 0,
			goalsAgainst = 0;

		for (const m of countedMatches) {
			const isHome = m.homeTeamId === team.id;
			const isAway = m.awayTeamId === team.id;
			if (!isHome && !isAway) continue;

			// Goles efectivos: W.O. = 3-0 para el ganador
			let homeGoals: number, awayGoals: number;
			if (m.status === "walkover_home") {
				homeGoals = 3;
				awayGoals = 0;
			} else if (m.status === "walkover_away") {
				homeGoals = 0;
				awayGoals = 3;
			} else {
				homeGoals = m.homeScore ?? 0;
				awayGoals = m.awayScore ?? 0;
			}

			const myGoals = isHome ? homeGoals : awayGoals;
			const theirGoals = isHome ? awayGoals : homeGoals;
			goalsFor += myGoals;
			goalsAgainst += theirGoals;

			if (myGoals > theirGoals) wins++;
			else if (myGoals === theirGoals) draws++;
			else losses++;
		}

		const played = wins + draws + losses;
		const points = wins * 3 + draws;

		// Forma idéntica a los snapshot rows para que la plantilla pública no cambie
		return {
			id: team.id,
			team: { id: team.id, name: team.name },
			played,
			wins,
			draws,
			losses,
			goalsFor,
			goalsAgainst,
			points,
		};
	});

	const sorted = rows.sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const aDiff = a.goalsFor - a.goalsAgainst;
		const bDiff = b.goalsFor - b.goalsAgainst;
		if (bDiff !== aDiff) return bDiff - aDiff;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		return a.team.name.localeCompare(b.team.name);
	});

	return { standings: sorted, jornada };
}

export type TopScorerRow = {
	playerId: string | null;
	fullName: string;
	alias: string | null;
	goals: number;
	assists: number;
	matchesPlayed: number;
	teamName: string;
};

/**
 * Goleadores de una liga (cualquiera con al menos 1 gol, sin excluir a
 * nadie), paginado y con búsqueda por nombre.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P14): antes leía
 * `player_season_stats` directo (100% V1) — cualquier liga capturada
 * en-app vía cédula no aparecía nunca aquí. Ahora usa `getMergedLeagueScorers`
 * (Excel histórico si la liga lo tiene, o cálculo en vivo desde
 * `match_player_stats` si no).
 *
 * Filtro/orden se hacen en memoria (no en DB, a diferencia de
 * `listAllGlobalPlayers`) porque la fuente combinada ya no es una sola
 * columna de una sola tabla — está acotado a UNA liga (decenas de jugadores,
 * nunca miles), así que el costo es despreciable frente a reimplementar la
 * lógica de "Excel vs. en vivo" dos veces en SQL con paginación nativa.
 */
export async function searchTopScorers(
	leagueId: string,
	opts: { q?: string; page: number; pageSize: number },
): Promise<{ rows: TopScorerRow[]; total: number }> {
	const canonical = opts.q?.trim() ? sanitizeToCanonical(opts.q) : "";

	const allRows = (await getMergedLeagueScorers([leagueId]))
		.filter((r) => r.goals > 0)
		.filter((r) => !canonical || sanitizeToCanonical(r.fullName).includes(canonical))
		.sort((a, b) => b.goals - a.goals || b.assists - a.assists);

	const offset = (opts.page - 1) * opts.pageSize;
	const rows: TopScorerRow[] = allRows.slice(offset, offset + opts.pageSize).map((r) => ({
		playerId: r.playerId,
		fullName: r.fullName,
		alias: null,
		goals: r.goals,
		assists: r.assists,
		matchesPlayed: r.matchesPlayed,
		teamName: r.teamName ?? "—",
	}));

	return { rows, total: allRows.length };
}

// `getStandingsHistory` (historial de posiciones por jornada, 100%
// `team_standings_snapshot`) se retiró aquí (docs/V1-REMOVAL-PLAN.md, Fase 1,
// P11 — jul 2026): cero callers reales en `src/app` (el "gráfico de
// evolución" mencionado en su comentario nunca se construyó). Se retiró en
// vez de migrarse — reimplementar "tabla en cada jornada pasada" sobre V2
// (cumulativo por matchday) no tiene sentido para una función sin consumidor.

// ---------------------------------------------------------------------------
// Público — jornadas (sorteo)
// ---------------------------------------------------------------------------

export type PublicMatchInfo = {
	matchId: string;
	homeTeamName: string;
	awayTeamName: string;
	venueName: string | null;
	/** ISO string, null si no hay hora definida */
	kickoffAt: string | null;
};

export type PublicMatchday = {
	id: string;
	number: number;
	phase: string;
	scheduledDate: string;
	status: string;
	matches: PublicMatchInfo[];
	/** true si el sorteo fue confirmado/actualizado en las últimas 48h */
	recentlyUpdated: boolean;
	/** ISO string del último insert de partido en esta jornada, o null */
	lastConfirmedAt: string | null;
};

/**
 * Devuelve las jornadas publicadas/en progreso/completadas de una liga,
 * con sus partidos y metadatos de actualización reciente.
 * Usada en la página pública /org/[slug]/[leagueSlug].
 */
export async function getPublicMatchdays(leagueId: string): Promise<PublicMatchday[]> {
	// 1. Traer jornadas visibles con MAX(matches.createdAt) por jornada
	const jornadasRows = await db
		.select({
			id: matchdays.id,
			number: matchdays.number,
			phase: matchdays.phase,
			scheduledDate: matchdays.scheduledDate,
			status: matchdays.status,
			lastConfirmedAt: sql<Date | null>`max(${matches.createdAt})`,
		})
		.from(matchdays)
		.leftJoin(matches, eq(matches.matchdayId, matchdays.id))
		.where(
			and(
				eq(matchdays.leagueId, leagueId),
				sql`${matchdays.status} IN ('published', 'in_progress', 'completed')`,
			),
		)
		.groupBy(matchdays.id)
		// La fase final comparte un solo matchday sentinel con number = 0 (ver
		// src/db/simulator/contributors/playoffs.ts), así que ordenar solo por
		// number la pondría primero aunque cronológicamente es la última fase.
		// Forzamos "regular" antes que cualquier otra fase, y dentro de cada
		// grupo ordenamos por number asc.
		.orderBy(
			sql`case when ${matchdays.phase} = 'regular' then 0 else 1 end`,
			asc(matchdays.number),
		);

	if (jornadasRows.length === 0) return [];

	const matchdayIds = jornadasRows.map((j) => j.id);

	// 2. Traer todos los partidos de estas jornadas con nombres de equipo y cancha
	const homeTeams = alias(teams, "home_teams");
	const awayTeams = alias(teams, "away_teams");

	const matchRows = await db
		.select({
			matchId: matches.id,
			matchdayId: matches.matchdayId,
			homeTeamName: homeTeams.name,
			awayTeamName: awayTeams.name,
			venueName: venues.name,
			kickoffAt: matches.kickoffAt,
		})
		.from(matches)
		.innerJoin(homeTeams, eq(homeTeams.id, matches.homeTeamId))
		.innerJoin(awayTeams, eq(awayTeams.id, matches.awayTeamId))
		.leftJoin(venues, eq(venues.id, matches.venueId))
		.where(inArray(matches.matchdayId, matchdayIds))
		.orderBy(asc(matches.kickoffAt));

	// 3. Agrupar partidos por jornada (kickoffAt todavía como Date | null aquí)
	type MatchRaw = {
		matchId: string;
		homeTeamName: string;
		awayTeamName: string;
		venueName: string | null;
		kickoffAt: Date | null;
	};
	const matchesByMatchday = new Map<string, MatchRaw[]>();
	for (const row of matchRows) {
		if (!row.matchdayId) continue;
		const list = matchesByMatchday.get(row.matchdayId) ?? [];
		list.push({
			matchId: row.matchId,
			homeTeamName: row.homeTeamName,
			awayTeamName: row.awayTeamName,
			venueName: row.venueName ?? null,
			kickoffAt: row.kickoffAt ?? null,
		});
		matchesByMatchday.set(row.matchdayId, list);
	}

	const now = Date.now();
	const MS_48H = 48 * 60 * 60 * 1000;

	// 4. Construir resultado final — serializar fechas a ISO string para la
	//    frontera Server → Client Component (Next.js no acepta Date como prop)
	return jornadasRows.map((j) => {
		const lastConfirmedAt = j.lastConfirmedAt ? new Date(j.lastConfirmedAt) : null;
		const recentlyUpdated = lastConfirmedAt ? now - lastConfirmedAt.getTime() <= MS_48H : false;
		return {
			id: j.id,
			number: j.number,
			phase: j.phase,
			scheduledDate: j.scheduledDate,
			status: j.status,
			matches: (matchesByMatchday.get(j.id) ?? []).map((m) => ({
				...m,
				kickoffAt: m.kickoffAt ? new Date(m.kickoffAt).toISOString() : null,
			})),
			recentlyUpdated,
			lastConfirmedAt: lastConfirmedAt ? lastConfirmedAt.toISOString() : null,
		};
	});
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/** Crea una nueva organización. */
export async function createOrganization(
	input: CreateOrganizationInput,
): Promise<typeof organizations.$inferSelect> {
	const [org] = await db
		.insert(organizations)
		.values({
			name: input.name,
			slug: input.slug,
			logoUrl: input.logoUrl,
			city: input.city,
		})
		.returning();
	return org;
}

/** Actualiza una organización existente. */
export async function updateOrganization(
	id: string,
	input: UpdateOrganizationInput,
): Promise<typeof organizations.$inferSelect | null> {
	const [updated] = await db
		.update(organizations)
		.set({
			...(input.name !== undefined && { name: input.name }),
			...(input.slug !== undefined && { slug: input.slug }),
			...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
			...(input.city !== undefined && { city: input.city }),
		})
		.where(eq(organizations.id, id))
		.returning();
	return updated ?? null;
}

/** Elimina una organización. Solo debería usarse si no tiene ligas activas. */
export async function deleteOrganization(id: string): Promise<boolean> {
	const result = await db
		.delete(organizations)
		.where(eq(organizations.id, id))
		.returning({ id: organizations.id });
	return result.length > 0;
}

/** Asigna un usuario a una organización (o lo desvincula con null). */
export async function setUserOrganization(
	userId: string,
	organizationId: string | null,
): Promise<void> {
	await db.update(users).set({ organizationId }).where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Showcase de ligas — homepage pública
// ---------------------------------------------------------------------------

export type LeagueShowcaseItem = {
	id: string;
	name: string;
	city: string;
	season: string;
	teamCount: number;
	playerCount: number;
	topScorer: { fullName: string; alias: string | null; goals: number } | null;
	/** Slug de la organización dueña de la liga. Null si la liga no tiene org. */
	orgSlug: string | null;
	/** Slug de la propia liga. Null si aún no fue asignado. */
	leagueSlug: string | null;
};

/**
 * Devuelve las ligas activas de una ciudad con datos de resumen para la
 * vitrina de la homepage: número de equipos, jugadores y goleador actual.
 */
export async function getLeaguesShowcase(city: string, limit = 6): Promise<LeagueShowcaseItem[]> {
	const activeLeagues = await db.query.leagues.findMany({
		where: and(eq(leagues.city, city), eq(leagues.status, "active")),
		with: {
			teams: { columns: { id: true } },
			// Include org status so we can filter out trial orgs below
			organization: { columns: { slug: true, status: true } },
		},
		orderBy: [desc(leagues.createdAt)],
		// Fetch extra to account for trial org filtering
		limit: limit * 3,
	});

	// Only show leagues from verified organizations in public cross-org views
	const verifiedLeagues = activeLeagues
		.filter((l) => l.organization?.status === "verified")
		.slice(0, limit);

	if (verifiedLeagues.length === 0) return [];

	const leagueIds = verifiedLeagues.map((l) => l.id);

	// Goleo combinado (Excel histórico o cálculo en vivo, por liga) — migrado a
	// V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P15): antes leía
	// `player_season_stats` directo, así que cualquier liga 100% en-app
	// siempre salía con 0 jugadores y sin goleador en la vitrina de home.
	const scorerRows = await getMergedLeagueScorers(leagueIds);

	// playerCount = jugadores con al menos una fila de stats en la liga (Excel
	// o en vivo) — mismo criterio que antes (contaba filas de player_season_stats
	// sin filtrar por goles).
	const playerCountMap = new Map<string, number>();
	const topScorerMap = new Map<string, { fullName: string; goals: number }>();
	for (const row of scorerRows) {
		playerCountMap.set(row.leagueId, (playerCountMap.get(row.leagueId) ?? 0) + 1);
		const existing = topScorerMap.get(row.leagueId);
		if (row.goals > 0 && (!existing || row.goals > existing.goals)) {
			topScorerMap.set(row.leagueId, { fullName: row.fullName, goals: row.goals });
		}
	}

	return verifiedLeagues.map((league) => {
		const scorer = topScorerMap.get(league.id) ?? null;
		return {
			id: league.id,
			name: league.name,
			city: league.city,
			season: league.season ?? "",
			teamCount: league.teams.length,
			playerCount: playerCountMap.get(league.id) ?? 0,
			topScorer: scorer ? { fullName: scorer.fullName, alias: null, goals: scorer.goals } : null,
			orgSlug: league.organization?.slug ?? null,
			leagueSlug: league.slug ?? null,
		};
	});
}

// ---------------------------------------------------------------------------
// Hub público — datos de resumen para la página de organización
// ---------------------------------------------------------------------------

export type LeagueSnapshot = {
	leader: { teamName: string; points: number } | null;
	topScorer: { fullName: string; alias: string | null; goals: number } | null;
	lastJornada: number | null;
};

export type OrgHubStats = {
	totalGoals: number;
	lastJornada: number | null;
};

/**
 * Retorna el líder de tabla, top goleador y última jornada de una liga.
 * Usado en las cards del hub de organización.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P12): antes leía
 * `team_standings_snapshot` (líder + jornada) y `player_season_stats`
 * (goleador) directo — ambas 100% V1. El líder y la jornada ahora salen de
 * `getLatestStandings` (ya migrado, P10); el goleador de
 * `getMergedLeagueScorers` (Excel histórico o cálculo en vivo).
 */
export async function getLeagueSnapshot(leagueId: string): Promise<LeagueSnapshot> {
	const [{ standings, jornada }, scorerRows] = await Promise.all([
		getLatestStandings(leagueId),
		getMergedLeagueScorers([leagueId]),
	]);

	const leader = standings[0] ?? null;
	const topScorerRow = scorerRows.filter((r) => r.goals > 0).sort((a, b) => b.goals - a.goals)[0];

	return {
		lastJornada: jornada,
		leader: leader ? { teamName: leader.team.name, points: leader.points } : null,
		topScorer: topScorerRow
			? { fullName: topScorerRow.fullName, alias: null, goals: topScorerRow.goals }
			: null,
	};
}

// ---------------------------------------------------------------------------
// Zonas de clasificación pública
// ---------------------------------------------------------------------------

export type PublicZone = {
	id: string;
	name: string;
	fromPosition: number;
	toPosition: number;
	color: string;
};

/**
 * Retorna las zonas de clasificación de una liga, ordenadas por `order` y posición.
 * Se usa tanto en la página pública como en la admin.
 */
export async function getLeagueZones(leagueId: string): Promise<PublicZone[]> {
	const rows = await db.query.leaguePlayoffZones.findMany({
		where: eq(leaguePlayoffZones.leagueId, leagueId),
		orderBy: [asc(leaguePlayoffZones.order), asc(leaguePlayoffZones.fromPosition)],
	});

	return rows.map((z) => ({
		id: z.id,
		name: z.name,
		fromPosition: z.fromPosition,
		toPosition: z.toPosition,
		color: z.color,
	}));
}

/**
 * Retorna el total de goles y la última jornada registrada en toda la organización.
 * Usado en el strip de stats del hub.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P13): antes sumaba
 * `player_season_stats.goals` y el máximo de `team_standings_snapshot.jornada`
 * directo (100% V1) — cualquier liga de la org 100% en-app no aportaba nada a
 * estos totales. Ahora usa `getMergedLeagueScorers` (Excel histórico o
 * cálculo en vivo, por liga) y `getLastJornadaForLeagues` (vía `matchdays`).
 */
export async function getOrgHubStats(orgId: string): Promise<OrgHubStats> {
	const orgLeagues = await db
		.select({ id: leagues.id })
		.from(leagues)
		.where(eq(leagues.organizationId, orgId));

	const leagueIds = orgLeagues.map((l) => l.id);
	if (leagueIds.length === 0) return { totalGoals: 0, lastJornada: null };

	const [scorerRows, lastJornada] = await Promise.all([
		getMergedLeagueScorers(leagueIds),
		getLastJornadaForLeagues(leagueIds),
	]);

	const totalGoals = scorerRows.reduce((sum, r) => sum + r.goals, 0);

	return { totalGoals, lastJornada };
}

// ---------------------------------------------------------------------------
// Público — feed de partidos de la organización (próxima jornada + recientes)
//
// Agregados cross-liga para el home del subdominio. A diferencia de
// getPublicMatchdays (por liga), estos barren TODAS las ligas activas de la
// org y devuelven un puñado de partidos ya ordenado, listo para pintar.
// Fechas serializadas a ISO string para cruzar la frontera Server → Client.
// ---------------------------------------------------------------------------

export type OrgFeedMatch = {
	matchId: string;
	leagueName: string;
	leagueSlug: string | null;
	homeTeamName: string;
	awayTeamName: string;
	venueName: string | null;
	/** ISO string, null si no hay hora definida */
	kickoffAt: string | null;
	/** "YYYY-MM-DD" (columna date) */
	matchDate: string;
	/** null en próximos (aún sin capturar); número en recientes */
	homeScore: number | null;
	awayScore: number | null;
};

const ORG_FEED_COUNTED_STATUSES = [
	"played",
	"walkover_home",
	"walkover_away",
	"completed",
] as const;

/** W.O. = 3-0 para el ganador; el resto usa el marcador capturado. */
function resolveFeedScore(
	status: string,
	home: number | null,
	away: number | null,
): [number, number] {
	if (status === "walkover_home") return [3, 0];
	if (status === "walkover_away") return [0, 3];
	return [home ?? 0, away ?? 0];
}

/**
 * Próximos partidos programados de toda la org (todas las ligas activas),
 * ordenados por fecha/hora ascendente. Usado en el home del subdominio.
 */
export async function getOrgUpcomingMatches(orgId: string, limit = 6): Promise<OrgFeedMatch[]> {
	const homeTeams = alias(teams, "up_home_teams");
	const awayTeams = alias(teams, "up_away_teams");

	const rows = await db
		.select({
			matchId: matches.id,
			leagueName: leagues.name,
			leagueSlug: leagues.slug,
			homeTeamName: homeTeams.name,
			awayTeamName: awayTeams.name,
			venueName: venues.name,
			kickoffAt: matches.kickoffAt,
			matchDate: matches.matchDate,
		})
		.from(matches)
		.innerJoin(leagues, and(eq(leagues.id, matches.leagueId), eq(leagues.status, "active")))
		.innerJoin(homeTeams, eq(homeTeams.id, matches.homeTeamId))
		.innerJoin(awayTeams, eq(awayTeams.id, matches.awayTeamId))
		.leftJoin(venues, eq(venues.id, matches.venueId))
		.where(
			and(
				eq(leagues.organizationId, orgId),
				eq(matches.status, "scheduled"),
				sql`coalesce(${matches.kickoffAt}::date, ${matches.matchDate}) >= current_date`,
			),
		)
		.orderBy(
			sql`coalesce(${matches.kickoffAt}::date, ${matches.matchDate}) asc`,
			asc(matches.kickoffAt),
		)
		.limit(limit);

	return rows.map((r) => ({
		matchId: r.matchId,
		leagueName: r.leagueName,
		leagueSlug: r.leagueSlug ?? null,
		homeTeamName: r.homeTeamName,
		awayTeamName: r.awayTeamName,
		venueName: r.venueName ?? null,
		kickoffAt: r.kickoffAt ? new Date(r.kickoffAt).toISOString() : null,
		matchDate: r.matchDate,
		homeScore: null,
		awayScore: null,
	}));
}

/**
 * Últimos partidos jugados de toda la org (todas las ligas activas),
 * ordenados por fecha descendente, con marcador (W.O. = 3-0). Usado en el
 * home del subdominio.
 */
export async function getOrgRecentResults(orgId: string, limit = 6): Promise<OrgFeedMatch[]> {
	const homeTeams = alias(teams, "rc_home_teams");
	const awayTeams = alias(teams, "rc_away_teams");

	const rows = await db
		.select({
			matchId: matches.id,
			leagueName: leagues.name,
			leagueSlug: leagues.slug,
			homeTeamName: homeTeams.name,
			awayTeamName: awayTeams.name,
			venueName: venues.name,
			kickoffAt: matches.kickoffAt,
			matchDate: matches.matchDate,
			status: matches.status,
			homeScore: matches.homeScore,
			awayScore: matches.awayScore,
		})
		.from(matches)
		.innerJoin(leagues, and(eq(leagues.id, matches.leagueId), eq(leagues.status, "active")))
		.innerJoin(homeTeams, eq(homeTeams.id, matches.homeTeamId))
		.innerJoin(awayTeams, eq(awayTeams.id, matches.awayTeamId))
		.leftJoin(venues, eq(venues.id, matches.venueId))
		.where(
			and(
				eq(leagues.organizationId, orgId),
				inArray(matches.status, [...ORG_FEED_COUNTED_STATUSES]),
			),
		)
		.orderBy(desc(matches.matchDate), desc(matches.kickoffAt))
		.limit(limit);

	return rows.map((r) => {
		const [homeScore, awayScore] = resolveFeedScore(r.status, r.homeScore, r.awayScore);
		return {
			matchId: r.matchId,
			leagueName: r.leagueName,
			leagueSlug: r.leagueSlug ?? null,
			homeTeamName: r.homeTeamName,
			awayTeamName: r.awayTeamName,
			venueName: r.venueName ?? null,
			kickoffAt: r.kickoffAt ? new Date(r.kickoffAt).toISOString() : null,
			matchDate: r.matchDate,
			homeScore,
			awayScore,
		};
	});
}

// ---------------------------------------------------------------------------
// Público — Muro de la Fama (goleadores cruzando todas las ligas de la org)
// ---------------------------------------------------------------------------

export type OrgTopScorer = {
	playerId: string | null;
	fullName: string;
	teamName: string | null;
	goals: number;
};

/**
 * Top goleadores de TODA la organización (todas las ligas activas), goleo
 * combinado (Excel histórico o cálculo en vivo, por liga — mismo criterio que
 * `getMergedLeagueScorers`, §1 AGENTS.md). Usado en el Muro de la Fama del
 * home del subdominio (Zona 2).
 */
export async function getOrgTopScorers(orgId: string, limit = 5): Promise<OrgTopScorer[]> {
	const orgLeagues = await db
		.select({ id: leagues.id })
		.from(leagues)
		.where(and(eq(leagues.organizationId, orgId), eq(leagues.status, "active")));

	const leagueIds = orgLeagues.map((l) => l.id);
	if (leagueIds.length === 0) return [];

	const scorerRows = await getMergedLeagueScorers(leagueIds);

	return scorerRows
		.filter((r) => r.goals > 0)
		.sort((a, b) => b.goals - a.goals)
		.slice(0, limit)
		.map((r) => ({
			playerId: r.playerId,
			fullName: r.fullName,
			teamName: r.teamName,
			goals: r.goals,
		}));
}

// ---------------------------------------------------------------------------
// Público — partidos de HOY, cruzando todas las ligas de la org
// ---------------------------------------------------------------------------

/**
 * Partidos programados para HOY en cualquier liga activa de la organización,
 * ordenados por hora ascendente. Usado en "Jugando Hoy" del home del
 * subdominio (Zona 2). Mismo criterio de fecha que `getOrgUpcomingMatches`
 * (coalesce kickoffAt/matchDate) pero acotado al día de hoy en vez de
 * "desde hoy en adelante".
 */
export async function getOrgMatchesToday(orgId: string, limit = 8): Promise<OrgFeedMatch[]> {
	const homeTeams = alias(teams, "td_home_teams");
	const awayTeams = alias(teams, "td_away_teams");

	const rows = await db
		.select({
			matchId: matches.id,
			leagueName: leagues.name,
			leagueSlug: leagues.slug,
			homeTeamName: homeTeams.name,
			awayTeamName: awayTeams.name,
			venueName: venues.name,
			kickoffAt: matches.kickoffAt,
			matchDate: matches.matchDate,
		})
		.from(matches)
		.innerJoin(leagues, and(eq(leagues.id, matches.leagueId), eq(leagues.status, "active")))
		.innerJoin(homeTeams, eq(homeTeams.id, matches.homeTeamId))
		.innerJoin(awayTeams, eq(awayTeams.id, matches.awayTeamId))
		.leftJoin(venues, eq(venues.id, matches.venueId))
		.where(
			and(
				eq(leagues.organizationId, orgId),
				eq(matches.status, "scheduled"),
				sql`coalesce(${matches.kickoffAt}::date, ${matches.matchDate}) = current_date`,
			),
		)
		.orderBy(asc(matches.kickoffAt))
		.limit(limit);

	return rows.map((r) => ({
		matchId: r.matchId,
		leagueName: r.leagueName,
		leagueSlug: r.leagueSlug ?? null,
		homeTeamName: r.homeTeamName,
		awayTeamName: r.awayTeamName,
		venueName: r.venueName ?? null,
		kickoffAt: r.kickoffAt ? new Date(r.kickoffAt).toISOString() : null,
		matchDate: r.matchDate,
		homeScore: null,
		awayScore: null,
	}));
}

// ---------------------------------------------------------------------------
// Público — buscador de equipos del home del subdominio (Zona 1)
// ---------------------------------------------------------------------------

export type OrgTeamSearchResult = {
	teamId: string;
	teamName: string;
	leagueName: string;
	leagueSlug: string | null;
};

/**
 * Busca equipos por nombre dentro de las ligas ACTIVAS de una organización.
 * Usado por el buscador "¿En qué equipo juegas?" del home del subdominio.
 * Búsqueda simple por `nameCanonical` (mismo patrón que `buildOrgDirectoryWhere`),
 * no fuzzy/similarity — acotado a los equipos de una sola org.
 */
export async function searchOrgTeams(
	orgId: string,
	q: string,
	limit = 8,
): Promise<OrgTeamSearchResult[]> {
	const canonical = sanitizeToCanonical(q.trim());
	if (!canonical) return [];

	const rows = await db
		.select({
			teamId: teams.id,
			teamName: teams.name,
			leagueName: leagues.name,
			leagueSlug: leagues.slug,
		})
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.where(
			and(
				eq(leagues.organizationId, orgId),
				eq(leagues.status, "active"),
				eq(teams.status, "active"),
				ilike(teams.nameCanonical, `%${canonical}%`),
			),
		)
		.orderBy(asc(teams.name))
		.limit(limit);

	return rows.map((r) => ({ ...r, leagueSlug: r.leagueSlug ?? null }));
}

// ---------------------------------------------------------------------------
// Verificaciones pendientes — panel del owner
// ---------------------------------------------------------------------------

export type PendingVerification = {
	id: string;
	name: string;
	slug: string;
	city: string;
	verificationRequestedAt: Date;
	organizer: { name: string; email: string } | null;
};

/**
 * Returns organizations in trial mode that have requested verification.
 * Used in /admin/verifications (owner-only panel).
 */
export async function listPendingVerifications(): Promise<PendingVerification[]> {
	const orgs = await db.query.organizations.findMany({
		where: and(eq(organizations.status, "trial"), isNotNull(organizations.verificationRequestedAt)),
		orderBy: [asc(organizations.verificationRequestedAt)],
	});

	if (orgs.length === 0) return [];

	const orgIds = orgs.map((o) => o.id);

	// Get the first organizer user for each org (to show contact info)
	const organizers = await db.query.users.findMany({
		where: and(inArray(users.organizationId, orgIds), eq(users.role, "organizer")),
		columns: { organizationId: true, name: true, email: true },
	});

	const organizerMap = new Map(organizers.map((u) => [u.organizationId, u]));

	return orgs.map((org) => ({
		id: org.id,
		name: org.name,
		slug: org.slug,
		city: org.city,
		verificationRequestedAt: org.verificationRequestedAt!,
		organizer: organizerMap.get(org.id) ?? null,
	}));
}

/**
 * Marks an organization as verified.
 * Returns the updated org and the organizer's email for sending confirmation.
 */
export async function approveOrganization(orgId: string): Promise<{
	org: typeof organizations.$inferSelect;
	organizerEmail: string | null;
	organizerName: string | null;
} | null> {
	const [updated] = await db
		.update(organizations)
		.set({ status: "verified", verificationRequestedAt: null })
		.where(eq(organizations.id, orgId))
		.returning();

	if (!updated) return null;

	const organizer = await db.query.users.findFirst({
		where: and(eq(users.organizationId, orgId), eq(users.role, "organizer")),
		columns: { email: true, name: true },
	});

	return {
		org: updated,
		organizerEmail: organizer?.email ?? null,
		organizerName: organizer?.name ?? null,
	};
}
