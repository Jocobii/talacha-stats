/**
 * src/db/simulator/contributors/matchplay.ts
 *
 * Contribuidor "matchplay" - ver docs/ORGANIZATION-SIMULATOR.md S5 y S7
 * (Epica C2, la "regla de oro" de consistencia en cascada).
 * Escribe: matches, match_events, match_player_stats.
 * Depende de: enrollment (roster real), calendar (jornadas nuevas).
 *
 * Por cada jornada nueva de cada liga: empareja equipos, simula un marcador
 * (Poisson sembrado, extiende el mismo modelo de /api/seed-liga), reparte
 * esos goles entre jugadores REALES del roster como match_events, y llena
 * match_player_stats desde esos mismos eventos. Invariante (no negociable):
 * suma de match_events tipo "goal" de un equipo === su marcador en `matches`.
 *
 * Cierre de jornada: como este contribuidor resuelve TODOS los partidos de
 * cada jornada nueva en el mismo paso (status "played"), tambien marca esas
 * jornadas como `matchdays.status = "completed"`: el mismo efecto que
 * produce `POST /api/matchdays/[id]/close` en produccion (unica escritura
 * de ese endpoint, ver su route.ts). Sin esto, las jornadas quedaban
 * `"published"` para siempre y el Cockpit de Sorteo (`/admin/leagues/[id]/sorteo`,
 * que solo muestra jornadas `draft|published`) se ataraba mostrando la
 * jornada 1 sin avanzar nunca, aunque hubiera mas jornadas ya jugadas en DB.
 */

import { inArray } from "drizzle-orm";
import { matches, matchdays, matchEvents, matchPlayerStats } from "@/db/schema";
import type {
	Match,
	MatchEvent,
	MatchPlayerStat,
	League,
	Team,
	Matchday,
	LeagueVenue,
	VenueTimeWindow,
} from "@/db/schema";
import { pick, pickN, rngInt, type Rng } from "../rng";
import { setData, requireData, type Contributor, type SimContext } from "../context";
import { insertInBatches } from "../chunk";
import { getLeagues, getTeamsByLeague } from "./structure";
import { getLeagueMembers, getInscriptions } from "./enrollment";
import { getMatchdaysByLeague } from "./calendar";
import { LEAGUE_VENUES_KEY, VENUE_TIME_WINDOWS_KEY } from "./venues";

export const MATCHES_KEY = "matches";
export const MATCH_EVENTS_KEY = "matchEvents";
export const MATCH_PLAYER_STATS_KEY = "matchPlayerStats";

export interface RosterEntry {
	inscriptionId: string;
	leagueMemberId: string;
	globalPlayerId: string;
}

// Simulacion de marcador - mismo modelo que /api/seed-liga, con rng sembrado.

export function poissonSample(rng: Rng, lambda: number): number {
	const L = Math.exp(-lambda);
	let k = 0;
	let p = 1;
	do {
		k++;
		p *= rng();
	} while (p > L);
	return k - 1;
}

/** Marcador calibrado para fut7 amateur (5-12 goles por equipo). */
export function simulateMatchScore(
	rng: Rng,
	homeStrength: number,
	awayStrength: number,
): [number, number] {
	const homeAdv = 5;
	const homeExp = 7.5 + (homeStrength + homeAdv - awayStrength) / 22;
	const awayExp = 7.5 + (awayStrength - homeStrength - homeAdv) / 22;
	return [poissonSample(rng, Math.max(2.0, homeExp)), poissonSample(rng, Math.max(2.0, awayExp))];
}

