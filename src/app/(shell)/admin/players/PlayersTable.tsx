"use client";

/**
 * app/admin/players/PlayersTable.tsx
 *
 * Client Component wrapper para AdminTable en la sección de jugadores.
 * Las definiciones de columnas viven en playersColumns.tsx (config
 * declarativa, separada para mantener este archivo corto — AGENTS.md §3.5).
 *
 * La page (Server Component) nunca pasa esto directo: siempre a través de
 * OwnerPlayersView / OrgPlayersView, que reciben datos ya serializables.
 */

import Link from "next/link";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTablePagination, AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { OrgPlayerRow, GlobalPlayerRow } from "@/entities/player";
import { ORG_PLAYER_COLUMNS, OWNER_PLAYER_COLUMNS } from "./playersColumns";

// ── Props del componente ──────────────────────────────────────────────────────

type OrgTableProps = {
	variant: "org";
	rows: OrgPlayerRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
	sort?: AdminTableSortConfig;
};

type OwnerTableProps = {
	variant: "owner";
	rows: GlobalPlayerRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
};

export type PlayersTableProps = OrgTableProps | OwnerTableProps;

// ── Acciones compartidas ───────────────────────────────────────────────────────

function ViewAction({ globalPlayerId }: { globalPlayerId: string }) {
	return (
		<Link
			href={`/admin/players/${globalPlayerId}`}
			className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand-ink hover:bg-brand/10 font-medium transition"
		>
			Ver
		</Link>
	);
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PlayersTable(props: PlayersTableProps) {
	if (props.variant === "owner") {
		return (
			<AdminTable
				columns={OWNER_PLAYER_COLUMNS}
				rows={props.rows}
				getKey={(r) => r.globalPlayerId}
				actions={(r) => <ViewAction globalPlayerId={r.globalPlayerId} />}
				pagination={props.pagination}
				emptyMessage={props.emptyMessage}
				countLabel={props.countLabel}
			/>
		);
	}

	return (
		<AdminTable
			columns={ORG_PLAYER_COLUMNS}
			rows={props.rows}
			getKey={(r) => r.globalPlayerId}
			actions={(r) => <ViewAction globalPlayerId={r.globalPlayerId} />}
			pagination={props.pagination}
			emptyMessage={props.emptyMessage}
			countLabel={props.countLabel}
			sort={props.sort}
		/>
	);
}
