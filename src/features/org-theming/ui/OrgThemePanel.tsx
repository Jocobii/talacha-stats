"use client";

/**
 * features/org-theming/ui/OrgThemePanel.tsx
 *
 * Contenedor del editor de tema. Responsabilidades repartidas (§ anti-god):
 * - fetch: useOrgTheme / useSaveOrgTheme (model)
 * - matemática: buildThemeTokens / reportThemeContrast (shared, puras)
 * - render: componentes tontos (PalettePickerGrid, FontPicker, …)
 *
 * El estado del form vive en <ThemeEditor> con lazy initializer y se
 * remonta vía `key` cuando llega/cambia el dato del server — sin setState
 * dentro de useEffect (AGENTS.md §7.2).
 */

import { useMemo, useState } from "react";
import {
	buildThemeTokens,
	HEX_COLOR_REGEX,
	ORG_FONT_LIST,
	ORG_PRESET_LIST,
	ORG_PRESETS,
	reportThemeContrast,
	type OrgFontId,
	type OrgPresetId,
	type ThemeInput,
} from "@/shared/org-theme";
import { dtoToThemeForm } from "../lib/map-theme-form";
import { useOrgTheme } from "../model/useOrgTheme";
import { useSaveOrgTheme } from "../model/useThemeMutations";
import type { ThemeFormInput } from "../model/theme-form-schema";
import { CustomColorFields } from "./CustomColorFields";
import { FontPicker } from "./FontPicker";
import { PalettePickerGrid } from "./PalettePickerGrid";
import { ThemePreviewCard } from "./ThemePreviewCard";

const DEFAULT_CUSTOM: ThemeInput = ORG_PRESETS["azul-rey"].colors;

type OrgThemePanelProps = {
	organizationId: string;
	orgName?: string;
};

export function OrgThemePanel({ organizationId, orgName }: OrgThemePanelProps) {
	const { data, isLoading, isError, error } = useOrgTheme(organizationId);

	if (isLoading) {
		return <p className="text-sm text-ink-2">Cargando tema…</p>;
	}
	if (isError) {
		return (
			<p className="text-sm text-rose" role="alert">
				No se pudo cargar el tema: {error.message}
			</p>
		);
	}

	return (
		<ThemeEditor
			key={data?.updatedAt ?? "sin-tema"}
			organizationId={organizationId}
			orgName={orgName}
			initial={dtoToThemeForm(data)}
		/>
	);
}

// ---------------------------------------------------------------------------

type ThemeEditorProps = {
	organizationId: string;
	orgName?: string;
	initial: ThemeFormInput;
};

function ThemeEditor({ organizationId, orgName, initial }: ThemeEditorProps) {
	const save = useSaveOrgTheme(organizationId);

	const [mode, setMode] = useState<"preset" | "custom">(() => initial.mode);
	const [presetId, setPresetId] = useState<OrgPresetId | null>(() =>
		initial.mode === "preset" ? initial.presetId : null,
	);
	const [custom, setCustom] = useState<ThemeInput>(() =>
		initial.mode === "custom"
			? {
					primary: initial.colorPrimary,
					accent: initial.colorAccent,
					surface: initial.colorSurface,
					ink: initial.colorInk,
				}
			: DEFAULT_CUSTOM,
	);
	const [fontId, setFontId] = useState<OrgFontId>(() => initial.fontId);

	// Input efectivo del tema según el modo (null = aún no editable/preview-able)
	const themeInput: ThemeInput | null = useMemo(() => {
		if (mode === "preset") return presetId ? ORG_PRESETS[presetId].colors : null;
		const complete = Object.values(custom).every((hex) => HEX_COLOR_REGEX.test(hex));
		return complete ? custom : null;
	}, [mode, presetId, custom]);

	const tokens = useMemo(() => (themeInput ? buildThemeTokens(themeInput) : null), [themeInput]);
	const report = useMemo(() => (themeInput ? reportThemeContrast(themeInput) : null), [themeInput]);

	const canSave =
		!save.isPending &&
		(mode === "preset" ? presetId !== null : report !== null && report.inkOnSurface >= 4.5);

	const handleSave = () => {
		const input: ThemeFormInput =
			mode === "preset" && presetId
				? { mode: "preset", presetId, fontId }
				: {
						mode: "custom",
						colorPrimary: custom.primary,
						colorAccent: custom.accent,
						colorSurface: custom.surface,
						colorInk: custom.ink,
						fontId,
					};
		save.mutate(input);
	};

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
			<div className="space-y-6">
				{/* Modo */}
				<div className="flex gap-2" role="tablist" aria-label="Modo de tema">
					{(
						[
							["preset", "Paletas TalachaStats"],
							["custom", "Colores propios"],
						] as const
					).map(([m, label]) => (
						<button
							key={m}
							type="button"
							role="tab"
							aria-selected={mode === m}
							onClick={() => setMode(m)}
							className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
								mode === m
									? "border-brand-ink bg-surface-2 text-ink"
									: "border-line text-ink-2 hover:border-line-2"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				{mode === "preset" ? (
					<PalettePickerGrid presets={ORG_PRESET_LIST} value={presetId} onChange={setPresetId} />
				) : (
					<CustomColorFields
						value={custom}
						onChange={(key, hex) => setCustom((prev) => ({ ...prev, [key]: hex }))}
						report={report}
					/>
				)}

				<section>
					<h3 className="mb-2 text-sm font-medium text-ink">Tipografía</h3>
					<FontPicker fonts={ORG_FONT_LIST} value={fontId} onChange={setFontId} />
				</section>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleSave}
						disabled={!canSave}
						className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
					>
						{save.isPending ? "Guardando…" : "Guardar tema"}
					</button>
					{save.isSuccess && <span className="text-sm text-brand-ink">Tema guardado ✓</span>}
					{save.isError && (
						<span className="text-sm text-rose" role="alert">
							{save.error.message}
						</span>
					)}
				</div>
			</div>

			{/* Preview en vivo */}
			<aside>
				<h3 className="mb-2 text-sm font-medium text-ink">Así se verá tu sitio</h3>
				{tokens ? (
					<ThemePreviewCard tokens={tokens} orgName={orgName} />
				) : (
					<p className="text-sm text-ink-2">
						{mode === "preset"
							? "Elige una paleta para ver el preview."
							: "Completa los 4 colores para ver el preview."}
					</p>
				)}
			</aside>
		</div>
	);
}