/** Reparto de goles con distribucion realista (el "crack" se come 25-35%). */
export function distributeGoalsAmongPresent(
	rng: Rng,
	totalGoals: number,
	presentCount: number,
): number[] {
	if (presentCount === 0) return [];
	if (totalGoals === 0) return new Array(presentCount).fill(0);

	const weights = Array.from({ length: presentCount }, (_, i) => {
		if (i === 0) return rngInt(rng, 22, 32);
		if (i === 1) return rngInt(rng, 8, 14);
		if (i === 2) return rngInt(rng, 5, 9);
		if (i <= 4) return rngInt(rng, 2, 5);
		return rngInt(rng, 1, 3);
	});
	const totalWeight = weights.reduce((a, b) => a + b, 0);
	const goals = new Array(presentCount).fill(0);

	for (let g = 0; g < totalGoals; g++) {
		let r = rng() * totalWeight;
		for (let i = 0; i < presentCount; i++) {
			r -= weights[i];
			if (r <= 0 || i === presentCount - 1) {
				goals[i]++;
				break;
			}
		}
	}
	return goals;
}

function pairTeams(rng: Rng, teamRows: Team[]): [Team, Team][] {
	const shuffled = pickN(rng, teamRows, teamRows.length);
	const pairs: [Team, Team][] = [];
	for (let i = 0; i + 1 < shuffled.length; i += 2) {
		pairs.push([shuffled[i], shuffled[i + 1]]);
	}
	return pairs; // equipo impar sobrante descansa esta jornada (bye)
}

function buildRosterByTeam(ctx: SimContext): Map<string, RosterEntry[]> {
	const memberById = new Map(getLeagueMembers(ctx).map((m) => [m.id, m]));
	const map = new Map<string, RosterEntry[]>();
	for (const inscription of getInscriptions(ctx)) {
		const member = memberById.get(inscription.leagueMemberId);
		if (!member) continue;
		const list = map.get(inscription.teamId) ?? [];
		list.push({
			inscriptionId: inscription.id,
			leagueMemberId: inscription.leagueMemberId,
			globalPlayerId: member.globalPlayerId,
		});
		map.set(inscription.teamId, list);
	}
	return map;
}

function parseCedulaSeq(cedula: string | null, code: string): number {
	if (!cedula) return 0;
	const match = cedula.match(new RegExp(`^${code}-(\\d+)$`));
	return match ? Number(match[1]) : 0;
}

async function fetchMaxCedulaSeqByLeague(
	ctx: SimContext,
	leagueRows: League[],
): Promise<Map<string, number>> {
	const rows = (await ctx.db
		.select({ leagueId: matches.leagueId, cedula: matches.cedula })
		.from(matches)) as {
		leagueId: string;
		cedula: string | null;
	}[];
	const codeByLeague = new Map(leagueRows.map((l) => [l.id, l.code ?? "LIG"]));
	const maxByLeague = new Map<string, number>();
	for (const row of rows) {
		const code = codeByLeague.get(row.leagueId);
		if (!code) continue;
		const seq = parseCedulaSeq(row.cedula, code);
		if (seq > (maxByLeague.get(row.leagueId) ?? 0)) maxByLeague.set(row.leagueId, seq);
	}
	return maxByLeague;
}

function primaryVenueForLeague(leagueId: string, leagueVenueRows: LeagueVenue[]): string | null {
	const candidates = leagueVenueRows
		.filter((lv) => lv.leagueId === leagueId)
		.sort((a, b) => a.priority - b.priority);
	return candidates[0]?.venueId ?? null;
}

function kickoffTimeForLeague(leagueId: string, timeWindowRows: VenueTimeWindow[]): string {
	const window = timeWindowRows.find((w) => w.leagueId === leagueId);
	return window?.startTime ?? "19:00";
}

type EventDraft = Omit<typeof matchEvents.$inferInsert, "matchId">;
type StatDraft = Omit<typeof matchPlayerStats.$inferInsert, "matchId">;

interface FixtureBuild {
	matchDef: typeof matches.$inferInsert;
	events: EventDraft[];
	stats: StatDraft[];
}

