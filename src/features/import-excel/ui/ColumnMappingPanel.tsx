"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ColumnMap } from "../parser";
import type { FieldDefinition } from "../model";

type Connector = { x1: number; y1: number; x2: number; y2: number };

// ---------------------------------------------------------------------------
// SVG bezier lines dibujadas entre pares mapeados
// ---------------------------------------------------------------------------

function ConnectorLines({ connectors }: { connectors: Connector[] }) {
	if (connectors.length === 0) return null;
	return (
		// Solo visible en sm+ — en mobile usamos números de par en su lugar
		<svg
			className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none"
			style={{ overflow: "visible", zIndex: 10 }}
		>
			{connectors.map((c, i) => (
				<path
					key={i}
					d={`M ${c.x1} ${c.y1} C ${c.x1 + 24} ${c.y1} ${c.x2 - 24} ${c.y2} ${c.x2} ${c.y2}`}
					stroke="var(--color-brand)"
					strokeWidth="1.5"
					fill="none"
					opacity="0.45"
					strokeDasharray="5 3"
				/>
			))}
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Componente combinado: ambos paneles + líneas SVG de conexión
// ---------------------------------------------------------------------------

type PanelsProps = {
	fields: FieldDefinition[];
	columnMap: ColumnMap;
	headerCols: string[];
	activeMapField: string | null;
	onFieldClick: (fieldKey: string) => void;
	onUnassign: (fieldKey: string) => void;
	onColClick: (colIdx: number) => void;
};

export function MappingPanels({
	fields,
	columnMap,
	headerCols,
	activeMapField,
	onFieldClick,
	onUnassign,
	onColClick,
}: PanelsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [connectors, setConnectors] = useState<Connector[]>([]);

	// Recalcula las líneas solo cuando cambia el mapeo o el activeMapField
	 
	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const lines: Connector[] = [];

		for (const [fieldKey, colIdxStr] of Object.entries(columnMap)) {
			const fieldEl = container.querySelector<HTMLElement>(`[data-field="${fieldKey}"]`);
			const colEl = container.querySelector<HTMLElement>(`[data-col="${colIdxStr}"]`);
			if (!fieldEl || !colEl) continue;

			const fr = fieldEl.getBoundingClientRect();
			const cr = colEl.getBoundingClientRect();
			lines.push({
				x1: fr.right - rect.left,
				y1: fr.top + fr.height / 2 - rect.top,
				x2: cr.left - rect.left,
				y2: cr.top + cr.height / 2 - rect.top,
			});
		}
		setConnectors(lines);
		// JSON.stringify para comparación profunda del objeto columnMap
	}, [JSON.stringify(columnMap), activeMapField]); // eslint-disable-line react-hooks/exhaustive-deps

	const getColName = (fieldKey: string): string | null => {
		const idx = columnMap[fieldKey];
		return idx !== undefined ? (headerCols[parseInt(idx)] ?? `Col ${idx}`) : null;
	};

	// Números de par para mobile: cada campo mapeado recibe un índice secuencial (1, 2, 3…)
	// que también se muestra en la columna correspondiente para indicar la relación sin líneas.
	const fieldPairNumber: Record<string, number> = {};
	const colPairNumber: Record<string, number> = {};
	let pairIdx = 1;
	for (const field of fields) {
		const colIdxStr = columnMap[field.key];
		if (colIdxStr !== undefined) {
			fieldPairNumber[field.key] = pairIdx;
			colPairNumber[colIdxStr] = pairIdx;
			pairIdx++;
		}
	}

	return (
		<div
			ref={containerRef}
			className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch"
		>
			<ConnectorLines connectors={connectors} />

			{/* Panel izquierdo — campos del sistema */}
			<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden flex flex-col h-full">
				<div className="px-4 py-3 border-b border-line shrink-0">
					<h3 className="text-[14px] font-bold text-ink">
						{activeMapField
							? `Asignando: ${fields.find((f) => f.key === activeMapField)?.label}`
							: "① Toca un campo para asignarlo"}
					</h3>
				</div>
				<div className="p-3 flex flex-col gap-1.5 flex-1">
					{fields.map((f) => {
						const colName = getColName(f.key);
						const isMapped = colName !== null;
						const isActive = activeMapField === f.key;
						const isReqFail = f.required && !isMapped && !isActive;

						return (
							<button
								key={f.key}
								data-field={f.key}
								type="button"
								onClick={() => onFieldClick(f.key)}
								className={[
									"flex items-center justify-between w-full px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
									isMapped ? "border-brand/40 bg-surface-2 text-ink" : "",
									isActive
										? "border-blue-400 bg-blue-950/40 text-blue-300 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
										: "",
									isReqFail ? "border-orange-800/50 bg-orange-950/30 text-orange-300" : "",
									!isMapped && !isActive && !isReqFail
										? "border-line bg-surface-2 text-ink-2 hover:border-blue-800/50 hover:bg-blue-950/40"
										: "",
								].join(" ")}
							>
								<div className="flex items-center gap-2 min-w-0">
									<span className="text-base shrink-0">
										{isMapped ? "✅" : isActive ? "👆" : isReqFail ? "⚠️" : "○"}
									</span>
									<span className="truncate">{f.label}</span>
									{f.required && <span className="text-[10px] opacity-60 shrink-0">(req.)</span>}
								</div>
								<div className="flex items-center gap-1.5 shrink-0 ml-2">
									{/* Número de par — solo mobile */}
									{isMapped && (
										<span className="sm:hidden w-5 h-5 rounded-full bg-brand text-pitch text-[10px] font-black flex items-center justify-center shrink-0">
											{fieldPairNumber[f.key]}
										</span>
									)}
									{isMapped && (
										<span className="text-[11px] bg-brand/15 px-2 py-0.5 rounded-full font-bold border border-brand/30 text-brand">
											{colName}
										</span>
									)}
									{isActive && !isMapped && (
										<span className="text-[11px] italic text-blue-300">→ elige columna</span>
									)}
									{isMapped && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onUnassign(f.key);
											}}
											className="opacity-40 hover:opacity-70 text-sm"
											title="Quitar"
										>
											×
										</button>
									)}
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Panel derecho — columnas del Excel */}
			<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden flex flex-col h-full">
				<div className="px-4 py-3 border-b border-line shrink-0">
					<h3 className={`text-[14px] font-bold ${activeMapField ? "text-blue-300" : "text-ink"}`}>
						{activeMapField
							? `② ¿Cuál columna es "${fields.find((f) => f.key === activeMapField)?.label}"?`
							: "② Columnas de tu archivo"}
					</h3>
					{!activeMapField && (
						<p className="text-[11px] text-ink-3 mt-0.5">
							Selecciona un campo a la izquierda primero
						</p>
					)}
				</div>
				<div className="p-3 flex flex-col gap-1.5 flex-1">
					{headerCols.map((col, idx) => {
						const assignedKey = Object.entries(columnMap).find(([, v]) => v === String(idx))?.[0];
						const assignedLabel = assignedKey
							? fields.find((f) => f.key === assignedKey)?.label
							: null;
						const isMapped = !!assignedLabel;
						const isClickable = !!activeMapField;

						return (
							<div
								key={idx}
								data-col={String(idx)}
								role={isClickable ? "button" : undefined}
								tabIndex={isClickable ? 0 : undefined}
								onClick={() => isClickable && onColClick(idx)}
								onKeyDown={(e) => e.key === "Enter" && isClickable && onColClick(idx)}
								className={[
									"flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all",
									isMapped ? "border-brand/40 bg-surface-2" : "",
									!isMapped && isClickable
										? "border-blue-800/50 bg-blue-950/40 cursor-pointer hover:border-blue-500 hover:shadow-sm"
										: "",
									!isMapped && !isClickable ? "border-line bg-surface-2 opacity-50" : "",
								].join(" ")}
							>
								<div className="flex items-center gap-2">
									<span
										className="text-[12px] font-black min-w-[18px]"
										style={{
											fontFamily: "'Barlow Condensed', sans-serif",
											color: isMapped ? "var(--color-brand)" : isClickable ? "#60a5fa" : "#555555",
										}}
									>
										{idx + 1}
									</span>
									<span className="text-[14px] font-bold text-ink">{col || "(vacío)"}</span>
								</div>
								{isMapped ? (
									<div className="flex items-center gap-1.5 shrink-0">
										{/* Número de par — solo mobile */}
										<span className="sm:hidden w-5 h-5 rounded-full bg-brand text-pitch text-[10px] font-black flex items-center justify-center shrink-0">
											{colPairNumber[String(idx)]}
										</span>
										<span className="text-[11px] bg-brand/15 text-brand px-2 py-0.5 rounded-full font-semibold">
											✓ {assignedLabel}
										</span>
									</div>
								) : isClickable ? (
									<span className="text-[11px] text-blue-300 font-bold">Seleccionar →</span>
								) : null}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// Exports legacy para compatibilidad
export { MappingPanels as FieldsPanel };
export { MappingPanels as ColumnsPanel };
