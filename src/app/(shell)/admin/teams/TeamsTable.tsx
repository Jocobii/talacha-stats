"use client";

/**
 * app/admin/teams/TeamsTable.tsx
 *
 * Client Component wrapper para AdminTable en la sección de equipos.
 * Las definiciones de columnas viven en teamsColumns.tsx (config
 * declarativa, separada para mantener este archivo corto — AGENTS.md §3.5).
 *
 * La page (Server Component) nunca pasa esto directo: siempre a través de
 * OwnerTeamsView / OrgTeamsView, que reciben datos ya serializables.
 * Espejo de app/admin/players/PlayersTable.tsx.
 */

import Link from "next/link";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTablePagination, AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { OrgTeamRow, GlobalTeamRow } from "@/entities/team";
import { ORG_TEAM_COLUMNS, OWNER_TEAM_COLUMNS } from "./teamsColumns";

// ── Props del componente ──────────────────────────────────────────────────────

type OrgTableProps = {
	variant: "org";
	rows: OrgTeamRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
	sort?: AdminTableSortConfig;
};

type OwnerTableProps = {
	variant: "owner";
	rows: GlobalTeamRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
};

export type TeamsTableProps = OrgTableProps | OwnerTableProps;

// ── Acciones compartidas ───────────────────────────────────────────────────────

function ViewAction({ teamId }: { teamId: string }) {
	return (
		<Link
			href={`/admin/teams/${teamId}`}
			className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand-ink hover:bg-brand/10 font-medium transition"
		>
			Ver
		</Link>
	);
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TeamsTable(props: TeamsTableProps) {
	if (props.variant === "owner") {
		return (
			<AdminTable
				columns={OWNER_TEAM_COLUMNS}
				rows={props.rows}
				getKey={(r) => r.id}
				actions={(r) => <ViewAction teamId={r.id} />}
				pagination={props.pagination}
				emptyMessage={props.emptyMessage}
				countLabel={props.countLabel}
			/>
		);
	}

	return (
		<AdminTable
			columns={ORG_TEAM_COLUMNS}
			rows={props.rows}
			getKey={(r) => r.id}
			actions={(r) => <ViewAction teamId={r.id} />}
			pagination={props.pagination}
			emptyMessage={props.emptyMessage}
			countLabel={props.countLabel}
			sort={props.sort}
		/>
	);
}
