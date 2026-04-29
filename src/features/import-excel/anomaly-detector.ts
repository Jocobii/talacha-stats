/**
 * features/import-excel/anomaly-detector.ts
 *
 * Responsabilidad única: recibir stats importadas + contexto histórico
 * y devolver un reporte de anomalías por jugador.
 *
 * IMPORTANTE: este módulo es una función pura — sin acceso a DB, sin efectos
 * secundarios, sin imports de @/db. El contexto histórico lo carga preview.ts
 * y lo pasa como parámetro.
 *
 * Las 5 reglas implementadas:
 *
 *   1. Monotonicidad   — goles acumulados nunca pueden bajar entre jornadas
 *   2. Delta spike     — goles en una jornada fuera de rango para fútbol amateur
 *   3. Z-score         — delta actual vs historial personal del jugador (≥3 jornadas)
 *   4. Cross-validation— suma individual de goles no puede superar total del equipo
 *   5. Goals/partido   — ratio goles/partidos_jugados fuera de rango razonable
 *
 * Exportaciones públicas:
 *   detectAnomalies(input) → AnomalyReport[]
 */

import type { GoleadoresRow } from "./parser";

// ---------------------------------------------------------------------------
// Umbrales de las reglas (configurables aquí — no hardcoded en la lógica)
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  // Regla 2 — Delta spike
  deltaSpikeWarning: 4,
  deltaSpikeCritical: 6,

  // Regla 3 — Z-score (requiere ≥ MIN_HISTORY_FOR_ZSCORE jornadas)
  zscoreWarning: 2.5,
  zscoreCritical: 4.0,
  minHistoryForZscore: 3,

  // Regla 4 — Cross-validation vs standings
  crossValWarningFactor: 1.1,   // sum_individual > team_total * 1.1
  crossValCriticalFactor: 1.3,  // sum_individual > team_total * 1.3

  // Regla 5 — Ratio goles/partido
  goalsPerGameWarning: 3.0,
  goalsPerGameCritical: 5.0,
} as const;

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type AnomalyLevel = "ok" | "warning" | "critical";

export type AnomalyRuleId =
  | "monotonicity"
  | "delta_spike"
  | "zscore"
  | "cross_validation"
  | "goals_per_game";

export type AnomalyFlag = {
  rule: AnomalyRuleId;
  level: AnomalyLevel;
  /** Mensaje legible para el admin en la UI */
  message: string;
  context: {
    current: number;
    previous?: number;
    average?: number;
    zscore?: number;
    threshold?: number;
  };
};

export type AnomalyReport = {
  rawName: string;
  /** Nivel más alto encontrado entre todos los flags */
  level: AnomalyLevel;
  flags: AnomalyFlag[];
};

/**
 * Snapshot histórico mínimo que necesita el detector.
 * Compatible con PlayerSeasonStatsSnapshot de la DB, pero sin depender del tipo Drizzle.
 * preview.ts carga estos datos y los pasa aquí.
 */
export type HistoricalSnapshot = {
  jornada: number;
  goals: number;         // goles ACUMULADOS hasta esta jornada
  matchesPlayed: number;
};

