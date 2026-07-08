/**
 * SheetPicker — elegir qué hoja del Excel analizar cuando el libro tiene
 * varias (p.ej. una pestaña por jornada). Por defecto el server ya parseó la
 * ÚLTIMA hoja (la jornada más reciente); este control deja cambiarla antes de
 * generar el análisis, sin volver a subir el archivo.
 *
 * Solo se renderiza si hay más de una hoja — un libro de una sola pestaña no
 * necesita este control (menos ruido, YAGNI).
 */

import { Layers, Loader2 } from "lucide-react";

export function SheetPicker({
	sheetNames,
	selectedIndex,
	onChange,
	loading,
}: {
	sheetNames: string[];
	selectedIndex: number;
	onChange: (index: number) => void;
	loading?: boolean;
}) {
	if (sheetNames.length <= 1) return null;

	return (
		<div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 mt-3">
			<Layers size={16} className="text-ink-3 shrink-0" />
			<label htmlFor="excel-sheet-picker" className="text-xs text-ink-3 shrink-0">
				Jornada / hoja
			</label>
			<select
				id="excel-sheet-picker"
				value={selectedIndex}
				disabled={loading}
				onChange={(e) => onChange(Number(e.target.value))}
				className="flex-1 min-w-0 bg-pitch border border-line text-ink rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50"
			>
				{sheetNames.map((name, i) => (
					<option key={i} value={i}>
						{name}
						{i === sheetNames.length - 1 ? " (última)" : ""}
					</option>
				))}
			</select>
			{loading && <Loader2 size={16} className="text-brand-ink animate-spin shrink-0" />}
		</div>
	);
}
