/**
 * MatchesTable.tsx
 *
 * Tabla de partidos de una jornada (o de un grupo ronda/zona dentro de una
 * jornada de playoff) — extraída de page.tsx para poder repetirla por grupo
 * cuando la jornada es de fase final (ver playoff-round-label.ts) sin
 * duplicar el JSX de la tabla.
 */
import Link from "next/link";
import { STATUS_LABELS } from "@/features/match-resolution/constants";
import type { ResolutionStatus } from "@/db/schema";

export type MatchRow = {
	id: string;
	cedula: string | null;
	status: string;
	homeScore: number | null;
	awayScore: number | null;
	homeTeam: { name: string };
	awayTeam: { name: string };
};

const STATUS_PILL: Record<string, string> = {
	scheduled: "bg-surface-2 text-ink-3",
	played: "bg-brand/10 text-brand-ink",
	walkover_home: "bg-amber/10 text-amber",
	walkover_away: "bg-amber/10 text-amber",
	suspended: "bg-rose/10 text-rose",
	postponed: "bg-amber/10 text-amber",
	completed: "bg-brand/10 text-brand-ink",
};

type Props = {
	matches: MatchRow[];
	leagueId: string;
	matchdayId: string;
	isClosed: boolean;
	canPrintCedulas: boolean;
};

export function MatchesTable({ matches, leagueId, matchdayId, isClosed, canPrintCedulas }: Props) {
	return (
		<div className="bg-surface rounded-lg border border-line overflow-hidden">
			<table className="w-full text-sm">
				<thead className="border-b border-line">
					<tr>
						<th className="px-4 py-3 text-left text-xs text-ink-3 font-medium uppercase tracking-wider">
							Cédula
						</th>
						<th className="px-4 py-3 text-left text-xs text-ink-3 font-medium uppercase tracking-wider">
							Partido
						</th>
						<th className="px-4 py-3 text-left text-xs text-ink-3 font-medium uppercase tracking-wider">
							Estado
						</th>
						<th className="px-4 py-3 text-left text-xs text-ink-3 font-medium uppercase tracking-wider">
							Marcador
						</th>
						<th className="px-4 py-3 text-right text-xs text-ink-3 font-medium uppercase tracking-wider">
							Acción
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-line">
					{matches.map((m) => {
						const label = STATUS_LABELS[m.status as ResolutionStatus] ?? m.status;
						const pillClass = STATUS_PILL[m.status] ?? "bg-surface-2 text-ink-3";
						return (
							<tr key={m.id} className={isClosed ? "" : "hover:bg-surface-2 transition-colors"}>
								<td className="px-4 py-3 font-mono text-blue text-xs">{m.cedula ?? "—"}</td>
								<td className="px-4 py-3">
									<span className="font-medium text-ink">{m.homeTeam.name}</span>
									<span className="text-ink-3 mx-1.5">vs</span>
									<span className="font-medium text-ink">{m.awayTeam.name}</span>
								</td>
								<td className="px-4 py-3">
									<span className={`px-2 py-0.5 rounded text-xs font-medium ${pillClass}`}>
										{label}
									</span>
								</td>
								<td className="px-4 py-3 text-ink-2 font-mono">
									{m.homeScore !== null && m.awayScore !== null
										? `${m.homeScore} – ${m.awayScore}`
										: "—"}
								</td>
								<td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
									{!isClosed && (
										<Link
											href={`/admin/ligas/${leagueId}/jornadas/${matchdayId}/partidos/${m.id}`}
											className="text-xs font-semibold text-brand-ink hover:text-brand-dim transition-colors"
										>
											{m.status === "scheduled" ? "Capturar →" : "Editar →"}
										</Link>
									)}
									{canPrintCedulas && (
										<a
											href={`/cedula/partido/${m.id}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs font-semibold text-ink-3 hover:text-ink-2 transition-colors"
										>
											Imprimir
										</a>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{matches.length === 0 && (
				<p className="text-center text-sm text-ink-3 py-10">No hay partidos en esta jornada.</p>
			)}
		</div>
	);
}
