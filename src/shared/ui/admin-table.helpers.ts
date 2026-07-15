/**
 * shared/ui/admin-table.helpers.ts
 *
 * Tipos, constantes y helpers de AdminTable que pueden usarse tanto desde
 * Server Components como desde Client Components.
 *
 * NO incluir "use client" — este archivo debe poder importarse desde cualquier
 * contexto (server actions, server components, API routes, client components).
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type AdminTablePagination = {
	page: number;
	pageSize: number;
	total: number;
	baseHref: string;
	pageParam?: string;
	extraParams?: Record<string, string>;
	/** Si se pasa, AdminTable muestra un selector "Filas por página" con estas opciones. */
	pageSizeOptions?: number[];
	pageSizeParam?: string;
};

// ── Constantes ────────────────────────────────────────────────────────────────

/** Tamaño de página por defecto para todas las tablas administrativas. */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Tamaño de página y opciones de "Filas por página" para los listados del
 * molde "módulo data-heavy" (FilterBar + tabla con selector de page size) —
 * jugadores, equipos, … Antes vivían duplicados en cada features/[recurso]-
 * admin/constants.ts; centralizados aquí porque son el mismo contrato de
 * paginación, no un detalle específico del recurso.
 */
export const DEFAULT_LIST_PAGE_SIZE = 10;
export const LIST_PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Construye el objeto AdminTablePagination a partir de los parámetros comunes.
 * Usable desde Server Components y Client Components.
 */
export function buildPagination(
	page: number,
	total: number,
	baseHref: string,
	opts?: {
		pageSize?: number;
		extraParams?: Record<string, string>;
		pageParam?: string;
		pageSizeOptions?: number[];
		pageSizeParam?: string;
	},
): AdminTablePagination {
	return {
		page,
		pageSize: opts?.pageSize ?? DEFAULT_PAGE_SIZE,
		total,
		baseHref,
		...(opts?.pageParam ? { pageParam: opts.pageParam } : {}),
		...(opts?.extraParams ? { extraParams: opts.extraParams } : {}),
		...(opts?.pageSizeOptions ? { pageSizeOptions: opts.pageSizeOptions } : {}),
		...(opts?.pageSizeParam ? { pageSizeParam: opts.pageSizeParam } : {}),
	};
}
