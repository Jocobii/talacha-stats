/**
 * src/db/simulator/contributors/playoffs.ts
 *
 * Contribuidor "playoffs" — ver docs/ORGANIZATION-SIMULATOR.md §5 y §9
 * (Épica C5).
 * Escribe: matchdays (sentinel `phase: "playoff"`), playoff_brackets,
 * playoff_slots, matches (ronda 1, `status: "scheduled"`).
 * Depende de: aggregates (necesita `team_standings_snapshot` de la jornada
 * final ya insertado en esta misma corrida, dentro de la misma transacción).
 *
 * Por cada liga que ya llegó a `JORNADAS_PER_TEMPORADA` (20) y todavía NO
 * tiene bracket armado, replica la lógica de
 * `POST /api/leagues/[id]/playoffs/start`: lee las zonas de clasificación
 * configuradas (`league_playoff_zones`, ya creadas por defecto en
 * `structure.ts`), arma la tabla final, siembra equipos por zona y genera
 * bracket + slots + partidos de ronda 1.
 *
 * A propósito NO resuelve/simula los partidos de playoff — la idea es que
 * el organizador (o quien pruebe la UI) juegue la liguilla a mano, cédula
 * por cédula, igual que en producción. El simulador solo deja la fase
 * regular jugada y el bracket listo para arrancar.
 *
 * Idempotente por liga: si ya existe un `playoff_bracket` para la liga, esta
 * corrida no le toca nada (misma regla que el endpoint HTTP).
 */

import { eq } from "drizzle-orm";
import {
	leaguePlayoffZones,
	playoffBrackets,
	playoffSlots,
	teamStandingsSnapshot,
	matchdays,
	matches,
} from "@/db/schema";
import type {
	League,
	Team,
	LeaguePlayoffZone,
	PlayoffBracket,
	PlayoffSlot,
	TeamStandingsSnapshot,
} from "@/db/schema";
import { generateBracket, type BracketTeam } from "@/features/playoffs/lib/bracket-generator";
import {
	JORNADAS_PER_TEMPORADA,
	setData,
	requireData,
	type Contributor,
	type SimContext,
} from "../context";
import { getLeagues, getTeamsByLeague } from "./structure";

export const PLAYOFF_BRACKETS_KEY = "playoffBrackets";
export const PLAYOFF_SLOTS_KEY = "playoffSlots";

/** Mismo sentinel que usa el endpoint HTTP (`playoffs/start/route.ts`). */
const PLAYOFF_MATCHDAY_NUMBER = 0;

interface StandingRow {
	teamId: string;
	points: number;
	goalsFor: number;
	goalsAgainst: number;
}

/** Mismo desempate que `getLatestStandings` (entities/organization/queries.ts). */
function sortStandings(rows: StandingRow[], teamById: Map<string, Team>): StandingRow[] {
	return [...rows].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const aDiff = a.goalsFor - a.goalsAgainst;
		const bDiff = b.goalsFor - b.goalsAgainst;
		if (bDiff !== aDiff) return bDiff - aDiff;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		const aName = teamById.get(a.teamId)?.name ?? "";
		const bName = teamById.get(b.teamId)?.name ?? "";
		return aName.localeCompare(bName);
	});
}

async function fetchExistingBracketLeagueIds(ctx: SimContext): Promise<Set<string>> {
	const rows = (await ctx.db
		.select({ leagueId: playoffBrackets.leagueId })
		.from(playoffBrackets)) as { leagueId: string }[];
	return new Set(rows.map((r) => r.leagueId));
}

async function fetchZonesByLeague(ctx: SimContext): Promise<Map<string, LeaguePlayoffZone[]>> {
	const rows = (await ctx.db.select().from(leaguePlayoffZones)) as LeaguePlayoffZone[];
	const byLeague = new Map<string, LeaguePlayoffZone[]>();
	for (const zone of rows) {
		const list = byLeague.get(zone.leagueId) ?? [];
		list.push(zone);
		byLeague.set(zone.leagueId, list);
	}
	for (const list of byLeague.values()) list.sort((a, b) => a.fromPosition - b.fromPosition);
	return byLeague;
}

