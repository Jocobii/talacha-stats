/**
 * __tests__/anomaly-detector.test.ts
 *
 * Tests unitarios de features/import-excel/anomaly-detector.ts
 *
 * Estrategia: función pura → tests rápidos con datos mock, sin DB, sin fixtures.
 * Cada test verifica UNA regla específica en aislamiento.
 */

import { describe, it, expect } from "vitest";
import { detectAnomalies } from "../anomaly-detector";
import type { AnomalyInput, HistoricalSnapshot } from "../anomaly-detector";
import type { GoleadoresRow } from "../parser";

// ---------------------------------------------------------------------------
// Helpers para construir inputs de test
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<GoleadoresRow> = {}): GoleadoresRow {
	return {
		rawName: "juan garcia",
		teamName: "deportivo fc",
		goals: 5,
		matchesPlayed: 6,
		...overrides,
	};
}

function makeInput(
	rows: GoleadoresRow[],
	overrides: Partial<Omit<AnomalyInput, "rows">> = {},
): AnomalyInput {
	return {
		rows,
		jornada: 10,
		history: new Map(),
		playerIdMap: new Map(),
		teamGoalTotals: new Map(),
		...overrides,
	};
}

function makeSnapshots(goals: number[]): HistoricalSnapshot[] {
	return goals.map((g, i) => ({
		jornada: i + 1,
		goals: g,
		matchesPlayed: i + 1,
	}));
}

// ---------------------------------------------------------------------------
// Regla 1 — Monotonicidad
// ---------------------------------------------------------------------------

describe("Regla 1 — Monotonicidad", () => {
	it("critical cuando goles bajan entre jornadas", () => {
		const row = makeRow({ goals: 3 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 5, matchesPlayed: 9 }];

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.level).toBe("critical");
		expect(report.flags.some((f) => f.rule === "monotonicity")).toBe(true);
	});

	it("ok cuando goles suben entre jornadas", () => {
		const row = makeRow({ goals: 7 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 5, matchesPlayed: 9 }];

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "monotonicity")).toBe(false);
	});

	it("ok cuando goles no cambian (igual valor)", () => {
		const row = makeRow({ goals: 5 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 5, matchesPlayed: 9 }];

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "monotonicity")).toBe(false);
	});

	it("ok cuando no hay historial previo", () => {
		const row = makeRow({ goals: 2 });
		const input = makeInput([row]); // sin history ni playerIdMap

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "monotonicity")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Regla 2 — Delta spike
// ---------------------------------------------------------------------------

describe("Regla 2 — Delta spike", () => {
	it("critical cuando delta ≥ 6 goles en una jornada", () => {
		const row = makeRow({ goals: 14 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 8, matchesPlayed: 9 }];
		// delta = 14 - 8 = 6

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "delta_spike");
		expect(flag?.level).toBe("critical");
	});

	it("warning cuando delta está entre 4 y 5 goles", () => {
		const row = makeRow({ goals: 13 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 9, matchesPlayed: 9 }];
		// delta = 13 - 9 = 4

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "delta_spike");
		expect(flag?.level).toBe("warning");
	});

	it("ok cuando delta es ≤ 3 goles", () => {
		const row = makeRow({ goals: 11 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 9, matchesPlayed: 9 }];
		// delta = 2

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "delta_spike")).toBe(false);
	});

	it("usa goals directamente cuando es primera jornada del jugador (sin historial)", () => {
		const row = makeRow({ goals: 7 }); // 7 goles sin historial previo

		const input = makeInput([row]); // sin history

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "delta_spike");
		expect(flag?.level).toBe("critical");
	});
});

// ---------------------------------------------------------------------------
// Regla 3 — Z-score personal
// ---------------------------------------------------------------------------

