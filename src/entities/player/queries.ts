/**
 * entities/player/queries.ts
 * Acceso a DB para el perfil de jugador cross-liga.
 *
 * Fuentes de stats (prioridad):
 *  1. player_season_stats  → importadas desde Excel (más completas)
 *  2. match_events          → fallback si no hay import para esa liga
 */

import { eq, and, inArray, desc, asc, sql } from "drizzle-orm";
import {
	db,
	players,
	playerRegistrations,
	playerSeasonStats,
	playerSeasonStatsSnapshot,
	matchEvents,
	matches,
	leagues,
	teams,
} from "@/db";
import type {
	PlayerView,
	PlayerLeagueStats,
	PlayerGlobalProfile,
	PlayerEgoStats,
	PlayerPositions,
	PlayerTeamGoalShare,
	PlayerBadge,
} from "./model";
import { getPlayerPositions } from "./ranking";

// ── Función principal ─────────────────────────────────────────────────────────

export async function getPlayerProfile(playerId: string): Promise<PlayerView | null> {
	// 1. Datos básicos del jugador
	const player = await db.query.players.findFirst({
		where: eq(players.id, playerId),
	});
	if (!player) return null;

	// 2. Todas las ligas en las que está registrado (con liga y equipo)
	const registrations = await db.query.playerRegistrations.findMany({
		where: eq(playerRegistrations.legacyPlayerId, playerId),
		with: { league: true, team: true },
	});

	if (registrations.length === 0) {
		return {
			id: player.id,
			fullName: player.fullName,
			alias: player.alias,
			phone: player.phone,
			photoUrl: player.photoUrl,
			global: emptyGlobal(),
			leagues: [],
		};
	}

	// 3. Todas las season_stats de este jugador (una sola query)
	const allSeasonStats = await db.query.playerSeasonStats.findMany({
		where: eq(playerSeasonStats.legacyPlayerId, playerId),
	});
	const seasonStatsMap = new Map(allSeasonStats.map((s) => [s.leagueId, s]));

	// 4. Para ligas sin season_stats, obtener conteos desde match_events
	const leagueIdsWithoutStats = registrations
		.map((r) => r.leagueId)
		.filter((id) => !seasonStatsMap.has(id));

	const fallbackData = await fetchMatchEventsFallback(playerId, leagueIdsWithoutStats);

	// 5. Construir stats por liga
	const leagueStats: PlayerLeagueStats[] = registrations.map((reg) => {
		const seasonStats = seasonStatsMap.get(reg.leagueId);

		if (seasonStats) {
			const gpm =
				seasonStats.matchesPlayed > 0 ? round2(seasonStats.goals / seasonStats.matchesPlayed) : 0;
			return {
				leagueId: reg.leagueId,
				leagueName: reg.league.name,
				dayOfWeek: reg.league.dayOfWeek,
				season: reg.league.season,
				city: reg.league.city,
				teamId: reg.teamId,
				teamName: reg.team.name,
				goals: seasonStats.goals,
				assists: seasonStats.assists,
				contributions: seasonStats.goals + seasonStats.assists,
				yellowCards: seasonStats.yellowCards,
				redCards: seasonStats.redCards,
				mvpCount: 0, // player_season_stats no almacena MVPs
				matchesPlayed: seasonStats.matchesPlayed,
				goalsPerMatch: gpm,
				source: "season_stats",
				leagueStatus: "active" as const, // se sobreescribe en el paso 6
			};
		}

		// Fallback desde match_events
		const fb = fallbackData.get(reg.leagueId) ?? emptyEventCounts();
		const gpm = fb.matchesPlayed > 0 ? round2(fb.goals / fb.matchesPlayed) : 0;
		return {
			leagueId: reg.leagueId,
			leagueName: reg.league.name,
			dayOfWeek: reg.league.dayOfWeek,
			season: reg.league.season,
			city: reg.league.city,
			teamId: reg.teamId,
			teamName: reg.team.name,
			goals: fb.goals,
			assists: fb.assists,
			contributions: fb.goals + fb.assists,
			yellowCards: fb.yellowCards,
			redCards: fb.redCards,
			mvpCount: fb.mvpCount,
			matchesPlayed: fb.matchesPlayed,
			goalsPerMatch: gpm,
			source: "match_events",
			leagueStatus: "active" as const, // se sobreescribe en el paso 6
		};
	});

	// 6. Determinar status efectivo de cada liga (explícito + auto-detección de sucesor)
	const leagueIds = registrations.map((r) => r.leagueId);
	const finishedIds = await resolveFinishedLeagues(leagueIds);

	for (const stat of leagueStats) {
		stat.leagueStatus = finishedIds.has(stat.leagueId) ? "finished" : "active";
	}

	// 7. Ordenar: activas primero, luego por goles → asistencias → nombre
	leagueStats.sort((a, b) => {
		// Activas antes que terminadas
		if (a.leagueStatus !== b.leagueStatus) {
			return a.leagueStatus === "active" ? -1 : 1;
		}
		if (b.goals !== a.goals) return b.goals - a.goals;
		if (b.assists !== a.assists) return b.assists - a.assists;
		return a.leagueName.localeCompare(b.leagueName);
	});

	// 7. Stats globales
	const global = computeGlobal(leagueStats);

	return {
		id: player.id,
		fullName: player.fullName,
		alias: player.alias,
		phone: player.phone,
		photoUrl: player.photoUrl,
		global,
		leagues: leagueStats,
	};
}