/** Máxima jornada REGULAR ya jugada por liga — ignora la jornada sentinel (0) de playoff. */
async function fetchMaxRegularJornadaByLeague(ctx: SimContext): Promise<Map<string, number>> {
	const rows = (await ctx.db
		.select({ leagueId: matchdays.leagueId, number: matchdays.number, phase: matchdays.phase })
		.from(matchdays)) as { leagueId: string; number: number; phase: string }[];
	const maxByLeague = new Map<string, number>();
	for (const row of rows) {
		if (row.phase !== "regular") continue;
		const current = maxByLeague.get(row.leagueId) ?? 0;
		if (row.number > current) maxByLeague.set(row.leagueId, row.number);
	}
	return maxByLeague;
}

async function fetchFinalStandings(
	ctx: SimContext,
	league: League,
	teamRows: Team[],
): Promise<StandingRow[]> {
	const rows = (await ctx.db.select().from(teamStandingsSnapshot)) as TeamStandingsSnapshot[];
	const activeTeamIds = new Set(teamRows.filter((t) => t.status === "active").map((t) => t.id));
	const teamById = new Map(teamRows.map((t) => [t.id, t]));
	const leagueRows = rows.filter(
		(r) =>
			r.leagueId === league.id &&
			r.jornada === JORNADAS_PER_TEMPORADA &&
			activeTeamIds.has(r.teamId),
	);
	return sortStandings(leagueRows, teamById);
}

/** Arma bracket + slots + partidos de R1 para una liga — misma lógica que playoffs/start/route.ts. */
async function createBracketsForLeague(
	ctx: SimContext,
	league: League,
	zones: LeaguePlayoffZone[],
	standings: StandingRow[],
	teamById: Map<string, Team>,
): Promise<{ brackets: PlayoffBracket[]; slots: PlayoffSlot[] }> {
	type ZoneTeams = { zone: LeaguePlayoffZone; teams: BracketTeam[] };

	const zoneTeams: ZoneTeams[] = zones.map((zone) => {
		const teamsInZone: BracketTeam[] = [];
		for (let pos = zone.fromPosition; pos <= zone.toPosition; pos++) {
			const row = standings[pos - 1];
			if (!row) break;
			const team = teamById.get(row.teamId);
			if (!team) break;
			teamsInZone.push({ id: team.id, name: team.name, seed: pos - zone.fromPosition + 1 });
		}
		return { zone, teams: teamsInZone };
	});

	const activeZones = zoneTeams.filter((zt) => zt.teams.length >= 2);
	if (activeZones.length === 0) return { brackets: [], slots: [] };

	const today = new Date().toISOString().slice(0, 10);

	const [matchday] = await ctx.db
		.insert(matchdays)
		.values({
			leagueId: league.id,
			number: PLAYOFF_MATCHDAY_NUMBER,
			phase: "playoff",
			scheduledDate: today,
			status: "published",
		})
		.returning();

	const insertedBrackets: PlayoffBracket[] = [];
	const insertedSlots: PlayoffSlot[] = [];

	for (const { zone, teams: bracketTeams } of activeZones) {
		const [bracket] = await ctx.db
			.insert(playoffBrackets)
			.values({
				leagueId: league.id,
				zoneId: zone.id,
				zoneName: zone.name,
				zoneColor: zone.color,
				status: "active",
			})
			.returning();
		insertedBrackets.push(bracket);

		const specs = generateBracket(bracketTeams);

		type Tracked = {
			id: string;
			key: string;
			round: number;
			homeTeamId: string | null;
			awayTeamId: string | null;
			isBye: boolean;
		};
		const tracked: Tracked[] = [];

		for (const spec of specs) {
			const [slot] = await ctx.db
				.insert(playoffSlots)
				.values({
					bracketId: bracket.id,
					round: spec.round,
					slotIndex: spec.slotIndex,
					isThirdPlace: spec.isThirdPlace,
					isBye: spec.isBye,
					homeTeamId: spec.homeTeamId,
					awayTeamId: spec.awayTeamId,
					homeFromSlotId: null,
					homeFromType: spec.homeFromType,
					awayFromSlotId: null,
					awayFromType: spec.awayFromType,
				})
				.returning();
			insertedSlots.push(slot);
			tracked.push({
				id: slot.id,
				key: `R${spec.round}S${spec.slotIndex}`,
				round: spec.round,
				homeTeamId: spec.homeTeamId,
				awayTeamId: spec.awayTeamId,
				isBye: spec.isBye,
			});
		}

		// Wire self-referential FKs (ronda N+1 apunta a slots de ronda N).
		const keyToId = new Map(tracked.map((s) => [s.key, s.id]));
		for (let i = 0; i < specs.length; i++) {
			const spec = specs[i];
			const slotId = tracked[i].id;
			const homeFromSlotId = spec.homeFromSlotKey
				? (keyToId.get(spec.homeFromSlotKey) ?? null)
				: null;
			const awayFromSlotId = spec.awayFromSlotKey
				? (keyToId.get(spec.awayFromSlotKey) ?? null)
				: null;
			if (homeFromSlotId !== null || awayFromSlotId !== null) {
				await ctx.db
					.update(playoffSlots)
					.set({ homeFromSlotId, awayFromSlotId })
					.where(eq(playoffSlots.id, slotId));
				const idx = insertedSlots.findIndex((s) => s.id === slotId);
				if (idx !== -1)
					insertedSlots[idx] = { ...insertedSlots[idx], homeFromSlotId, awayFromSlotId };
			}
		}

		// Partidos reales de R1 para slots sin bye con ambos equipos conocidos.
		for (const s of tracked) {
			if (s.round === 1 && !s.isBye && s.homeTeamId && s.awayTeamId) {
				const [match] = await ctx.db
					.insert(matches)
					.values({
						leagueId: league.id,
						matchdayId: matchday.id,
						homeTeamId: s.homeTeamId,
						awayTeamId: s.awayTeamId,
						matchDate: today,
						status: "scheduled",
					})
					.returning();

				await ctx.db
					.update(playoffSlots)
					.set({ matchId: match.id })
					.where(eq(playoffSlots.id, s.id));
				const idx = insertedSlots.findIndex((sl) => sl.id === s.id);
				if (idx !== -1) insertedSlots[idx] = { ...insertedSlots[idx], matchId: match.id };
			}
		}
	}

	return { brackets: insertedBrackets, slots: insertedSlots };
}