describe("Regla 3 — Z-score", () => {
	it("critical cuando Z-score ≥ 4.0", () => {
		// Historial: alternando 2 y 0 goles por jornada → media=1, stddev=1
		// Delta actual: 10 goles → Z = (10-1)/1 = 9 → critical
		const row = makeRow({ goals: 18 });
		const snapshotGoals = [0, 2, 2, 4, 4, 6, 6, 8, 8]; // deltas = [2,0,2,0,2,0,2,0]
		const history = makeSnapshots(snapshotGoals);
		// prevSnapshot = {jornada:9, goals:8} → delta = 18-8 = 10, Z = (10-1)/1 = 9 → critical

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "zscore");
		expect(flag?.level).toBe("critical");
	});

	it("no genera flag cuando historial < 3 jornadas", () => {
		const row = makeRow({ goals: 10 });
		// Solo 2 snapshots → no hay suficiente historial para Z-score
		const history: HistoricalSnapshot[] = [
			{ jornada: 8, goals: 3, matchesPlayed: 8 },
			{ jornada: 9, goals: 4, matchesPlayed: 9 },
		];

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "zscore")).toBe(false);
	});

	it("no genera flag cuando jugador no tiene historial resuelto (sin playerIdMap)", () => {
		const row = makeRow({ goals: 20 });
		const history = makeSnapshots([1, 2, 3, 4, 5]);

		// playerIdMap vacío — el jugador no fue resuelto contra la DB
		const input = makeInput([row], {
			jornada: 6,
			history: new Map([["p1", history]]),
			playerIdMap: new Map(), // no se puede linkear rawName → playerId
		});

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "zscore")).toBe(false);
	});

	it("no genera flag cuando stddev = 0 (jugador muy consistente)", () => {
		// Siempre exactamente 2 goles por jornada — stddev 0, Z-score indefinido
		const row = makeRow({ goals: 20 });
		const history = makeSnapshots([2, 4, 6, 8, 10, 12, 14, 16, 18]);
		// delta actual = 20 - 18 = 2, idéntico al histórico → no hay anomalía

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "zscore")).toBe(false);
	});

	it("el contexto del flag incluye zscore y average calculados", () => {
		const row = makeRow({ goals: 25 });
		const snapshotGoals = [0, 2, 2, 4, 4, 6, 6, 8, 8]; // deltas = [2,0,2,0,2,0,2,0]
		const history = makeSnapshots(snapshotGoals);
		// prevSnapshot = {jornada:9, goals:8} → delta = 25-8 = 17, media=1, stddev=1 → Z=16 → critical

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "zscore");
		expect(flag?.context.zscore).toBeDefined();
		expect(flag?.context.average).toBeDefined();
		expect(typeof flag?.context.zscore).toBe("number");
	});
});

// ---------------------------------------------------------------------------
// Regla 4 — Cross-validation vs standings
// ---------------------------------------------------------------------------

