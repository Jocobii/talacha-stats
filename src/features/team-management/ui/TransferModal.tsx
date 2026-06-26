"use client";

/**
 * features/team-management/ui/TransferModal.tsx
 * Selector de equipo destino + checkbox carta de salida.
 */

import { ArrowLeftRight } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Avatar } from "@/shared/ui/Avatar";
import { Select } from "@/shared/ui/Select";
import { useTransferModal } from "../model/useTransferModal";
import { useLeagueTeams } from "../model/useLeagueTeams";
import type { RosterEntry, TeamOption } from "../types";

type Props = {
	member: RosterEntry;
	leagueId: string;
	teamId: string;
	onTransfer: (memberId: string, targetTeamId: string) => Promise<void>;
	onClose: () => void;
	mutating: boolean;
	error: string;
};

function getInitials(n: string): string {
	const p = n.trim().split(" ");
	return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
}

export function TransferModal({
	member,
	leagueId,
	teamId,
	onTransfer,
	onClose,
	mutating,
	error,
}: Props) {
	const { targetTeamId, hasExitLetter, setTargetTeamId, setHasExitLetter } = useTransferModal();
	const { data: availableTeams = [], isLoading: loadingTeams } = useLeagueTeams(leagueId, teamId);

	async function handleConfirm() {
		if (!targetTeamId) return;
		await onTransfer(member.memberId, targetTeamId);
	}

	return (
		<Modal onClose={onClose} title="Transferir jugador" size="sm">
			<div className="p-5 flex flex-col gap-5">
				{/* Jugador */}
				<div className="flex items-center gap-3 p-3 bg-surface-2/50 rounded-lg border border-line">
					<Avatar initials={getInitials(member.fullName)} size="sm" />
					<div>
						<p className="text-[13px] font-semibold text-ink">{member.fullName}</p>
						{member.dorsal && <p className="text-[11px] text-ink-3 font-mono">#{member.dorsal}</p>}
					</div>
					<ArrowLeftRight size={14} className="text-ink-3 ml-auto" />
				</div>

				{/* Selector equipo destino */}
				<div>
					<label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-3 mb-1.5">
						Equipo destino
					</label>
					{loadingTeams ? (
						<p className="text-[12px] text-ink-3 py-2">Cargando equipos...</p>
					) : (
						<Select value={targetTeamId} onChange={(e) => setTargetTeamId(e.target.value)}>
							<option value="">Selecciona un equipo</option>
							{availableTeams.map((t: TeamOption) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</Select>
					)}
				</div>

				{/* Checkbox carta de salida */}
				<label className="flex items-start gap-2.5 cursor-pointer">
					<input
						type="checkbox"
						checked={hasExitLetter}
						onChange={(e) => setHasExitLetter(e.target.checked)}
						className="mt-0.5 accent-brand"
					/>
					<span className="text-[13px] text-ink-2 leading-snug">
						Carta de salida entregada (sin adeudo con el equipo anterior)
					</span>
				</label>

				{error && <p className="text-[12px] text-red-400">{error}</p>}

				<div className="flex gap-2 justify-end">
					<Button variant="ghost" size="md" onClick={onClose} disabled={mutating}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						size="md"
						onClick={handleConfirm}
						disabled={!targetTeamId || mutating}
					>
						{mutating ? "Transfiriendo..." : "Confirmar transferencia"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
