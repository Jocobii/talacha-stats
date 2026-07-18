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
import { listMatchesByRound, getPlayoffSlotInfoForMatches } from "@/entities/match/queries";
import { CedulaSearch } from "./CedulaSearch";
import { CloseMatchdayButton } from "./CloseMatchdayButton";
import { ReopenPlayoffButton } from "./ReopenPlayoffButton";
import { ShareJornadaButton } from "./ShareJornadaButton";
import { PrintCedulaButton } from "./PrintCedulaButton";
import { MatchesTable } from "./MatchesTable";
import { groupPlayoffMatches } from "./group-playoff-matches";

type Params = { params: Promise<{ leagueId: string; matchdayId: string }> };

const CAPTURED_STATUSES = new Set([
	"played",
	"walkover_home",
	"walkover_away",
	"suspended",
	"postponed",
	"completed",
]);

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

	// Fase final: todas las rondas (cuartos/semis/final, de cualquier zona)
	// cuelgan del mismo matchday sentinel — sin esto la tabla mezclaba todo
	// junto y era ilegible. Se agrupan por (zona, ronda) en vez de una tabla plana.
	const playoffGroups = isPlayoff
		? groupPlayoffMatches(matches, await getPlayoffSlotInfoForMatches(matches.map((m) => m.id)))
		: [];

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

				{/* Partidos — agrupados por ronda/zona en fase final, tabla única en jornada regular */}
				{isPlayoff ? (
					<div className="space-y-6">
						{playoffGroups.map((group) => (
							<div key={group.label}>
								<h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-2">
									{group.label}
								</h2>
								<MatchesTable
									matches={group.matches}
									leagueId={leagueId}
									matchdayId={matchdayId}
									isClosed={isClosed}
									canPrintCedulas={canPrintCedulas}
								/>
							</div>
						))}
						{matches.length === 0 && (
							<p className="text-center text-sm text-ink-3 py-10">
								No hay partidos en esta jornada.
							</p>
						)}
					</div>
				) : (
					<MatchesTable
						matches={matches}
						leagueId={leagueId}
						matchdayId={matchdayId}
						isClosed={isClosed}
						canPrintCedulas={canPrintCedulas}
					/>
				)}
			</div>
		</div>
	);
}
