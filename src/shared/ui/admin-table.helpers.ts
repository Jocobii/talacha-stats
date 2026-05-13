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
};

// ── Constantes ────────────────────────────────────────────────────────────────

/** Tamaño de página por defecto para todas las tablas administrativas. */
export const DEFAULT_PAGE_SIZE = 25;

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
	},
): AdminTablePagination {
	return {
		page,
		pageSize: opts?.pageSize ?? DEFAULT_PAGE_SIZE,
		total,
		baseHref,
		...(opts?.pageParam ? { pageParam: opts.pageParam } : {}),
		...(opts?.extraParams ? { extraParams: opts.extraParams } : {}),
	};
}
