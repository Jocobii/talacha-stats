"use client";

/**
 * features/team-management/ui/TeamSettingsPanel.tsx
 * Formulario de configuracion N2: nombre y color del equipo.
 */

import { Check } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { Card } from "@/shared/ui/Card";
import { useTeamForm } from "../model/useTeamForm";
import type { TeamFormData } from "../types";

type Props = {
	teamId: string;
	initial: TeamFormData;
};

const PRESET_COLORS = [
	"#00E676",
	"#3B82F6",
	"#F59E0B",
	"#EC4899",
	"#A855F7",
	"#EF4444",
	"#06B6D4",
	"#F97316",
];

export function TeamSettingsPanel({ teamId, initial }: Props) {
	const { name, color, saving, saved, error, setName, setColor, handleSave } = useTeamForm(
		teamId,
		initial,
	);

	return (
		<Card className="p-6">
			<h3 className="font-display text-[20px] font-bold text-ink tracking-tight mb-5">
				Configuracion del equipo
			</h3>

			<div className="flex flex-col gap-5 max-w-md">
				{/* Nombre */}
				<div>
					<SectionLabel className="mb-1.5">Nombre del equipo</SectionLabel>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre del equipo"
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSave();
						}}
					/>
				</div>

				{/* Color */}
				<div>
					<SectionLabel className="mb-2">Color del equipo</SectionLabel>
					<div className="flex items-center gap-3 flex-wrap">
						{PRESET_COLORS.map((c) => (
							<button
								key={c}
								title={c}
								onClick={() => setColor(c)}
								className="w-7 h-7 rounded-md border-2 transition"
								style={{
									background: c,
									borderColor: color === c ? "#fff" : "transparent",
									boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
								}}
							/>
						))}
						<input
							type="color"
							value={color || "#00E676"}
							onChange={(e) => setColor(e.target.value)}
							title="Color personalizado"
							className="w-7 h-7 rounded-md border border-line cursor-pointer bg-transparent"
						/>
					</div>
					<p className="text-[11px] text-ink-3 mt-2 font-mono">{color || "Sin color"}</p>
				</div>

				{error && <p className="text-[12px] text-red-400">{error}</p>}

				<div className="flex items-center gap-3">
					<Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
						{saving ? "Guardando..." : "Guardar cambios"}
					</Button>
					{saved && (
						<span className="flex items-center gap-1 text-[12px] text-brand">
							<Check size={13} strokeWidth={2.5} /> Guardado
						</span>
					)}
				</div>
			</div>
		</Card>
	);
}
