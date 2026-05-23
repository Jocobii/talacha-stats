"use client";

import type { BulkPreviewResult } from "../model";
import type { StandingsRow } from "../parser";

type Props = {
	preview: BulkPreviewResult & { type: "standings" };
	excludedRows: Set<string>;
	onToggleExclude: (key: string) => void;
	onClearExcluded: () => void;
};

export function StandingsPreview({
	preview,
	excludedRows,
	onToggleExclude,
	onClearExcluded,
}: Props) {
	const rows = preview.rows as StandingsRow[];

	return (
		<>
			{/* Summary banner */}
			<div className="bg-brand/10 border border-brand/20 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
				<span className="text-3xl">✅</span>
				<div className="flex-1">
					<p className="text-base font-bold text-brand-ink">
						¡Todo se ve bien! {rows.length} equipos para la Jornada {preview.jornada}
					</p>
					<p className="text-xs text-brand-ink mt-0.5">
						{preview.summary.teams} equipos listos para importar.
					</p>
				</div>
				<div className="text-center shrink-0">
					<div
						className="text-2xl font-black text-brand-ink"
						style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
					>
						{preview.summary.teams}
					</div>
					<div className="text-[10px] text-ink-3 uppercase tracking-wider">Equipos</div>
				</div>
			</div>

			{/* Warnings */}
			{preview.warnings.length > 0 && (
				<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-2xl p-4">
					<p className="font-semibold text-yellow-300 text-sm mb-2">Avisos</p>
					<ul className="space-y-1">
						{preview.warnings.map((w, i) => (
							<li key={i} className="text-xs text-yellow-300">
								⚠ {w}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Data table */}
			<div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
				<div className="px-4 py-3 border-b border-line flex items-center justify-between">
					<h3 className="text-sm font-bold text-ink">Vista previa de los datos</h3>
					{excludedRows.size > 0 && (
						<button
							type="button"
							onClick={onClearExcluded}
							className="text-xs text-ink-2 bg-surface-2 rounded-lg px-3 py-1 hover:bg-surface-2 transition"
						>
							Restaurar todos
						</button>
					)}
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-surface-2">
							<tr>
								{["#", "Equipo", "JJ", "G", "E", "P", "GF", "GC", "Pts", ""].map((h, i) => (
									<th
										key={i}
										className={`px-3 py-2.5 text-[11px] font-bold text-ink-2 uppercase tracking-wider whitespace-nowrap ${i <= 1 ? "text-left" : "text-center"}`}
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{rows.map((r, i) => {
								const key = `s:${i}:${r.teamName}`;
								const excluded = excludedRows.has(key);
								return (
									<tr
										key={r.teamName}
										className={`transition-opacity ${excluded ? "opacity-40 bg-red-950/40" : i % 2 === 0 ? "bg-surface" : "bg-surface-2/50"}`}
									>
										<td className="px-3 py-2.5 text-ink-3 text-xs">{r.position}</td>
										<td
											className={`px-3 py-2.5 font-semibold text-ink ${excluded ? "line-through" : ""}`}
										>
											{r.teamName}
										</td>
										<td className="px-3 py-2.5 text-center text-ink-2">{r.played}</td>
										<td className="px-3 py-2.5 text-center font-semibold text-brand-ink">
											{r.wins}
										</td>
										<td className="px-3 py-2.5 text-center text-ink-2">{r.draws}</td>
										<td className="px-3 py-2.5 text-center text-red-500">{r.losses}</td>
										<td className="px-3 py-2.5 text-center text-ink-2">{r.goalsFor}</td>
										<td className="px-3 py-2.5 text-center text-ink-2">{r.goalsAgainst}</td>
										<td
											className="px-3 py-2.5 text-center font-black text-brand-ink text-base"
											style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
										>
											{r.points}
										</td>
										<td className="px-2 py-2.5 text-center">
											<button
												type="button"
												onClick={() => onToggleExclude(key)}
												title={excluded ? "Restaurar" : "Excluir fila"}
												className="text-ink-2 hover:text-red-500 transition text-base leading-none"
											>
												{excluded ? "↩" : "✕"}
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{excludedRows.size > 0 && (
				<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-xl px-4 py-2.5 text-sm text-yellow-300">
					⚠️ {excludedRows.size} equipo{excludedRows.size !== 1 ? "s" : ""} excluido
					{excludedRows.size !== 1 ? "s" : ""} — no se importará
					{excludedRows.size !== 1 ? "n" : ""}.
				</div>
			)}
		</>
	);
}
