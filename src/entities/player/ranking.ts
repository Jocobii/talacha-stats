/**
 * entities/player/ranking.ts
 * Queries para el ranking público de goleadores.
 * Sin asistencias — no se registran en ligas amateur.
 */

import { eq, desc, sql, and, or, ilike, inArray, isNull } from "drizzle-orm";
import {
	db,
	players,
	playerSeasonStats,
	playerSeasonStatsSnapshot,
	leagues,
	teams,
	organizations,
} from "@/db";
import {
	type PaginationParams,
	paginateArray,
	type PaginatedResult,
} from "@/shared/lib/pagination";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type RankingEntry = {
	playerId: string;
	fullName: string;
	alias: string | null;
	totalGoals: number;
	totalMatches: number;
	goalsPerMatch: number;
	leaguesCount: number;
	topLeague: string;
	topTeam: string;
	cities?: string[]; // populated for global scope
	positionDelta: number | null; // +N subió, -N bajó, 0 igual, null = sin historial
	isNew: boolean; // apareció en esta jornada, no en la anterior
};

export type JornadaHero = {
	playerId: string;
	fullName: string;
	alias: string | null;
	goals: number;
	matchesPlayed: number;
	goalsPerMatch: number;
	leagueName: string;
	teamName: string;
	jornada: number;
};

export type JornadaLeague = {
	leagueId: string;
	leagueName: string;
	season: string;
	dayOfWeek: string;
	jornada: number;
	heroes: JornadaHero[];
};

// Disambiguation search result — includes all participations so the user can
// identify themselves when multiple players share the same name.
export type PlayerSearchResult = {
	playerId: string;
	fullName: string;
	alias: string | null;
	totalGoals: number;
	participations: {
		leagueId: string;
		leagueName: string;
		teamName: string;
		city: string;
		season: string;
		goals: number;
	}[];
};

