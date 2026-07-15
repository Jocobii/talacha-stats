/**
 * src/db/simulator/contributors/enrollment.ts
 *
 * Contribuidor "enrollment" — ver docs/ORGANIZATION-SIMULATOR.md §5 (Épica B4).
 * Escribe: league_members, inscriptions.
 * Depende de: structure (leagues, teams). Consume el pool de global_players
 * que dejó identity.
 *
 * Dos pasadas:
 *   1. Baseline — cada equipo recibe exactamente `ctx.params.playersPerTeam`
 *      global_players distintos, tomados en orden del pool (cursor
 *      compartido: el pool viene dimensionado 1:1 con los cupos totales).
 *   2. Refuerzos cross-liga — una fracción de los league_members recién
 *      creados se re-inscribe TAMBIÉN en otra liga de la corrida (misma
 *      identidad, distinto league_member), lo que es dato realista, no
 *      duplicación (docs/ORGANIZATION-SIMULATOR.md §6). Es aditivo: no le
 *      quita roster a ningún equipo, solo agrega un refuerzo extra.
 */

import { leagueMembers, inscriptions } from "@/db/schema";
import type { LeagueMember, Inscription, League, Team } from "@/db/schema";
import { pickN, rngInt } from "../rng";
import { setData, requireData, type Contributor, type SimContext } from "../context";
import { insertInBatches } from "../chunk";
import { getGlobalPlayers } from "./identity";
import { getLeagues, getTeams } from "./structure";

export const LEAGUE_MEMBERS_KEY = "leagueMembers";
export const INSCRIPTIONS_KEY = "inscriptions";

/** Fracción de league_members baseline que además se inscribe en otra liga. */
export const CROSS_LEAGUE_REUSE_RATIO = 0.08;

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export interface BaselineResult {
	memberDefs: {
		globalPlayerId: string;
		leagueId: string;
		dorsal: number;
		inscriptionDate: string;
	}[];
	/** teamId por índice — mismo orden que memberDefs, para las inscriptions. */
	teamIdByIndex: string[];
}

/**
 * Reparte el pool de global_players entre equipos/ligas en orden — el pool
 * viene dimensionado exactamente a `totalRosterSlots` por `identity`, así
 * que no debería sobrar ni faltar en una corrida de bootstrap normal.
 *
 * Exportada para el modo "avanzar liga existente" (Épica E): el caller arma
 * `ctx.data[GLOBAL_PLAYERS_KEY]` con un pool dimensionado a UNA liga (no al
 * tier completo) y le pasa `leagueRows: [esaLiga]`.
 */
export function buildBaseline(
	ctx: SimContext,
	leagueRows: League[],
	teamRows: Team[],
): BaselineResult {
	const pool = getGlobalPlayers(ctx);
	const teamsByLeague = new Map<string, Team[]>();
	for (const team of teamRows) {
		const list = teamsByLeague.get(team.leagueId) ?? [];
		list.push(team);
		teamsByLeague.set(team.leagueId, list);
	}

	const memberDefs: BaselineResult["memberDefs"] = [];
	const teamIdByIndex: string[] = [];
	let cursor = 0;
	const inscriptionDate = todayIso();

	for (const league of leagueRows) {
		const leagueTeams = teamsByLeague.get(league.id) ?? [];
		for (const team of leagueTeams) {
			for (let i = 0; i < ctx.params.playersPerTeam; i++) {
				if (cursor >= pool.length) {
					throw new Error(
						"enrollment: se agotó el pool de global_players antes de completar el roster. " +
							"¿totalRosterSlots(ctx) en identity.ts está desalineado con params?",
					);
				}
				const player = pool[cursor++];
				memberDefs.push({
					globalPlayerId: player.id,
					leagueId: league.id,
					dorsal: i + 1,
					inscriptionDate,
				});
				teamIdByIndex.push(team.id);
			}
		}
	}

	return { memberDefs, teamIdByIndex };
}

interface CrossLeagueResult {
	memberDefs: {
		globalPlayerId: string;
		leagueId: string;
		dorsal: number | null;
		inscriptionDate: string;
	}[];
	teamIdByIndex: string[];
}

/**
 * Selecciona una fracción de los league_members recién creados y los
 * re-inscribe (aditivo) en otra liga de la corrida donde esa identidad
 * global aún no participa. No hace nada si solo hay una liga.
 */
