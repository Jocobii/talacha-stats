import { describe, expect, it } from "vitest";
import type { League, Team, GlobalPlayer } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import {
	enrollmentContributor,
	getLeagueMembers,
	getInscriptions,
	CROSS_LEAGUE_REUSE_RATIO,
} from "./enrollment";
import { GLOBAL_PLAYERS_KEY } from "./identity";
import { LEAGUES_KEY, TEAMS_KEY } from "./structure";

const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes"] as const;

function makeLeagues(count: number, orgId = "org-0"): League[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `league-${i}`,
		name: `Liga ${i}`,
		nameCanonical: `liga ${i}`,
		slug: `liga-${i}`,
		category: "Libre",
		dayOfWeek: DAYS[i % DAYS.length],
		season: "Temporada 1",
		city: "Tijuana",
		organizationId: orgId,
		status: "active" as const,
		schedulingEnabled: true,
		code: `L${i}`,
		registrationCutoffMatchday: null,
		createdAt: new Date(),
	}));
}

function makeTeams(leagueRows: League[], teamsPerLeague: number): Team[] {
	return leagueRows.flatMap((league, li) =>
		Array.from({ length: teamsPerLeague }, (_, ti) => ({
			id: `team-${li}-${ti}`,
			name: `Team ${li}-${ti}`,
			nameCanonical: `team ${li} ${ti}`,
			leagueId: league.id,
			color: "#000000",
			status: "active" as const,
			sourceTeamId: null,
			joinedAtMatchday: null,
			createdAt: new Date(),
		})),
	);
}

function makeGlobalPlayers(n: number): GlobalPlayer[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `gp-${i}`,
		curpHash: `hash-${i}`,
		fullName: `Jugador ${i}`,
		fullNameCanonical: `jugador ${i}`,
		birthDate: "1995-01-01",
		gender: null,
		avatarUrl: null,
		registeredByOrganizationId: null,
		createdAt: new Date(),
	}));
}

function makeCtx(
	seed: number,
	tier: "S" | "M" | "L" | "XL",
	overrides?: { leagueCount?: number; teamsPerLeague?: number; playersPerTeam?: number },
) {
	const fakeDb = createFakeDb();
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
	});

	const leagueCount = overrides?.leagueCount ?? ctx.params.leaguesPerOrg;
	const teamsPerLeague = overrides?.teamsPerLeague ?? ctx.params.teamsPerLeague;
	const playersPerTeam = overrides?.playersPerTeam ?? ctx.params.playersPerTeam;

	const leagueRows = makeLeagues(leagueCount);
	const teamRows = makeTeams(leagueRows, teamsPerLeague);
	const totalSlots = leagueRows.length * teamsPerLeague * playersPerTeam;
	// +20% de holgura para que la reutilización cross-liga tenga con qué trabajar
	// sin agotar el pool (el contribuidor real lo dimensiona exacto — aquí solo
	// probamos la lógica de reparto, no el dimensionamiento de identity.ts).
	const pool = makeGlobalPlayers(Math.ceil(totalSlots * 1.2));

	ctx.data[LEAGUES_KEY] = leagueRows;
	ctx.data[TEAMS_KEY] = teamRows;
	ctx.data[GLOBAL_PLAYERS_KEY] = pool;
	ctx.params.playersPerTeam = playersPerTeam;

	return { ctx, fakeDb, leagueRows, teamRows, pool };
}

