/**
 * MatchdayCard — Tarjeta de una jornada con su lista de partidos.
 * Sub-componente de la página de calendario (Server Component).
 */

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
	matches: MatchRow[];
};

const STATUS_BADGE: Record<string, string> = {
	draft: "bg-surface-2 text-ink-3",
	published: "bg-blue-100 text-blue-700",
	in_progress: "bg-amber-100 text-amber-700",
	completed: "bg-green-100 text-green-700",
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
	const badgeClass = STATUS_BADGE[md.status] ?? "bg-surface-2 text-ink-3";

	return (
		<div className="bg-surface rounded-lg shadow overflow-hidden">
			<div className="px-5 py-3 border-b border-line flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-ink text-sm">
						{isExtra ? "🔄 " : ""}Jornada {md.number}
					</span>
					<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
						{md.status}
					</span>
				</div>
				<span className="text-xs text-ink-2 capitalize">{formatDate(md.scheduledDate)}</span>
			</div>

			{md.matches.length === 0 ? (
				<p className="text-sm text-ink-3 text-center py-5">Sin partidos en esta jornada</p>
			) : (
				<ul className="divide-y divide-line">
					{md.matches.map((m) => (
						<li key={m.id} className="px-5 py-3 flex items-center gap-3">
							<div className="w-12 text-center shrink-0">
								{m.kickoffAt ? (
									<span className="text-xs font-mono text-ink-2">{formatTime(m.kickoffAt)}</span>
								) : (
									<span className="text-xs text-ink-3">—</span>
								)}
							</div>
							<div className="flex-1 flex items-center gap-2 min-w-0">
								<span className="font-medium text-ink text-sm truncate text-right flex-1">
									{m.homeTeamName}
								</span>
								<span className="text-xs text-ink-3 shrink-0">vs</span>
								<span className="font-medium text-ink text-sm truncate flex-1">
									{m.awayTeamName}
								</span>
							</div>
							{m.venueName && (
								<span className="text-xs text-ink-3 shrink-0 hidden sm:block">
									📍 {m.venueName}
								</span>
							)}
							{m.status !== "scheduled" && (
								<span
									className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
										m.status === "completed"
											? "bg-green-100 text-green-700"
											: m.status === "cancelled"
												? "bg-red-100 text-red-500"
												: "bg-amber-100 text-amber-700"
									}`}
								>
									{m.status}
								</span>
							)}
							{m.isMakeup && (
								<span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded shrink-0">
									recuperación
								</span>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
