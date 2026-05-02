"use client";

import type { ColumnMap } from "../parser";
import type { FieldDefinition } from "../model";

// ---------------------------------------------------------------------------
// Fields panel (left side)
// ---------------------------------------------------------------------------

type FieldsPanelProps = {
	fields: FieldDefinition[];
	columnMap: ColumnMap;
	headerCols: string[];
	activeMapField: string | null;
	onFieldClick: (fieldKey: string) => void;
	onUnassign: (fieldKey: string) => void;
};

export function FieldsPanel({
	fields,
	columnMap,
	headerCols,
	activeMapField,
	onFieldClick,
	onUnassign,
}: FieldsPanelProps) {
	const getColName = (fieldKey: string): string | null => {
		const idx = columnMap[fieldKey];
		return idx !== undefined ? (headerCols[parseInt(idx)] ?? `Col ${idx}`) : null;
	};

	return (
		<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
			<div className="px-4 py-3 border-b border-line">
				<h3 className="text-[14px] font-bold text-ink">
					{activeMapField
						? `✏️ Asignando: ${fields.find((f) => f.key === activeMapField)?.label}`
						: "① Toca un campo para asignarlo"}
				</h3>
			</div>
			<div className="p-3 flex flex-col gap-1.5">
				{fields.map((f) => {
					const colName = getColName(f.key);
					const isMapped = colName !== null;
					const isActive = activeMapField === f.key;
					const isReqFail = f.required && !isMapped && !isActive;

					return (
						<button
							key={f.key}
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
	);
}

// ---------------------------------------------------------------------------
// Columns panel (right side)
// ---------------------------------------------------------------------------

type ColumnsPanelProps = {
	headerCols: string[];
	columnMap: ColumnMap;
	fields: FieldDefinition[];
	activeMapField: string | null;
	onColClick: (colIdx: number) => void;
};

export function ColumnsPanel({
	headerCols,
	columnMap,
	fields,
	activeMapField,
	onColClick,
}: ColumnsPanelProps) {
	return (
		<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
			<div className="px-4 py-3 border-b border-line">
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
			<div className="p-3 flex flex-col gap-1.5">
				{headerCols.map((col, idx) => {
					const assignedKey = Object.entries(columnMap).find(
						([, v]) => v === String(idx),
					)?.[0];
					const assignedLabel = assignedKey
						? fields.find((f) => f.key === assignedKey)?.label
						: null;
					const isMapped = !!assignedLabel;
					const isClickable = !!activeMapField;

					return (
						<div
							key={idx}
							role={isClickable ? "button" : undefined}
							tabIndex={isClickable ? 0 : undefined}
							onClick={() => isClickable && onColClick(idx)}
							onKeyDown={(e) => e.key === "Enter" && isClickable && onColClick(idx)}
							className={[
								"flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all",
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
										color: isMapped
											? "var(--color-brand)"
											: isClickable
												? "#60a5fa"
												: "#555555",
									}}
								>
									{idx + 1}
								</span>
								<span className="text-[14px] font-bold text-ink">{col || "(vacío)"}</span>
							</div>
							{isMapped ? (
								<span className="text-[11px] bg-brand/15 text-brand px-2 py-0.5 rounded-full font-semibold">
									✓ {assignedLabel}
								</span>
							) : isClickable ? (
								<span className="text-[11px] text-blue-300 font-bold">Seleccionar →</span>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}
