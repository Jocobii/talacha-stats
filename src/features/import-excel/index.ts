/**
 * features/import-excel — exportaciones públicas
 *
 * Solo re-exportar lo que los consumidores externos (routes, pages) necesitan.
 * Los tipos internos de cada módulo no se re-exportan aquí salvo que otra
 * capa los necesite explícitamente.
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
