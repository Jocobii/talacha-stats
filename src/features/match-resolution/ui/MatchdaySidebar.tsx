"use client";
/**
 * features/match-resolution/ui/MatchdaySidebar.tsx
 *
 * Panel lateral con todos los partidos de la jornada.
 * Permite navegar directo a cualquier partido sin volver al dashboard.
 */
import Link from "next/link";
import { cn } from "@/shared/lib/cn";

type SidebarMatch = {
	id: string;
	homeTeamName: string;
	awayTeamName: string;
	status: string;
	homeScore: number | null;
	awayScore: number | null;
};

type Props = {
	matches: SidebarMatch[];
	currentMatchId: string;
	leagueId: string;
	matchdayId: string;
	matchdayNumber: number;
	capturedCount: number;
};

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

const STATUS_DOT: Record<string, string> = {
	played: "bg-green-500",
	completed: "bg-green-500",
	walkover_home: "bg-amber-400",
	walkover_away: "bg-amber-400",
	suspended: "bg-rose-500",
	postponed: "bg-amber-400",
	scheduled: "bg-surface-3 border border-line",
};

const STATUS_LABEL: Record<string, string> = {
	played: "Jugado",
	completed: "Completado",
	walkover_home: "W.O. Local",
	walkover_away: "W.O. Visit.",
	suspended: "Suspendido",
	postponed: "Pospuesto",
	scheduled: "Pendiente",
};

export function MatchdaySidebar({
	matches,
	currentMatchId,
	leagueId,
	matchdayId,
	matchdayNumber,
	capturedCount,
}: Props) {
	const total = matches.length;
	const allDone = total > 0 && capturedCount === total;

	return (
		<aside className="w-56 shrink-0 bg-surface border-r border-line flex flex-col overflow-hidden">
			{/* Header */}
			<div className="px-4 py-2.5 border-b border-line">
				<p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
					Jornada {matchdayNumber}
				</p>
				{allDone && <p className="text-xs text-green-600 font-medium mt-0.5">✓ Todos capturados</p>}
			</div>

			{/* Lista de partidos */}
			<nav className="flex-1 overflow-y-auto py-1">
				{matches.map((m) => {
					const isCurrent = m.id === currentMatchId;
					const isCaptured = CAPTURED_STATUSES.has(m.status);
					const dotClass = STATUS_DOT[m.status] ?? "bg-surface-3 border border-line";
					const statusLabel = STATUS_LABEL[m.status] ?? m.status;

					return (
						<Link
							key={m.id}
							href={`/admin/ligas/${leagueId}/jornadas/${matchdayId}/partidos/${m.id}`}
							className={cn(
								"block px-4 py-2.5 border-l-2 transition-colors",
								isCurrent
									? "border-brand bg-brand/5"
									: "border-transparent hover:bg-surface-2 hover:border-line",
							)}
						>
							{/* Equipos */}
							<div className="flex items-center gap-1.5 mb-1">
								<span
									className={cn("w-2 h-2 rounded-full shrink-0 mt-px", dotClass)}
									title={statusLabel}
								/>
								<span
									className={cn(
										"text-xs font-medium leading-tight truncate",
										isCurrent ? "text-brand" : "text-ink",
									)}
								>
									{m.homeTeamName}
								</span>
							</div>
							<div className="flex items-center justify-between gap-2 pl-3.5">
								<span className="text-xs text-ink-2 truncate">{m.awayTeamName}</span>
								{isCaptured && m.homeScore !== null && m.awayScore !== null ? (
									<span className="text-xs font-mono text-ink shrink-0">
										{m.homeScore}–{m.awayScore}
									</span>
								) : (
									<span className="text-xs text-ink-3 shrink-0">{statusLabel}</span>
								)}
							</div>
						</Link>
					);
				})}
			</nav>

			{/* Footer: volver al dashboard */}
			<div className="px-4 py-3 border-t border-line">
				<Link
					href={`/admin/ligas/${leagueId}/jornadas/${matchdayId}`}
					className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink transition-colors"
				>
					← Ver todos los partidos
				</Link>
			</div>
		</aside>
	);
}
