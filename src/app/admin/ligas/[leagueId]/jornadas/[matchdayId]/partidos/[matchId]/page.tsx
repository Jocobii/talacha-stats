/**
 * Pantalla de captura de un partido individual.
 * Ruta: /admin/ligas/[leagueId]/jornadas/[matchdayId]/partidos/[matchId]
 *
 * Server Component: carga inicial de datos.
 * MatchResolutionScreen: Client Component con toda la interactividad.
 */
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
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

	const data = await loadMatchForResolution(matchId);
	if (!data) notFound();

	return <MatchResolutionScreen initialData={data} leagueId={leagueId} matchdayId={matchdayId} />;
}