function buildCrossLeagueReuse(
	ctx: SimContext,
	leagueRows: League[],
	teamRows: Team[],
	baseline: BaselineResult,
): CrossLeagueResult {
	if (leagueRows.length < 2 || baseline.memberDefs.length === 0) {
		return { memberDefs: [], teamIdByIndex: [] };
	}

	const teamsByLeague = new Map<string, Team[]>();
	for (const team of teamRows) {
		const list = teamsByLeague.get(team.leagueId) ?? [];
		list.push(team);
		teamsByLeague.set(team.leagueId, list);
	}

	// globalPlayerId -> Set<leagueId> ya inscrito, para no violar uq_league_member.
	const registeredLeaguesByPlayer = new Map<string, Set<string>>();
	for (const m of baseline.memberDefs) {
		const set = registeredLeaguesByPlayer.get(m.globalPlayerId) ?? new Set<string>();
		set.add(m.leagueId);
		registeredLeaguesByPlayer.set(m.globalPlayerId, set);
	}

	const numCross = Math.round(baseline.memberDefs.length * CROSS_LEAGUE_REUSE_RATIO);
	// Favorece a jugadores elegidos con índice bajo (llegaron "primero" al pool)
	// solo para tener algo de variedad determinista — no representa habilidad
	// real todavía (eso lo aporta matchplay/aggregates en la Épica C).
	const candidates = pickN(
		ctx.rng,
		baseline.memberDefs,
		Math.min(numCross, baseline.memberDefs.length),
	);

	const memberDefs: CrossLeagueResult["memberDefs"] = [];
	const teamIdByIndex: string[] = [];
	const inscriptionDate = todayIso();

	for (const candidate of candidates) {
		const eligibleLeagues = leagueRows.filter(
			(l) => !registeredLeaguesByPlayer.get(candidate.globalPlayerId)?.has(l.id),
		);
		if (eligibleLeagues.length === 0) continue;

		const targetLeague = eligibleLeagues[rngInt(ctx.rng, 0, eligibleLeagues.length - 1)];
		const targetTeams = teamsByLeague.get(targetLeague.id) ?? [];
		if (targetTeams.length === 0) continue;

		const targetTeam = targetTeams[rngInt(ctx.rng, 0, targetTeams.length - 1)];

		memberDefs.push({
			globalPlayerId: candidate.globalPlayerId,
			leagueId: targetLeague.id,
			dorsal: null, // refuerzo — número lo asigna el organizador después
			inscriptionDate,
		});
		teamIdByIndex.push(targetTeam.id);

		const set = registeredLeaguesByPlayer.get(candidate.globalPlayerId) ?? new Set<string>();
		set.add(targetLeague.id);
		registeredLeaguesByPlayer.set(candidate.globalPlayerId, set);
	}

	return { memberDefs, teamIdByIndex };
}

export const enrollmentContributor: Contributor = {
	name: "enrollment",
	dependsOn: ["structure"],
	async contribute(ctx: SimContext): Promise<void> {
		const leagueRows = getLeagues(ctx);
		const teamRows = getTeams(ctx);

		const baseline = buildBaseline(ctx, leagueRows, teamRows);
		const crossLeague = buildCrossLeagueReuse(ctx, leagueRows, teamRows, baseline);

		const allMemberDefs = [...baseline.memberDefs, ...crossLeague.memberDefs];
		const allTeamIdByIndex = [...baseline.teamIdByIndex, ...crossLeague.teamIdByIndex];

		const memberRows: LeagueMember[] = await insertInBatches(allMemberDefs, (batch) =>
			ctx.db.insert(leagueMembers).values(batch).returning(),
		);

		const inscriptionDefs = memberRows.map((member, i) => ({
			leagueMemberId: member.id,
			teamId: allTeamIdByIndex[i],
		}));

		const inscriptionRows: Inscription[] = await insertInBatches(inscriptionDefs, (batch) =>
			ctx.db.insert(inscriptions).values(batch).returning(),
		);

		setData(ctx, LEAGUE_MEMBERS_KEY, memberRows);
		setData(ctx, INSCRIPTIONS_KEY, inscriptionRows);
	},
};

export function getLeagueMembers(ctx: SimContext): LeagueMember[] {
	return requireData<LeagueMember[]>(ctx, LEAGUE_MEMBERS_KEY);
}

export function getInscriptions(ctx: SimContext): Inscription[] {
	return requireData<Inscription[]>(ctx, INSCRIPTIONS_KEY);
}

/** Solo para tests/depuración — no se usa en producción. */
export const __internals = { buildBaseline, buildCrossLeagueReuse };