export type AnomalyInput = {
  rows: GoleadoresRow[];
  /** Jornada que se está importando */
  jornada: number;
  /**
   * Historial de snapshots por playerId, ordenados ascendente por jornada.
   * Si un jugador no tiene historial, su entrada puede estar ausente del Map.
   */
  history: Map<string, HistoricalSnapshot[]>;
  /**
   * rawName → playerId. Necesario para buscar el historial de cada jugador.
   * Solo están presentes los jugadores ya resueltos (found=true).
   */
  playerIdMap: Map<string, string>;
  /**
   * teamName (sanitizado) → goles_a_favor del equipo en standings.
   * Usado para cross-validation. Si un equipo no tiene standings importados,
   * la regla se omite silenciosamente.
   */
  teamGoalTotals: Map<string, number>;
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Analiza las filas de una importación y devuelve un AnomalyReport por jugador.
 * Función síncrona y pura — no hace I/O.
 */
export function detectAnomalies(input: AnomalyInput): AnomalyReport[] {
  const { rows, jornada, history, playerIdMap, teamGoalTotals } = input;

  // Pre-calcular suma de goles individuales por equipo (para cross-validation)
  const teamGoalSums = computeTeamGoalSums(rows);

  return rows.map((row) => {
    const flags: AnomalyFlag[] = [];
    const playerId = playerIdMap.get(row.rawName);
    const snapshots = playerId ? (history.get(playerId) ?? []) : [];

    // Snapshot de la jornada anterior (la más reciente antes de la actual)
    const prevSnapshot = getPreviousSnapshot(snapshots, jornada);

    // ── Regla 1: Monotonicidad ──────────────────────────────────────────────
    const monFlag = checkMonotonicity(row, prevSnapshot);
    if (monFlag) flags.push(monFlag);

    // ── Regla 2: Delta spike ────────────────────────────────────────────────
    const delta = computeDelta(row.goals, prevSnapshot?.goals ?? 0);
    const spikeFlag = checkDeltaSpike(row, delta, prevSnapshot);
    if (spikeFlag) flags.push(spikeFlag);

    // ── Regla 3: Z-score personal ───────────────────────────────────────────
    const zFlag = checkZscore(row, delta, snapshots, jornada);
    if (zFlag) flags.push(zFlag);

    // ── Regla 4: Cross-validation vs standings ──────────────────────────────
    const crossFlag = checkCrossValidation(row, teamGoalSums, teamGoalTotals);
    if (crossFlag) flags.push(crossFlag);

    // ── Regla 5: Ratio goles/partido ────────────────────────────────────────
    const ratioFlag = checkGoalsPerGame(row);
    if (ratioFlag) flags.push(ratioFlag);

    const level = aggregateLevel(flags);
    return { rawName: row.rawName, level, flags };
  });
}

// ---------------------------------------------------------------------------
// Regla 1 — Monotonicidad
// ---------------------------------------------------------------------------

function checkMonotonicity(
  row: GoleadoresRow,
  prev: HistoricalSnapshot | undefined,
): AnomalyFlag | null {
  if (!prev) return null;
  if (row.goals >= prev.goals) return null;

  return {
    rule: "monotonicity",
    level: "critical",
    message: `Los goles bajaron de ${prev.goals} a ${row.goals} — imposible en acumulados.`,
    context: { current: row.goals, previous: prev.goals },
  };
}

// ---------------------------------------------------------------------------
// Regla 2 — Delta spike
// ---------------------------------------------------------------------------

function checkDeltaSpike(
  row: GoleadoresRow,
  delta: number,
  prev: HistoricalSnapshot | undefined,
): AnomalyFlag | null {
  // Sin historial previo: no podemos calcular delta, usar goals directamente
  // solo si es la primera jornada del jugador
  const effectiveDelta = prev !== undefined ? delta : row.goals;

  if (effectiveDelta < THRESHOLDS.deltaSpikeWarning) return null;

  const level: AnomalyLevel =
    effectiveDelta >= THRESHOLDS.deltaSpikeCritical ? "critical" : "warning";

  return {
    rule: "delta_spike",
    level,
    message: `${effectiveDelta} goles en una jornada es inusual para fútbol amateur.`,
    context: {
      current: effectiveDelta,
      threshold: level === "critical"
        ? THRESHOLDS.deltaSpikeCritical
        : THRESHOLDS.deltaSpikeWarning,
    },
  };
}

// ---------------------------------------------------------------------------
// Regla 3 — Z-score personal
// ---------------------------------------------------------------------------

function checkZscore(
  row: GoleadoresRow,
  currentDelta: number,
  snapshots: HistoricalSnapshot[],
  currentJornada: number,
): AnomalyFlag | null {
  // Calcular deltas históricos (diferencia entre jornadas consecutivas)
  const historicalDeltas = computeHistoricalDeltas(snapshots, currentJornada);

  if (historicalDeltas.length < THRESHOLDS.minHistoryForZscore) return null;

  const mean = average(historicalDeltas);
  const stddev = standardDeviation(historicalDeltas, mean);

  // Si no hay variación en el historial (stddev = 0), no aplica Z-score
  if (stddev === 0) return null;

  const z = (currentDelta - mean) / stddev;

  if (z < THRESHOLDS.zscoreWarning) return null;

  const level: AnomalyLevel = z >= THRESHOLDS.zscoreCritical ? "critical" : "warning";

  return {
    rule: "zscore",
    level,
    message: `Goles en esta jornada (${currentDelta}) son ${z.toFixed(1)} desviaciones estándar sobre su promedio histórico (${mean.toFixed(1)}).`,
    context: {
      current: currentDelta,
      average: parseFloat(mean.toFixed(2)),
      zscore: parseFloat(z.toFixed(2)),
      threshold: level === "critical"
        ? THRESHOLDS.zscoreCritical
        : THRESHOLDS.zscoreWarning,
    },
  };
}

// ---------------------------------------------------------------------------
// Regla 4 — Cross-validation vs standings
// ---------------------------------------------------------------------------

function checkCrossValidation(
  row: GoleadoresRow,
  teamGoalSums: Map<string, number>,
  teamGoalTotals: Map<string, number>,
): AnomalyFlag | null {
  if (!row.teamName) return null;

  const teamTotal = teamGoalTotals.get(row.teamName);
  if (teamTotal === undefined || teamTotal === 0) return null;

  const individualSum = teamGoalSums.get(row.teamName) ?? 0;
  const ratio = individualSum / teamTotal;

  if (ratio <= THRESHOLDS.crossValWarningFactor) return null;

  const level: AnomalyLevel =
    ratio > THRESHOLDS.crossValCriticalFactor ? "critical" : "warning";

  return {
    rule: "cross_validation",
    level,
    message: `La suma de goles individuales del equipo "${row.teamName}" (${individualSum}) supera sus goles totales en standings (${teamTotal}).`,
    context: {
      current: individualSum,
      threshold: teamTotal,
    },
  };
}

// ---------------------------------------------------------------------------
// Regla 5 — Ratio goles/partido
// ---------------------------------------------------------------------------

function checkGoalsPerGame(row: GoleadoresRow): AnomalyFlag | null {
  if (!row.matchesPlayed || row.matchesPlayed === 0) return null;

  const ratio = row.goals / row.matchesPlayed;

  if (ratio <= THRESHOLDS.goalsPerGameWarning) return null;

  const level: AnomalyLevel =
    ratio > THRESHOLDS.goalsPerGameCritical ? "critical" : "warning";

  return {
    rule: "goals_per_game",
    level,
    message: `Ratio de ${ratio.toFixed(2)} goles/partido es muy alto para fútbol amateur.`,
    context: {
      current: parseFloat(ratio.toFixed(2)),
      threshold: level === "critical"
        ? THRESHOLDS.goalsPerGameCritical
        : THRESHOLDS.goalsPerGameWarning,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers de cálculo
// ---------------------------------------------------------------------------

/** Delta de goles entre la jornada actual y la anterior. */
function computeDelta(currentGoals: number, prevGoals: number): number {
  return currentGoals - prevGoals;
}

/**
 * Obtiene el snapshot de la jornada inmediatamente anterior a `currentJornada`.
 * Si hay múltiples snapshots previos, devuelve el más reciente.
 */
function getPreviousSnapshot(
  snapshots: HistoricalSnapshot[],
  currentJornada: number,
): HistoricalSnapshot | undefined {
  const prev = snapshots
    .filter((s) => s.jornada < currentJornada)
    .sort((a, b) => b.jornada - a.jornada);
  return prev[0];
}

/**
 * Calcula los deltas entre jornadas consecutivas del historial.
 * Excluye la jornada actual para no contaminar el cálculo histórico.
 */
function computeHistoricalDeltas(
  snapshots: HistoricalSnapshot[],
  currentJornada: number,
): number[] {
  const historical = snapshots
    .filter((s) => s.jornada < currentJornada)
    .sort((a, b) => a.jornada - b.jornada);

  const deltas: number[] = [];
  for (let i = 1; i < historical.length; i++) {
    const delta = historical[i].goals - historical[i - 1].goals;
    if (delta >= 0) deltas.push(delta); // ignorar deltas negativos (correcciones)
  }
  return deltas;
}

/** Suma de goles individuales agrupada por teamName. */
function computeTeamGoalSums(rows: GoleadoresRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.teamName) continue;
    map.set(row.teamName, (map.get(row.teamName) ?? 0) + row.goals);
  }
  return map;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/** Devuelve el nivel más alto encontrado en una lista de flags. */
function aggregateLevel(flags: AnomalyFlag[]): AnomalyLevel {
  if (flags.some((f) => f.level === "critical")) return "critical";
  if (flags.some((f) => f.level === "warning")) return "warning";
  return "ok";
}
