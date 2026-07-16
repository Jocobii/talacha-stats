/**
 * src/db/simulator/contributors/aggregates.ts
 *
 * Contribuidor "aggregates" — ver docs/ORGANIZATION-SIMULATOR.md §5 y §7.3
 * (Épica C3).
 * Escribe: player_season_stats, team_standings_snapshot,
 * player_season_stats_snapshot.
 * Depende de: matchplay.
 *
 * Todo se SUMA desde `matches`/`match_player_stats` reales — nunca números
 * independientes (regla de oro, §7). No recibe nada por parámetro además
 * de ctx: relee lo que matchplay/calendar acaban de escribir en `ctx.db`.
 *
 * Límite conocido (bootstrap-only, igual que el resto de la Épica B/C):
 * este contribuidor INSERTA sin borrar. Es correcto para una liga nueva
 * (nada previo que pisar). Para una corrida incremental sobre una liga ya
 * existente, `player_season_stats` necesitaría upsert por
 * (global_player_id, league_id) — hoy esa tabla NO tiene ese UNIQUE (solo
 * el legacy sobre player_profile_id). Antes de usar este contribuidor en
 * modo incremental hay que resolver ese hueco de schema; por ahora
 * documentado, no resuelto.
 */

import {
	playerSeasonStats,
	teamStandingsSnapshot,
	playerSeasonStatsSnapshot,
	matches,
	matchdays,
	matchPlayerStats,
	inscriptions,
	leagueMembers,
} from "@/db/schema";
import type {
	PlayerSeasonStats,
	TeamStandingsSnapshot,
	PlayerSeasonStatsSnapshot,
	Match,
	Matchday,
	MatchPlayerStat,
	Inscription,
	LeagueMember,
	League,
	Team,
} from "@/db/schema";
import { setData, requireData, type Contributor, type SimContext } from "../context";
import { insertInBatches } from "../chunk";
import { getLeagues, getTeamsByLeague } from "./structure";
import { getMatchdaysByLeague } from "./calendar";

export const PLAYER_SEASON_STATS_KEY = "playerSeasonStats";
export const TEAM_STANDINGS_SNAPSHOT_KEY = "teamStandingsSnapshot";
export const PLAYER_SEASON_STATS_SNAPSHOT_KEY = "playerSeasonStatsSnapshot";

interface StandingAcc {
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
}

