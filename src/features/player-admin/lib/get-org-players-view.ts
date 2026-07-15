/**
 * features/player-admin/lib/get-org-players-view.ts
 *
 * Orquesta la vista de /admin/players para organizador: parsea la URL contra
 * el registro de filtros, llama a entities/player + entities/league, arma
 * chips/paginación/orden. Sin acceso a DB directo — todo pasa por entities/.
 */

import { parseListQuery } from "@/shared/lib/list-query";
import { orgPlayerFilters } from "@/entities/player/filters";
import { listOrgPlayers, countOrgPlayers, type OrgPlayerRow } from "@/entities/player";
import { listOrgLeagueOptions } from "@/entities/league/queries";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import type { AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { FilterOption } from "@/shared/ui/filters";
import { buildPlayerFilterChips, type PlayerFilterChip } from "./chips";
import {
	PLAYERS_BASE_PATH,
	DEFAULT_PLAYERS_PAGE_SIZE,
	PLAYERS_PAGE_SIZE_OPTIONS,
} from "../constants";

export type OrgPlayersView = {
	rows: OrgPlayerRow[];
	total: number;
	unfilteredTotal: number;
	filtersActive: boolean;
	leagueOptions: FilterOption[];
	chips: PlayerFilterChip[];
	countLabel: string;
	pagination: AdminTablePagination;
	sort: AdminTableSortConfig;
};

export async function getOrgPlayersView(
	organizationId: string,
	params: Record<string, string>,
): Promise<OrgPlayersView> {
	const searchParams = toSearchParams(params);
	const { query } = parseListQuery(searchParams, orgPlayerFilters, {
		defaultSort: [{ field: "nombre", dir: "asc" }],
		pageSize: DEFAULT_PLAYERS_PAGE_SIZE,
		maxPageSize: 100,
	});

	const [{ rows, total }, orgLeagues, unfilteredTotal] = await Promise.all([
		listOrgPlayers(organizationId, query),
		listOrgLeagueOptions(organizationId),
		countOrgPlayers(organizationId),
	]);

	const leagueOptions: FilterOption[] = orgLeagues.map((l) => ({ value: l.id, label: l.name }));
	const leagueNameById = new Map(orgLeagues.map((l) => [l.id, l.name]));
	const filtersActive = query.filters.length > 0;

	const chips = buildPlayerFilterChips({
		basePath: PLAYERS_BASE_PATH,
		filters: query.filters,
		searchParams,
		leagueNameById,
		equipoLabel: rows.find((r) => r.latestTeamName)?.latestTeamName ?? "Equipo",
	});

	return {
		rows,
		total,
		unfilteredTotal,
		filtersActive,
		leagueOptions,
		chips,
		countLabel: buildCountLabel(total, unfilteredTotal, filtersActive),
		pagination: buildPagination(query.page, total, PLAYERS_BASE_PATH, {
			pageSize: query.pageSize,
			pageSizeOptions: [...PLAYERS_PAGE_SIZE_OPTIONS],
			extraParams: paramsWithout(searchParams, ["page", "pageSize"]),
		}),
		sort: {
			baseHref: PLAYERS_BASE_PATH,
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
	if (filtersActive) return `${total} de ${unfilteredTotal} jugadores en tu organización`;
	return `${total} jugador${total !== 1 ? "es" : ""} en tu organización`;
}
