/**
 * features/import-excel -- exportaciones publicas
 *
 * Solo re-exportar lo que los consumidores externos (routes, pages) necesitan.
 * Los tipos internos de cada modulo no se re-exportan aqui salvo que otra
 * capa los necesite explicitamente.
 */

export {
	parseBulkBuffer,
	ParseError,
	type ParserInput,
	type ParsedBulkImport,
	type BulkImportType,
	type GoleadoresRow,
	type StandingsRow,
	type MappedImportOptions,
	type ColumnMap,
} from "./parser";

export {
	resolveImportEntities,
	type ResolverInput,
	type ResolverOutput,
	type PlayerResolution,
	type PlayerCandidate,
	type CandidateTeam,
} from "./resolver";

export {
	detectAnomalies,
	type AnomalyInput,
	type AnomalyReport,
	type AnomalyFlag,
	type AnomalyLevel,
	type AnomalyRuleId,
	type HistoricalSnapshot,
} from "./anomaly-detector";

export { generatePreview, type PreviewInput, type PreviewResult } from "./preview";

// New layer-based pipeline (Historia 03)
export { generateImportPreview } from "./preview";

export { confirmImport, type ConfirmInput, type ConfirmResult } from "./confirm";

// New layer-based pipeline (Historia 03)
export {
	confirmImportDecisions,
	type ConfirmImportInput,
	type ConfirmImportResult,
} from "./confirm";

export {
	generateEventPreview,
	confirmEventImport,
	type EventPreviewInput,
	type EventPreviewResult,
	type EventConfirmInput,
	type EventConfirmResult,
	type ImportRow,
	type ResultRow,
	type PlayerMatch,
} from "./events";

export {
	getFieldsForType,
	GOLEADORES_FIELDS,
	STANDINGS_FIELDS,
	type ImportStep,
	type ImportTemplate,
	type BulkPreviewResult,
	type ImportResult,
	type FieldDefinition,
} from "./model";

export { normalizeCell, guessHeaderRow, autoMapColumns } from "./column-mapper";

// New layer-based pipeline types (Historia 03)
export {
	ImportDecisionSchema,
	type ParsedRow,
	type MatchOutcome,
	type ProfileCandidate,
	type GlobalCandidate,
	type ImportDecision,
	type ImportPreviewResult,
} from "./types";