function buildFixture(
	ctx: SimContext,
	league: League,
	matchday: Matchday,
	home: Team,
	away: Team,
	rosterByTeam: Map<string, RosterEntry[]>,
	strengthByTeam: Map<string, number>,
	cedulaSeq: number,
	venueId: string | null,
	startTime: string,
): FixtureBuild {
	const rng = ctx.rng;
	let [homeScore, awayScore] = simulateMatchScore(
		rng,
		strengthByTeam.get(home.id)!,
		strengthByTeam.get(away.id)!,
	);

	const homeRoster = rosterByTeam.get(home.id) ?? [];
	const awayRoster = rosterByTeam.get(away.id) ?? [];
	// Salvaguarda del invariante: sin roster no puede haber goles atribuibles.
	if (homeRoster.length === 0) homeScore = 0;
	if (awayRoster.length === 0) awayScore = 0;

	const code = league.code ?? "LIG";
	const cedula = `${code}-${String(cedulaSeq).padStart(4, "0")}`;
	const kickoffAt = new Date(`${matchday.scheduledDate}T${startTime}:00`);

	const matchDef = {
		leagueId: league.id,
		homeTeamId: home.id,
		awayTeamId: away.id,
		matchDate: matchday.scheduledDate,
		status: "played" as const,
		homeScore,
		awayScore,
		matchdayId: matchday.id,
		venueId,
		kickoffAt,
		isMakeup: false,
		cedula,
	};

	function buildSideEvents(team: Team, roster: RosterEntry[], score: number): EventDraft[] {
		if (roster.length === 0) return [];
		const presentCount = Math.min(
			roster.length,
			rngInt(rng, Math.min(7, roster.length), Math.min(11, roster.length)),
		);
		const present = pickN(rng, roster, presentCount);
		const goalsByPlayer = distributeGoalsAmongPresent(rng, score, present.length);

		const events: EventDraft[] = [];
		present.forEach((player, i) => {
			for (let g = 0; g < goalsByPlayer[i]; g++) {
				events.push({
					globalPlayerId: player.globalPlayerId,
					leagueMemberId: player.leagueMemberId,
					teamId: team.id,
					eventType: "goal",
					minute: rngInt(rng, 1, 50),
				});
				// ~55% de los goles llevan asistencia de otro presente.
				if (present.length > 1 && rng() < 0.55) {
					const assister = pick(
						rng,
						present.filter((p) => p !== player),
					);
					events.push({
						globalPlayerId: assister.globalPlayerId,
						leagueMemberId: assister.leagueMemberId,
						teamId: team.id,
						eventType: "assist",
						minute: null,
					});
				}
			}
			// Tarjetas: independientes de si anoto o no.
			if (rng() < 0.22) {
				events.push({
					globalPlayerId: player.globalPlayerId,
					leagueMemberId: player.leagueMemberId,
					teamId: team.id,
					eventType: "yellow_card",
					minute: rngInt(rng, 1, 50),
				});
			}
			if (rng() < 0.03) {
				events.push({
					globalPlayerId: player.globalPlayerId,
					leagueMemberId: player.leagueMemberId,
					teamId: team.id,
					eventType: "red_card",
					minute: rngInt(rng, 1, 50),
				});
			}
		});
		return events;
	}

	function buildSideStats(
		roster: RosterEntry[],
		side: "home" | "away",
		events: EventDraft[],
	): StatDraft[] {
		const eventsByPlayer = new Map<
			string,
			{ goals: number; assists: number; yellow: number; red: number }
		>();
		for (const e of events) {
			if (!e.leagueMemberId) continue;
			const acc = eventsByPlayer.get(e.leagueMemberId) ?? {
				goals: 0,
				assists: 0,
				yellow: 0,
				red: 0,
			};
			if (e.eventType === "goal") acc.goals++;
			else if (e.eventType === "assist") acc.assists++;
			else if (e.eventType === "yellow_card") acc.yellow++;
			else if (e.eventType === "red_card") acc.red++;
			eventsByPlayer.set(e.leagueMemberId, acc);
		}

		return roster.map((player) => {
			const acc = eventsByPlayer.get(player.leagueMemberId);
			return {
				playerRegistrationId: player.inscriptionId,
				teamSide: side,
				isPresent: Boolean(acc),
				goals: acc?.goals ?? 0,
				assists: acc?.assists ?? 0,
				yellowCards: acc?.yellow ?? 0,
				blueCards: 0,
				redCards: acc?.red ?? 0,
			};
		});
	}

	const homeEvents = buildSideEvents(home, homeRoster, homeScore);
	const awayEvents = buildSideEvents(away, awayRoster, awayScore);
	const events = [...homeEvents, ...awayEvents];
	const stats = [
		...buildSideStats(homeRoster, "home", homeEvents),
		...buildSideStats(awayRoster, "away", awayEvents),
	];

	return { matchDef, events, stats };
}

