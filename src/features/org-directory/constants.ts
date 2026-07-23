/**
 * features/org-directory/constants.ts
 * Magic strings, URL builder y tamaños de página del Hub de Portales (§3.5).
 */
import type { OrgDirectorySort } from "@/entities/organization";

export const ORG_DIRECTORY_PAGE_SIZE = 20;
export const ORG_DIRECTORY_SEARCH_DEBOUNCE_MS = 300;
export const ORG_DIRECTORY_DEFAULT_SORT: OrgDirectorySort = "name_asc";

export const ORG_DIRECTORY_SORT_OPTIONS: readonly OrgDirectorySort[] = [
	"name_asc",
	"name_desc",
	"leagues_desc",
	"players_desc",
];

type OrgDirectoryUrlFilters = { city?: string; q?: string; sort: OrgDirectorySort };

/**
 * Directorio público de organizaciones: GET con ciudad + búsqueda + orden.
 * "Cargar más" sube `limit` (siempre `page=1`) en vez de pedir `page=2`,3…
 * — ver comentario en useOrgDirectoryQuery.
 */
export const ORG_DIRECTORY_URL = (filters: OrgDirectoryUrlFilters, limit: number): string => {
	const params = new URLSearchParams({ sort: filters.sort, page: "1", limit: String(limit) });
	if (filters.city) params.set("city", filters.city);
	if (filters.q?.trim()) params.set("q", filters.q.trim());
	return `/api/organizations/public?${params.toString()}`;
};

export type OrgDirectoryViewMode = "grid" | "list";
export const ORG_DIRECTORY_DEFAULT_VIEW: OrgDirectoryViewMode = "grid";

/**
 * Paleta de colores del avatar de organización (diseño del Hub de
 * Portales): asignada determinísticamente por `id` en el mapper (§19), no
 * aleatoria — el mismo id siempre pinta el mismo color entre renders/sesiones.
 */
export const ORG_DIRECTORY_AVATAR_PALETTE: readonly {
	bg: string;
	text: string;
	border: string;
}[] = [
	{ bg: "bg-brand/10", text: "text-brand-ink", border: "border-brand/20" },
	{ bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
	{ bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
	{ bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
	{ bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
	{ bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
];
