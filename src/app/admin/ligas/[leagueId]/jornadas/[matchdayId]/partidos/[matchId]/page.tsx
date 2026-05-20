/**
 * Pantalla de captura de un partido individual.
 * Ruta: /admin/ligas/[leagueId]/jornadas/[matchdayId]/partidos/[matchId]
 *
 * Server Component: carga inicial de datos.
 * MatchResolutionScreen: Client Component con toda la interactividad.
 */
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { matches, matchdays } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Lock } from "lucide-react";
import Link from "next/link";
import { getSessionUser } from "@/shared/lib/auth";
import { loadMatchForResolution } from "@/features/match-resolution/load-match";
import { MatchResolutionScreen } from "@/features/match-resolution/ui/MatchResolutionScreen";

export const metadata = { title: "Captura de partido · TalachaStats" };

type Params = {
	params: Promise<{ leagueId: string; matchdayId: string; matchId: string }>;
};

export default async function MatchCapturePage({ params }: Params) {
	const [user, { leagueId, matchdayId, matchId }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	// Verificar permiso de organización
	const match = await db.query.matches.findFirst({
		where: eq(matches.id, matchId),
		with: { league: { columns: { organizationId: true } } },
		columns: { id: true },
	});
	if (!match) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === match.league?.organizationId);
	if (!canManage) redirect("/admin/leagues");

	// Cargar datos del partido y sidebar en paralelo
	const [data, matchday, allMatches] = await Promise.all([
		loadMatchForResolution(matchId),
		db.query.matchdays.findFirst({
			where: eq(matchdays.id, matchdayId),
			columns: { number: true, status: true },
		}),
		db.query.matches.findMany({
			where: eq(matches.matchdayId, matchdayId),
			with: {
				homeTeam: { columns: { name: true } },
				awayTeam: { columns: { name: true } },
			},
			columns: { id: true, status: true, homeScore: true, awayScore: true },
			orderBy: [asc(matches.kickoffAt), asc(matches.matchDate)],
		}),
	]);

	if (!data || !matchday) notFound();

	// Jornada cerrada → mostrar pantalla de bloqueo
	if (matchday.status === "completed") {
		return (
			<div className="min-h-screen bg-pitch flex items-center justify-center">
				<div className="text-center space-y-4 max-w-sm px-6">
					<div className="w-14 h-14 rounded-full bg-green-600/10 border border-green-600/20 grid place-items-center mx-auto">
						<Lock size={24} className="text-green-600" strokeWidth={2} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-ink">Jornada cerrada</h2>
						<p className="text-sm text-ink-2 mt-1">
							Esta jornada ya fue cerrada. Los resultados están bloqueados y no pueden editarse.
						</p>
					</div>
					<Link
						href={`/admin/ligas/${leagueId}/jornadas/${matchdayId}`}
						className="inline-block text-sm font-semibold text-brand hover:underline"
					>
						← Volver a la jornada
					</Link>
				</div>
			</div>
		);
	}

	const sidebarMatches = allMatches.map((m) => ({
		id: m.id,
		homeTeamName: m.homeTeam.name,
		awayTeamName: m.awayTeam.name,
		status: m.status,
		homeScore: m.homeScore,
		awayScore: m.awayScore,
	}));

	return (
		<MatchResolutionScreen
			initialData={data}
			leagueId={leagueId}
			matchdayId={matchdayId}
			matchdayNumber={matchday.number}
			sidebarMatches={sidebarMatches}
		/>
	);
}
