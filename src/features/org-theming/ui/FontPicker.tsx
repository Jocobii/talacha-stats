"use client";

/**
 * features/org-theming/ui/FontPicker.tsx
 *
 * Selector de tipografía. TONTO: catálogo por props, selección por callback.
 */

import type { OrgFontDefinition, OrgFontId } from "@/shared/org-theme";

type FontPickerProps = {
	fonts: readonly OrgFontDefinition[];
	value: OrgFontId;
	onChange: (id: OrgFontId) => void;
};

export function FontPicker({ fonts, value, onChange }: FontPickerProps) {
	return (
		<div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipografía">
			{fonts.map((font) => {
				const selected = font.id === value;
				return (
					<button
						key={font.id}
						type="button"
						role="radio"
						aria-checked={selected}
						onClick={() => onChange(font.id)}
						className={`rounded-lg border px-3 py-2 text-left transition-colors ${
							selected
								? "border-brand-ink ring-1 ring-brand-ink bg-surface-2"
								: "border-line hover:border-line-2 bg-surface"
						}`}
						style={font.cssVariable ? { fontFamily: `var(${font.cssVariable})` } : undefined}
					>
						<span className="block text-sm font-medium text-ink">{font.label}</span>
						<span className="block text-xs text-ink-2">{font.description}</span>
					</button>
				);
			})}
		</div>
	);
}