export const matchplayContributor: Contributor = {
	name: "matchplay",
	dependsOn: ["enrollment", "calendar"],
	async contribute(ctx: SimContext): Promise<void> {
		const leagueRows = getLeagues(ctx);
		const rosterByTeam = buildRosterByTeam(ctx);
		const leagueVenueRows = (ctx.data[LEAGUE_VENUES_KEY] as LeagueVenue[] | undefined) ?? [];
		const timeWindowRows =
			(ctx.data[VENUE_TIME_WINDOWS_KEY] as VenueTimeWindow[] | undefined) ?? [];
		const cedulaSeqByLeague = await fetchMaxCedulaSeqByLeague(ctx, leagueRows);

		const fixtures: FixtureBuild[] = [];

		for (const league of leagueRows) {
			const teamRows = getTeamsByLeague(ctx, league.id);
			const strengthByTeam = new Map(teamRows.map((t) => [t.id, rngInt(ctx.rng, 56, 86)]));
			const venueId = primaryVenueForLeague(league.id, leagueVenueRows);
			const startTime = kickoffTimeForLeague(league.id, timeWindowRows);

			let seq = cedulaSeqByLeague.get(league.id) ?? 0;

			for (const matchday of getMatchdaysByLeague(ctx, league.id)) {
				const fixturePairs = pairTeams(ctx.rng, teamRows);
				for (const [home, away] of fixturePairs) {
					seq += 1;
					fixtures.push(
						buildFixture(
							ctx,
							league,
							matchday,
							home,
							away,
							rosterByTeam,
							strengthByTeam,
							seq,
							venueId,
							startTime,
						),
					);
				}
			}
			cedulaSeqByLeague.set(league.id, seq);
		}

		const matchRows: Match[] = await insertInBatches(
			fixtures.map((f) => f.matchDef),
			(batch) => ctx.db.insert(matches).values(batch).returning(),
		);

		const eventDefs = matchRows.flatMap((match, i) =>
			fixtures[i].events.map((e) => ({ ...e, matchId: match.id })),
		);
		const eventRows: MatchEvent[] = await insertInBatches(eventDefs, (batch) =>
			ctx.db.insert(matchEvents).values(batch).returning(),
		);

		const statDefs = matchRows.flatMap((match, i) =>
			fixtures[i].stats.map((s) => ({ ...s, matchId: match.id })),
		);
		const statRows: MatchPlayerStat[] = await insertInBatches(statDefs, (batch) =>
			ctx.db.insert(matchPlayerStats).values(batch).returning(),
		);

		// Cierra las jornadas que este contribuidor acaba de jugar por completo
		// (ver nota de cabecera): sin esto quedan "published" para siempre.
		const touchedMatchdayIds = leagueRows.flatMap((league) =>
			getMatchdaysByLeague(ctx, league.id).map((md) => md.id),
		);
		if (touchedMatchdayIds.length > 0) {
			await ctx.db
				.update(matchdays)
				.set({ status: "completed" })
				.where(inArray(matchdays.id, touchedMatchdayIds));
		}

		setData(ctx, MATCHES_KEY, matchRows);
		setData(ctx, MATCH_EVENTS_KEY, eventRows);
		setData(ctx, MATCH_PLAYER_STATS_KEY, statRows);
	},
};

export function getMatches(ctx: SimContext): Match[] {
	return requireData<Match[]>(ctx, MATCHES_KEY);
}

export function getMatchEvents(ctx: SimContext): MatchEvent[] {
	return requireData<MatchEvent[]>(ctx, MATCH_EVENTS_KEY);
}

export function getMatchPlayerStats(ctx: SimContext): MatchPlayerStat[] {
	return requireData<MatchPlayerStat[]>(ctx, MATCH_PLAYER_STATS_KEY);
}
