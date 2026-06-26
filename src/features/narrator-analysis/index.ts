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

// Export de assets (ya existentes)
export { buildNarratorPdf } from "./export-pdf";
export { buildNarratorPngElement } from "./export-png";
