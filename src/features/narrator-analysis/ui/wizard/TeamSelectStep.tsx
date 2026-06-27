/**
 * TeamSelectStep — paso 3. Elegir Equipo A vs Equipo B tocando la tabla.
 * Reconocer > recordar: el narrador toca dos filas, sin escribir. Vista previa
 * de los datos ya limpios (confirmación implícita, patrón de import CSV).
 */

import { SlidersHorizontal, X } from "lucide-react";
import type { ExcelStandingRow } from "@/entities/narrator/model";
import { titleCase } from "@/shared/lib/normalize";

export function TeamSelectStep({
	standings,
	teamAId,
	teamBId,
	onSelect,
	onAdjustColumns,
}: {
	standings: ExcelStandingRow[];
	teamAId: string | null;
	teamBId: string | null;
	onSelect: (teamId: string) => void;
	onAdjustColumns: () => void;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h2 className="font-display font-black text-lg uppercase tracking-wide text-ink">
						Elige los dos equipos
					</h2>
					<p className="text-xs text-ink-3">{standings.length} equipos detectados</p>
				</div>
				<button
					type="button"
					onClick={onAdjustColumns}
					className="shrink-0 inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink border border-line rounded-lg px-2.5 py-2 min-h-[40px]"
				>
					<SlidersHorizontal size={14} /> Columnas
				</button>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<SlotChip
					label="Equipo A"
					color="blue"
					name={nameFor(standings, teamAId)}
					onClear={teamAId ? () => onSelect(teamAId) : undefined}
				/>
				<SlotChip
					label="Equipo B"
					color="red"
					name={nameFor(standings, teamBId)}
					onClear={teamBId ? () => onSelect(teamBId) : undefined}
				/>
			</div>

			<ul className="space-y-2">
				{standings.map((row, i) => {
					const role = row.teamId === teamAId ? "A" : row.teamId === teamBId ? "B" : null;
					return (
						<li key={row.teamId}>
							<button
								type="button"
								onClick={() => onSelect(row.teamId)}
								className={`w-full min-h-[52px] flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99]
								${
									role === "A"
										? "border-blue-500 bg-blue-950/40"
										: role === "B"
											? "border-red-500 bg-red-950/40"
											: "border-line bg-surface-2"
								}`}
							>
								<span className="w-6 text-center text-xs text-ink-3 shrink-0">
									{row.position ?? i + 1}
								</span>
								<span className="flex-1 min-w-0 text-sm font-medium text-ink truncate">
									{titleCase(row.teamName)}
								</span>
								<span className="text-xs text-ink-3 shrink-0">{row.points} pts</span>
								{role && (
									<span
										className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white
										${role === "A" ? "bg-blue-600" : "bg-red-600"}`}
									>
										{role}
									</span>
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function SlotChip({
	label,
	color,
	name,
	onClear,
}: {
	label: string;
	color: "blue" | "red";
	name: string | null;
	onClear?: () => void;
}) {
	const accent = color === "blue" ? "text-blue-400" : "text-red-400";
	return (
		<div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 flex items-center justify-between gap-2">
			<div className="min-w-0">
				<p className={`text-[10px] font-bold uppercase tracking-widest ${accent}`}>{label}</p>
				<p className="text-sm text-ink truncate mt-0.5">{name ?? "— Toca un equipo —"}</p>
			</div>
			{name && onClear && (
				<button
					type="button"
					onClick={onClear}
					aria-label={`Quitar ${label}`}
					className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface transition"
				>
					<X size={16} />
				</button>
			)}
		</div>
	);
}

function nameFor(standings: ExcelStandingRow[], teamId: string | null): string | null {
	if (!teamId) return null;
	const row = standings.find((r) => r.teamId === teamId);
	return row ? titleCase(row.teamName) : null;
}