// Position of a player across three scopes.
export type PlayerPositions = {
	league: { rank: number; total: number; goals: number } | null;
	city: { rank: number; total: number; goals: number; cityName: string } | null;
	global: { rank: number; total: number; goals: number };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type LeagueAcc = { leagueId: string; leagueName: string; teamName: string; goals: number };

function buildRankingEntry(
	playerId: string,
	fullName: string,
	alias: string | null,
	totalGoals: number,
	totalMatches: number,
	leagueList: LeagueAcc[],
	cities?: string[],
	positionDelta: number | null = null,
	isNew = false,
): RankingEntry {
	const best = leagueList.reduce((b, l) => (l.goals > b.goals ? l : b));
	return {
		playerId,
		fullName,
		alias,
		totalGoals,
		totalMatches,
		goalsPerMatch: totalMatches > 0 ? Math.round((totalGoals / totalMatches) * 100) / 100 : 0,
		leaguesCount: leagueList.length,
		topLeague: best.leagueName,
		topTeam: best.teamName,
		...(cities ? { cities } : {}),
		positionDelta,
		isNew,
	};
}

function sortRanking(ranking: RankingEntry[]): RankingEntry[] {
	return ranking.sort((a, b) => {
		if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
		if (b.goalsPerMatch !== a.goalsPerMatch) return b.goalsPerMatch - a.goalsPerMatch;
		return a.fullName.localeCompare(b.fullName);
	});
}

// Retorna para cada jugador sus goles acumulados en la jornada anterior (N-1)
// agrupados por liga. Usa las dos jornadas más recientes de cada liga en el snapshot.
async function getPrevGoalsByLeague(
	leagueIds: string[],
): Promise<Map<string, Map<string, number>>> {
	if (leagueIds.length === 0) return new Map();

	// Dos jornadas más recientes por liga
	const jornadaRows = await db
		.select({
			leagueId: playerSeasonStatsSnapshot.leagueId,
			jornada: playerSeasonStatsSnapshot.jornada,
		})
		.from(playerSeasonStatsSnapshot)
		.where(inArray(playerSeasonStatsSnapshot.leagueId, leagueIds))
		.groupBy(playerSeasonStatsSnapshot.leagueId, playerSeasonStatsSnapshot.jornada)
		.orderBy(playerSeasonStatsSnapshot.leagueId, desc(playerSeasonStatsSnapshot.jornada));

	// Por liga: tomar la segunda jornada más reciente (la anterior)
	const prevJornadaByLeague = new Map<string, number>();
	const seenLeagues = new Map<string, number>(); // leagueId → count of jornadas seen

	for (const row of jornadaRows) {
		const count = (seenLeagues.get(row.leagueId) ?? 0) + 1;
		seenLeagues.set(row.leagueId, count);
		if (count === 2) prevJornadaByLeague.set(row.leagueId, row.jornada);
	}

	if (prevJornadaByLeague.size === 0) return new Map();

	// Fetch snapshots de la jornada anterior para cada liga
	// result: Map<leagueId, Map<playerId, goals>>
	const result = new Map<string, Map<string, number>>();

	for (const [leagueId, jornada] of prevJornadaByLeague) {
		const rows = await db
			.select({
				playerId: playerSeasonStatsSnapshot.playerId,
				goals: playerSeasonStatsSnapshot.goals,
			})
			.from(playerSeasonStatsSnapshot)
			.where(
				and(
					eq(playerSeasonStatsSnapshot.leagueId, leagueId),
					eq(playerSeasonStatsSnapshot.jornada, jornada),
				),
			);

		const playerMap = new Map<string, number>();
		for (const r of rows) playerMap.set(r.playerId, r.goals);
		result.set(leagueId, playerMap);
	}

	return result;
}

// Calcula positionDelta comparando ranking actual vs ranking previo.
// prevTotals: Map<playerId, totalGoals en jornada anterior>
function computeDeltas(currentRanking: RankingEntry[], prevTotals: Map<string, number>): void {
	if (prevTotals.size === 0) return;

	// Ordenar jugadores previos por goles para asignar posiciones
	const prevSorted = [...prevTotals.entries()].sort((a, b) => b[1] - a[1]);
	const prevRankMap = new Map<string, number>(prevSorted.map(([id], idx) => [id, idx + 1]));

	currentRanking.forEach((entry, idx) => {
		const currentPos = idx + 1;
		const prevPos = prevRankMap.get(entry.playerId);

		if (prevPos === undefined) {
			entry.isNew = true;
			entry.positionDelta = null;
		} else {
			entry.positionDelta = prevPos - currentPos; // positivo = subió
			entry.isNew = false;
		}
	});
}

const EMPTY_PAGINATION = (total: number) =>
	({ total, page: 1, limit: total, totalPages: 1, hasNext: false, hasPrev: false }) as const;

// ── Ranking por ciudad ────────────────────────────────────────────────────────

export async function getCityRanking(
	city: string,
	pagination?: PaginationParams,
): Promise<PaginatedResult<RankingEntry>> {
	const rows = await db
		.select({
			playerId: playerSeasonStats.playerId,
			fullName: players.fullName,
			alias: players.alias,
			goals: playerSeasonStats.goals,
			matches: playerSeasonStats.matchesPlayed,
			leagueId: playerSeasonStats.leagueId,
			leagueName: leagues.name,
			teamId: playerSeasonStats.teamId,
			teamName: teams.name,
		})
		.from(playerSeasonStats)
		.innerJoin(players, eq(playerSeasonStats.playerId, players.id))
		.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.leftJoin(organizations, eq(leagues.organizationId, organizations.id))
		.where(
			and(
				eq(leagues.city, city),
				sql`${playerSeasonStats.goals} > 0`,
				// Exclude leagues from trial organizations
				or(isNull(leagues.organizationId), eq(organizations.status, "verified")),
			),
		);

	type Acc = {
		playerId: string;
		fullName: string;
		alias: string | null;
		totalGoals: number;
		totalMatches: number;
		leagues: LeagueAcc[];
	};

	const map = new Map<string, Acc>();
	for (const row of rows) {
		if (!map.has(row.playerId)) {
			map.set(row.playerId, {
				playerId: row.playerId,
				fullName: row.fullName,
				alias: row.alias,
				totalGoals: 0,
				totalMatches: 0,
				leagues: [],
			});
		}
		const entry = map.get(row.playerId)!;
		entry.totalGoals += row.goals;
		entry.totalMatches += row.matches;
		entry.leagues.push({
			leagueId: row.leagueId,
			leagueName: row.leagueName,
			teamName: row.teamName ?? "—",
			goals: row.goals,
		});
	}

	const ranking = sortRanking(
		[...map.values()].map((a) =>
			buildRankingEntry(a.playerId, a.fullName, a.alias, a.totalGoals, a.totalMatches, a.leagues),
		),
	);

	// Deltas vs jornada anterior (agrega goles previos de todas las ligas de la ciudad)
	const leagueIds = [...new Set(rows.map((r) => r.leagueId))];
	const prevByLeague = await getPrevGoalsByLeague(leagueIds);
	const prevTotals = new Map<string, number>();
	for (const playerMap of prevByLeague.values()) {
		for (const [pid, goals] of playerMap) {
			prevTotals.set(pid, (prevTotals.get(pid) ?? 0) + goals);
		}
	}
	computeDeltas(ranking, prevTotals);

	if (!pagination) return { items: ranking, meta: EMPTY_PAGINATION(ranking.length) };
	return paginateArray(ranking, pagination);
}

// ── Ranking por liga ──────────────────────────────────────────────────────────

export async function getLeagueRanking(
	leagueId: string,
	pagination?: PaginationParams,
): Promise<PaginatedResult<RankingEntry>> {
	const rows = await db
		.select({
			playerId: playerSeasonStats.playerId,
			fullName: players.fullName,
			alias: players.alias,
			goals: playerSeasonStats.goals,
			matches: playerSeasonStats.matchesPlayed,
			leagueName: leagues.name,
			teamName: teams.name,
		})
		.from(playerSeasonStats)
		.innerJoin(players, eq(playerSeasonStats.playerId, players.id))
		.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.where(and(eq(playerSeasonStats.leagueId, leagueId), sql`${playerSeasonStats.goals} > 0`))
		.orderBy(desc(playerSeasonStats.goals));

	const ranking: RankingEntry[] = rows.map((r) =>
		buildRankingEntry(r.playerId, r.fullName, r.alias, r.goals, r.matches, [
			{ leagueId, leagueName: r.leagueName, teamName: r.teamName ?? "—", goals: r.goals },
		]),
	);

	// Deltas vs jornada anterior
	const prevByLeague = await getPrevGoalsByLeague([leagueId]);
	const prevTotals = new Map<string, number>();
	for (const [pid, goals] of prevByLeague.get(leagueId) ?? []) {
		prevTotals.set(pid, goals);
	}
	computeDeltas(ranking, prevTotals);

	if (!pagination) return { items: ranking, meta: EMPTY_PAGINATION(ranking.length) };
	return paginateArray(ranking, pagination);
}

// ── Ranking global (todas las ciudades) ───────────────────────────────────────

export async function getGlobalRanking(
	pagination?: PaginationParams,
): Promise<PaginatedResult<RankingEntry>> {
	const rows = await db
		.select({
			playerId: playerSeasonStats.playerId,
			fullName: players.fullName,
			alias: players.alias,
			goals: playerSeasonStats.goals,
			matches: playerSeasonStats.matchesPlayed,
			leagueId: playerSeasonStats.leagueId,
			leagueName: leagues.name,
			teamName: teams.name,
			city: leagues.city,
		})
		.from(playerSeasonStats)
		.innerJoin(players, eq(playerSeasonStats.playerId, players.id))
		.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.leftJoin(organizations, eq(leagues.organizationId, organizations.id))
		.where(
			and(
				sql`${playerSeasonStats.goals} > 0`,
				// Exclude leagues from trial organizations
				or(isNull(leagues.organizationId), eq(organizations.status, "verified")),
			),
		);

	type Acc = {
		playerId: string;
		fullName: string;
		alias: string | null;
		totalGoals: number;
		totalMatches: number;
		leagues: LeagueAcc[];
		cities: string[];
	};

	const map = new Map<string, Acc>();
	for (const row of rows) {
		if (!map.has(row.playerId)) {
			map.set(row.playerId, {
				playerId: row.playerId,
				fullName: row.fullName,
				alias: row.alias,
				totalGoals: 0,
				totalMatches: 0,
				leagues: [],
				cities: [],
			});
		}
		const e = map.get(row.playerId)!;
		e.totalGoals += row.goals;
		e.totalMatches += row.matches;
		if (!e.cities.includes(row.city)) e.cities.push(row.city);
		e.leagues.push({
			leagueId: row.leagueId,
			leagueName: row.leagueName,
			teamName: row.teamName ?? "—",
			goals: row.goals,
		});
	}

	const ranking = sortRanking(
		[...map.values()].map((a) =>
			buildRankingEntry(
				a.playerId,
				a.fullName,
				a.alias,
				a.totalGoals,
				a.totalMatches,
				a.leagues,
				a.cities,
			),
		),
	);

	// Deltas vs jornada anterior (todas las ligas del sistema)
	const leagueIds = [...new Set(rows.map((r) => r.leagueId))];
	const prevByLeague = await getPrevGoalsByLeague(leagueIds);
	const prevTotals = new Map<string, number>();
	for (const playerMap of prevByLeague.values()) {
		for (const [pid, goals] of playerMap) {
			prevTotals.set(pid, (prevTotals.get(pid) ?? 0) + goals);
		}
	}
	computeDeltas(ranking, prevTotals);

	if (!pagination) return { items: ranking, meta: EMPTY_PAGINATION(ranking.length) };
	return paginateArray(ranking, pagination);
}

// ── Búsqueda de jugadores para desambiguación ─────────────────────────────────
// Búsqueda global (todas las ciudades) con contexto completo de participaciones.

export async function searchPlayersForDisambiguation(q: string): Promise<PlayerSearchResult[]> {
	if (!q.trim()) return [];

	const rows = await db
		.select({
			playerId: players.id,
			fullName: players.fullName,
			alias: players.alias,
			goals: playerSeasonStats.goals,
			leagueId: leagues.id,
			leagueName: leagues.name,
			season: leagues.season,
			city: leagues.city,
			teamName: teams.name,
		})
		.from(players)
		.innerJoin(playerSeasonStats, eq(playerSeasonStats.playerId, players.id))
		.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
		.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.where(or(ilike(players.fullName, `%${q}%`), ilike(players.alias, `%${q}%`)))
		.limit(50);

	const map = new Map<string, PlayerSearchResult>();
	for (const row of rows) {
		if (!map.has(row.playerId)) {
			map.set(row.playerId, {
				playerId: row.playerId,
				fullName: row.fullName,
				alias: row.alias,
				totalGoals: 0,
				participations: [],
			});
		}
		const e = map.get(row.playerId)!;
		e.totalGoals += row.goals;
		e.participations.push({
			leagueId: row.leagueId,
			leagueName: row.leagueName,
			teamName: row.teamName ?? "—",
			city: row.city,
			season: row.season,
			goals: row.goals,
		});
	}

	return [...map.values()].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 8);
}

