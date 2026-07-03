"use client";

/**
 * features/org-theming/ui/CustomColorFields.tsx
 *
 * Los 4 colores custom. TONTO: recibe valores y el reporte de contraste YA
 * CALCULADO (reportThemeContrast corre en el contenedor) — aquí no hay
 * matemática, solo inputs y warnings.
 */

import { HEX_COLOR_REGEX, type ThemeContrastReport, type ThemeInput } from "@/shared/org-theme";

const FIELDS: ReadonlyArray<{ key: keyof ThemeInput; label: string; hint: string }> = [
	{ key: "primary", label: "Primario", hint: "Botones, encabezados, highlights" },
	{ key: "accent", label: "Acento", hint: "Badges, detalles, líder de tabla" },
	{ key: "surface", label: "Fondo", hint: "Fondo de tarjetas y paneles" },
	{ key: "ink", label: "Texto", hint: "Texto principal sobre el fondo" },
];

type CustomColorFieldsProps = {
	value: ThemeInput;
	onChange: (key: keyof ThemeInput, hex: string) => void;
	/** null mientras algún hex esté incompleto. */
	report: ThemeContrastReport | null;
};

export function CustomColorFields({ value, onChange, report }: CustomColorFieldsProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{FIELDS.map(({ key, label, hint }) => {
					const hex = value[key];
					const validHex = HEX_COLOR_REGEX.test(hex);
					return (
						<label key={key} className="block">
							<span className="block text-sm font-medium text-ink">{label}</span>
							<span className="block text-xs text-ink-2 mb-1">{hint}</span>
							<span className="flex items-center gap-2">
								<input
									type="color"
									value={validHex ? hex : "#000000"}
									onChange={(e) => onChange(key, e.target.value)}
									className="h-9 w-9 cursor-pointer rounded border border-line bg-surface p-0.5"
									aria-label={`${label} (selector)`}
								/>
								<input
									type="text"
									value={hex}
									onChange={(e) => onChange(key, e.target.value)}
									placeholder="#1a2b3c"
									maxLength={7}
									spellCheck={false}
									className={`w-28 rounded border bg-surface px-2 py-1.5 text-sm font-mono text-ink ${
										validHex ? "border-line" : "border-rose"
									}`}
									aria-label={`${label} (hex)`}
								/>
							</span>
						</label>
					);
				})}
			</div>

			{report && report.inkOnSurface < 4.5 && (
				<p className="text-sm text-amber" role="alert">
					El texto no contrasta suficiente con el fondo ({report.inkOnSurface.toFixed(1)}:1 — mínimo
					4.5:1). Ajusta el color de texto o el fondo para poder guardar.
				</p>
			)}
			{report && report.primaryOnSurface < 1.5 && (
				<p className="text-sm text-amber" role="alert">
					El primario casi no se distingue del fondo — los botones se perderán.
				</p>
			)}
		</div>
	);
}
