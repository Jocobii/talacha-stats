/**
 * features/team-admin/lib/get-owner-teams-view.ts
 *
 * Orquesta la vista de "todos los equipos" (owner, sin scope de
 * organización, sin FilterBar). Sin acceso a DB — delega en entities/team.
 * Espejo de features/player-admin/lib/get-owner-players-view.ts.
 */

import { listAllTeams, type GlobalTeamRow } from "@/entities/team";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import { TEAMS_BASE_PATH, DEFAULT_TEAMS_PAGE_SIZE, TEAMS_PAGE_SIZE_OPTIONS } from "../constants";

export type OwnerTeamsView = {
	rows: GlobalTeamRow[];
	total: number;
	search: string;
	pagination: AdminTablePagination;
	countLabel: string;
};

export async function getOwnerTeamsView(params: Record<string, string>): Promise<OwnerTeamsView> {
	const page = Math.max(1, Number(params.page ?? 1) || 1);
	const pageSize = parsePageSize(params.pageSize);
	const search = params.q?.trim() ?? "";

	const { rows, total } = await listAllTeams({
		page,
		pageSize,
		search: search || undefined,
	});

	return {
		rows,
		total,
		search,
		pagination: buildPagination(page, total, TEAMS_BASE_PATH, {
			pageSize,
			pageSizeOptions: [...TEAMS_PAGE_SIZE_OPTIONS],
			extraParams: search ? { q: search } : {},
		}),
		countLabel: `${total} equipo${total !== 1 ? "s" : ""}`,
	};
}

/** Acepta solo valores del set permitido — cualquier otra cosa cae al default. */
function parsePageSize(raw: string | undefined): number {
	const n = Number(raw);
	return (TEAMS_PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_TEAMS_PAGE_SIZE;
}
