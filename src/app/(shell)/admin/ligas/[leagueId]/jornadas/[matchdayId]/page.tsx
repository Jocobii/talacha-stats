/**
 * Dashboard de jornada — lista de partidos con estado de captura.
 * Ruta: /admin/ligas/[leagueId]/jornadas/[matchdayId]
 */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Lock } from "lucide-react";
import { db } from "@/db";
import { matchdays, leagues } from "@/db/schema";
import { getSessionUser } from "@/shared/lib/auth";
import { listMatchesByRound } from "@/entities/match/queries";
import { CedulaSearch } from "./CedulaSearch";
import { CloseMatchdayButton } from "./CloseMatchdayButton";
import { ReopenPlayoffButton } from "./ReopenPlayoffButton";
import { ShareJornadaButton } from "./ShareJornadaButton";
import { PrintCedulaButton } from "./PrintCedulaButton";
import { STATUS_LABELS } from "@/features/match-resolution/constants";
import type { ResolutionStatus } from "@/db/schema";

type Params = { params: Promise<{ leagueId: string; matchdayId: string }> };

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

const STATUS_PILL: Record<string, string> = {
	scheduled: "bg-surface-2 text-ink-3",
	played: "bg-brand/10 text-brand-ink",
	walkover_home: "bg-amber/10 text-amber",
	walkover_away: "bg-amber/10 text-amber",
	suspended: "bg-rose/10 text-rose",
	postponed: "bg-amber/10 text-amber",
	completed: "bg-brand/10 text-brand-ink",
};

export default async function JornadaDashboardPage({ params }: Params) {
	const [user, { leagueId, matchdayId }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const [matchday, league] = await Promise.all([
		db.query.matchdays.findFirst({
			where: eq(matchdays.id, matchdayId),
			columns: { id: true, number: true, scheduledDate: true, status: true, phase: true },
		}),
		db.query.leagues.findFirst({
			where: eq(leagues.id, leagueId),
			columns: { id: true, name: true, organizationId: true },
		}),
	]);

	if (!matchday || !league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const matches = await listMatchesByRound(matchdayId);
	const capturedCount = matches.filter((m) => CAPTURED_STATUSES.has(m.status)).length;
	const isPlayoff = matchday.phase === "playoff";
	const isClosed = matchday.status === "completed" && !isPlayoff;
	const allCaptured = matches.length > 0 && capturedCount === matches.length;
	const firstScheduled = matches.find((m) => m.status === "scheduled");
	// Imprimir cédulas solo con jornada ya publicada (plan §12.3): antes de
	// eso los partidos/horarios pueden seguir cambiando.
	const canPrintCedulas = matchday.status !== "draft";

	return (
		<div className="min-h-screen bg-pitch">
			<div className="w-full px-6 py-8">
				{/* Cabecera */}
				<div className="mb-6">
					<p className="text-xs text-ink-3 mb-2">
						<Link
							href={`/admin/leagues/${leagueId}/calendario`}
							className="hover:text-ink-2 transition-colors"
						>
							{league.name}
						</Link>
						<span className="mx-1.5 text-ink-3">&gt;</span>
						{isPlayoff ? "Fase Final" : `Jornada ${matchday.number}`}
						<span className="mx-1.5 text-ink-3">&gt;</span>
						{matchday.scheduledDate}
					</p>
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<div className="flex items-center gap-2">
								<h1 className="font-display text-3xl text-ink font-bold tracking-tight">
									Captura de resultados
								</h1>
								{isClosed && (
									<span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-600/10 border border-green-600/20 px-2 py-0.5 rounded-full">
										<Lock size={11} strokeWidth={2.5} />
										Cerrada
									</span>
								)}
							</div>
							<p className="text-sm text-ink-2 mt-1">
								{isClosed ? (
									<span className="text-green-600 font-medium">
										✓ Jornada cerrada — {capturedCount}/{matches.length} partidos capturados
									</span>
								) : (
									<>
										Progreso:{" "}
										<span className="font-semibold text-ink">
											{capturedCount}/{matches.length}
										</span>{" "}
										partidos capturados
									</>
								)}
							</p>
						</div>

						{/* Acciones */}
						<div className="flex items-center gap-3 flex-wrap justify-end">
							{canPrintCedulas && (
								<PrintCedulaButton
									matchdayId={matchdayId}
									matches={matches.map((m) => ({
										id: m.id,
										cedula: m.cedula,
										homeTeamName: m.homeTeam.name,
										awayTeamName: m.awayTeam.name,
									}))}
								/>
							)}
							{!isClosed && (
								<>
									<CedulaSearch leagueId={leagueId} matchdayId={matchdayId} />
									{firstScheduled && (
										<Link
											href={`/admin/ligas/${leagueId}/jornadas/${matchdayId}/partidos/${firstScheduled.id}`}
											className="bg-brand hover:bg-brand-dim text-pitch text-sm font-bold px-4 py-2 rounded transition-colors"
										>
											Continuar →
										</Link>
									)}
								</>
							)}
							{allCaptured && !isClosed && !isPlayoff && (
								<CloseMatchdayButton
									matchdayId={matchdayId}
									leagueId={leagueId}
									matchdayNumber={matchday.number}
								/>
							)}
							{isClosed && matchday.number !== null && (
								<ShareJornadaButton leagueId={leagueId} jornadaNumber={matchday.number} />
							)}
							{isPlayoff && matchday.status === "completed" && (
								<ReopenPlayoffButton matchdayId={matchdayId} />
							)}
						</div>
					</div>
				</div>

				{/* Banner de jornada cerrada */}
				{isClosed && (
					<div className="mb-4 flex items-center gap-3 bg-green-600/10 border border-green-600/20 text-green-700 rounded-lg px-4 py-3 text-sm">
						<Lock size={16} strokeWidth={2} className="shrink-0" />
						<div>
							<span className="font-semibold">Jornada cerrada.</span> Los resultados están
							bloqueados. La tabla de posiciones ya fue actualizada.
						</div>
					</div>
				)}

				{/* Tabla de partidos */}
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
			</div>
		</div>
	);
}