// ── Resolución de status de ligas ─────────────────────────────────────────────
// Una liga se considera "finished" si:
//   1. Su campo status = 'finished' (cierre explícito del admin), O
//   2. Existe una liga con el mismo nombre + dayOfWeek + ciudad creada después
//      (significa que fue reiniciada con "Nueva temporada" o manualmente).
//
// Esta función se ejecuta en cada carga del perfil — sin cron job necesario.

async function resolveFinishedLeagues(leagueIds: string[]): Promise<Set<string>> {
	if (leagueIds.length === 0) return new Set();

	const l1 = leagues;

	const rows = await db
		.select({ id: l1.id })
		.from(l1)
		.where(
			and(
				inArray(l1.id, leagueIds),
				sql`(
          ${l1.status} = 'finished'
          OR EXISTS (
            SELECT 1 FROM leagues l2
            WHERE l2.name      = ${l1.name}
              AND l2.day_of_week = ${l1.dayOfWeek}
              AND l2.city       = ${l1.city}
              AND l2.created_at > ${l1.createdAt}
              AND l2.id        != ${l1.id}
          )
        )`,
			),
		);

	return new Set(rows.map((r) => r.id));
}

// ── Fallback: conteos de match_events por liga ────────────────────────────────

type EventCounts = {
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	mvpCount: number;
	matchesPlayed: number;
};

