/**
 * features/player-admin/lib/get-owner-players-view.ts
 *
 * Orquesta la vista de "todos los jugadores" (owner, sin scope de
 * organización, sin FilterBar). Sin acceso a DB — delega en entities/player.
 */

import { listAllGlobalPlayers, type GlobalPlayerRow } from "@/entities/player";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import {
	PLAYERS_BASE_PATH,
	DEFAULT_PLAYERS_PAGE_SIZE,
	PLAYERS_PAGE_SIZE_OPTIONS,
} from "../constants";

export type OwnerPlayersView = {
	rows: GlobalPlayerRow[];
	total: number;
	search: string;
	pagination: AdminTablePagination;
	countLabel: string;
};

export async function getOwnerPlayersView(
	params: Record<string, string>,
): Promise<OwnerPlayersView> {
	const page = Math.max(1, Number(params.page ?? 1) || 1);
	const pageSize = parsePageSize(params.pageSize);
	const search = params.q?.trim() ?? "";

	const { rows, total } = await listAllGlobalPlayers({
		page,
		pageSize,
		search: search || undefined,
	});

	return {
		rows,
		total,
		search,
		pagination: buildPagination(page, total, PLAYERS_BASE_PATH, {
			pageSize,
			pageSizeOptions: [...PLAYERS_PAGE_SIZE_OPTIONS],
			extraParams: search ? { q: search } : {},
		}),
		countLabel: `${total} jugador${total !== 1 ? "es" : ""}`,
	};
}

/** Acepta solo valores del set permitido — cualquier otra cosa cae al default. */
function parsePageSize(raw: string | undefined): number {
	const n = Number(raw);
	return (PLAYERS_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
		? n
		: DEFAULT_PLAYERS_PAGE_SIZE;
}
