/**
 * MatchdayCard — Tarjeta de una jornada con su lista de partidos.
 * Sub-componente de la página de calendario (Server Component).
 */
import Link from "next/link";

type MatchRow = {
	id: string;
	homeTeamName: string;
	awayTeamName: string;
	venueName: string | null;
	kickoffAt: Date | null;
	matchDate: string;
	status: string;
	isMakeup: boolean;
};

export type MatchdayWithMatches = {
	id: string;
	number: number;
	scheduledDate: string;
	phase: string;
	status: string;
	leagueId: string;
	matches: MatchRow[];
};

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

const MATCHDAY_STATUS_BADGE: Record<string, string> = {
	draft: "bg-surface-2 text-ink-3",
	published: "bg-blue/10 text-blue",
	in_progress: "bg-amber/10 text-amber",
	completed: "bg-brand/10 text-brand",
};

const MATCH_STATUS_PILL: Record<string, string> = {
	played: "bg-brand/10 text-brand",
	completed: "bg-brand/10 text-brand",
	walkover_home: "bg-amber/10 text-amber",
	walkover_away: "bg-amber/10 text-amber",
	suspended: "bg-rose/10 text-rose",
	postponed: "bg-amber/10 text-amber",
	cancelled: "bg-rose/10 text-rose",
};

const MATCH_STATUS_LABELS: Record<string, string> = {
	played: "jugado",
	completed: "completado",
	walkover_home: "W.O. local",
	walkover_away: "W.O. visitante",
	suspended: "suspendido",
	postponed: "pospuesto",
	cancelled: "cancelado",
};

function formatTime(kickoffAt: Date | null): string {
	if (!kickoffAt) return "";
	return kickoffAt.toLocaleTimeString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function formatDate(iso: string): string {
	const [year, month, day] = iso.split("-");
	const d = new Date(Number(year), Number(month) - 1, Number(day));
	return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

export function MatchdayCard({
	md,
	isExtra = false,
}: {
	md: MatchdayWithMatches;
	isExtra?: boolean;
}) {
	const isClosed = md.status === "completed";
	const badgeClass = MATCHDAY_STATUS_BADGE[md.status] ?? "bg-surface-2 text-ink-3";
	const total = md.matches.length;
	const captured = md.matches.filter((m) => CAPTURED_STATUSES.has(m.status)).length;
	const pct = total > 0 ? Math.round((captured / total) * 100) : 0;
	const allDone = total > 0 && captured === total;

	return (
		<div className={`bg-surface rounded-lg shadow overflow-hidden ${isClosed ? "opacity-75" : ""}`}>
			{/* ── Header ─────────────────────────────────────────────────────── */}
			<div className="px-5 py-3 border-b border-line">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-ink text-sm">
							{isExtra ? "🔄 " : ""}Jornada {md.number}
						</span>
						{isClosed ? (
							<span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-600/10 text-green-700 border border-green-600/20">
								✓ Cerrada
							</span>
						) : (
							<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
								{md.status}
							</span>
						)}
					</div>
					<div className="flex items-center gap-3">
						<span className="text-xs text-ink-2 capitalize">{formatDate(md.scheduledDate)}</span>
						{!isClosed && (
							<Link
								href={`/admin/ligas/${md.leagueId}/jornadas/${md.id}`}
								className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors border ${
									allDone
										? "bg-surface-2 text-ink-2 hover:bg-surface-3 border-line"
										: "text-brand bg-brand/10 hover:bg-brand/20 border-brand/20"
								}`}
							>
								{allDone ? "Ver →" : captured === 0 ? "Capturar →" : "Continuar →"}
							</Link>
						)}
					</div>
				</div>

				{/* Barra de progreso — solo en jornadas abiertas */}
				{!isClosed && total > 0 && (
					<div className="flex items-center gap-2">
						<div className="flex-1 bg-surface-2 rounded-full h-1.5 border border-line">
							<div
								className={`h-1.5 rounded-full transition-all ${allDone ? "bg-green-500" : "bg-brand"}`}
								style={{ width: `${pct}%` }}
							/>
						</div>
						<span
							className={`text-xs font-semibold shrink-0 ${allDone ? "text-green-600" : "text-ink-2"}`}
						>
							{captured}/{total}
						</span>
					</div>
				)}
			</div>

			{/* ── Lista de partidos ───────────────────────────────────────────── */}
			{md.matches.length === 0 ? (
				<p className="text-sm text-ink-3 text-center py-5">Sin partidos en esta jornada</p>
			) : (
				<ul className="divide-y divide-line">
					{md.matches.map((m) => {
						const isCaptured = CAPTURED_STATUSES.has(m.status);
						const pillClass = MATCH_STATUS_PILL[m.status];
						const pillLabel = MATCH_STATUS_LABELS[m.status];

						const rowContent = (
							<>
								{/* Hora */}
								<div className="w-12 text-center shrink-0">
									{m.kickoffAt ? (
										<span className="text-xs font-mono text-ink-2">{formatTime(m.kickoffAt)}</span>
									) : (
										<span className="text-xs text-ink-3">—</span>
									)}
								</div>

								{/* Equipos */}
								<div className="flex-1 flex items-center gap-2 min-w-0">
									<span className="font-medium text-ink text-sm truncate text-right flex-1">
										{m.homeTeamName}
									</span>
									<span className="text-xs text-ink-3 shrink-0">vs</span>
									<span className="font-medium text-ink text-sm truncate flex-1">
										{m.awayTeamName}
									</span>
								</div>

								{/* Cancha */}
								{m.venueName && (
									<span className="text-xs text-ink-3 shrink-0 hidden sm:block">
										📍 {m.venueName}
									</span>
								)}

								{/* Badge de estado */}
								{pillClass && pillLabel ? (
									<span
										className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-medium ${pillClass}`}
									>
										{pillLabel}
									</span>
								) : null}

								{/* Makeup badge */}
								{m.isMakeup && (
									<span className="text-xs bg-blue/10 text-blue px-1.5 py-0.5 rounded shrink-0">
										recuperación
									</span>
								)}

								{/* Flecha — solo en jornadas abiertas */}
								{!isClosed && (
									<span className="text-xs text-ink-3 group-hover:text-brand transition-colors shrink-0">
										{isCaptured ? "Editar →" : "Capturar →"}
									</span>
								)}
							</>
						);

						return (
							<li key={m.id}>
								{isClosed ? (
									<div className="px-5 py-3 flex items-center gap-3 cursor-default">
										{rowContent}
									</div>
								) : (
									<Link
										href={`/admin/ligas/${md.leagueId}/jornadas/${md.id}/partidos/${m.id}`}
										className="px-5 py-3 flex items-center gap-3 hover:bg-surface-2 transition-colors group"
									>
										{rowContent}
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