async function fetchMatchEventsFallback(
	playerId: string,
	leagueIds: string[],
): Promise<Map<string, EventCounts>> {
	const result = new Map<string, EventCounts>();
	if (leagueIds.length === 0) return result;

	// Conteos por tipo de evento y liga — una sola query
	const eventRows = await db
		.select({
			leagueId: matches.leagueId,
			eventType: matchEvents.eventType,
			count: sql<number>`count(*)::int`,
		})
		.from(matchEvents)
		.innerJoin(matches, eq(matchEvents.matchId, matches.id))
		.where(
			and(
				eq(matchEvents.legacyPlayerId, playerId),
				eq(matches.status, "completed"),
				inArray(matches.leagueId, leagueIds),
			),
		)
		.groupBy(matches.leagueId, matchEvents.eventType);

	// Partidos jugados (distintos) por liga — una sola query
	const matchRows = await db
		.selectDistinct({
			leagueId: matches.leagueId,
			matchId: matchEvents.matchId,
		})
		.from(matchEvents)
		.innerJoin(matches, eq(matchEvents.matchId, matches.id))
		.where(
			and(
				eq(matchEvents.legacyPlayerId, playerId),
				eq(matches.status, "completed"),
				inArray(matches.leagueId, leagueIds),
			),
		);

	// Conteo de partidos por liga
	const matchCountByLeague = new Map<string, number>();
	for (const row of matchRows) {
		matchCountByLeague.set(row.leagueId, (matchCountByLeague.get(row.leagueId) ?? 0) + 1);
	}

	// Agrupar eventos por liga
	for (const row of eventRows) {
		if (!result.has(row.leagueId)) {
			result.set(row.leagueId, emptyEventCounts());
		}
		const entry = result.get(row.leagueId)!;
		switch (row.eventType) {
			case "goal":
				entry.goals = row.count;
				break;
			case "assist":
				entry.assists = row.count;
				break;
			case "yellow_card":
				entry.yellowCards = row.count;
				break;
			case "red_card":
				entry.redCards = row.count;
				break;
			case "mvp":
				entry.mvpCount = row.count;
				break;
		}
	}

	// Inyectar partidos jugados
	for (const [leagueId, count] of matchCountByLeague) {
		if (!result.has(leagueId)) result.set(leagueId, emptyEventCounts());
		result.get(leagueId)!.matchesPlayed = count;
	}

	return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeGlobal(leagues: PlayerLeagueStats[]): PlayerGlobalProfile {
	const totalGoals = leagues.reduce((s, l) => s + l.goals, 0);
	const totalAssists = leagues.reduce((s, l) => s + l.assists, 0);
	const totalMatches = leagues.reduce((s, l) => s + l.matchesPlayed, 0);
	const totalYellow = leagues.reduce((s, l) => s + l.yellowCards, 0);
	const totalRed = leagues.reduce((s, l) => s + l.redCards, 0);
	const totalMvp = leagues.reduce((s, l) => s + l.mvpCount, 0);

	return {
		totalGoals,
		totalAssists,
		totalContributions: totalGoals + totalAssists,
		totalYellowCards: totalYellow,
		totalRedCards: totalRed,
		totalMvp,
		totalMatches,
		leaguesCount: leagues.length,
		goalsPerMatch: totalMatches > 0 ? round2(totalGoals / totalMatches) : 0,
	};
}

function emptyGlobal(): PlayerGlobalProfile {
	return {
		totalGoals: 0,
		totalAssists: 0,
		totalContributions: 0,
		totalYellowCards: 0,
		totalRedCards: 0,
		totalMvp: 0,
		totalMatches: 0,
		leaguesCount: 0,
		goalsPerMatch: 0,
	};
}

function emptyEventCounts(): EventCounts {
	return { goals: 0, assists: 0, yellowCards: 0, redCards: 0, mvpCount: 0, matchesPlayed: 0 };
}

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

// ── Player Ego Stats ──────────────────────────────────────────────────────────
// Todos los cálculos que alimentan el perfil público (ranking, racha, badges).
// Sin dependencia del resultado de getPlayerProfile — queries propias.

export async function getPlayerEgoStats(playerId: string): Promise<PlayerEgoStats> {
	// Rows de season_stats con info de liga y equipo
	const seasonRows = await db
		.select({
			leagueId: playerSeasonStats.leagueId,
			leagueName: leagues.name,
			teamId: playerSeasonStats.teamId,
			teamName: teams.name,
			goals: playerSeasonStats.goals,
			matchesPlayed: playerSeasonStats.matchesPlayed,
			city: leagues.city,
		})
		.from(playerSeasonStats)
		.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.where(eq(playerSeasonStats.legacyPlayerId, playerId));

	const [streak, hatTricks, mvpCount] = await Promise.all([
		fetchGoalStreak(playerId),
		fetchHatTricks(playerId),
		fetchMvpCount(playerId),
	]);

	if (seasonRows.length === 0) {
		return emptyEgoStats();
	}

	// Liga con más goles para el scope de posiciones
	const bestRow = seasonRows.reduce((a, b) => (b.goals > a.goals ? b : a));

	const positions = await getPlayerPositions(playerId, {
		leagueId: bestRow.leagueId,
		city: bestRow.city,
	});

	const cityTopPercent =
		positions.city && positions.city.goals > 0 && positions.city.total > 0
			? Math.ceil((positions.city.rank / positions.city.total) * 100)
			: null;

	const normalizedRows = seasonRows.map((r) => ({
		leagueId: r.leagueId,
		leagueName: r.leagueName,
		teamId: r.teamId,
		teamName: r.teamName ?? "—",
		goals: r.goals,
		matchesPlayed: r.matchesPlayed,
	}));

	const teamGoalShares = await fetchTeamGoalShares(normalizedRows);
	const leaguesCount = new Set(seasonRows.map((r) => r.leagueId)).size;
	const totalMatches = seasonRows.reduce((s, r) => s + r.matchesPlayed, 0);
	const totalGoals = seasonRows.reduce((s, r) => s + r.goals, 0);
	const overallGPM = totalMatches > 0 ? totalGoals / totalMatches : 0;
	const badges = computeBadges(
		positions,
		leaguesCount,
		mvpCount,
		streak,
		hatTricks,
		totalMatches,
		overallGPM,
	);

	return { positions, cityTopPercent, goalStreak: streak, hatTricks, teamGoalShares, badges };
}

// ── Helpers de ego stats ──────────────────────────────────────────────────────

// Racha activa: jornadas consecutivas con Δgoles > 0 desde la más reciente.
// Usa snapshot en lugar de match_events — funciona con importación Excel.
async function fetchGoalStreak(playerId: string): Promise<number> {
	const rows = await db
		.select({
			leagueId: playerSeasonStatsSnapshot.leagueId,
			jornada: playerSeasonStatsSnapshot.jornada,
			goals: playerSeasonStatsSnapshot.goals,
		})
		.from(playerSeasonStatsSnapshot)
		.where(eq(playerSeasonStatsSnapshot.playerId, playerId))
		.orderBy(desc(playerSeasonStatsSnapshot.leagueId), desc(playerSeasonStatsSnapshot.jornada));

	if (rows.length === 0) return 0;

	// Agrupar por liga manteniendo orden jornada desc
	const byLeague = new Map<string, { jornada: number; goals: number }[]>();
	for (const r of rows) {
		if (!byLeague.has(r.leagueId)) byLeague.set(r.leagueId, []);
		byLeague.get(r.leagueId)!.push({ jornada: r.jornada, goals: r.goals });
	}

	// Por cada liga calcular racha activa y retornar la mayor
	let bestStreak = 0;
	for (const snaps of byLeague.values()) {
		// snaps ya viene ordenado desc por jornada
		let streak = 0;
		for (let i = 0; i < snaps.length; i++) {
			const prev = snaps[i + 1];
			const delta = snaps[i].goals - (prev?.goals ?? 0);
			if (delta > 0) streak++;
			else break;
		}
		if (streak > bestStreak) bestStreak = streak;
	}
	return bestStreak;
}

// Hat-tricks: jornadas donde el jugador anotó ≥ 3 goles (Δgoles ≥ 3 vs jornada anterior).
async function fetchHatTricks(playerId: string): Promise<number> {
	const rows = await db
		.select({
			leagueId: playerSeasonStatsSnapshot.leagueId,
			jornada: playerSeasonStatsSnapshot.jornada,
			goals: playerSeasonStatsSnapshot.goals,
		})
		.from(playerSeasonStatsSnapshot)
		.where(eq(playerSeasonStatsSnapshot.playerId, playerId))
		.orderBy(playerSeasonStatsSnapshot.leagueId, playerSeasonStatsSnapshot.jornada);

	const byLeague = new Map<string, { jornada: number; goals: number }[]>();
	for (const r of rows) {
		if (!byLeague.has(r.leagueId)) byLeague.set(r.leagueId, []);
		byLeague.get(r.leagueId)!.push({ jornada: r.jornada, goals: r.goals });
	}

	let total = 0;
	for (const snaps of byLeague.values()) {
		for (let i = 0; i < snaps.length; i++) {
			const prevGoals = i > 0 ? snaps[i - 1].goals : 0;
			if (snaps[i].goals - prevGoals >= 3) total++;
		}
	}
	return total;
}

async function fetchMvpCount(playerId: string): Promise<number> {
	const rows = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(matchEvents)
		.where(and(eq(matchEvents.legacyPlayerId, playerId), eq(matchEvents.eventType, "mvp")));
	return rows[0]?.count ?? 0;
}

type SeasonRow = {
	leagueId: string;
	leagueName: string;
	teamId: string | null;
	teamName: string;
	goals: number;
	matchesPlayed: number;
};

async function fetchTeamGoalShares(seasonRows: SeasonRow[]): Promise<PlayerTeamGoalShare[]> {
	const relevant = seasonRows.filter((r) => r.teamId !== null && r.goals > 0);
	if (relevant.length === 0) return [];

	const leagueIds = [...new Set(relevant.map((r) => r.leagueId))];
	const teamIds = [...new Set(relevant.map((r) => r.teamId as string))];

	const totals = await db
		.select({
			leagueId: playerSeasonStats.leagueId,
			teamId: playerSeasonStats.teamId,
			teamGoals: sql<number>`sum(${playerSeasonStats.goals})::int`,
		})
		.from(playerSeasonStats)
		.where(
			and(
				inArray(playerSeasonStats.leagueId, leagueIds),
				inArray(playerSeasonStats.teamId, teamIds),
			),
		)
		.groupBy(playerSeasonStats.leagueId, playerSeasonStats.teamId);

	const teamTotalMap = new Map<string, number>();
	for (const row of totals) {
		if (!row.teamId) continue;
		teamTotalMap.set(`${row.leagueId}:${row.teamId}`, row.teamGoals);
	}

	return relevant
		.map((r) => {
			const teamGoals = teamTotalMap.get(`${r.leagueId}:${r.teamId}`) ?? r.goals;
			const sharePercent = teamGoals > 0 ? Math.round((r.goals / teamGoals) * 100) : 0;
			return {
				leagueId: r.leagueId,
				leagueName: r.leagueName,
				teamName: r.teamName,
				playerGoals: r.goals,
				teamGoals,
				sharePercent,
			};
		})
		.filter((s) => s.sharePercent > 0);
}

function computeBadges(
	positions: PlayerPositions,
	leaguesCount: number,
	mvpCount: number,
	goalStreak: number,
	hatTricks: number,
	totalMatches: number,
	goalsPerMatch: number,
): PlayerBadge[] {
	const badges: PlayerBadge[] = [];
	if (positions.league?.rank === 1) badges.push("league_top_scorer");
	if (leaguesCount >= 2) badges.push("multi_league");
	if (goalsPerMatch >= 1.0 && totalMatches >= 5) badges.push("marksman");
	if (goalStreak >= 3) badges.push("on_streak");
	if (mvpCount > 0) badges.push("mvp");
	if (hatTricks > 0) badges.push("hat_trick_club");
	if (totalMatches >= 25) badges.push("veteran");
	return badges;
}

function emptyEgoStats(): PlayerEgoStats {
	return {
		positions: {
			league: null,
			city: null,
			global: { rank: 0, total: 0, goals: 0 },
		},
		cityTopPercent: null,
		goalStreak: 0,
		hatTricks: 0,
		teamGoalShares: [],
		badges: [],
	};
}

// ---------------------------------------------------------------------------
// Historia 05 — Queries sobre la vista player_global_stats
// ---------------------------------------------------------------------------

import { playerGlobalStats } from "@/db/schema";
import type { PlayerGlobalStats } from "./model";

/**
 * Retorna las estadísticas globales verificadas de un jugador.
 * Devuelve null si el jugador no tiene profiles con claim_status='verified'.
 */
export async function getPlayerGlobalStats(playerId: string): Promise<PlayerGlobalStats | null> {
	const rows = await db
		.select()
		.from(playerGlobalStats)
		.where(eq(playerGlobalStats.playerId, playerId))
		.limit(1);

	if (rows.length === 0) return null;
	const r = rows[0];
	return {
		playerId: r.playerId,
		fullName: r.fullName,
		alias: r.alias ?? null,
		organizationsCount: r.organizationsCount,
		leaguesCount: r.leaguesCount,
		totalGoals: r.totalGoals,
		totalAssists: r.totalAssists,
		totalMatchesPlayed: r.totalMatchesPlayed,
		totalYellowCards: r.totalYellowCards,
		totalRedCards: r.totalRedCards,
		lastUpdatedAt: r.lastUpdatedAt,
	};
}

/**
 * Lista los jugadores con más goles verificados en toda la plataforma.
 * Excluye jugadores sin ningun partido jugado (minMatches guard).
 */
export async function listTopScorers(opts: {
	limit?: number;
	minMatches?: number;
}): Promise<PlayerGlobalStats[]> {
	const { limit = 20, minMatches = 1 } = opts;

	const rows = await db
		.select()
		.from(playerGlobalStats)
		.where(sql`${playerGlobalStats.totalMatchesPlayed} >= ${minMatches}`)
		.orderBy(desc(playerGlobalStats.totalGoals), desc(playerGlobalStats.totalMatchesPlayed))
		.limit(limit);

	return rows.map((r) => ({
		playerId: r.playerId,
		fullName: r.fullName,
		alias: r.alias ?? null,
		organizationsCount: r.organizationsCount,
		leaguesCount: r.leaguesCount,
		totalGoals: r.totalGoals,
		totalAssists: r.totalAssists,
		totalMatchesPlayed: r.totalMatchesPlayed,
		totalYellowCards: r.totalYellowCards,
		totalRedCards: r.totalRedCards,
		lastUpdatedAt: r.lastUpdatedAt,
	}));
}

// ===========================================================================
// BREAKING CHANGE — Ecosistema de identidad global (admin-ecosystem branch)
//
// Queries para las tres nuevas entidades:
//   GlobalPlayer / LeagueMember / Inscription
//
// Todas las funciones tienen tipos de retorno explícitos (regla TypeScript strict).
// Las que pueden no encontrar un registro retornan null, nunca lanzan.
// ===========================================================================

import { globalPlayers, leagueMembers, inscriptions } from "@/db/schema";
import type {
	GlobalPlayer,
	CreateGlobalPlayer,
	LeagueMember,
	CreateLeagueMember,
	Inscription,
	CreateInscription,
	LeagueMemberView,
} from "./model";

// ---------------------------------------------------------------------------
// GlobalPlayer
// ---------------------------------------------------------------------------

/**
 * Cuenta cuántas ligas (league_members) tiene un global_player.
 * Usado en el lookup para mostrar historial en la ventanilla de registro.
 */
export async function countGlobalPlayerLeagueMemberships(globalPlayerId: string): Promise<number> {
	const rows = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(leagueMembers)
		.where(eq(leagueMembers.globalPlayerId, globalPlayerId));
	return rows[0]?.count ?? 0;
}

/**
 * Busca un jugador global por su curp_hash.
 * Es la query central del flujo de registro: el oficinista ingresa el CURP,
 * el feature genera el hash y llama a esta función.
 *
 * Retorna null si el jugador nunca ha sido registrado en el sistema.
 */
export async function findGlobalPlayerByHash(curpHash: string): Promise<GlobalPlayer | null> {
	const row = await db.query.globalPlayers.findFirst({
		where: eq(globalPlayers.curpHash, curpHash),
	});
	if (!row) return null;

	return {
		id: row.id,
		curpHash: row.curpHash,
		fullName: row.fullName,
		birthDate: row.birthDate,
		avatarUrl: row.avatarUrl ?? null,
		createdAt: row.createdAt,
	};
}

/**
 * Inserta un nuevo jugador global y retorna la fila creada.
 * El caller debe asegurarse de que el curpHash no exista previamente
 * (usar findGlobalPlayerByHash antes de llamar a esta función).
 */
export async function createGlobalPlayer(data: CreateGlobalPlayer): Promise<GlobalPlayer> {
	const rows = await db
		.insert(globalPlayers)
		.values({
			curpHash: data.curpHash,
			fullName: data.fullName,
			birthDate: data.birthDate,
			avatarUrl: data.avatarUrl ?? null,
		})
		.returning();

	const row = rows[0];
	if (!row) throw new Error("createGlobalPlayer: insert no retornó ninguna fila");

	return {
		id: row.id,
		curpHash: row.curpHash,
		fullName: row.fullName,
		birthDate: row.birthDate,
		avatarUrl: row.avatarUrl ?? null,
		createdAt: row.createdAt,
	};
}

// ---------------------------------------------------------------------------
// LeagueMember
// ---------------------------------------------------------------------------

/**
 * Busca la membresía de un jugador en una liga específica.
 * Usado para verificar si el jugador ya está inscrito antes de crear
 * una nueva membresía (evitar duplicados en el flujo de registro).
 */
export async function findLeagueMember(
	globalPlayerId: string,
	leagueId: string,
): Promise<LeagueMember | null> {
	const row = await db.query.leagueMembers.findFirst({
		where: and(
			eq(leagueMembers.globalPlayerId, globalPlayerId),
			eq(leagueMembers.leagueId, leagueId),
		),
	});
	if (!row) return null;

	return {
		id: row.id,
		globalPlayerId: row.globalPlayerId,
		leagueId: row.leagueId,
		status: row.status,
		dorsal: row.dorsal ?? null,
		inscriptionDate: row.inscriptionDate,
		institutionPhotoUrl: row.institutionPhotoUrl ?? null,
		internalNotes: row.internalNotes ?? null,
		createdAt: row.createdAt,
	};
}

/**
 * Crea una nueva membresía (global_player ↔ liga).
 * La constraint UNIQUE(global_player_id, league_id) en la DB es el
 * último guardia — pero el caller debe verificar con findLeagueMember primero
 * para retornar un error legible al usuario.
 */
export async function createLeagueMember(data: CreateLeagueMember): Promise<LeagueMember> {
	const today = new Date().toISOString().slice(0, 10);

	const rows = await db
		.insert(leagueMembers)
		.values({
			globalPlayerId: data.globalPlayerId,
			leagueId: data.leagueId,
			status: data.status ?? "active",
			dorsal: data.dorsal ?? null,
			inscriptionDate: data.inscriptionDate ?? today,
			institutionPhotoUrl: data.institutionPhotoUrl ?? null,
			internalNotes: data.internalNotes ?? null,
		})
		.returning();

	const row = rows[0];
	if (!row) throw new Error("createLeagueMember: insert no retornó ninguna fila");

	return {
		id: row.id,
		globalPlayerId: row.globalPlayerId,
		leagueId: row.leagueId,
		status: row.status,
		dorsal: row.dorsal ?? null,
		inscriptionDate: row.inscriptionDate,
		institutionPhotoUrl: row.institutionPhotoUrl ?? null,
		internalNotes: row.internalNotes ?? null,
		createdAt: row.createdAt,
	};
}

// ---------------------------------------------------------------------------
// Inscription
// ---------------------------------------------------------------------------

/**
 * Inscribe un league_member en un equipo.
 * La constraint UNIQUE(league_member_id) garantiza un solo equipo por jugador
 * por liga. Si ya existe inscripción para ese member, la DB lanzará un error
 * de constraint — el caller (feature) debe manejarlo con onConflict o precheck.
 */
export async function createInscription(data: CreateInscription): Promise<Inscription> {
	const rows = await db
		.insert(inscriptions)
		.values({
			leagueMemberId: data.leagueMemberId,
			teamId: data.teamId,
		})
		.returning();

	const row = rows[0];
	if (!row) throw new Error("createInscription: insert no retornó ninguna fila");

	return {
		id: row.id,
		leagueMemberId: row.leagueMemberId,
		teamId: row.teamId,
		createdAt: row.createdAt,
	};
}

// ---------------------------------------------------------------------------
// Vista combinada — usada por la UI del panel de registro
// ---------------------------------------------------------------------------

/**
 * Retorna la vista combinada de un jugador en el contexto de una liga:
 * datos globales + membresía + equipo asignado (si existe).
 *
 * Data siloing: institution_photo_url e internal_notes solo se devuelven
 * aquí porque la query ya está scoped a una liga específica.
 *
 * Retorna null si el jugador no es miembro de la liga.
 */
export async function findLeagueMemberView(
	globalPlayerId: string,
	leagueId: string,
): Promise<LeagueMemberView | null> {
	const rows = await db
		.select({
			// Campos globales
			id: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			// Membresía
			memberId: leagueMembers.id,
			leagueId: leagueMembers.leagueId,
			status: leagueMembers.status,
			dorsal: leagueMembers.dorsal,
			inscriptionDate: leagueMembers.inscriptionDate,
			// Equipo (nullable — puede no estar inscrito aún)
			teamId: inscriptions.teamId,
			teamName: teams.name,
		})
		.from(globalPlayers)
		.innerJoin(
			leagueMembers,
			and(eq(leagueMembers.globalPlayerId, globalPlayers.id), eq(leagueMembers.leagueId, leagueId)),
		)
		.leftJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(eq(globalPlayers.id, globalPlayerId))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	return {
		id: row.id,
		fullName: row.fullName,
		birthDate: row.birthDate,
		avatarUrl: row.avatarUrl ?? null,
		memberId: row.memberId,
		leagueId: row.leagueId,
		status: row.status,
		dorsal: row.dorsal ?? null,
		inscriptionDate: row.inscriptionDate,
		teamId: row.teamId ?? null,
		teamName: row.teamName ?? null,
	};
}

// ---------------------------------------------------------------------------
// Roster de equipo — jugadores inscritos via tablas V2
// ---------------------------------------------------------------------------

export type TeamRosterEntry = {
	inscriptionId: string;
	memberId: string;
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	dorsal: number | null;
	status: "active" | "suspended" | "inactive";
	inscriptionDate: string;
};

/**
 * Devuelve el roster completo de un equipo usando las tablas V2:
 *   inscriptions → league_members → global_players
 *
 * Ordenado por dorsal (nulls al final, comportamiento por defecto en PG para ASC)
 * y luego por nombre alfabético.
 */
export async function getTeamRoster(teamId: string): Promise<TeamRosterEntry[]> {
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
		status: r.status as TeamRosterEntry["status"],
		inscriptionDate: r.inscriptionDate,
	}));
}

