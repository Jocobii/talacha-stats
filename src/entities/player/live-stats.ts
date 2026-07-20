/**
 * entities/player/live-stats.ts
 *
 * Cálculo EN VIVO de stats de jugador desde `match_player_stats` (V2, cédula
 * de partido) — mismo patrón "Prioridad 2" que ya existe para la tabla de
 * posiciones de equipos (`src/lib/standings.ts`).
 *
 * Por qué existe (hallazgo, julio 2026): `player_season_stats` (V1, Excel)
 * solo lo escriben el importador (eliminado en 2026, §1.6 AGENTS.md) y el
 * simulador de pruebas — ninguna liga capturada 100% en-app vía cédula tiene
 * filas ahí. `match_events` tampoco lo escribe nadie en producción (solo el
 * simulador). `match_player_stats` es la ÚNICA fuente viva de stats de
 * jugador en producción hoy. Sin este módulo, cualquier liga nueva corrida
 * 100% con sorteo + cédula se ve vacía en goleo/ranking/perfil para siempre,
 * aunque la cédula tenga los datos correctos.
 *
 * Regla de prioridad (§1 AGENTS.md): si una liga tiene `player_season_stats`
 * (import de Excel), esa es la fuente — nunca se mezcla con el cálculo en
 * vivo de la MISMA liga para no duplicar goles. `getMergedLeagueStatsRows`
 * decide la fuente por liga, no por fila.
 *
 * MVP no se captura en la cédula (`match_player_stats` no tiene columna
 * `mvp` — solo existía en `match_events`, eventType 'mvp'). Todo cálculo en
 * vivo reporta `mvpCount = 0`.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
	db,
	matches,
	matchPlayerStats,
	inscriptions,
	leagueMembers,
	globalPlayers,
	leagues,
	teams,
	matchdays,
	playerSeasonStats,
} from "@/db";

/**
 * Statuses que representan un partido "real" con stats capturadas — mismo
 * criterio que `features/match-resolution/lib/freeze-league-config.ts`
 * (`COUNTED_RESOLUTION_STATUSES`). No se puede importar ese archivo aquí
 * (entities → features está prohibido, §3.1 AGENTS.md): se mantiene
 * sincronizado a mano. Si cambia uno, cambia el otro.
 */
export const COUNTED_MATCH_STATUSES = ["played", "walkover_home", "walkover_away"] as const;

export type MergedLeagueStatsRow = {
	playerId: string; // global_player_id
	fullName: string;
	leagueId: string;
	leagueName: string;
	city: string;
	teamId: string | null;
	teamName: string | null;
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	matches: number;
	source: "season_stats" | "live_match_stats";
};

/** Ids de liga (del subconjunto dado) que ya tienen `player_season_stats` importado. */
export async function getLeagueIdsWithSeasonStats(leagueIds: string[]): Promise<Set<string>> {
	if (leagueIds.length === 0) return new Set();
	const rows = await db
		.selectDistinct({ leagueId: playerSeasonStats.leagueId })
		.from(playerSeasonStats)
		.where(inArray(playerSeasonStats.leagueId, leagueIds));
	return new Set(rows.map((r) => r.leagueId));
}

async function fetchSeasonStatsRows(leagueIds: string[]): Promise<MergedLeagueStatsRow[]> {
	if (leagueIds.length === 0) return [];
	const rows = await db
		.select({
			playerId: playerSeasonStats.globalPlayerId,
			fullName: globalPlayers.fullName,
			leagueId: playerSeasonStats.leagueId,
			leagueName: leagues.name,
			city: leagues.city,
			teamId: playerSeasonStats.teamId,
			teamName: teams.name,
			goals: playerSeasonStats.goals,
			assists: playerSeasonStats.assists,
			yellowCards: playerSeasonStats.yellowCards,
			redCards: playerSeasonStats.redCards,
			matches: playerSeasonStats.matchesPlayed,
		})
		.from(playerSeasonStats)
		.innerJoin(globalPlayers, eq(playerSeasonStats.globalPlayerId, globalPlayers.id))
		.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.where(inArray(playerSeasonStats.leagueId, leagueIds));

	// globalPlayerId es nullable en el schema (columna agregada después) —
	// filas legacy sin backfill no se pueden atribuir a un jugador global.
	return rows
		.filter((r): r is (typeof rows)[number] & { playerId: string } => r.playerId !== null)
		.map((r) => ({ ...r, source: "season_stats" as const }));
}

