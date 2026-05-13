"use client";

type Props = {
	sheets: string[];
	selectedSheet: string;
	onSheetChange: (sheet: string) => void;
	excelPreview: string[][];
	loading: boolean;
	error: string;
	onBack: () => void;
	onSubmit: () => void;
};

export function SheetSelectStep({
	sheets,
	selectedSheet,
	onSheetChange,
	excelPreview,
	loading,
	error,
	onBack,
	onSubmit,
}: Props) {
	return (
		<div className="flex flex-col gap-5">
			{/* Selector de hoja */}
			<div className="bg-surface rounded-2xl shadow-sm border border-line p-4 flex items-center gap-3">
				<label className="text-sm font-semibold text-ink whitespace-nowrap">Hoja del Excel:</label>
				<select
					value={selectedSheet}
					onChange={(e) => onSheetChange(e.target.value)}
					disabled={loading}
					className="border border-line rounded-xl px-3 py-2 text-sm flex-1 bg-surface-2 text-ink [color-scheme:dark]"
				>
					{sheets.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</div>

			{/* Preview de filas */}
			<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
				<div className="px-4 py-3 border-b border-line flex items-center justify-between">
					<span className="text-sm font-bold text-ink">
						Vista previa — <span className="text-brand">{selectedSheet || "sin selección"}</span>
					</span>
					{loading && (
						<span className="inline-block w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
					)}
				</div>

				<div className="overflow-x-auto">
					{excelPreview.length === 0 ? (
						<p className="text-sm text-ink-3 px-4 py-6 text-center">Sin datos para mostrar</p>
					) : (
						<table className="w-full text-xs">
							<tbody>
								{excelPreview.slice(0, 10).map((row, ri) => (
									<tr
										key={ri}
										className={ri === 0 ? "bg-surface-2 font-semibold text-ink" : "text-ink-2"}
									>
										<td className="px-3 py-1.5 text-ink-3 border-r border-line w-8 text-center shrink-0">
											{ri + 1}
										</td>
										{row.slice(0, 8).map((cell, ci) => (
											<td
												key={ci}
												className="px-3 py-1.5 border-r border-line last:border-0 truncate max-w-[120px]"
											>
												{cell || <span className="text-ink-3">—</span>}
											</td>
										))}
										{row.length > 8 && (
											<td className="px-3 py-1.5 text-ink-3">+{row.length - 8}</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>

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
					disabled={loading || !selectedSheet}
					className={[
						"flex-1 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all",
						!loading && selectedSheet
							? "bg-brand hover:bg-brand-dim shadow-[0_4px_12px_rgba(22,163,74,0.35)]"
							: "bg-line cursor-not-allowed",
					].join(" ")}
				>
					{loading ? (
						<>
							<span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							Cargando...
						</>
					) : (
						<>Continuar →</>
					)}
				</button>
			</div>
		</div>
	);
}
