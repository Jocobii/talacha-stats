/**
 * features/discipline/lib/get-org-suspensions-view.ts
 *
 * Orquesta la vista de /admin/suspensiones para organizador: parsea la URL
 * contra el registro de filtros, llama a manage-suspensions (que a su vez
 * pasa por entities/suspension), arma chips/paginación/orden — espejo de
 * features/player-admin/lib/get-org-players-view.ts.
 */

import { parseListQuery } from "@/shared/lib/list-query";
import { orgSuspensionFilters } from "@/entities/suspension/filters";
import type { GlobalSuspensionListItemDto, SuspensionLeagueOption } from "@/entities/suspension";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import type { AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { FilterOption } from "@/shared/ui/filters";
import {
	listSuspensionsForScopePage,
	listLeaguesForScope,
	countSuspensionsForScopeTotal,
} from "../manage-suspensions";
import { buildSuspensionFilterChips, type SuspensionFilterChip } from "./chips";
import {
	SUSPENSIONS_BASE_PATH,
	DEFAULT_SUSPENSIONS_PAGE_SIZE,
	SUSPENSIONS_PAGE_SIZE_OPTIONS,
} from "../constants";

export type OrgSuspensionsView = {
	rows: GlobalSuspensionListItemDto[];
	total: number;
	unfilteredTotal: number;
	filtersActive: boolean;
	leagueOptions: FilterOption[];
	/** Ligas de la organización — selector de liga en "Registrar sanción". */
	leagues: SuspensionLeagueOption[];
	chips: SuspensionFilterChip[];
	countLabel: string;
	pagination: AdminTablePagination;
	sort: AdminTableSortConfig;
};

export async function getOrgSuspensionsView(
	organizationId: string,
	params: Record<string, string>,
): Promise<OrgSuspensionsView> {
	const searchParams = toSearchParams(params);
	const { query } = parseListQuery(searchParams, orgSuspensionFilters, {
		defaultSort: [{ field: "creadoEn", dir: "desc" }],
		pageSize: DEFAULT_SUSPENSIONS_PAGE_SIZE,
		maxPageSize: 100,
	});

	const scope = { kind: "org" as const, organizationId };
	const [{ rows, total }, orgLeagues, unfilteredTotal] = await Promise.all([
		listSuspensionsForScopePage(scope, query),
		listLeaguesForScope(scope),
		countSuspensionsForScopeTotal(scope),
	]);

	const leagueOptions: FilterOption[] = orgLeagues.map((l) => ({ value: l.id, label: l.name }));
	const leagueNameById = new Map(orgLeagues.map((l) => [l.id, l.name]));
	const filtersActive = query.filters.length > 0;

	const chips = buildSuspensionFilterChips({
		basePath: SUSPENSIONS_BASE_PATH,
		filters: query.filters,
		searchParams,
		leagueNameById,
	});

	return {
		rows,
		total,
		unfilteredTotal,
		filtersActive,
		leagueOptions,
		leagues: orgLeagues,
		chips,
		countLabel: buildCountLabel(total, unfilteredTotal, filtersActive),
		pagination: buildPagination(query.page, total, SUSPENSIONS_BASE_PATH, {
			pageSize: query.pageSize,
			pageSizeOptions: [...SUSPENSIONS_PAGE_SIZE_OPTIONS],
			extraParams: paramsWithout(searchParams, ["page", "pageSize"]),
		}),
		sort: {
			baseHref: SUSPENSIONS_BASE_PATH,
			params: paramsWithout(searchParams, ["page", "sort"]),
			active: query.sort[0] ?? null,
		},
	};
}

function toSearchParams(params: Record<string, string>): URLSearchParams {
	return new URLSearchParams(
		Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string"),
	);
}

function paramsWithout(searchParams: URLSearchParams, exclude: string[]): Record<string, string> {
	return Object.fromEntries([...searchParams.entries()].filter(([k]) => !exclude.includes(k)));
}

function buildCountLabel(total: number, unfilteredTotal: number, filtersActive: boolean): string {
	if (filtersActive) return `${total} de ${unfilteredTotal} suspensiones en tu organización`;
	return `${total} suspensi${total !== 1 ? "ones" : "ón"} en tu organización`;
}
