/**
 * MappingStep — paso 2. Emparejar lo que el SISTEMA necesita con las columnas
 * del EXCEL del usuario. Se muestra solo si la autodetección no resolvió lo
 * obligatorio, o si el usuario pide ajustar.
 *
 * Claridad (lo que pedía el usuario): cada renglón deja explícito
 *   «lo que necesitamos»  →  «cuál columna de tu Excel»
 * y muestra EJEMPLOS reales de cada columna (reconocer > recordar, patrón de
 * import CSV). Obligatorias arriba; opcionales plegadas.
 */

import { Check } from "lucide-react";
import { type CanonicalField, type ColumnMapping } from "@/entities/narrator/model";
import { FIELD_LABELS, HEADER_PICKER_ROWS } from "../../constants";

const REQUIRED_ORDER: CanonicalField[] = ["team", "points", "goalsFor", "goalsAgainst"];
const OPTIONAL_ORDER: CanonicalField[] = ["position", "played", "wins", "draws", "losses"];

const FIELD_HINTS: Record<CanonicalField, string> = {
	team: "El nombre del equipo",
	points: "Puntos totales",
	goalsFor: "Goles que metió",
	goalsAgainst: "Goles que le metieron",
	position: "Lugar en la tabla",
	played: "Partidos jugados",
	wins: "Partidos ganados",
	draws: "Partidos empatados",
	losses: "Partidos perdidos",
};

export function MappingStep({
	grid,
	headerRowIndex,
	headers,
	mapping,
	onHeaderRow,
	onField,
}: {
	grid: string[][];
	headerRowIndex: number;
	headers: string[];
	mapping: ColumnMapping;
	onHeaderRow: (index: number) => void;
	onField: (field: CanonicalField, columnIndex: number | null) => void;
}) {
	const dataRows = grid.slice(headerRowIndex + 1);
	const previewRows = grid.slice(0, HEADER_PICKER_ROWS);

	return (
		<div className="space-y-6">
			<HeaderRowPicker rows={previewRows} selected={headerRowIndex} onSelect={onHeaderRow} />

			<section>
				<h2 className="font-display font-black text-lg uppercase tracking-wide text-ink mb-2">
					Empareja las columnas
				</h2>
				<div className="rounded-xl bg-brand/10 border border-brand/30 p-3 text-xs text-ink-2 leading-relaxed">
					A la izquierda está <strong className="text-ink">lo que el análisis necesita</strong>.
					Para cada uno elige <strong className="text-ink">cuál columna de tu Excel</strong> le
					toca. Ya detectamos casi todo (✓); solo revisa los que falten.
				</div>

				<div className="mt-4 space-y-3">
					{REQUIRED_ORDER.map((field) => (
						<FieldRow
							key={field}
							field={field}
							headers={headers}
							dataRows={dataRows}
							value={mapping[field]}
							onChange={(idx) => onField(field, idx)}
						/>
					))}
				</div>

				<details className="mt-4 group">
					<summary className="cursor-pointer list-none flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">
						<span>Columnas opcionales (mejoran el análisis)</span>
						<span className="text-ink-3 group-open:rotate-180 transition-transform">▾</span>
					</summary>
					<div className="mt-3 space-y-3">
						{OPTIONAL_ORDER.map((field) => (
							<FieldRow
								key={field}
								field={field}
								headers={headers}
								dataRows={dataRows}
								value={mapping[field]}
								onChange={(idx) => onField(field, idx)}
							/>
						))}
					</div>
				</details>
			</section>
		</div>
	);
}

// ── Selector de fila de encabezados ─────────────────────────────────────────

function HeaderRowPicker({
	rows,
	selected,
	onSelect,
}: {
	rows: string[][];
	selected: number;
	onSelect: (index: number) => void;
}) {
	return (
		<section>
			<h2 className="font-display font-black text-lg uppercase tracking-wide text-ink mb-1">
				¿Cuál fila tiene los títulos?
			</h2>
			<p className="text-xs text-ink-3 mb-3">Toca la fila con los nombres (Equipo, PJ, Pts…).</p>
			<div className="space-y-2">
				{rows.map((row, i) => {
					const isSel = i === selected;
					return (
						<button
							key={i}
							type="button"
							onClick={() => onSelect(i)}
							className={`w-full text-left rounded-xl border px-3 py-2.5 min-h-[48px] flex items-center gap-2 transition
							${isSel ? "border-brand bg-brand/10" : "border-line bg-surface-2"}`}
						>
							<span
								className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border
								${isSel ? "bg-brand border-brand text-pitch" : "border-line text-ink-3"}`}
							>
								{isSel ? <Check size={12} strokeWidth={3} /> : i + 1}
							</span>
							<span className="text-xs text-ink-2 truncate">{rowPreview(row)}</span>
						</button>
					);
				})}
			</div>
		</section>
	);
}

// ── Un campo del sistema → columna del Excel ────────────────────────────────

function FieldRow({
	field,
	headers,
	dataRows,
	value,
	onChange,
}: {
	field: CanonicalField;
	headers: string[];
	dataRows: string[][];
	value: number | null;
	onChange: (columnIndex: number | null) => void;
}) {
	const { label, required } = FIELD_LABELS[field];
	const isSet = value !== null;
	const missing = required && !isSet;

	return (
		<div
			className={`rounded-xl border bg-surface-2 p-3.5 ${missing ? "border-red-700" : "border-line"}`}
		>
			<div className="flex items-start gap-2.5 mb-2.5">
				<span
					className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
					${isSet ? "bg-brand text-pitch" : missing ? "bg-red-900 text-red-300" : "bg-surface text-ink-3 border border-line"}`}
				>
					{isSet ? <Check size={12} strokeWidth={3} /> : "?"}
				</span>
				<div className="min-w-0">
					<p className="text-sm font-semibold text-ink leading-tight">
						{label}
						{required && <span className="text-red-400"> *</span>}
					</p>
					<p className="text-[11px] text-ink-3">{FIELD_HINTS[field]}</p>
				</div>
			</div>

			<label className="block text-[10px] uppercase tracking-widest text-ink-3 mb-1">
				Columna de tu Excel
			</label>
			<select
				value={isSet ? String(value) : ""}
				onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
				className={`w-full min-h-[48px] bg-pitch border text-ink rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand
				${missing ? "border-red-700" : "border-line"}`}
			>
				<option value="">— Elegir columna —</option>
				{headers.map((h, i) => (
					<option key={i} value={i}>
						{optionLabel(h, columnSample(dataRows, i))}
					</option>
				))}
			</select>
		</div>
	);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowPreview(row: string[]): string {
	const cells = row.filter((c) => c !== "");
	if (cells.length === 0) return "(fila vacía)";
	const shown = cells.slice(0, 8).join(" · ");
	const rest = cells.length - 8;
	return rest > 0 ? `${shown} · +${rest}` : shown;
}

function columnSample(dataRows: string[][], colIndex: number, n = 3): string {
	const values: string[] = [];
	for (const row of dataRows) {
		const v = (row[colIndex] ?? "").trim();
		if (v) values.push(v);
		if (values.length >= n) break;
	}
	return values.join(", ");
}

function optionLabel(header: string, sample: string): string {
	const name = header.trim() || "(sin título)";
	return sample ? `${name}  ·  ej. ${sample}` : name;
}
