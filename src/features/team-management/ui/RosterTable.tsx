"use client";

/**
 * features/team-management/ui/RosterTable.tsx
 * Vista principal del roster — tabla con acciones inline N1.
 */

import { UserPlus, Pencil, ArrowLeftRight, UserMinus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { ROSTER_STATUS_LABEL, ROSTER_STATUS_CLASS } from "../constants";
import type { RosterEntry, ModalType } from "../types";

type Props = {
	roster: RosterEntry[];
	onOpenModal: (type: ModalType, member?: RosterEntry) => void;
};

function getInitials(fullName: string): string {
	const parts = fullName.trim().split(" ");
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return fullName.slice(0, 2).toUpperCase();
}

export function RosterTable({ roster, onOpenModal }: Props) {
	const activeCount = roster.filter((p) => p.status === "active").length;

	return (
		<div className="flex flex-col gap-0">
			{/* Header */}
			<div className="flex items-center justify-between px-6 py-3 border-b border-line bg-surface-2/40">
				<span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-3">
					{roster.length} jugador{roster.length !== 1 ? "es" : ""} &middot; {activeCount} activ
					{activeCount !== 1 ? "os" : "o"}
				</span>
				<Button variant="primary" size="sm" icon={UserPlus} onClick={() => onOpenModal("add")}>
					Agregar jugador
				</Button>
			</div>

			{/* Tabla */}
			{roster.length === 0 ? (
				<EmptyRoster onAdd={() => onOpenModal("add")} />
			) : (
				<ul className="divide-y divide-line">
					{roster.map((player) => (
						<RosterRow key={player.memberId} player={player} onOpenModal={onOpenModal} />
					))}
				</ul>
			)}
		</div>
	);
}

function RosterRow({
	player,
	onOpenModal,
}: {
	player: RosterEntry;
	onOpenModal: (type: ModalType, member?: RosterEntry) => void;
}) {
	const statusClass = ROSTER_STATUS_CLASS[player.status] ?? "bg-surface-2 text-ink-3";
	const statusLabel = ROSTER_STATUS_LABEL[player.status] ?? player.status;

	return (
		<li className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/30 transition group">
			{/* Dorsal */}
			<span className="w-8 text-center font-mono text-[13px] text-ink-3 shrink-0">
				{player.dorsal ?? "--"}
			</span>

			{/* Avatar + Nombre */}
			<Avatar initials={getInitials(player.fullName)} size="sm" />
			<div className="flex-1 min-w-0">
				<p className="text-[14px] font-medium text-ink truncate">{player.fullName}</p>
				<p className="text-[11px] text-ink-3 truncate">{player.inscriptionDate}</p>
			</div>

			{/* Status badge */}
			<Badge className={statusClass}>{statusLabel}</Badge>

			{/* Actions — visibles al hover */}
			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
				<ActionBtn label="Editar" icon={Pencil} onClick={() => onOpenModal("edit", player)} />
				<ActionBtn
					label="Transferir"
					icon={ArrowLeftRight}
					onClick={() => onOpenModal("transfer", player)}
				/>
				<ActionBtn
					label="Dar de baja"
					icon={UserMinus}
					onClick={() => onOpenModal("remove", player)}
					danger
				/>
			</div>
		</li>
	);
}

function ActionBtn({
	label,
	icon: Icon,
	onClick,
	danger,
}: {
	label: string;
	icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
	onClick: () => void;
	danger?: boolean;
}) {
	return (
		<button
			title={label}
			onClick={onClick}
			className={`w-7 h-7 grid place-items-center rounded-md transition ${
				danger
					? "text-ink-3 hover:text-red-400 hover:bg-red-500/10"
					: "text-ink-3 hover:text-ink hover:bg-surface-2"
			}`}
		>
			<Icon size={14} strokeWidth={2} />
		</button>
	);
}

function EmptyRoster({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="flex flex-col items-center gap-3 py-14 text-center">
			<p className="text-[14px] text-ink-2">Sin jugadores en el roster.</p>
			<Button variant="secondary" size="sm" icon={UserPlus} onClick={onAdd}>
				Agregar el primero
			</Button>
		</div>
	);
}
