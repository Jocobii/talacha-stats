/**
 * features/narrator-analysis — punto de import público de la feature (§3.6).
 *
 * Motor agnóstico + pipeline del flujo Excel público. El flujo BD legacy sigue
 * en `lib/narrator.ts` (pendiente de migrar aquí, §10) y ya consume el mismo
 * contrato de tipos desde `entities/narrator`.
 */

// Motor puro
export { computeNarratorAnalysis } from "./analysis";

// Pipeline Excel
export { parseExcel } from "./lib/parse-excel";
export { detectColumns } from "./lib/detect-columns";
export { normalizeStandings } from "./lib/normalize-standings";
export { buildInputFromExcel, type BuildInputFromExcelArgs } from "./lib/build-input-from-excel";

// Constantes públicas (límites del endpoint)
export { EXCEL_LIMITS, COLUMN_SYNONYMS } from "./constants";

// Export de assets — NO se re-exportan aquí a propósito: `export-pdf.ts` usa
// `pdfkit` (Node puro) y `export-png.tsx` usa `next/og`. Si el barrel los
// re-exporta, cualquier Client Component que importe desde aquí (como
// AnalysisView, más abajo) arrastraría esas deps server-only al bundle del
// navegador. El route de export ya los importa por ruta directa:
// `@/features/narrator-analysis/export-pdf` / `.../export-png`.

// ── Flujo BD (/analysis) — matchup pre-partido ──────────────────────────────
export { useNarratorMatchup, type NarratorMatchup } from "./model/useNarratorMatchup";
export { useNarratorAnalysisQuery } from "./model/useNarratorAnalysisQuery";
export { NarratorReport } from "./ui/NarratorReport";
export { MatchupForm } from "./ui/MatchupForm";
export { NarratorReportActions } from "./ui/NarratorReportActions";
export { MATCHUP_SELECT_CLASS } from "./constants";
export type { TeamOption, ConfirmedMatchup, MatchupErrorCode } from "./types";