function emptyStanding(): StandingAcc {
	return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function applyResult(standings: Map<string, StandingAcc>, match: Match): void {
	const home = standings.get(match.homeTeamId) ?? emptyStanding();
	const away = standings.get(match.awayTeamId) ?? emptyStanding();
	const hg = match.homeScore ?? 0;
	const ag = match.awayScore ?? 0;

	home.played++;
	away.played++;
	home.goalsFor += hg;
	home.goalsAgainst += ag;
	away.goalsFor += ag;
	away.goalsAgainst += hg;

	if (hg > ag) {
		home.wins++;
		home.points += 3;
		away.losses++;
	} else if (hg < ag) {
		away.wins++;
		away.points += 3;
		home.losses++;
	} else {
		home.draws++;
		home.points++;
		away.draws++;
		away.points++;
	}

	standings.set(match.homeTeamId, home);
	standings.set(match.awayTeamId, away);
}

interface PlayerAcc {
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	matchesPlayed: number;
}

function emptyPlayerAcc(): PlayerAcc {
	return { goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 };
}

/** globalPlayerId de una fila de match_player_stats, resuelto vía inscription → league_member. */
function resolveGlobalPlayerId(
	stat: MatchPlayerStat,
	inscriptionById: Map<string, Inscription>,
	memberById: Map<string, LeagueMember>,
): string | null {
	const inscription = inscriptionById.get(stat.playerRegistrationId);
	if (!inscription) return null;
	const member = memberById.get(inscription.leagueMemberId);
	return member?.globalPlayerId ?? null;
}

async function fetchLeagueData(ctx: SimContext, leagueId: string) {
	const [allMatchesRaw, allMatchdaysRaw, allInscriptionsRaw, allLeagueMembersRaw, allStatsRaw] =
		await Promise.all([
			ctx.db.select().from(matches),
			ctx.db.select().from(matchdays),
			ctx.db.select().from(inscriptions),
			ctx.db.select().from(leagueMembers),
			ctx.db.select().from(matchPlayerStats),
		]);

	const allMatches = allMatchesRaw as Match[];
	const allMatchdays = allMatchdaysRaw as Matchday[];
	const allInscriptions = allInscriptionsRaw as Inscription[];
	const allLeagueMembers = allLeagueMembersRaw as LeagueMember[];
	const allStats = allStatsRaw as MatchPlayerStat[];

	const leagueMatches = allMatches.filter((m) => m.leagueId === leagueId && m.status === "played");
	const matchdayNumberById = new Map(
		allMatchdays.filter((md) => md.leagueId === leagueId).map((md) => [md.id, md.number]),
	);
	const matchIds = new Set(leagueMatches.map((m) => m.id));
	const leagueStats = allStats.filter((s) => matchIds.has(s.matchId));

	const inscriptionById = new Map(allInscriptions.map((i) => [i.id, i]));
	const memberById = new Map(
		allLeagueMembers.filter((m) => m.leagueId === leagueId).map((m) => [m.id, m]),
	);

	return { leagueMatches, matchdayNumberById, leagueStats, inscriptionById, memberById };
}

function buildTeamStandingsRows(
	league: League,
	teamRows: Team[],
	leagueMatches: Match[],
	matchdayNumberById: Map<string, number>,
	jornadasToSnapshot: number[],
): Omit<TeamStandingsSnapshot, "id" | "updatedAt">[] {
	const rows: Omit<TeamStandingsSnapshot, "id" | "updatedAt">[] = [];
	const sortedTargets = [...jornadasToSnapshot].sort((a, b) => a - b);

	for (const jornada of sortedTargets) {
		const standings = new Map<string, StandingAcc>();
		const upToNow = leagueMatches.filter(
			(m) => m.matchdayId && (matchdayNumberById.get(m.matchdayId) ?? Infinity) <= jornada,
		);
		for (const match of upToNow) applyResult(standings, match);

		for (const team of teamRows) {
			const acc = standings.get(team.id) ?? emptyStanding();
			rows.push({
				teamId: team.id,
				leagueId: league.id,
				jornada,
				...acc,
				zone: null,
			});
		}
	}
	return rows;
}

function buildPlayerSeasonStatsRows(
	league: League,
	leagueStats: MatchPlayerStat[],
	inscriptionById: Map<string, Inscription>,
	memberById: Map<string, LeagueMember>,
): Omit<PlayerSeasonStats, "id" | "updatedAt">[] {
	const totals = new Map<string, PlayerAcc>();
	const teamByPlayer = new Map<string, string | null>();

	for (const stat of leagueStats) {
		const globalPlayerId = resolveGlobalPlayerId(stat, inscriptionById, memberById);
		if (!globalPlayerId) continue;

		const acc = totals.get(globalPlayerId) ?? emptyPlayerAcc();
		acc.goals += stat.goals;
		acc.assists += stat.assists;
		acc.yellowCards += stat.yellowCards;
		acc.redCards += stat.redCards;
		if (stat.isPresent) acc.matchesPlayed += 1;
		totals.set(globalPlayerId, acc);

		const inscription = inscriptionById.get(stat.playerRegistrationId);
		if (inscription) teamByPlayer.set(globalPlayerId, inscription.teamId);
	}

	return [...totals.entries()].map(([globalPlayerId, acc]) => ({
		globalPlayerId,
		leagueMemberId: null,
		playerProfileId: null,
		legacyPlayerId: null,
		leagueId: league.id,
		teamId: teamByPlayer.get(globalPlayerId) ?? null,
		...acc,
		jornada: null,
	}));
}

function buildPlayerSeasonStatsSnapshotRows(
	league: League,
	leagueMatches: Match[],
	matchdayNumberById: Map<string, number>,
	leagueStats: MatchPlayerStat[],
	inscriptionById: Map<string, Inscription>,
	memberById: Map<string, LeagueMember>,
	jornadasToSnapshot: number[],
): Omit<PlayerSeasonStatsSnapshot, "id" | "importedAt">[] {
	const rows: Omit<PlayerSeasonStatsSnapshot, "id" | "importedAt">[] = [];
	const statsByMatch = new Map<string, MatchPlayerStat[]>();
	for (const stat of leagueStats) {
		const list = statsByMatch.get(stat.matchId) ?? [];
		list.push(stat);
		statsByMatch.set(stat.matchId, list);
	}

	for (const jornada of [...jornadasToSnapshot].sort((a, b) => a - b)) {
		const matchesUpToJornada = leagueMatches.filter(
			(m) => m.matchdayId && (matchdayNumberById.get(m.matchdayId) ?? Infinity) <= jornada,
		);
		const totals = new Map<string, PlayerAcc>();
		const teamByPlayer = new Map<string, string | null>();

		for (const match of matchesUpToJornada) {
			for (const stat of statsByMatch.get(match.id) ?? []) {
				const globalPlayerId = resolveGlobalPlayerId(stat, inscriptionById, memberById);
				if (!globalPlayerId) continue;
				const acc = totals.get(globalPlayerId) ?? emptyPlayerAcc();
				acc.goals += stat.goals;
				acc.assists += stat.assists;
				acc.yellowCards += stat.yellowCards;
				acc.redCards += stat.redCards;
				if (stat.isPresent) acc.matchesPlayed += 1;
				totals.set(globalPlayerId, acc);

				const inscription = inscriptionById.get(stat.playerRegistrationId);
				if (inscription) teamByPlayer.set(globalPlayerId, inscription.teamId);
			}
		}

		for (const [globalPlayerId, acc] of totals.entries()) {
			rows.push({
				globalPlayerId,
				playerId: null,
				playerProfileId: null,
				leagueId: league.id,
				teamId: teamByPlayer.get(globalPlayerId) ?? null,
				jornada,
				...acc,
			});
		}
	}

	return rows;
}

export const aggregatesContributor: Contributor = {
	name: "aggregates",
	dependsOn: ["matchplay"],
	async contribute(ctx: SimContext): Promise<void> {
		const leagueRows = getLeagues(ctx);

		const standingsDefs: Omit<TeamStandingsSnapshot, "id" | "updatedAt">[] = [];
		const playerSeasonDefs: Omit<PlayerSeasonStats, "id" | "updatedAt">[] = [];
		const snapshotDefs: Omit<PlayerSeasonStatsSnapshot, "id" | "importedAt">[] = [];

		for (const league of leagueRows) {
			const { leagueMatches, matchdayNumberById, leagueStats, inscriptionById, memberById } =
				await fetchLeagueData(ctx, league.id);

			const jornadasToSnapshot = getMatchdaysByLeague(ctx, league.id).map((md) => md.number);
			if (jornadasToSnapshot.length === 0) continue;

			const teamRows = getTeamsByLeague(ctx, league.id);

			standingsDefs.push(
				...buildTeamStandingsRows(
					league,
					teamRows,
					leagueMatches,
					matchdayNumberById,
					jornadasToSnapshot,
				),
			);
			playerSeasonDefs.push(
				...buildPlayerSeasonStatsRows(league, leagueStats, inscriptionById, memberById),
			);
			snapshotDefs.push(
				...buildPlayerSeasonStatsSnapshotRows(
					league,
					leagueMatches,
					matchdayNumberById,
					leagueStats,
					inscriptionById,
					memberById,
					jornadasToSnapshot,
				),
			);
		}

		const standingsRows: TeamStandingsSnapshot[] = await insertInBatches(standingsDefs, (batch) =>
			ctx.db.insert(teamStandingsSnapshot).values(batch).returning(),
		);
		const playerSeasonRows: PlayerSeasonStats[] = await insertInBatches(playerSeasonDefs, (batch) =>
			ctx.db.insert(playerSeasonStats).values(batch).returning(),
		);
		const snapshotRows: PlayerSeasonStatsSnapshot[] = await insertInBatches(snapshotDefs, (batch) =>
			ctx.db.insert(playerSeasonStatsSnapshot).values(batch).returning(),
		);

		setData(ctx, TEAM_STANDINGS_SNAPSHOT_KEY, standingsRows);
		setData(ctx, PLAYER_SEASON_STATS_KEY, playerSeasonRows);
		setData(ctx, PLAYER_SEASON_STATS_SNAPSHOT_KEY, snapshotRows);
	},
};

export function getTeamStandingsSnapshots(ctx: SimContext): TeamStandingsSnapshot[] {
	return requireData<TeamStandingsSnapshot[]>(ctx, TEAM_STANDINGS_SNAPSHOT_KEY);
}

export function getPlayerSeasonStats(ctx: SimContext): PlayerSeasonStats[] {
	return requireData<PlayerSeasonStats[]>(ctx, PLAYER_SEASON_STATS_KEY);
}
