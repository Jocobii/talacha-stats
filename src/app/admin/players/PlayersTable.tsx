"use client";

/**
 * app/admin/players/PlayersTable.tsx
 *
 * Client Component wrapper para AdminTable en la sección de jugadores.
 * Las column definitions (con funciones render) deben vivir en un Client
 * Component — no pueden cruzar la frontera Server → Client.
 *
 * La page (Server Component) solo pasa datos serializables (rows, pagination).
 */

import Link from "next/link";
import { AdminTable } from "@/shared/ui/AdminTable";
import type { AdminTableColumn, AdminTablePagination } from "@/shared/ui/AdminTable";
import type { OrgPlayerRow } from "@/entities/player";

// ── Tipos de fila ─────────────────────────────────────────────────────────────

export type OwnerPlayerRow = {
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	leagueCount: number;
};

// ── Badges de estado ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
	active: "bg-brand/15 text-brand",
	suspended: "bg-yellow-900/40 text-yellow-400",
	inactive: "bg-surface-2 text-ink-3",
};
const STATUS_LABEL: Record<string, string> = {
	active: "Activo",
	suspended: "Suspendido",
	inactive: "Inactivo",
};

// ── Avatar initials helper ────────────────────────────────────────────────────

function initials(fullName: string) {
	return fullName
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
}

// ── Tabla para organizer (OrgPlayerRow) ───────────────────────────────────────

const ORG_COLUMNS: AdminTableColumn<OrgPlayerRow>[] = [
	{
		key: "fullName",
		label: "Jugador",
		render: (p) => (
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand shrink-0">
					{initials(p.fullName)}
				</div>
				<span className="font-medium text-ink">{p.fullName}</span>
			</div>
		),
	},
	{
		key: "latestLeagueName",
		label: "Liga",
		hiddenMobile: true,
		render: (p) => <span className="text-ink-2 text-sm">{p.latestLeagueName ?? "—"}</span>,
	},
	{
		key: "leagueCount",
		label: "Ligas",
		align: "center",
		hiddenMobile: true,
		render: (p) => <span className="text-ink-2 tabular-nums">{p.leagueCount}</span>,
	},
	{
		key: "latestDorsal",
		label: "#",
		align: "center",
		hiddenMobile: true,
		render: (p) =>
			p.latestDorsal != null ? (
				<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand/15 text-brand font-black text-xs">
					{p.latestDorsal}
				</span>
			) : (
				<span className="text-ink-3 text-xs">—</span>
			),
	},
	{
		key: "latestStatus",
		label: "Estado",
		align: "center",
		render: (p) =>
			p.latestStatus ? (
				<span
					className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[p.latestStatus] ?? ""}`}
				>
					{STATUS_LABEL[p.latestStatus] ?? p.latestStatus}
				</span>
			) : (
				<span className="text-ink-3 text-xs">—</span>
			),
	},
];

// ── Tabla para owner (GlobalPlayerRow) ────────────────────────────────────────

const OWNER_COLUMNS: AdminTableColumn<OwnerPlayerRow>[] = [
	{
		key: "fullName",
		label: "Jugador",
		render: (p) => (
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand shrink-0">
					{initials(p.fullName)}
				</div>
				<span className="font-medium text-ink">{p.fullName}</span>
			</div>
		),
	},
	{
		key: "leagueCount",
		label: "Ligas",
		align: "center",
		hiddenMobile: true,
		render: (p) => <span className="text-ink-2 tabular-nums">{p.leagueCount}</span>,
	},
];

// ── Props del componente ──────────────────────────────────────────────────────

type OrgTableProps = {
	variant: "org";
	rows: OrgPlayerRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
};

type OwnerTableProps = {
	variant: "owner";
	rows: OwnerPlayerRow[];
	pagination: AdminTablePagination;
	emptyMessage: string;
	countLabel: string;
};

export type PlayersTableProps = OrgTableProps | OwnerTableProps;

// ── Componente ────────────────────────────────────────────────────────────────

export function PlayersTable(props: PlayersTableProps) {
	if (props.variant === "owner") {
		return (
			<AdminTable
				columns={OWNER_COLUMNS}
				rows={props.rows}
				getKey={(r) => r.globalPlayerId}
				actions={(r) => (
					<Link
						href={`/admin/players/${r.globalPlayerId}`}
						className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand hover:bg-brand/10 font-medium transition"
					>
						Ver
					</Link>
				)}
				pagination={props.pagination}
				emptyMessage={props.emptyMessage}
				countLabel={props.countLabel}
			/>
		);
	}

	return (
		<AdminTable
			columns={ORG_COLUMNS}
			rows={props.rows}
			getKey={(r) => r.globalPlayerId}
			actions={(r) => (
				<Link
					href={`/admin/players/${r.globalPlayerId}`}
					className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand hover:bg-brand/10 font-medium transition"
				>
					Ver
				</Link>
			)}
			pagination={props.pagination}
			emptyMessage={props.emptyMessage}
			countLabel={props.countLabel}
		/>
	);
}
