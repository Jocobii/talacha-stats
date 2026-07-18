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

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTablePagination, AdminTableSortConfig } from "@/shared/ui/AdminTable";
import type { OrgPlayerRow, GlobalPlayerRow } from "@/entities/player";
import type { OrganizationCredentialConfigDto } from "@/entities/organization-credential-config";
import { IssueCredentialModal } from "@/features/player-credential/ui/IssueCredentialModal";
import { ORG_PLAYER_COLUMNS, OWNER_PLAYER_COLUMNS } from "./playersColumns";

// ── Props del componente ──────────────────────────────────────────────────────

type OrgTableProps = {
	variant: "org";
	rows: OrgPlayerRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
	sort?: AdminTableSortConfig;
	orgConfig: OrganizationCredentialConfigDto;
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

/**
 * Botón "Emitir"/"Renovar" — solo aparece si la fila tiene una liga (sin
 * liga no hay de dónde derivar la organización, ver IssueCredentialModal) y
 * el pase no está vigente. Abre el modal de la pantalla B y refresca la
 * página al emitir (Server Component — sin cache de TanStack que invalidar).
 */
function CredentialAction({
	row,
	orgConfig,
}: {
	row: OrgPlayerRow;
	orgConfig: OrganizationCredentialConfigDto;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	if (row.credentialStatus === "vigente" || !row.latestLeagueId) return null;

	const isRenewal = row.credentialStatus === "vencida" || row.credentialStatus === "porvencer";

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="text-xs px-2.5 py-1 rounded-lg border border-line text-ink-2 hover:bg-surface-2 hover:text-ink font-medium transition"
			>
				{isRenewal ? "Renovar" : "Emitir"}
			</button>
			{open && (
				<IssueCredentialModal
					onClose={() => setOpen(false)}
					globalPlayerId={row.globalPlayerId}
					leagueId={row.latestLeagueId}
					playerName={row.fullName}
					orgConfig={orgConfig}
					currentDisplayStatus={row.credentialStatus}
					onIssued={() => router.refresh()}
				/>
			)}
		</>
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
			actions={(r) => (
				<div className="flex items-center gap-2">
					<ViewAction globalPlayerId={r.globalPlayerId} />
					<CredentialAction row={r} orgConfig={props.orgConfig} />
				</div>
			)}
			pagination={props.pagination}
			emptyMessage={props.emptyMessage}
			countLabel={props.countLabel}
			sort={props.sort}
		/>
	);
}
