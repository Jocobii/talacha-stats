/**
 * Pantalla de captura de un partido individual.
 * Ruta: /admin/ligas/[leagueId]/jornadas/[matchdayId]/partidos/[matchId]
 *
 * Server Component: carga inicial de datos.
 * MatchResolutionScreen: Client Component con toda la interactividad.
 */
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { matches, matchdays, playoffSlots, playoffBrackets } from "@/db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";
import { Lock } from "lucide-react";
import Link from "next/link";
import { getSessionUser } from "@/shared/lib/auth";
import { loadMatchForResolution } from "@/features/match-resolution/load-match";
import { MatchResolutionScreen } from "@/features/match-resolution/ui/MatchResolutionScreen";

export const metadata = { title: "Captura de partido · TalachaStats" };

type SidebarMatch = {
	id: string;
	homeTeam: { name: string };
	awayTeam: { name: string };
	status: string;
	homeScore: number | null;
	awayScore: number | null;
};

/**
 * Para jornadas de fase final: carga solo los partidos del mismo round que el
 * partido actual (cuartos, semis o final por separado).
 * Para jornadas regulares: todos los partidos de la jornada.
 */
async function loadSidebarMatches(
	matchId: string,
	matchdayId: string,
	phase: string,
): Promise<SidebarMatch[]> {
	if (phase !== "playoff") {
		return db.query.matches.findMany({
			where: eq(matches.matchdayId, matchdayId),
			with: { homeTeam: { columns: { name: true } }, awayTeam: { columns: { name: true } } },
			columns: { id: true, status: true, homeScore: true, awayScore: true },
			orderBy: [asc(matches.kickoffAt), asc(matches.matchDate)],
		});
	}

	// Encontrar el slot del partido actual para obtener su round y bracketId
	const currentSlot = await db.query.playoffSlots.findFirst({
		where: eq(playoffSlots.matchId, matchId),
		columns: { round: true, bracketId: true },
	});
	if (!currentSlot) {
		// Fallback: todos los partidos de la jornada
		return db.query.matches.findMany({
			where: eq(matches.matchdayId, matchdayId),
			with: { homeTeam: { columns: { name: true } }, awayTeam: { columns: { name: true } } },
			columns: { id: true, status: true, homeScore: true, awayScore: true },
		});
	}

	// Obtener todos los slots del mismo round y bracket
	const roundSlots = await db.query.playoffSlots.findMany({
		where: and(
			eq(playoffSlots.bracketId, currentSlot.bracketId),
			eq(playoffSlots.round, currentSlot.round),
		),
		columns: { matchId: true, slotIndex: true },
		orderBy: [asc(playoffSlots.slotIndex)],
	});

	const roundMatchIds = roundSlots.map((s) => s.matchId).filter((id): id is string => id !== null);

	if (roundMatchIds.length === 0) return [];

	return db.query.matches.findMany({
		where: inArray(matches.id, roundMatchIds),
		with: { homeTeam: { columns: { name: true } }, awayTeam: { columns: { name: true } } },
		columns: { id: true, status: true, homeScore: true, awayScore: true },
	});
}

const PLAYOFF_ROUND_LABELS: Record<number, string> = {
	1: "Cuartos de Final",
	2: "Semifinales",
	3: "Final",
};

type PlayoffContext = { roundLabel: string; zoneName: string };

/**
 * Para partidos de fase final: devuelve el label de ronda y el nombre de zona/bracket.
 * Ejemplo: { roundLabel: "Semifinales", zoneName: "Liguilla" }
 */
async function loadPlayoffContext(matchId: string): Promise<PlayoffContext | null> {
	const slot = await db.query.playoffSlots.findFirst({
		where: eq(playoffSlots.matchId, matchId),
		columns: { round: true, bracketId: true },
	});
	if (!slot) return null;

	const bracket = await db.query.playoffBrackets.findFirst({
		where: eq(playoffBrackets.id, slot.bracketId),
		columns: { zoneName: true },
	});

	const roundLabel = PLAYOFF_ROUND_LABELS[slot.round] ?? `Ronda ${slot.round}`;
	return { roundLabel, zoneName: bracket?.zoneName ?? "Fase Final" };
}

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

	// Cargar datos del partido y jornada en paralelo
	const [data, matchday] = await Promise.all([
		loadMatchForResolution(matchId),
		db.query.matchdays.findFirst({
			where: eq(matchdays.id, matchdayId),
			columns: { number: true, phase: true, status: true },
		}),
	]);

	if (!data || !matchday) notFound();

	// Sidebar: para playoff solo los partidos del mismo round; para regular, todos de la jornada
	const [allMatches, playoffCtx] = await Promise.all([
		loadSidebarMatches(matchId, matchdayId, matchday.phase),
		matchday.phase === "playoff" ? loadPlayoffContext(matchId) : Promise.resolve(null),
	]);

	// Jornada cerrada → mostrar pantalla de bloqueo (no aplica a jornadas de fase final)
	if (matchday.status === "completed" && matchday.phase !== "playoff") {
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
						className="inline-block text-sm font-semibold text-brand-ink hover:underline"
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

	// Label contextual para playoff: "Semifinales · Liguilla", "Cuartos de Final · Copa", etc.
	const matchdayLabel =
		matchday.phase === "playoff"
			? playoffCtx
				? `${playoffCtx.roundLabel} · ${playoffCtx.zoneName}`
				: "Fase Final"
			: undefined;

	// Mismo criterio que canPrintCedulas en jornadas/[matchdayId]/page.tsx.
	const canPrintCedula = matchday.status !== "draft";

	return (
		<MatchResolutionScreen
			initialData={data}
			leagueId={leagueId}
			matchdayId={matchdayId}
			matchdayNumber={matchday.number}
			matchdayLabel={matchdayLabel}
			sidebarMatches={sidebarMatches}
			canPrintCedula={canPrintCedula}
		/>
	);
}