describe("Regla 4 — Cross-validation vs standings", () => {
	it("critical cuando suma individual > total equipo × 1.3", () => {
		// Equipo tiene 10 goles en standings, pero jugador solo tiene 14 → 140%
		const row = makeRow({ teamName: "deportivo fc", goals: 14 });
		const input = makeInput([row], {
			teamGoalTotals: new Map([["deportivo fc", 10]]),
		});

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "cross_validation");
		expect(flag?.level).toBe("critical");
	});

	it("warning cuando suma individual está entre 1.1× y 1.3× del total", () => {
		// 12 / 10 = 1.2 → warning
		const row = makeRow({ teamName: "deportivo fc", goals: 12 });
		const input = makeInput([row], {
			teamGoalTotals: new Map([["deportivo fc", 10]]),
		});

		const [report] = detectAnomalies(input);
		const flag = report.flags.find((f) => f.rule === "cross_validation");
		expect(flag?.level).toBe("warning");
	});

	it("ok cuando suma individual ≤ total del equipo", () => {
		const rows = [
			makeRow({ rawName: "juan garcia", teamName: "deportivo fc", goals: 5 }),
			makeRow({ rawName: "pedro lopez", teamName: "deportivo fc", goals: 3 }),
		];
		// suma = 8, total = 10 → ok
		const input = makeInput(rows, {
			teamGoalTotals: new Map([["deportivo fc", 10]]),
		});

		const reports = detectAnomalies(input);
		expect(reports.every((r) => !r.flags.some((f) => f.rule === "cross_validation"))).toBe(true);
	});

	it("ok cuando el equipo no tiene standings importados", () => {
		const row = makeRow({ teamName: "equipo sin standings", goals: 99 });
		// teamGoalTotals vacío — la regla se omite silenciosamente
		const input = makeInput([row], { teamGoalTotals: new Map() });

		const [report] = detectAnomalies(input);
		expect(report.flags.some((f) => f.rule === "cross_validation")).toBe(false);
	});

	it("agrupa correctamente múltiples jugadores del mismo equipo", () => {
		const rows = [
			makeRow({ rawName: "juan garcia", teamName: "deportivo fc", goals: 8 }),
			makeRow({ rawName: "pedro lopez", teamName: "deportivo fc", goals: 7 }),
		];
		// suma = 15, total = 10 → 1.5× → critical
		const input = makeInput(rows, {
			teamGoalTotals: new Map([["deportivo fc", 10]]),
		});

		const reports = detectAnomalies(input);
		// Ambos players del mismo equipo deberían recibir el flag
		expect(
			reports.some((r) =>
				r.flags.some((f) => f.rule === "cross_validation" && f.level === "critical"),
			),
		).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Regla 5 — Ratio goles/partido
// ---------------------------------------------------------------------------

describe("Regla 5 — Goals per game", () => {
	it("critical cuando ratio > 5.0 goles/partido", () => {
		const row = makeRow({ goals: 18, matchesPlayed: 3 }); // ratio = 6.0

		const [report] = detectAnomalies(makeInput([row]));
		const flag = report.flags.find((f) => f.rule === "goals_per_game");
		expect(flag?.level).toBe("critical");
	});

	it("warning cuando ratio está entre 3.0 y 5.0", () => {
		const row = makeRow({ goals: 12, matchesPlayed: 3 }); // ratio = 4.0

		const [report] = detectAnomalies(makeInput([row]));
		const flag = report.flags.find((f) => f.rule === "goals_per_game");
		expect(flag?.level).toBe("warning");
	});

	it("ok cuando ratio ≤ 3.0", () => {
		const row = makeRow({ goals: 9, matchesPlayed: 6 }); // ratio = 1.5

		const [report] = detectAnomalies(makeInput([row]));
		expect(report.flags.some((f) => f.rule === "goals_per_game")).toBe(false);
	});

	it("omite la regla cuando matchesPlayed es 0 o undefined", () => {
		const rowZero = makeRow({ goals: 99, matchesPlayed: 0 });
		const rowUndefined = makeRow({ goals: 99, matchesPlayed: undefined });

		for (const row of [rowZero, rowUndefined]) {
			const [report] = detectAnomalies(makeInput([row]));
			expect(report.flags.some((f) => f.rule === "goals_per_game")).toBe(false);
		}
	});
});

// ---------------------------------------------------------------------------
// aggregateLevel — nivel del reporte
// ---------------------------------------------------------------------------

describe("AnomalyReport — nivel agregado", () => {
	it("level es 'ok' cuando no hay flags", () => {
		const row = makeRow({ goals: 2, matchesPlayed: 5 });
		const [report] = detectAnomalies(makeInput([row]));
		expect(report.level).toBe("ok");
		expect(report.flags).toHaveLength(0);
	});

	it("level es 'critical' si al menos un flag es critical", () => {
		// goals bajaron (critical) + ratio ok
		const row = makeRow({ goals: 3, matchesPlayed: 10 });
		const history: HistoricalSnapshot[] = [{ jornada: 9, goals: 5, matchesPlayed: 9 }];

		const input = makeInput([row], {
			jornada: 10,
			history: new Map([["p1", history]]),
			playerIdMap: new Map([["juan garcia", "p1"]]),
		});

		const [report] = detectAnomalies(input);
		expect(report.level).toBe("critical");
	});

	it("función pura: misma entrada produce siempre misma salida", () => {
		const row = makeRow({ goals: 7, matchesPlayed: 1 });
		const input = makeInput([row]);

		const result1 = detectAnomalies(input);
		const result2 = detectAnomalies(input);
		const result3 = detectAnomalies(input);

		expect(result1).toEqual(result2);
		expect(result2).toEqual(result3);
	});
});