/** Agrega goles/asistencias/tarjetas/partidos por jugador calculado en vivo desde match_player_stats. */
async function fetchLiveStatsRows(leagueIds: string[]): Promise<MergedLeagueStatsRow[]> {
	if (leagueIds.length === 0) return [];
	const rows = await db
		.select({
			playerId: leagueMembers.globalPlayerId,
			fullName: globalPlayers.fullName,
			leagueId: leagueMembers.leagueId,
			leagueName: leagues.name,
			city: leagues.city,
			teamId: inscriptions.teamId,
			teamName: teams.name,
			goals: sql<number>`COALESCE(SUM(${matchPlayerStats.goals}), 0)::int`,
			assists: sql<number>`COALESCE(SUM(${matchPlayerStats.assists}), 0)::int`,
			yellowCards: sql<number>`COALESCE(SUM(${matchPlayerStats.yellowCards}), 0)::int`,
			redCards: sql<number>`COALESCE(SUM(${matchPlayerStats.redCards}), 0)::int`,
			matches: sql<number>`COUNT(*) FILTER (WHERE ${matchPlayerStats.isPresent})::int`,
		})
		.from(matchPlayerStats)
		.innerJoin(matches, eq(matchPlayerStats.matchId, matches.id))
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.innerJoin(leagues, eq(matches.leagueId, leagues.id))
		.leftJoin(teams, eq(inscriptions.teamId, teams.id))
		.where(
			and(inArray(matches.leagueId, leagueIds), inArray(matches.status, COUNTED_MATCH_STATUSES)),
		)
		.groupBy(
			leagueMembers.globalPlayerId,
			globalPlayers.fullName,
			leagueMembers.leagueId,
			leagues.name,
			leagues.city,
			inscriptions.teamId,
			teams.name,
		);

	return rows.map((r) => ({ ...r, source: "live_match_stats" as const }));
}

/**
 * Fuente combinada para goleo/ranking/perfil: por cada liga en `leagueIds`,
 * usa `player_season_stats` si existe (Excel, histórico) o lo calcula en
 * vivo desde `match_player_stats` si no — nunca ambas para la misma liga
 * (evita duplicar goles).
 */
export async function getMergedLeagueStatsRows(
	leagueIds: string[],
): Promise<MergedLeagueStatsRow[]> {
	if (leagueIds.length === 0) return [];

	const withSeasonStats = await getLeagueIdsWithSeasonStats(leagueIds);
	const seasonLeagueIds = leagueIds.filter((id) => withSeasonStats.has(id));
	const liveLeagueIds = leagueIds.filter((id) => !withSeasonStats.has(id));

	const [seasonRows, liveRows] = await Promise.all([
		fetchSeasonStatsRows(seasonLeagueIds),
		fetchLiveStatsRows(liveLeagueIds),
	]);

	return [...seasonRows, ...liveRows];
}

// ── Racha / hat-tricks en vivo ──────────────────────────────────────────────
// Goles por partido de UN jugador, con jornada cuando la liga usa scheduling
// (matches.matchdayId → matchdays.number). Sin snapshot (V1), esto reemplaza
// a playerSeasonStatsSnapshot para ligas 100% V2.

export type LiveMatchGoalRow = {
	leagueId: string;
	jornada: number | null; // null si la liga no usa el módulo de scheduling (matchdayId no asignado)
	goals: number;
};

export async function getLivePlayerMatchGoals(
	globalPlayerId: string,
	leagueIds: string[],
): Promise<LiveMatchGoalRow[]> {
	if (leagueIds.length === 0) return [];
	const rows = await db
		.select({
			leagueId: matches.leagueId,
			jornada: matchdays.number,
			goals: matchPlayerStats.goals,
			resolvedAt: matches.resolvedAt,
		})
		.from(matchPlayerStats)
		.innerJoin(matches, eq(matchPlayerStats.matchId, matches.id))
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(matchdays, eq(matches.matchdayId, matchdays.id))
		.where(
			and(
				eq(leagueMembers.globalPlayerId, globalPlayerId),
				inArray(matches.leagueId, leagueIds),
				inArray(matches.status, COUNTED_MATCH_STATUSES),
			),
		)
		.orderBy(asc(matchdays.number), asc(matches.resolvedAt));

	return rows.map((r) => ({ leagueId: r.leagueId, jornada: r.jornada, goals: r.goals }));
}

// ── Tabla de honor por jornada (en vivo) ─────────────────────────────────────
// Reemplaza la lectura de player_season_stats en entities/player/ranking.ts
// (docs/V1-REMOVAL-PLAN.md, Fase 1, P3/D2 — jul 2026). No hay backfill (D1):
// una liga cuyo único historial vive en Excel simplemente no aparece aquí
// (antes tampoco aparecía si nunca corrió import, así que no es una regresión
// nueva para ligas 100% en-app — sí lo es para ligas de Excel, aceptado).

export type LiveJornadaHero = {
	playerId: string;
	fullName: string;
	teamName: string | null;
	goals: number;
	matchesPlayed: number;
};

export type LiveJornadaHonor = {
	jornada: number;
	heroes: LiveJornadaHero[];
};

