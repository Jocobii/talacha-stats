"use client";

/**
 * features/org-theming/ui/PalettePickerGrid.tsx
 *
 * Grid de paletas precuradas. TONTO: recibe el catálogo por props, no
 * hace fetch ni matemática — solo pinta y reporta la selección.
 */

import type { OrgPresetDefinition, OrgPresetId } from "@/shared/org-theme";

type PalettePickerGridProps = {
	presets: readonly OrgPresetDefinition[];
	value: OrgPresetId | null;
	onChange: (id: OrgPresetId) => void;
};

export function PalettePickerGrid({ presets, value, onChange }: PalettePickerGridProps) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Paleta">
			{presets.map((preset) => {
				const selected = preset.id === value;
				return (
					<button
						key={preset.id}
						type="button"
						role="radio"
						aria-checked={selected}
						onClick={() => onChange(preset.id)}
						className={`rounded-lg border p-3 text-left transition-colors ${
							selected
								? "border-brand-ink ring-1 ring-brand-ink bg-surface-2"
								: "border-line hover:border-line-2 bg-surface"
						}`}
					>
						<span className="flex gap-1.5 mb-2" aria-hidden>
							{[
								preset.colors.primary,
								preset.colors.accent,
								preset.colors.surface,
								preset.colors.ink,
							].map((hex, i) => (
								<span
									key={i}
									className="h-5 w-5 rounded-full border border-line"
									style={{ backgroundColor: hex }}
								/>
							))}
						</span>
						<span className="block text-sm font-medium text-ink">{preset.label}</span>
						<span className="block text-xs text-ink-2 mt-0.5">{preset.description}</span>
					</button>
				);
			})}
		</div>
	);
}
