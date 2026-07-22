/**
 * entities/player/ranking.ts
 * Queries para el ranking público de goleadores.
 *
 * Fuente combinada (julio 2026, ver entities/player/live-stats.ts):
 * player_season_stats (Excel, histórico) cuando la liga lo tiene, o cálculo
 * en vivo desde match_player_stats (cédula) cuando no. Antes solo leía
 * player_season_stats — ninguna liga capturada 100% en-app (única forma
 * desde que se eliminó import-excel) aparecía aquí.
 *
 * El ranking no muestra asistencias (solo goles) por diseño de la tabla de
 * goleo — eso no significa que no se capturen: la cédula sí registra
 * asistencias (match_player_stats.assists), solo que este módulo no las
 * agrega. El perfil de jugador (entities/player/queries.ts) sí las expone.
 *
 * P8/P9 (docs/V1-REMOVAL-PLAN.md, Fase 1 — jul 2026): `searchPlayersForDisambiguation`
 * y el cálculo de `positionDelta` (vía `getPrevJornadaGoalsByLeague`,
 * live-stats.ts) migrados de `player_season_stats`/`player_season_stats_snapshot`
 * (V1) a `match_player_stats`/`matchdays` (V2) — ya no quedan lecturas V1 en
 * este archivo.
 */

import { eq, and, or, ilike, isNull, inArray } from "drizzle-orm";
import { db, globalPlayers, leagueMembers, leagues, organizations } from "@/db";
import {
	getMergedLeagueStatsRows,
	getLiveJornadaHonor,
	getPrevJornadaGoalsByLeague,
} from "./live-stats";
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
	// Ligas de la ciudad (scope de org igual que antes) — la fuente de stats
	// (Excel vs en vivo) se resuelve por liga dentro de getMergedLeagueStatsRows.
	const cityLeagueRows = await db
		.select({ id: leagues.id })
		.from(leagues)
		.leftJoin(organizations, eq(leagues.organizationId, organizations.id))
		.where(
			and(
				eq(leagues.city, city),
				// Exclude leagues from trial organizations
				or(isNull(leagues.organizationId), eq(organizations.status, "verified")),
			),
		);
	const leagueIds = cityLeagueRows.map((l) => l.id);

	const rows = (await getMergedLeagueStatsRows(leagueIds)).filter((r) => r.goals > 0);

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
				alias: null,
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

	// Deltas vs jornada anterior (agrega goles previos de todas las ligas de la ciudad).
	// Cubre cualquier liga con 2+ jornadas registradas en `matchdays`, sea cual
	// sea su fuente de stats (P9, jul 2026) — antes solo cubría ligas con
	// snapshot V1, así que cualquier liga 100% en vivo salía siempre "isNew".
	const prevByLeague = await getPrevJornadaGoalsByLeague(leagueIds);
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
	const rows = (await getMergedLeagueStatsRows([leagueId]))
		.filter((r) => r.goals > 0)
		.sort((a, b) => b.goals - a.goals);

	const ranking: RankingEntry[] = rows.map((r) =>
		buildRankingEntry(r.playerId, r.fullName, null, r.goals, r.matches, [
			{ leagueId, leagueName: r.leagueName, teamName: r.teamName ?? "—", goals: r.goals },
		]),
	);

	// Deltas vs jornada anterior
	const prevByLeague = await getPrevJornadaGoalsByLeague([leagueId]);
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
	const allLeagueRows = await db
		.select({ id: leagues.id })
		.from(leagues)
		.leftJoin(organizations, eq(leagues.organizationId, organizations.id))
		.where(
			// Exclude leagues from trial organizations
			or(isNull(leagues.organizationId), eq(organizations.status, "verified")),
		);
	const leagueIds = allLeagueRows.map((l) => l.id);

	const rows = (await getMergedLeagueStatsRows(leagueIds)).filter((r) => r.goals > 0);

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
				alias: null,
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

	// Deltas vs jornada anterior (todas las ligas con resultados en el ranking)
	const resultLeagueIds = [...new Set(rows.map((r) => r.leagueId))];
	const prevByLeague = await getPrevJornadaGoalsByLeague(resultLeagueIds);
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

	// 1. Jugadores cuyo nombre matchea (identidad global, V2).
	const matchedPlayers = await db.query.globalPlayers.findMany({
		where: ilike(globalPlayers.fullName, `%${q}%`),
		columns: { id: true, fullName: true },
		limit: 50,
	});
	if (matchedPlayers.length === 0) return [];

	const playerIds = new Set(matchedPlayers.map((p) => p.id));

	// 2. Ligas donde participan (para poder pedir sus stats por liga).
	const memberships = await db
		.select({ leagueId: leagueMembers.leagueId })
		.from(leagueMembers)
		.where(inArray(leagueMembers.globalPlayerId, [...playerIds]));
	const leagueIds = [...new Set(memberships.map((m) => m.leagueId))];
	if (leagueIds.length === 0) return [];

	const leagueSeasonRows = await db.query.leagues.findMany({
		where: inArray(leagues.id, leagueIds),
		columns: { id: true, season: true },
	});
	const seasonByLeague = new Map(leagueSeasonRows.map((l) => [l.id, l.season]));

	// 3. Stats por liga (fuente combinada — Excel histórico o cálculo en vivo).
	const statsRows = await getMergedLeagueStatsRows(leagueIds);

	const map = new Map<string, PlayerSearchResult>();
	for (const row of statsRows) {
		if (!playerIds.has(row.playerId)) continue;
		if (!map.has(row.playerId)) {
			map.set(row.playerId, {
				playerId: row.playerId,
				fullName: row.fullName,
				// global_players no tiene alias (apodo) — solo existía en la tabla V1 `players`.
				alias: null,
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
			season: seasonByLeague.get(row.leagueId) ?? "",
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
		const rows = (await getMergedLeagueStatsRows([opts.leagueId])).sort(
			(a, b) => b.goals - a.goals,
		);

		const idx = rows.findIndex((r) => r.playerId === playerId);
		if (idx >= 0) {
			league = { rank: idx + 1, total: rows.length, goals: rows[idx].goals };
		}
	}

	// --- Scope Ciudad ---
	let city: PlayerPositions["city"] = null;
	if (opts.city) {
		const cityLeagueRows = await db
			.select({ id: leagues.id })
			.from(leagues)
			.where(eq(leagues.city, opts.city));
		const cityRows = await getMergedLeagueStatsRows(cityLeagueRows.map((l) => l.id));

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
	const allLeagueRows = await db.select({ id: leagues.id }).from(leagues);
	const globalRows = await getMergedLeagueStatsRows(allLeagueRows.map((l) => l.id));

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
// Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1 P3/D2): antes leía
// player_season_stats (V1, snapshot cumulativo por jornada del import de
// Excel) — sin backfill, ninguna liga capturada 100% en-app vía cédula
// aparecía nunca aquí. Ahora se calcula en vivo desde match_player_stats
// (getLiveJornadaHonor). Sin backfill de Excel (D1): una liga cuyo único
// historial vivía en Excel deja de aparecer — pérdida aceptada.

export async function getJornadaHonor(city: string): Promise<JornadaLeague[]> {
	const cityLeagues = await db.query.leagues.findMany({
		where: eq(leagues.city, city),
	});

	if (cityLeagues.length === 0) return [];

	const results: JornadaLeague[] = [];

	for (const league of cityLeagues) {
		const honor = await getLiveJornadaHonor(league.id);
		if (!honor || honor.heroes.length === 0) continue;

		results.push({
			leagueId: league.id,
			leagueName: league.name,
			season: league.season,
			dayOfWeek: league.dayOfWeek,
			jornada: honor.jornada,
			heroes: honor.heroes.map((h) => ({
				playerId: h.playerId,
				fullName: h.fullName,
				alias: null,
				goals: h.goals,
				matchesPlayed: h.matchesPlayed,
				goalsPerMatch:
					h.matchesPlayed > 0 ? Math.round((h.goals / h.matchesPlayed) * 100) / 100 : 0,
				leagueName: league.name,
				teamName: h.teamName ?? "—",
				jornada: honor.jornada,
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
		.map(({ organization: _, ...l }) => l);
}
