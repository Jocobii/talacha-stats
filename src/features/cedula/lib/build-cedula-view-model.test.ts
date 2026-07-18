import { describe, it, expect } from "vitest";
import { buildCedulaViewModel } from "./build-cedula-view-model";
import type { CedulaMatchData, CedulaPlayerRow } from "@/entities/match";

function makePlayer(overrides: Partial<CedulaPlayerRow> = {}): CedulaPlayerRow {
	return {
		globalPlayerId: "p1",
		fullName: "Jugador Uno",
		credentialCode: 12,
		dorsal: 7,
		blocked: null,
		...overrides,
	};
}

function makeData(overrides: Partial<CedulaMatchData> = {}): CedulaMatchData {
	return {
		matchId: "m1",
		cedula: "MLT-0009",
		matchdayNumber: 2,
		matchDate: "2026-07-27",
		kickoffAt: null,
		venueName: "Cancha 1",
		league: { name: "MiLigaTest2", code: "MLT", season: "Apertura 2026", category: "Libre" },
		homeTeam: { id: "h1", name: "Los Charros FC" },
		awayTeam: { id: "a1", name: "Los Valientes" },
		homePlayers: [],
		awayPlayers: [],
		...overrides,
	};
}

describe("buildCedulaViewModel", () => {
	it("formatea folio, fecha y credencial con padStart(4)", () => {
		const vm = buildCedulaViewModel(
			makeData({ homePlayers: [makePlayer({ credentialCode: 42 })] }),
		);
		expect(vm.folio).toBe("MLT-0009");
		expect(vm.dateLabel).toBe("lun 27 jul 2026");
		expect(vm.home.rows[0]).toMatchObject({ kind: "player", credentialCode: "0042" });
	});

	it("da al menos MIN_BLANK_ROWS (5) de refuerzos aunque el roster esté vacío", () => {
		const vm = buildCedulaViewModel(makeData());
		const blanks = vm.home.rows.filter((r) => r.kind === "blank");
		expect(blanks).toHaveLength(5);
	});

	it("empareja la altura de ambas columnas cuando un equipo tiene más jugadores", () => {
		const home = Array.from({ length: 12 }, (_, i) =>
			makePlayer({ globalPlayerId: `h${i}`, credentialCode: i + 1 }),
		);
		const away = Array.from({ length: 8 }, (_, i) =>
			makePlayer({ globalPlayerId: `a${i}`, credentialCode: i + 1 }),
		);
		const vm = buildCedulaViewModel(makeData({ homePlayers: home, awayPlayers: away }));
		expect(vm.home.rows).toHaveLength(vm.away.rows.length);
		// home (el roster más largo) recibe exactamente el mínimo de refuerzos
		expect(vm.home.rows.filter((r) => r.kind === "blank")).toHaveLength(5);
		// away recibe más refuerzos para igualar la altura
		expect(vm.away.rows.filter((r) => r.kind === "blank")).toHaveLength(9);
	});

	it("marca density normal/compact/tight y overflowsToSecondPage según el roster más grande", () => {
		const smallRoster = Array.from({ length: 10 }, (_, i) =>
			makePlayer({ globalPlayerId: `s${i}`, credentialCode: i + 1 }),
		);
		expect(buildCedulaViewModel(makeData({ homePlayers: smallRoster })).density).toBe("normal");

		const bigRoster = Array.from({ length: 16 }, (_, i) =>
			makePlayer({ globalPlayerId: `b${i}`, credentialCode: i + 1 }),
		);
		const compactVm = buildCedulaViewModel(makeData({ homePlayers: bigRoster }));
		expect(compactVm.density).toBe("compact");
		expect(compactVm.overflowsToSecondPage).toBe(false);

		const hugeRoster = Array.from({ length: 40 }, (_, i) =>
			makePlayer({ globalPlayerId: `x${i}`, credentialCode: i + 1 }),
		);
		const hugeVm = buildCedulaViewModel(makeData({ homePlayers: hugeRoster }));
		expect(hugeVm.density).toBe("tight");
		expect(hugeVm.overflowsToSecondPage).toBe(true);
	});

	it("propaga la marca de suspendido a la fila del jugador", () => {
		const vm = buildCedulaViewModel(
			makeData({
				homePlayers: [
					makePlayer({
						credentialCode: 31,
						blocked: { reason: "suspension", tag: "NO JUEGA", why: "1/2 jornadas" },
					}),
				],
			}),
		);
		expect(vm.home.rows[0]).toMatchObject({
			kind: "player",
			blocked: { reason: "suspension", tag: "NO JUEGA", why: "1/2 jornadas" },
		});
	});

	it("propaga la marca de sin-credencial-vigente a la fila del jugador", () => {
		const vm = buildCedulaViewModel(
			makeData({
				homePlayers: [
					makePlayer({
						credentialCode: 32,
						blocked: { reason: "credential", tag: "NO JUEGA", why: "Sin credencial vigente" },
					}),
				],
			}),
		);
		expect(vm.home.rows[0]).toMatchObject({
			kind: "player",
			blocked: { reason: "credential", tag: "NO JUEGA", why: "Sin credencial vigente" },
		});
	});

	it("arma los chips del encabezado con categoría y temporada, sin vacíos", () => {
		const vm = buildCedulaViewModel(
			makeData({ league: { name: "L", code: null, season: "Apertura 2026", category: null } }),
		);
		expect(vm.chips).toEqual(["Temporada Apertura 2026"]);
	});
});