// ---------------------------------------------------------------------------
// Lista de jugadores por organización — para /admin/players
// ---------------------------------------------------------------------------

export type OrgPlayerRow = {
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	leagueCount: number;
	// Liga más reciente en la org
	latestLeagueName: string | null;
	latestStatus: "active" | "suspended" | "inactive" | null;
	latestDorsal: number | null;
};

/**
 * Lista paginada de jugadores que tienen al menos un league_member
 * en alguna liga de la organización dada.
 *
 * Devuelve jugadores únicos (una fila por global_player).
 */
export async function listOrgPlayers(
	organizationId: string,
	opts: { page: number; pageSize: number; search?: string },
): Promise<{ rows: OrgPlayerRow[]; total: number }> {
	const { page, pageSize, search } = opts;
	const offset = (page - 1) * pageSize;

	// Subquery: IDs de ligas que pertenecen a esta org
	// Usamos un join en la query principal para filtrar

	// Query principal: un global_player por fila, con datos agregados
	const baseFilter = and(
		eq(leagues.organizationId, organizationId),
		search
			? sql`LOWER(${globalPlayers.fullName}) LIKE ${"%" + search.toLowerCase() + "%"}`
			: undefined,
	);

	const [rowsResult, countResult] = await Promise.all([
		db
			.selectDistinctOn([globalPlayers.id], {
				globalPlayerId: globalPlayers.id,
				fullName: globalPlayers.fullName,
				birthDate: globalPlayers.birthDate,
				avatarUrl: globalPlayers.avatarUrl,
				leagueCount: sql<number>`COUNT(${leagueMembers.id}) OVER (PARTITION BY ${globalPlayers.id})::int`,
				latestLeagueName: leagues.name,
				latestStatus: leagueMembers.status,
				latestDorsal: leagueMembers.dorsal,
			})
			.from(globalPlayers)
			.innerJoin(leagueMembers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
			.where(baseFilter)
			.orderBy(asc(globalPlayers.id), desc(leagues.createdAt))
			.limit(pageSize)
			.offset(offset),

		db
			.select({ total: sql<number>`COUNT(DISTINCT ${globalPlayers.id})::int` })
			.from(globalPlayers)
			.innerJoin(leagueMembers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
			.where(baseFilter),
	]);

	return {
		rows: rowsResult.map((r) => ({
			globalPlayerId: r.globalPlayerId,
			fullName: r.fullName,
			birthDate: r.birthDate,
			avatarUrl: r.avatarUrl ?? null,
			leagueCount: r.leagueCount,
			latestLeagueName: r.latestLeagueName ?? null,
			latestStatus: (r.latestStatus as OrgPlayerRow["latestStatus"]) ?? null,
			latestDorsal: r.latestDorsal ?? null,
		})),
		total: countResult[0]?.total ?? 0,
	};
}

// ---------------------------------------------------------------------------
// GlobalPlayerLeagueMembers — detalle de membresías V2 para pantalla de admin
//
// Devuelve todas las ligas en las que el global_player está inscrito, con los
// campos editables (status, dorsal, internalNotes, institutionPhotoUrl).
//
// Si se pasa organizationId, filtra solo las ligas de esa organización.
// Los campos sensibles (internalNotes, institutionPhotoUrl) solo se incluyen
// cuando la query ya está scoped a la organización del usuario.
// ---------------------------------------------------------------------------

export type GlobalPlayerLeagueMember = {
	memberId: string;
	leagueId: string;
	leagueName: string;
	organizationId: string;
	teamId: string | null;
	teamName: string | null;
	dorsal: number | null;
	status: "active" | "suspended" | "inactive";
	inscriptionDate: string;
	internalNotes: string | null;
	institutionPhotoUrl: string | null;
};

export async function getGlobalPlayerLeagueMembers(
	globalPlayerId: string,
	organizationId?: string,
): Promise<GlobalPlayerLeagueMember[]> {
	const rows = await db
		.select({
			memberId: leagueMembers.id,
			leagueId: leagueMembers.leagueId,
			leagueName: leagues.name,
			organizationId: leagues.organizationId,
			teamId: inscriptions.teamId,
			teamName: teams.name,
			dorsal: leagueMembers.dorsal,
			status: leagueMembers.status,
			inscriptionDate: leagueMembers.inscriptionDate,
			internalNotes: leagueMembers.internalNotes,
			institutionPhotoUrl: leagueMembers.institutionPhotoUrl,
		})
		.from(leagueMembers)
		.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.leftJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(
			and(
				eq(leagueMembers.globalPlayerId, globalPlayerId),
				organizationId ? eq(leagues.organizationId, organizationId) : undefined,
			),
		)
		.orderBy(desc(leagues.createdAt));

	return rows.map((r) => ({
		memberId: r.memberId,
		leagueId: r.leagueId,
		leagueName: r.leagueName,
		organizationId: r.organizationId,
		teamId: r.teamId ?? null,
		teamName: r.teamName ?? null,
		dorsal: r.dorsal ?? null,
		status: r.status as GlobalPlayerLeagueMember["status"],
		inscriptionDate: r.inscriptionDate,
		internalNotes: organizationId ? (r.internalNotes ?? null) : null,
		institutionPhotoUrl: organizationId ? (r.institutionPhotoUrl ?? null) : null,
	}));
}

// ---------------------------------------------------------------------------
// getGlobalPlayerBasic — datos básicos de un global_player (nombre, fecha nac.)
// Para la pantalla de detalle cuando no hay perfil V1 disponible.
// ---------------------------------------------------------------------------

export type GlobalPlayerBasic = {
	id: string;
	fullName: string;
	birthDate: string | null;
	avatarUrl: string | null;
};

export async function getGlobalPlayerBasic(
	globalPlayerId: string,
): Promise<GlobalPlayerBasic | null> {
	const row = await db.query.globalPlayers.findFirst({
		where: eq(globalPlayers.id, globalPlayerId),
	});
	if (!row) return null;
	return {
		id: row.id,
		fullName: row.fullName,
		birthDate: row.birthDate ?? null,
		avatarUrl: row.avatarUrl ?? null,
	};
}