// ── Posición de un jugador en los tres scopes ─────────────────────────────────

export async function getPlayerPositions(
	playerId: string,
	opts: { leagueId?: string; city?: string },
): Promise<PlayerPositions> {
	// --- Scope Liga ---
	let league: PlayerPositions["league"] = null;
	if (opts.leagueId) {
		const rows = await db
			.select({ playerId: playerSeasonStats.playerId, goals: playerSeasonStats.goals })
			.from(playerSeasonStats)
			.where(eq(playerSeasonStats.leagueId, opts.leagueId))
			.orderBy(desc(playerSeasonStats.goals));

		const idx = rows.findIndex((r) => r.playerId === playerId);
		if (idx >= 0) {
			league = { rank: idx + 1, total: rows.length, goals: rows[idx].goals };
		}
	}

	// --- Scope Ciudad ---
	let city: PlayerPositions["city"] = null;
	if (opts.city) {
		const cityRows = await db
			.select({ playerId: playerSeasonStats.playerId, goals: playerSeasonStats.goals })
			.from(playerSeasonStats)
			.innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
			.where(eq(leagues.city, opts.city));

		const totals = new Map<string, number>();
		for (const r of cityRows) totals.set(r.playerId, (totals.get(r.playerId) ?? 0) + r.goals);

		const sorted = [...totals.entries()].filter(([, g]) => g > 0).sort((a, b) => b[1] - a[1]);
		const myGoals = totals.get(playerId) ?? 0;
		const idx = sorted.findIndex(([id]) => id === playerId);

		city = {
			rank: idx >= 0 ? idx + 1 : sorted.length + 1,
			total: sorted.length,
			goals: myGoals,
			cityName: opts.city,
		};
	}

	// --- Scope Global ---
	const globalRows = await db
		.select({ playerId: playerSeasonStats.playerId, goals: playerSeasonStats.goals })
		.from(playerSeasonStats);

	const globalTotals = new Map<string, number>();
	for (const r of globalRows)
		globalTotals.set(r.playerId, (globalTotals.get(r.playerId) ?? 0) + r.goals);

	const globalSorted = [...globalTotals.entries()]
		.filter(([, g]) => g > 0)
		.sort((a, b) => b[1] - a[1]);
	const myGlobalGoals = globalTotals.get(playerId) ?? 0;
	const globalIdx = globalSorted.findIndex(([id]) => id === playerId);

	const global = {
		rank: globalIdx >= 0 ? globalIdx + 1 : globalSorted.length + 1,
		total: globalSorted.length,
		goals: myGlobalGoals,
	};

	return { league, city, global };
}

