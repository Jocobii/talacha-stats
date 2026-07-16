"use client";

/**
 * features/team-management/ui/EditPlayerDrawer.tsx
 * Edicion de datos locales del jugador: dorsal y estatus.
 * CURP y nombre estan bloqueados para edicion ordinaria.
 */

import { useState } from "react";
import { Lock } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Listbox } from "@/shared/ui/Listbox";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { ROSTER_STATUSES, ROSTER_STATUS_LABEL } from "../constants";
import type { RosterEntry, UpdateRosterMemberData } from "../types";

type Props = {
	member: RosterEntry;
	onSave: (memberId: string, data: UpdateRosterMemberData) => Promise<void>;
	onClose: () => void;
	mutating: boolean;
	error: string;
};

export function EditPlayerDrawer({ member, onSave, onClose, mutating, error }: Props) {
	const [dorsal, setDorsal] = useState(member.dorsal?.toString() ?? "");
	const [status, setStatus] = useState<RosterEntry["status"]>(member.status);

	function handleDorsalChange(v: string) {
		if (v === "" || /^\d{1,2}$/.test(v)) setDorsal(v);
	}

	async function handleSave() {
		const dorsalNum = dorsal === "" ? null : parseInt(dorsal, 10);
		if (dorsalNum !== null && (dorsalNum < 1 || dorsalNum > 99)) return;
		await onSave(member.memberId, { dorsal: dorsalNum, status });
	}

	return (
		<Modal onClose={onClose} title="Editar jugador" size="sm">
			<div className="p-5 flex flex-col gap-5">
				{/* Datos bloqueados */}
				<div className="p-3 bg-surface-2/50 rounded-lg border border-line flex flex-col gap-1">
					<div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-3">
						<Lock size={10} strokeWidth={2.5} />
						Identidad verificada — no editable
					</div>
					<p className="text-[14px] font-medium text-ink">{member.fullName}</p>
				</div>

				{/* Dorsal */}
				<div>
					<SectionLabel className="mb-1.5">Numero de dorsal</SectionLabel>
					<Input
						type="number"
						min={1}
						max={99}
						value={dorsal}
						onChange={(e) => handleDorsalChange(e.target.value)}
						placeholder="1 – 99 (opcional)"
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSave();
						}}
					/>
					<p className="text-[11px] text-ink-3 mt-1">Dejar vacio si el equipo no usa dorsales</p>
				</div>

				{/* Estatus */}
				<div>
					<SectionLabel className="mb-1.5">Estatus</SectionLabel>
					<Listbox
						value={status}
						onChange={(v) => setStatus(v as RosterEntry["status"])}
						options={ROSTER_STATUSES.map((s) => ({ value: s, label: ROSTER_STATUS_LABEL[s] }))}
					/>
				</div>

				{error && <p className="text-[12px] text-red-400">{error}</p>}

				<div className="flex gap-2 justify-end">
					<Button variant="ghost" size="md" onClick={onClose} disabled={mutating}>
						Cancelar
					</Button>
					<Button variant="primary" size="md" onClick={handleSave} disabled={mutating}>
						{mutating ? "Guardando..." : "Guardar cambios"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