/**
 * Última jornada de la liga con al menos un gol capturado vía cédula, y sus
 * hasta 3 goleadores de ESA jornada (no acumulado de temporada). `null` si la
 * liga no tiene ninguna jornada con goles en `match_player_stats`.
 */
export async function getLiveJornadaHonor(leagueId: string): Promise<LiveJornadaHonor | null> {
	const latest = await db
		.select({ matchdayId: matchdays.id, number: matchdays.number })
		.from(matchdays)
		.innerJoin(matches, eq(matches.matchdayId, matchdays.id))
		.innerJoin(matchPlayerStats, eq(matchPlayerStats.matchId, matches.id))
		.where(
			and(
				eq(matchdays.leagueId, leagueId),
				inArray(matches.status, COUNTED_MATCH_STATUSES),
				sql`${matchPlayerStats.goals} > 0`,
			),
		)
		.groupBy(matchdays.id, matchdays.number)
		.orderBy(desc(matchdays.number))
		.limit(1);

	const jornada = latest[0];
	if (!jornada) return null;

	const heroRows = await db
		.select({
			playerId: leagueMembers.globalPlayerId,
			fullName: globalPlayers.fullName,
			teamName: teams.name,
			goals: sql<number>`SUM(${matchPlayerStats.goals})::int`,
			matchesPlayed: sql<number>`COUNT(*) FILTER (WHERE ${matchPlayerStats.isPresent})::int`,
		})
		.from(matchPlayerStats)
		.innerJoin(matches, eq(matchPlayerStats.matchId, matches.id))
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.leftJoin(teams, eq(inscriptions.teamId, teams.id))
		.where(
			and(
				eq(matches.matchdayId, jornada.matchdayId),
				inArray(matches.status, COUNTED_MATCH_STATUSES),
			),
		)
		.groupBy(leagueMembers.globalPlayerId, globalPlayers.fullName, teams.name)
		.having(sql`SUM(${matchPlayerStats.goals}) > 0`)
		.orderBy(desc(sql`SUM(${matchPlayerStats.goals})`))
		.limit(3);

	return {
		jornada: jornada.number,
		heroes: heroRows.map((r) => ({
			playerId: r.playerId!,
			fullName: r.fullName,
			teamName: r.teamName,
			goals: r.goals,
			matchesPlayed: r.matchesPlayed,
		})),
	};
}

// ── Roster de un equipo con stats V2 sobre un subconjunto de partidos ───────
// Reemplaza el roster V1 (`player_registrations` + `player_season_stats`/
// `match_events`) que usaban `lib/narrator.ts` y `lib/preview.ts`
// (docs/V1-REMOVAL-PLAN.md, Fase 1, P4/P5 — jul 2026). El caller decide qué
// partidos entran en la agregación (temporada completa, últimos 3, etc.) —
// esta función solo agrega. LEFT JOIN desde `inscriptions`: un jugador sin
// ninguna stat en los `matchIds` dados igual aparece, con todo en 0 (mismo
// comportamiento que el roster V1 original, que incluía jugadores sin goles).

export type TeamMatchStatsRosterEntry = {
	playerId: string; // global_player_id
	fullName: string;
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	matchesPlayed: number;
};

export async function getTeamMatchStatsRoster(
	teamId: string,
	matchIds: string[],
): Promise<TeamMatchStatsRosterEntry[]> {
	const statsFilter =
		matchIds.length > 0
			? and(eq(matchPlayerStats.playerRegistrationId, inscriptions.id), inArray(matchPlayerStats.matchId, matchIds))
			: sql`false`; // sin partidos → LEFT JOIN no matchea nada, todo en 0

	const rows = await db
		.select({
			playerId: leagueMembers.globalPlayerId,
			fullName: globalPlayers.fullName,
			goals: sql<number>`COALESCE(SUM(${matchPlayerStats.goals}), 0)::int`,
			assists: sql<number>`COALESCE(SUM(${matchPlayerStats.assists}), 0)::int`,
			yellowCards: sql<number>`COALESCE(SUM(${matchPlayerStats.yellowCards}), 0)::int`,
			redCards: sql<number>`COALESCE(SUM(${matchPlayerStats.redCards}), 0)::int`,
			matchesPlayed: sql<number>`COUNT(*) FILTER (WHERE ${matchPlayerStats.isPresent})::int`,
		})
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.leftJoin(matchPlayerStats, statsFilter)
		.where(eq(inscriptions.teamId, teamId))
		.groupBy(leagueMembers.globalPlayerId, globalPlayers.fullName);

	return rows.map((r) => ({
		playerId: r.playerId,
		fullName: r.fullName,
		goals: r.goals,
		assists: r.assists,
		yellowCards: r.yellowCards,
		redCards: r.redCards,
		matchesPlayed: r.matchesPlayed,
	}));
}