// ── Tabla de honor por jornada ────────────────────────────────────────────────

export async function getJornadaHonor(city: string): Promise<JornadaLeague[]> {
	const cityLeagues = await db.query.leagues.findMany({
		where: eq(leagues.city, city),
	});

	if (cityLeagues.length === 0) return [];

	const results: JornadaLeague[] = [];

	for (const league of cityLeagues) {
		const latestRow = await db
			.select({ maxJornada: sql<number>`max(jornada)::int` })
			.from(playerSeasonStats)
			.where(eq(playerSeasonStats.leagueId, league.id));

		const jornada = latestRow[0]?.maxJornada;
		if (!jornada) continue;

		const topRows = await db
			.select({
				playerId: playerSeasonStats.playerId,
				fullName: players.fullName,
				alias: players.alias,
				goals: playerSeasonStats.goals,
				matchesPlayed: playerSeasonStats.matchesPlayed,
				teamName: teams.name,
			})
			.from(playerSeasonStats)
			.innerJoin(players, eq(playerSeasonStats.playerId, players.id))
			.leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
			.where(
				and(
					eq(playerSeasonStats.leagueId, league.id),
					eq(playerSeasonStats.jornada, jornada),
					sql`${playerSeasonStats.goals} > 0`,
				),
			)
			.orderBy(desc(playerSeasonStats.goals))
			.limit(3);

		if (topRows.length === 0) continue;

		results.push({
			leagueId: league.id,
			leagueName: league.name,
			season: league.season,
			dayOfWeek: league.dayOfWeek,
			jornada,
			heroes: topRows.map((r) => ({
				playerId: r.playerId,
				fullName: r.fullName,
				alias: r.alias,
				goals: r.goals,
				matchesPlayed: r.matchesPlayed,
				goalsPerMatch:
					r.matchesPlayed > 0 ? Math.round((r.goals / r.matchesPlayed) * 100) / 100 : 0,
				leagueName: league.name,
				teamName: r.teamName ?? "—",
				jornada,
			})),
		});
	}

	results.sort((a, b) => b.jornada - a.jornada);
	return results;
}

// ── Ligas de una ciudad (para el selector de liga) ────────────────────────────

export async function getCityLeagues(
	city: string,
): Promise<{ id: string; name: string; dayOfWeek: string; season: string }[]> {
	const rows = await db.query.leagues.findMany({
		where: eq(leagues.city, city),
		columns: { id: true, name: true, dayOfWeek: true, season: true },
		with: { organization: { columns: { status: true } } },
	});
	// Only show leagues from verified orgs (or legacy leagues without an org)
	return rows
		.filter((l) => !l.organization || l.organization.status === "verified")
		.map(({ organization: _org, ...l }) => l);
}
