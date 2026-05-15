"use client";

/**
 * features/team-management/ui/RemovePlayerModal.tsx
 * Confirmacion de baja del roster. Preserva leagueMember e historial.
 */

import { UserMinus } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Avatar } from "@/shared/ui/Avatar";
import type { RosterEntry } from "../types";

type Props = {
	member: RosterEntry;
	onConfirm: (memberId: string) => Promise<void>;
	onClose: () => void;
	mutating: boolean;
	error: string;
};

function getInitials(n: string): string {
	const p = n.trim().split(" ");
	return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
}

export function RemovePlayerModal({ member, onConfirm, onClose, mutating, error }: Props) {
	return (
		<Modal onClose={onClose} size="sm">
			<div className="p-6 flex flex-col gap-5">
				{/* Icono + titulo */}
				<div className="flex items-start gap-3">
					<span className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 grid place-items-center shrink-0 mt-0.5">
						<UserMinus size={17} strokeWidth={2} className="text-red-400" />
					</span>
					<div>
						<h3 className="text-[15px] font-semibold text-ink">Dar de baja del roster</h3>
						<p className="text-[13px] text-ink-2 mt-1 leading-relaxed">
							El jugador quedara como agente libre en esta liga. Su historial de goles y tarjetas se
							preserva.
						</p>
					</div>
				</div>

				{/* Jugador */}
				<div className="flex items-center gap-3 p-3 bg-surface-2/50 rounded-lg border border-line">
					<Avatar initials={getInitials(member.fullName)} size="sm" />
					<div>
						<p className="text-[13px] font-semibold text-ink">{member.fullName}</p>
						{member.dorsal && <p className="text-[11px] text-ink-3 font-mono">#{member.dorsal}</p>}
					</div>
				</div>

				{error && <p className="text-[12px] text-red-400">{error}</p>}

				<div className="flex gap-2 justify-end">
					<Button variant="ghost" size="md" onClick={onClose} disabled={mutating}>
						Cancelar
					</Button>
					<Button
						variant="danger"
						size="md"
						onClick={() => onConfirm(member.memberId)}
						disabled={mutating}
					>
						{mutating ? "Procesando..." : "Dar de baja"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
