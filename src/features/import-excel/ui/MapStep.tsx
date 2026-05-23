/* eslint-disable react/no-unescaped-entities */
"use client";

import { MappingPanels } from "./ColumnMappingPanel";
import { useColumnMapping } from "../hooks/useColumnMapping";
import { autoMapColumns } from "../column-mapper";
import type { ColumnMap } from "../parser";
import type { FieldDefinition } from "../model";

type Props = {
	sheets: string[];
	activeSheet: string;
	onSheetChange: (sheet: string) => void;
	excelPreview: string[][];
	headerRow: number;
	onHeaderRowChange: (row: number, cols: string[]) => void;
	headerCols: string[];
	fields: FieldDefinition[];
	columnMap: ColumnMap;
	onColumnMapChange: (map: ColumnMap) => void;
	mappedCount: number;
	allReqDone: boolean;
	hasGoodHeaders: boolean;
	importType: "goleadores" | "standings";
	// Template saving
	newTemplateName: string;
	onNewTemplateNameChange: (name: string) => void;
	onSaveTemplate: () => void;
	savingTemplate: boolean;
	templateSaved: boolean;
	// Navigation
	onBack: () => void;
	onSubmit: () => void;
	loading: boolean;
	error: string;
};

export function MapStep({
	sheets,
	activeSheet,
	onSheetChange,
	excelPreview,
	headerRow,
	onHeaderRowChange,
	headerCols,
	fields,
	columnMap,
	onColumnMapChange,
	mappedCount,
	allReqDone,
	hasGoodHeaders,
	importType,
	newTemplateName,
	onNewTemplateNameChange,
	onSaveTemplate,
	savingTemplate,
	templateSaved,
	onBack,
	onSubmit,
	loading,
	error,
}: Props) {
	const {
		activeMapField,
		hasMapInteracted,
		handleFieldClick,
		handleColClick,
		resetMapInteraction,
	} = useColumnMapping();

	const handleColClickWrapper = (colIdx: number) => {
		const newMap = handleColClick(colIdx, columnMap, fields);
		onColumnMapChange(newMap);
	};

	const handleUnassign = (fieldKey: string) => {
		const newMap = { ...columnMap };
		delete newMap[fieldKey];
		onColumnMapChange(newMap);
	};

	return (
		<div className="flex flex-col gap-5">
			{/* Sheet selector (only when multiple sheets) */}
			{sheets.length > 1 && (
				<div className="bg-surface rounded-2xl shadow-sm border border-line p-4 flex items-center gap-3">
					<label className="text-sm font-semibold text-ink whitespace-nowrap">
						Hoja del Excel:
					</label>
					<select
						value={activeSheet}
						onChange={(e) => onSheetChange(e.target.value)}
						className="border border-line rounded-xl px-3 py-2 text-sm flex-1 bg-surface-2 text-ink [color-scheme:dark]"
					>
						{sheets.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Header row selector */}
			<div
				className={[
					"rounded-2xl border-2 p-4 transition-all",
					!hasGoodHeaders ? "bg-surface border-line" : "bg-brand/10 border-brand/20",
				].join(" ")}
			>
				{/* Instrucción principal */}
				<div className="mb-3">
					<p className="text-[15px] font-bold text-ink">
						{!hasGoodHeaders
							? "¿Cuál fila tiene los nombres de tus columnas?"
							: `Fila ${headerRow + 1} seleccionada ✓`}
					</p>
					<p className={`text-xs mt-1 ${!hasGoodHeaders ? "text-ink-2" : "text-brand-ink"}`}>
						{!hasGoodHeaders ? (
							<>
								Busca la fila que diga cosas como{" "}
								<span className="font-semibold text-ink">
									"Equipo", "Puntos", "Jugador", "Goles"…
								</span>{" "}
								y tócala.
							</>
						) : (
							<>{mappedCount} columnas detectadas automáticamente.</>
						)}
					</p>
				</div>

				<div className="bg-surface rounded-xl border border-line overflow-hidden">
					<div className="px-3 py-2 bg-surface-2 border-b border-line text-[11px] font-bold text-ink-2 uppercase tracking-wider">
						Tu archivo — toca la fila correcta
					</div>
					<div className="overflow-x-auto">
						{excelPreview.slice(0, 5).map((row, ri) => {
							const isSelected = ri === headerRow;
							const looksLikeHeaders = row.some(
								(c) =>
									c && isNaN(Number(c)) && c.length > 0 && new Set(row.filter(Boolean)).size > 1,
							);
							return (
								<button
									key={ri}
									type="button"
									onClick={() => {
										onHeaderRowChange(ri, row);
										resetMapInteraction();
										onColumnMapChange(autoMapColumns(row, importType));
									}}
									className={[
										"w-full min-w-[320px] flex items-center gap-0 text-left border-b border-line last:border-0 transition-colors",
										isSelected
											? "bg-brand/10 border-l-4 border-l-brand"
											: looksLikeHeaders
												? "hover:bg-brand/5 border-l-4 border-l-yellow-400/60 animate-pulse-subtle"
												: "hover:bg-surface-2 border-l-4 border-l-transparent",
									].join(" ")}
								>
									<div
										className={`w-9 py-2.5 text-center text-[11px] font-bold shrink-0 border-r border-line ${isSelected ? "text-brand-ink bg-brand/15" : "text-ink-3 bg-surface-2"}`}
									>
										{isSelected ? "✓" : ri + 1}
									</div>
									<div className="flex px-1">
										{row.slice(0, 6).map((cell, ci) => (
											<div
												key={ci}
												className={`px-2 py-2.5 text-[12px] truncate w-24 shrink-0 ${
													isSelected
														? "text-brand-ink font-bold"
														: looksLikeHeaders
															? "text-ink font-semibold"
															: "text-ink-3"
												}`}
											>
												{cell || "—"}
											</div>
										))}
										{row.length > 6 && (
											<div className="px-2 py-2 text-[11px] text-ink-3 shrink-0 self-center">
												+{row.length - 6}
											</div>
										)}
									</div>
									<div className="ml-auto px-3 shrink-0">
										{isSelected ? (
											<span className="text-[11px] bg-brand text-pitch px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
												Esta es
											</span>
										) : looksLikeHeaders ? (
											<span className="text-[11px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
												¿Esta?
											</span>
										) : null}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Progress banner */}
			{hasGoodHeaders && (
				<div
					className={[
						"rounded-2xl border-2 p-4 flex gap-3 items-start transition-all",
						hasMapInteracted ? "bg-brand/10 border-brand/20" : "bg-blue-950/40 border-blue-800/50",
					].join(" ")}
				>
					<span className="text-2xl shrink-0">{hasMapInteracted ? "✅" : "👋"}</span>
					<div className="flex-1 min-w-0">
						<p
							className={`text-[14px] font-bold mb-1 ${hasMapInteracted ? "text-brand-ink" : "text-blue-300"}`}
						>
							{hasMapInteracted
								? `${mappedCount} de ${fields.length} columnas asignadas`
								: `Detectamos ${mappedCount} columnas — revisa y corrige si algo está mal`}
						</p>
						{!hasMapInteracted && (
							<p className="text-[12px] text-blue-300 mt-1">
								① Toca un campo → ② toca su columna → ✅ listo
							</p>
						)}
						{hasMapInteracted && !allReqDone && (
							<p className="text-xs text-orange-700 mt-1">
								Faltan:{" "}
								{fields
									.filter((f) => f.required && !columnMap[f.key])
									.map((f) => f.label)
									.join(", ")}
							</p>
						)}
						{hasMapInteracted && allReqDone && (
							<p className="text-xs text-brand-ink mt-1">
								Todos los campos obligatorios asignados. ¡Puedes continuar!
							</p>
						)}
					</div>
					{hasMapInteracted && (
						<div className="shrink-0 text-center w-12">
							<div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1">
								<div
									className="h-full bg-brand rounded-full transition-all duration-500"
									style={{ width: `${(mappedCount / fields.length) * 100}%` }}
								/>
							</div>
							<span className="text-[10px] text-ink-2">
								{mappedCount}/{fields.length}
							</span>
						</div>
					)}
				</div>
			)}

			{/* Dos paneles con líneas SVG de conexión entre pares mapeados */}
			{hasGoodHeaders && (
				<MappingPanels
					fields={fields}
					columnMap={columnMap}
					headerCols={headerCols}
					activeMapField={activeMapField}
					onFieldClick={handleFieldClick}
					onUnassign={handleUnassign}
					onColClick={handleColClickWrapper}
				/>
			)}

			{/* Save as template */}
			{hasGoodHeaders && (
				<div className="bg-surface-2 border border-line rounded-2xl p-4">
					<p className="text-[13px] text-white font-semibold text-ink-2 mb-2">
						💾 Guardar esta configuración para la próxima vez
					</p>
					{templateSaved ? (
						<div className="flex items-center gap-2 text-brand-ink text-sm font-semibold">
							<span>✅</span> ¡Plantilla guardada!
						</div>
					) : (
						<div className="flex gap-2">
							<input
								value={newTemplateName}
								onChange={(e) => onNewTemplateNameChange(e.target.value)}
								placeholder="Ej: Liga Viernes – Posiciones"
								className="flex-1 border border-line rounded-xl px-3 py-2 text-sm outline-none focus:border-brand"
							/>
							<button
								type="button"
								onClick={onSaveTemplate}
								disabled={savingTemplate || !newTemplateName.trim()}
								className={[
									"px-4 py-2 rounded-xl text-sm font-semibold text-white transition",
									newTemplateName.trim()
										? "bg-surface-2 hover:bg-surface"
										: "bg-line cursor-not-allowed",
								].join(" ")}
							>
								{savingTemplate ? "..." : "Guardar"}
							</button>
						</div>
					)}
				</div>
			)}

			{error && (
				<p className="text-red-600 text-sm bg-red-950/40 border border-red-800/50 px-4 py-2.5 rounded-xl">
					{error}
				</p>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onBack}
					className="bg-surface border border-line text-ink px-5 py-3.5 rounded-2xl text-[15px] font-semibold hover:bg-surface-2 transition"
				>
					← Atrás
				</button>
				<button
					type="button"
					onClick={onSubmit}
					disabled={loading || !allReqDone || !hasGoodHeaders}
					className={[
						"flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all",
						allReqDone && hasGoodHeaders && !loading
							? "bg-brand hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
							: "bg-line cursor-not-allowed",
					].join(" ")}
				>
					{loading ? (
						<>
							<span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							Procesando...
						</>
					) : !hasGoodHeaders ? (
						<>Selecciona la fila de encabezados primero</>
					) : (
						<>Ver datos importados →</>
					)}
				</button>
			</div>
		</div>
	);
}
