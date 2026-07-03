"use client";

/**
 * features/tournament-skin/ui/SkinPickerGrid.tsx
 *
 * Selector de tema estilo "theme picker" (grid de tarjetas con preview real
 * arriba y nombre + descripción abajo). Componente tonto: value/onChange por
 * props — el form lo cablea vía <Controller>.
 */

import { cn } from "@/shared/lib/cn";
import { SKIN_IDS, SKINS, type SkinDefinition, type SkinId } from "@/shared/skins/registry";
import { SkinPreview } from "./SkinPreview";

type SkinPickerGridProps = {
	value: SkinId;
	onChange: (skinId: SkinId) => void;
	disabled?: boolean;
};

type SkinPickerCardProps = {
	skin: SkinDefinition;
	isSelected: boolean;
	disabled?: boolean;
	onSelect: () => void;
};

function SkinPickerCard({ skin, isSelected, disabled, onSelect }: SkinPickerCardProps) {
	return (
		<button
			type="button"
			role="radio"
			aria-checked={isSelected}
			disabled={disabled}
			onClick={onSelect}
			className={cn(
				"text-left rounded-xl border overflow-hidden transition focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50",
				isSelected ? "border-brand ring-1 ring-brand/40" : "border-line hover:border-line-2",
			)}
		>
			<SkinPreview skinId={skin.id} className="p-3 bg-surface-2" />
			<div className="px-3 py-2.5 border-t border-line bg-surface flex items-start gap-2.5">
				<span
					aria-hidden
					className={cn(
						"mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0",
						isSelected ? "border-brand bg-brand" : "border-line-2",
					)}
				/>
				<span>
					<span className="block text-sm font-medium text-ink">{skin.label}</span>
					<span className="block text-xs text-ink-2 mt-0.5">{skin.description}</span>
				</span>
			</div>
		</button>
	);
}

export function SkinPickerGrid({ value, onChange, disabled }: SkinPickerGridProps) {
	return (
		<div role="radiogroup" aria-label="Tema" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{SKIN_IDS.map((skinId) => (
				<SkinPickerCard
					key={skinId}
					skin={SKINS[skinId]}
					isSelected={value === skinId}
					disabled={disabled}
					onSelect={() => onChange(skinId)}
				/>
			))}
		</div>
	);
}
