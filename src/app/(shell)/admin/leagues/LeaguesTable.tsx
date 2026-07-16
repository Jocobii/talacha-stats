"use client";

/**
 * app/(shell)/admin/leagues/LeaguesTable.tsx
 *
 * Client Component wrapper para AdminTable en la vista de Ligas. Las
 * columnas (con `render` custom) y la acción "Ver" son funciones — no pueden
 * cruzar el límite Server → Client como props, así que viven aquí adentro en
 * vez de en LeaguesView.tsx (Server Component). Espejo de
 * app/admin/teams/TeamsTable.tsx.
 */

import Link from "next/link";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTablePagination, AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { LeagueAdminRow } from "@/entities/league";
import { LEAGUE_COLUMNS } from "./leaguesColumns";

function ViewAction({ leagueId }: { leagueId: string }) {
	return (
		<Link
			href={`/admin/leagues/${leagueId}`}
			className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand-ink hover:bg-brand/10 font-medium transition"
		>
			Ver
		</Link>
	);
}

export function LeaguesTable({
	rows,
	pagination,
	emptyMessage,
	countLabel,
	sort,
}: {
	rows: LeagueAdminRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
	sort: AdminTableSortConfig;
}) {
	return (
		<AdminTable
			columns={LEAGUE_COLUMNS}
			rows={rows}
			getKey={(l) => l.id}
			actions={(l) => <ViewAction leagueId={l.id} />}
			pagination={pagination}
			emptyMessage={emptyMessage}
			countLabel={countLabel}
			sort={sort}
		/>
	);
}
