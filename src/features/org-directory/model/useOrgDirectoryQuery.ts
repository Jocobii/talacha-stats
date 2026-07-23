"use client";

/**
 * features/org-directory/model/useOrgDirectoryQuery.ts
 *
 * Query gateada del Hub de Portales (§7.3b). "Cargar más" vuelve a pedir el
 * mismo listado con un `limit` mayor (offset 0) en vez de acumular páginas
 * en estado local: el directorio es chico (decenas/un par de cientos de
 * organizaciones verificadas), así que repetir el fetch completo con más
 * `limit` es más simple que mergear páginas y sigue siendo barato.
 *
 * Usa `apiFetchPaginated` (no `apiFetch`) porque la UI necesita `meta.total`
 * y `meta.hasNext` para el contador "X de Y organizaciones" y el botón
 * "cargar más" del diseño.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetchPaginated } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { OrgDirectoryItem } from "@/entities/organization";
import type { PaginationMeta } from "@/shared/lib/pagination";
import { mapOrgDirectoryItemToView } from "../lib/map-org-directory-view";
import { ORG_DIRECTORY_URL } from "../constants";
import type { OrgDirectoryCardView, OrgDirectoryFiltersValue } from "../types";

export type OrgDirectoryQueryResult = {
	items: OrgDirectoryCardView[];
	meta: PaginationMeta;
};

export function useOrgDirectoryQuery(filters: OrgDirectoryFiltersValue, visibleCount: number) {
	return useQuery({
		queryKey: queryKeys.organizations.directory(filters, visibleCount),
		queryFn: async (): Promise<OrgDirectoryQueryResult> => {
			const res = await apiFetchPaginated<OrgDirectoryItem>(
				ORG_DIRECTORY_URL(filters, visibleCount),
			);
			if (!res.ok) throw new Error(res.error);
			return { items: res.data.map(mapOrgDirectoryItemToView), meta: res.meta };
		},
	});
}