describe("enrollmentContributor", () => {
	it("crea playersPerTeam league_members por equipo (baseline)", async () => {
		const { ctx, teamRows } = makeCtx(1, "S", { leagueCount: 1 });
		await enrollmentContributor.contribute(ctx);

		const members = getLeagueMembers(ctx);
		const inscriptionRows = getInscriptions(ctx);

		for (const team of teamRows) {
			const teamInscriptionIds = new Set(
				inscriptionRows.filter((i) => i.teamId === team.id).map((i) => i.leagueMemberId),
			);
			const teamMembers = members.filter((m) => teamInscriptionIds.has(m.id));
			expect(teamMembers.length).toBeGreaterThanOrEqual(ctx.params.playersPerTeam);
		}
	});

	it("revienta con error claro si el pool de global_players se agota a mitad de un equipo", async () => {
		const { ctx } = makeCtx(99, "S", { leagueCount: 1, teamsPerLeague: 4, playersPerTeam: 5 });
		// Alcanza para 2 de los 4 equipos, no para los otros 2 — el pool mal
		// dimensionado es justo el bug real que se encontró en producción
		// (ver identity.ts::totalRosterSlots).
		ctx.data[GLOBAL_PLAYERS_KEY] = makeGlobalPlayers(2 * 5);

		await expect(enrollmentContributor.contribute(ctx)).rejects.toThrow(
			/se agotó el pool de global_players/,
		);
		expect(() => getLeagueMembers(ctx)).toThrow();
	});

	it("revienta con error claro si un equipo pertenece a una liga ausente de leagueRows (equipo huérfano en silencio, sin agotar el pool)", async () => {
		const { ctx, leagueRows, teamRows, pool } = makeCtx(100, "S", {
			leagueCount: 2,
			teamsPerLeague: 3,
			playersPerTeam: 4,
		});
		// Simula el caso real: `teams` (TEAMS_KEY) trae equipos de una liga que
		// `leagues` (LEAGUES_KEY) ya no incluye en esta corrida. buildBaseline
		// solo itera `leagueRows`, así que esos equipos nunca entran al loop —
		// ni se les asigna roster NI se agota el pool (no hay throw "viejo" que
		// lo detecte). Antes de este guard, la corrida terminaba "exitosa" con
		// esos equipos con cero inscripciones.
		ctx.data[LEAGUES_KEY] = [leagueRows[0]];
		ctx.data[GLOBAL_PLAYERS_KEY] = pool; // pool de sobra, no es tema de cupos

		await expect(enrollmentContributor.contribute(ctx)).rejects.toThrow(/no recibieron roster/);
		expect(() => getLeagueMembers(ctx)).toThrow();
		void teamRows;
	});

	it("una inscription por cada league_member creado", async () => {
		const { ctx } = makeCtx(2, "S", { leagueCount: 1 });
		await enrollmentContributor.contribute(ctx);

		expect(getInscriptions(ctx)).toHaveLength(getLeagueMembers(ctx).length);
	});

	it("nunca duplica (globalPlayerId, leagueId) — respeta uq_league_member", async () => {
		const { ctx } = makeCtx(3, "M");
		await enrollmentContributor.contribute(ctx);

		const members = getLeagueMembers(ctx);
		const pairs = new Set(members.map((m) => `${m.globalPlayerId}::${m.leagueId}`));
		expect(pairs.size).toBe(members.length);
	});

	it("con 2+ ligas, reutiliza una fracción de global_players cross-liga", async () => {
		const { ctx } = makeCtx(4, "M", { leagueCount: 3, teamsPerLeague: 6, playersPerTeam: 6 });
		await enrollmentContributor.contribute(ctx);

		const members = getLeagueMembers(ctx);
		const leaguesByPlayer = new Map<string, Set<string>>();
		for (const m of members) {
			const set = leaguesByPlayer.get(m.globalPlayerId) ?? new Set<string>();
			set.add(m.leagueId);
			leaguesByPlayer.set(m.globalPlayerId, set);
		}
		const crossLeaguePlayers = [...leaguesByPlayer.values()].filter((s) => s.size > 1);
		expect(crossLeaguePlayers.length).toBeGreaterThan(0);
	});

	it("no intenta reutilización cross-liga con una sola liga", async () => {
		const { ctx } = makeCtx(5, "S", { leagueCount: 1 });
		await enrollmentContributor.contribute(ctx);

		const members = getLeagueMembers(ctx);
		const baselineExpected = ctx.params.teamsPerLeague * ctx.params.playersPerTeam;
		expect(members).toHaveLength(baselineExpected);
	});

	it("lanza si el pool de global_players no alcanza para el baseline", async () => {
		const { ctx } = makeCtx(6, "S", { leagueCount: 1 });
		ctx.data[GLOBAL_PLAYERS_KEY] = (ctx.data[GLOBAL_PLAYERS_KEY] as GlobalPlayer[]).slice(0, 2);

		await expect(enrollmentContributor.contribute(ctx)).rejects.toThrow(/pool de global_players/);
	});

	it("misma semilla produce el mismo reparto", async () => {
		const { ctx: ctxA } = makeCtx(77, "M", { leagueCount: 3 });
		await enrollmentContributor.contribute(ctxA);
		const { ctx: ctxB } = makeCtx(77, "M", { leagueCount: 3 });
		await enrollmentContributor.contribute(ctxB);

		expect(getLeagueMembers(ctxA).map((m) => m.globalPlayerId)).toEqual(
			getLeagueMembers(ctxB).map((m) => m.globalPlayerId),
		);
	});
});

describe("CROSS_LEAGUE_REUSE_RATIO", () => {
	it("es una fracción razonable (entre 0 y 0.5)", () => {
		expect(CROSS_LEAGUE_REUSE_RATIO).toBeGreaterThan(0);
		expect(CROSS_LEAGUE_REUSE_RATIO).toBeLessThan(0.5);
	});
});