export const playoffsContributor: Contributor = {
	name: "playoffs",
	dependsOn: ["aggregates"],
	async contribute(ctx: SimContext): Promise<void> {
		const leagueRows = getLeagues(ctx);

		const [existingBracketLeagueIds, zonesByLeague, maxRegularJornadaByLeague] = await Promise.all([
			fetchExistingBracketLeagueIds(ctx),
			fetchZonesByLeague(ctx),
			fetchMaxRegularJornadaByLeague(ctx),
		]);

		const allBrackets: PlayoffBracket[] = [];
		const allSlots: PlayoffSlot[] = [];

		for (const league of leagueRows) {
			if (existingBracketLeagueIds.has(league.id)) continue; // idempotente — ya arrancó su fase final

			const maxRegularJornada = maxRegularJornadaByLeague.get(league.id) ?? 0;
			if (maxRegularJornada < JORNADAS_PER_TEMPORADA) continue; // fase regular aún no termina

			const zones = zonesByLeague.get(league.id) ?? [];
			if (zones.length === 0) continue; // sin zonas configuradas, no hay qué armar

			const teamRows = getTeamsByLeague(ctx, league.id);
			const teamById = new Map(teamRows.map((t) => [t.id, t]));
			const standings = await fetchFinalStandings(ctx, league, teamRows);
			if (standings.length === 0) continue;

			const { brackets, slots } = await createBracketsForLeague(
				ctx,
				league,
				zones,
				standings,
				teamById,
			);
			allBrackets.push(...brackets);
			allSlots.push(...slots);
		}

		setData(ctx, PLAYOFF_BRACKETS_KEY, allBrackets);
		setData(ctx, PLAYOFF_SLOTS_KEY, allSlots);
	},
};

export function getPlayoffBrackets(ctx: SimContext): PlayoffBracket[] {
	return requireData<PlayoffBracket[]>(ctx, PLAYOFF_BRACKETS_KEY);
}

export function getPlayoffSlots(ctx: SimContext): PlayoffSlot[] {
	return requireData<PlayoffSlot[]>(ctx, PLAYOFF_SLOTS_KEY);
}
