/**
 * shared/lib/list-query — estándar de listado con filtros/orden/paginación.
 *
 * Contrato único para todos los módulos "data-heavy" (jugadores, equipos, …):
 * el front manda params planos en la URL, el backend los normaliza a `ListQuery`
 * y los traduce a Drizzle. Ver docs/LIST-QUERY-FILTERS.md.
 *
 * Nota: este barrel NO importa `@/db`. El registro concreto de cada recurso
 * (que sí referencia columnas de `@/db`) vive en `entities/[recurso]/filters.ts`
 * y es server-only — no re-exportarlo hacia el bundle cliente.
 */

export type {
	FilterOperator,
	FilterScalar,
	FilterValue,
	FilterCondition,
	SortDir,
	SortRule,
	ListQuery,
	FilterFieldDef,
	FilterMap,
} from "./types";
export { LIST_OPERATORS } from "./types";

export { defineFilterMap } from "./registry";

export {
	parseListQuery,
	DEFAULT_LIST_PAGE_SIZE,
	MAX_LIST_PAGE_SIZE,
	type FilterIssue,
	type ParsedListQuery,
	type ParseListQueryOptions,
} from "./parse";

export { buildWhere, buildOrderBy } from "./translate";
