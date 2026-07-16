/**
 * features/discipline/lib/get-owner-suspensions-view.ts
 *
 * Orquesta la vista de "todas las suspensiones" (owner, sin scope de
 * organización, sin FilterBar) — espejo de
 * features/player-admin/lib/get-owner-players-view.ts. Búsqueda simple por
 * nombre de jugador, sin acceso a DB directo (pasa por manage-suspensions,
 * que a su vez pasa por entities/suspension).
 */

import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { buildPagination, type AdminTablePagination } from "@/shared/ui/admin-table.helpers";
import type { GlobalSuspensionListItemDto, SuspensionLeagueOption } from "@/entities/suspension";
import { listSuspensionsForScopePage, listLeaguesForScope } from "../manage-suspensions";
import {
	SUSPENSIONS_BASE_PATH,
	DEFAULT_SUSPENSIONS_PAGE_SIZE,
	SUSPENSIONS_PAGE_SIZE_OPTIONS,
} from "../constants";

export type OwnerSuspensionsView = {
	rows: GlobalSuspensionListItemDto[];
	total: number;
	search: string;
	pagination: AdminTablePagination;
	countLabel: string;
	/** Todas las ligas de la plataforma — selector de liga en "Registrar sanción". */
	leagues: SuspensionLeagueOption[];
};

export async function getOwnerSuspensionsView(
	params: Record<string, string>,
): Promise<OwnerSuspensionsView> {
	const page = Math.max(1, Number(params.page ?? 1) || 1);
	const pageSize = parsePageSize(params.pageSize);
	const search = params.q?.trim() ?? "";
	const scope = { kind: "all" as const };

	const [{ rows, total }, leagues] = await Promise.all([
		listSuspensionsForScopePage(scope, {
			filters: search
				? [{ field: "jugador", op: "containsWords", value: sanitizeToCanonical(search) }]
				: [],
			sort: [{ field: "creadoEn", dir: "desc" }],
			page,
			pageSize,
		}),
		listLeaguesForScope(scope),
	]);

	return {
		rows,
		total,
		search,
		pagination: buildPagination(page, total, SUSPENSIONS_BASE_PATH, {
			pageSize,
			pageSizeOptions: [...SUSPENSIONS_PAGE_SIZE_OPTIONS],
			extraParams: search ? { q: search } : {},
		}),
		countLabel: `${total} suspensi${total !== 1 ? "ones" : "ón"}`,
		leagues,
	};
}

/** Acepta solo valores del set permitido — cualquier otra cosa cae al default. */
function parsePageSize(raw: string | undefined): number {
	const n = Number(raw);
	return (SUSPENSIONS_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
		? n
		: DEFAULT_SUSPENSIONS_PAGE_SIZE;
}
