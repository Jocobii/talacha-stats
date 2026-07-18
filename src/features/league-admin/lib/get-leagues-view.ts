/**
 * features/league-admin/lib/get-leagues-view.ts
 *
 * Orquesta la vista de /admin/leagues: parsea la URL contra el registro de
 * filtros, resuelve el scope (ciudad para el owner, organización para el
 * organizador — igual que /api/leagues), llama a entities/league, arma
 * chips/paginación/orden. Sin acceso a DB directo — todo pasa por entities/.
 * Espejo de features/team-admin/lib/get-org-teams-view.ts.
 */

import { getActiveCity } from "@/shared/lib/active-city";
import { parseListQuery, type FilterCondition } from "@/shared/lib/list-query";
import { leagueFilters } from "@/entities/league/filters";
import { listLeaguesAdmin, countLeaguesAdmin, type LeagueAdminRow } from "@/entities/league";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import type { AdminTableSortConfig } from "@/shared/ui/AdminTable";
import { buildLeagueFilterChips, type LeagueFilterChip } from "./chips";
import {
	LEAGUES_BASE_PATH,
	DEFAULT_LEAGUES_PAGE_SIZE,
	LEAGUES_PAGE_SIZE_OPTIONS,
} from "../constants";

export type LeaguesViewModel = {
	rows: LeagueAdminRow[];
	total: number;
	unfilteredTotal: number;
	filtersActive: boolean;
	chips: LeagueFilterChip[];
	countLabel: string;
	pagination: AdminTablePagination;
	sort: AdminTableSortConfig;
};

export async function getLeaguesView(
	session: { role: "owner" | "organizer"; organizationId: string | null },
	params: Record<string, string>,
): Promise<LeaguesViewModel> {
	const city = await getActiveCity();
	// Mismo criterio de scope que GET /api/leagues: el owner ve las ligas de
	// la ciudad activa, el organizador solo las de su organización (fallback
	// a ciudad si no tiene una asignada).
	const scope =
		session.role === "owner"
			? { city }
			: session.organizationId
				? { organizationId: session.organizationId }
				: { city };

	const searchParams = toSearchParams(params);
	// Más nuevas primero. "creada" no está en el FilterMap (no es filtrable,
	// solo se usa como default de orden) — parseSort acepta un defaultSort
	// arbitrario sin validarlo contra la allowlist de campos `sortable`.
	const { query } = parseListQuery(searchParams, leagueFilters, {
		defaultSort: [{ field: "creada", dir: "desc" }],
		pageSize: DEFAULT_LEAGUES_PAGE_SIZE,
		maxPageSize: 100,
	});

	// Día a día solo importan las ligas activas — las terminadas quedan como
	// histórico y se acceden explícitamente con el filtro "estado" (chip
	// "Terminada"). Si el usuario no pidió un estado en la URL, se inyecta el
	// default "active" aquí (backend), no en el front — §17 AGENTS.md.
	const filtersActive = query.filters.length > 0;
	const queryForDb = hasEstadoFilter(query.filters)
		? query
		: { ...query, filters: [...query.filters, DEFAULT_ESTADO_FILTER] };

	const [{ rows, total }, unfilteredTotal] = await Promise.all([
		listLeaguesAdmin(scope, queryForDb),
		countLeaguesAdmin(scope),
	]);
	const chips = buildLeagueFilterChips({
		basePath: LEAGUES_BASE_PATH,
		filters: query.filters,
		searchParams,
	});

	return {
		rows,
		total,
		unfilteredTotal,
		filtersActive,
		chips,
		countLabel: buildCountLabel(total, unfilteredTotal, filtersActive),
		pagination: buildPagination(query.page, total, LEAGUES_BASE_PATH, {
			pageSize: query.pageSize,
			pageSizeOptions: [...LEAGUES_PAGE_SIZE_OPTIONS],
			extraParams: paramsWithout(searchParams, ["page", "pageSize"]),
		}),
		sort: {
			baseHref: LEAGUES_BASE_PATH,
			params: paramsWithout(searchParams, ["page", "sort"]),
			active: query.sort[0] ?? null,
		},
	};
}

const DEFAULT_ESTADO_FILTER: FilterCondition = { field: "estado", op: "eq", value: "active" };

function hasEstadoFilter(filters: FilterCondition[]): boolean {
	return filters.some((f) => f.field === "estado");
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
	if (filtersActive) return `${total} de ${unfilteredTotal} ligas`;
	return `${total} liga${total !== 1 ? "s" : ""}`;
}
