/**
 * entities/narrator — punto de import público de la entidad.
 * El contrato (tipos + schemas Zod) y las queries de métricas.
 */

export * from "./model";
export {
	recordNarratorAnalysis,
	getNarratorUsageStats,
	type RecordNarratorAnalysisInput,
} from "./queries";
