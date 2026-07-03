"use client";

/**
 * features/org-theming/ui/OrgStyleStep.tsx
 *
 * Paso de identidad visual reutilizable: paleta + tipografía + preview en vivo.
 * CONTROLADO (§7.2 — el estado vive en el caller, aquí solo pinta y reporta):
 * lo usa el wizard de onboarding y podría usarlo cualquier flujo de alta.
 *
 * A diferencia de OrgThemePanel, este composite:
 *  - NO hace fetch ni mutación (no react-query) — el caller decide qué hacer.
 *  - Solo ofrece modo "preset" (colores propios = avanzado, vive en el panel).
 *  - Ofrece explícitamente el DEFAULT TalachaStats (presetId=null) como primera
 *    opción, preseleccionada: quien no quiere elegir colores lo deja así y su
 *    sitio se ve como la plataforma (fallback de marca).
 *
 * El preview vive en su propia columna sticky (siempre visible al hacer scroll)
 * y refleja SIEMPRE la selección — incluido el default, que se pinta con la
 * paleta de marca. La matemática (buildThemeTokens) es pura; los pickers son
 * tontos — misma frontera que el resto de la feature.
 */

import { useMemo } from "react";
import { BRAND_PALETTE } from "@/shared/brand/palette";
import {
	buildThemeTokens,
	ORG_FONTS,
	ORG_FONT_LIST,
	ORG_PRESET_LIST,
	ORG_PRESETS,
	type OrgFontId,
	type OrgPresetId,
	type ThemeInput,
} from "@/shared/org-theme";
import { FontPicker } from "./FontPicker";
import { PalettePickerGrid } from "./PalettePickerGrid";
import { ThemePreviewCard } from "./ThemePreviewCard";

export type OrgStyleValue = {
	/** null = default TalachaStats → la org usa el tema de la plataforma. */
	presetId: OrgPresetId | null;
	fontId: OrgFontId;
};

/** Valor inicial: default TalachaStats (sin paleta) y fuente de marca. */
export const DEFAULT_ORG_STYLE: OrgStyleValue = { presetId: null, fontId: "brand" };

/** Los 4 colores fuente del look TalachaStats por defecto — mismos que ve el
 *  público cuando la org no tiene tema (fallback de marca). Para preview/swatch. */
const TALACHA_DEFAULT: ThemeInput = {
	primary: BRAND_PALETTE.brand,
	accent: BRAND_PALETTE.gold,
	surface: BRAND_PALETTE.surface,
	ink: BRAND_PALETTE.ink,
};

type OrgStyleStepProps = {
	value: OrgStyleValue;
	onChange: (value: OrgStyleValue) => void;
	orgName?: string;
};

export function OrgStyleStep({ value, onChange, orgName }: OrgStyleStepProps) {
	const colors = value.presetId ? ORG_PRESETS[value.presetId].colors : TALACHA_DEFAULT;
	const tokens = useMemo(() => buildThemeTokens(colors), [colors]);

	const fontFamily = ORG_FONTS[value.fontId].cssVariable
		? `var(${ORG_FONTS[value.fontId].cssVariable})`
		: undefined;

	const isDefault = value.presetId === null;

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
			{/* Opciones */}
			<div className="space-y-6">
				<section>
					<h3 className="mb-2 text-sm font-medium text-ink">Paleta</h3>

					{/* Default TalachaStats — preseleccionado, para quien no quiere elegir. */}
					<button
						type="button"
						aria-pressed={isDefault}
						onClick={() => onChange({ ...value, presetId: null })}
						className={`mb-3 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
							isDefault
								? "border-brand-ink bg-surface-2 ring-1 ring-brand-ink"
								: "border-line bg-surface hover:border-line-2"
						}`}
					>
						<span className="flex shrink-0 gap-1.5" aria-hidden>
							{[
								TALACHA_DEFAULT.primary,
								TALACHA_DEFAULT.accent,
								TALACHA_DEFAULT.surface,
								TALACHA_DEFAULT.ink,
							].map((hex, i) => (
								<span
									key={i}
									className="h-5 w-5 rounded-full border border-line"
									style={{ backgroundColor: hex }}
								/>
							))}
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-medium text-ink">
								TalachaStats <span className="font-normal text-ink-3">· por defecto</span>
							</span>
							<span className="block text-xs text-ink-2">
								El tema de la plataforma. Déjalo así si no quieres elegir colores.
							</span>
						</span>
					</button>

					<PalettePickerGrid
						presets={ORG_PRESET_LIST}
						value={value.presetId}
						onChange={(presetId) => onChange({ ...value, presetId })}
					/>
				</section>

				<section>
					<h3 className="mb-2 text-sm font-medium text-ink">Tipografía</h3>
					<FontPicker
						fonts={ORG_FONT_LIST}
						value={value.fontId}
						onChange={(fontId) => onChange({ ...value, fontId })}
					/>
				</section>
			</div>

			{/* Preview — columna propia, sticky: siempre visible al hacer scroll. */}
			<aside className="lg:sticky lg:top-6">
				<h3 className="mb-2 text-sm font-medium text-ink">Así se verá tu sitio</h3>
				<ThemePreviewCard tokens={tokens} orgName={orgName} fontFamily={fontFamily} />
			</aside>
		</div>
	);
}
