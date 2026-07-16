/**
 * features/team-admin/lib/get-org-teams-view.ts
 *
 * Orquesta la vista de /admin/teams para organizador: parsea la URL contra
 * el registro de filtros, llama a entities/team + entities/league, arma
 * chips/paginación/orden. Sin acceso a DB directo — todo pasa por entities/.
 * Espejo de features/player-admin/lib/get-org-players-view.ts.
 */

import { parseListQuery } from "@/shared/lib/list-query";
import { orgTeamFilters } from "@/entities/team/filters";
import { listOrgTeams, countOrgTeams, type OrgTeamRow } from "@/entities/team";
import { listOrgLeagueOptions } from "@/entities/league/queries";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import type { AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { FilterOption } from "@/shared/ui/filters";
import { buildTeamFilterChips, type TeamFilterChip } from "./chips";
import { TEAMS_BASE_PATH, DEFAULT_TEAMS_PAGE_SIZE, TEAMS_PAGE_SIZE_OPTIONS } from "../constants";

export type OrgTeamsView = {
	rows: OrgTeamRow[];
	total: number;
	unfilteredTotal: number;
	filtersActive: boolean;
	leagueOptions: FilterOption[];
	chips: TeamFilterChip[];
	countLabel: string;
	pagination: AdminTablePagination;
	sort: AdminTableSortConfig;
};

export async function getOrgTeamsView(
	organizationId: string,
	params: Record<string, string>,
): Promise<OrgTeamsView> {
	const searchParams = toSearchParams(params);
	const { query } = parseListQuery(searchParams, orgTeamFilters, {
		defaultSort: [{ field: "nombre", dir: "asc" }],
		pageSize: DEFAULT_TEAMS_PAGE_SIZE,
		maxPageSize: 100,
	});

	const [{ rows, total }, orgLeagues, unfilteredTotal] = await Promise.all([
		listOrgTeams(organizationId, query),
		listOrgLeagueOptions(organizationId),
		countOrgTeams(organizationId),
	]);

	const leagueOptions: FilterOption[] = orgLeagues.map((l) => ({ value: l.id, label: l.name }));
	const leagueNameById = new Map(orgLeagues.map((l) => [l.id, l.name]));
	const filtersActive = query.filters.length > 0;

	const chips = buildTeamFilterChips({
		basePath: TEAMS_BASE_PATH,
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
		chips,
		countLabel: buildCountLabel(total, unfilteredTotal, filtersActive),
		pagination: buildPagination(query.page, total, TEAMS_BASE_PATH, {
			pageSize: query.pageSize,
			pageSizeOptions: [...TEAMS_PAGE_SIZE_OPTIONS],
			extraParams: paramsWithout(searchParams, ["page", "pageSize"]),
		}),
		sort: {
			baseHref: TEAMS_BASE_PATH,
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
	if (filtersActive) return `${total} de ${unfilteredTotal} equipos en tu organización`;
	return `${total} equipo${total !== 1 ? "s" : ""} en tu organización`;
}
