// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useMatchResolution } from "./use-match-resolution";
import type { MatchResolutionData, PlayerResolutionRow } from "@/entities/match/model";

// Aísla la unidad de la red (§20.3): el hook usa estas funciones para
// autosave/resolución, no nos interesa el transporte en estas pruebas de
// transición de estado.
vi.mock("../lib/match-resolution-api", () => ({
	patchPlayerStat: vi.fn().mockResolvedValue(undefined),
	patchMatchFields: vi.fn().mockResolvedValue(undefined),
	resolveMatch: vi.fn().mockResolvedValue({ nextMatchId: null }),
}));

function buildPlayer(overrides: Partial<PlayerResolutionRow> = {}): PlayerResolutionRow {
	return {
		registrationId: "r1",
		playerProfileId: "p1",
		fullName: "Juan Pérez",
		jerseyNumber: 10,
		credentialCode: 1,
		isAdHoc: false,
		stat: null,
		suspended: null,
		...overrides,
	};
}

function buildData(overrides: Partial<MatchResolutionData["match"]> = {}): MatchResolutionData {
	return {
		match: {
			id: "m1",
			cedula: "LCN-0001",
			status: "scheduled",
			homeScore: null,
			awayScore: null,
			homeBonusGoals: 0,
			awayBonusGoals: 0,
			refereeObservations: null,
			matchDate: "2026-07-16",
			kickoffAt: null,
			...overrides,
		},
		matchday: null,
		league: { id: "l1", name: "Liga Amigos", code: "LCN" },
		homeTeam: { id: "h1", name: "Tigres", color: null },
		awayTeam: { id: "a1", name: "Leones", color: null },
		homePlayers: [buildPlayer({ registrationId: "hr1" })],
		awayPlayers: [buildPlayer({ registrationId: "ar1" })],
	};
}

describe("useMatchResolution", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		cleanup();
	});

	it("pasa a 'played' automáticamente al capturar ambos marcadores globales", () => {
		const { result } = renderHook(() => useMatchResolution(buildData()));

		act(() => result.current.updateMatchField("homeScore", 2));
		expect(result.current.state.status).toBe("scheduled"); // falta el visitante

		act(() => result.current.updateMatchField("awayScore", 1));
		expect(result.current.state.status).toBe("played");
	});

	it("hasGoalMismatch se activa cuando los goles capturados no cuadran con el marcador", () => {
		const { result } = renderHook(() => useMatchResolution(buildData()));

		act(() => {
			result.current.updateMatchField("homeScore", 2);
			result.current.updateMatchField("awayScore", 0);
		});
		expect(result.current.hasGoalMismatch).toBe(true);
		expect(result.current.homeGoalGap).toBe(2);

		act(() => result.current.updatePlayerStat("home", "hr1", "goals", 2));
		expect(result.current.hasGoalMismatch).toBe(false);
		expect(result.current.homeGoalGap).toBe(0);
	});

	it("no bloquea por goles en Suspendido/Pospuesto aunque el marcador no cuadre", () => {
		const { result } = renderHook(() =>
			useMatchResolution(buildData({ status: "suspended", homeScore: 2, awayScore: 0 })),
		);
		expect(result.current.hasGoalMismatch).toBe(false);
	});

	it("W.O. fija el marcador 3-0 sin tocar la lista de jugadores", () => {
		const { result } = renderHook(() => useMatchResolution(buildData()));

		act(() => result.current.updatePlayerStat("home", "hr1", "goals", 3));
		act(() => result.current.updateMatchField("status", "walkover_home"));

		expect(result.current.state.status).toBe("walkover_home");
		expect(result.current.state.homeScore).toBe(3);
		expect(result.current.state.awayScore).toBe(0);
		// Los 3 goles del ganador van a "goles de equipo", no por jugador.
		expect(result.current.state.homeBonusGoals).toBe(3);
		expect(result.current.state.awayBonusGoals).toBe(0);
		// La captura de goles del jugador sigue intacta (no se limpia en W.O.);
		// la UI (PlayerStatRow) es quien bloquea nuevas entradas en esa celda.
		expect(result.current.state.homePlayers[0].goals).toBe(3);
	});
});
