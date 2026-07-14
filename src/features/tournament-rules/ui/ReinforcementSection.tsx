"use client";

/**
 * features/tournament-rules/ui/ReinforcementSection.tsx
 * Límite de refuerzos por partido. `null` = sin límite (toggle).
 */
import { useState } from "react";
import { NumInput, ToggleSwitch } from "./controls";
import { FieldRow, SectionCard } from "./primitives";

type Props = {
	reinforcementLimit: number | null;
	onChange: (v: number | null) => void;
	locked?: boolean;
};

const DEFAULT_LIMIT = 3;

export function ReinforcementSection({ reinforcementLimit, onChange, locked }: Props) {
	// Recuerda el último límite numérico mientras el toggle está en "sin
	// límite", para no perderlo si el organizador vuelve a limitar.
	const [lastLimit, setLastLimit] = useState(reinforcementLimit ?? DEFAULT_LIMIT);
	const unlimited = reinforcementLimit === null;

	return (
		<SectionCard title="Jugadores y refuerzos" locked={locked}>
			<FieldRow
				label="Límite de refuerzos por partido"
				hint="Jugadores prestados que un equipo puede alinear en un mismo partido."
				isDefault={!unlimited && reinforcementLimit === DEFAULT_LIMIT}
			>
				<div className="flex items-center gap-4">
					<NumInput
						value={reinforcementLimit === null ? lastLimit : reinforcementLimit}
						disabled={unlimited}
						onChange={(v) => {
							setLastLimit(v);
							onChange(v);
						}}
						suffix="jugadores"
					/>
					<span className="w-px h-[22px] bg-line" />
					<div className="flex items-center gap-2.5">
						<ToggleSwitch checked={unlimited} onChange={(v) => onChange(v ? null : lastLimit)} />
						<span className="text-[13px] text-ink-2 font-medium">Sin límite</span>
					</div>
				</div>
			</FieldRow>
		</SectionCard>
	);
}
