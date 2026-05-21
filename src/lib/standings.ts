import { db, matches, teams, teamStandingsSnapshot } from "@/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { TeamStanding } from "@/types";

/**
 * Statuses que cuentan como partido jugado para la tabla (V2 capture + V1 legacy).
 * - "played"        → partido normal con marcador real.
 * - "walkover_home" → local gana 3-0 por W.O. del visitante.
 * - "walkover_away" → visitante gana 3-0 por W.O. del local.
 * - "completed"     → estado legacy de partidos importados desde Excel (V1).
 * "suspended" y "postponed" no cuentan: el partido no se jugó aún.
 */
const COUNTED_STATUSES = ["played", "walkover_home", "walkover_away", "completed"] as const;

/**
 * Devuelve los goles efectivos de un partido según su status.
 * Los W.O. siempre reportan 3-0 al ganador independientemente del score almacenado.
 */
function resolveGoals(
	status: string,
	homeScore: number | null,
	awayScore: number | null,
): { homeGoals: number; awayGoals: number } {
	if (status === "walkover_home") return { homeGoals: 3, awayGoals: 0 };
	if (status === "walkover_away") return { homeGoals: 0, awayGoals: 3 };
	return { homeGoals: homeScore ?? 0, awayGoals: awayScore ?? 0 };
}

/**
 * Ordenamiento estándar: Pts → DG → GF → nombre.
 */
function sortStandings(rows: TeamStanding[]): TeamStanding[] {
	return rows.sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		return a.teamName.localeCompare(b.teamName);
	});
}

/**
 * Devuelve la tabla de posiciones de una liga.
 *
 * Prioridad 1 — snapshots importados desde Excel (V1 legacy):
 *   Si existen, se usa la jornada más reciente disponible.
 *
 * Prioridad 2 — cálculo en vivo desde partidos capturados (V2):
 *   Cuenta played + walkover_home + walkover_away + completed.
 *   Los W.O. se contabilizan como 3-0 para el ganador.
 */
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> {
	// ── Prioridad 1: snapshots Excel ──────────────────────────────────────────
	const snapshots = await db.query.teamStandingsSnapshot.findMany({
		where: eq(teamStandingsSnapshot.leagueId, leagueId),
		orderBy: [desc(teamStandingsSnapshot.jornada), desc(teamStandingsSnapshot.points)],
		with: { team: true, league: true },
	});

	if (snapshots.length > 0) {
		const latestJornada = snapshots[0].jornada;
		const latest = snapshots.filter((s) => s.jornada === latestJornada);

		return sortStandings(
			latest.map((s) => ({
				teamId: s.teamId,
				teamName: s.team.name,
				leagueId,
				leagueName: s.league.name,
				season: s.league.season,
				played: s.played,
				wins: s.wins,
				draws: s.draws,
				losses: s.losses,
				goalsFor: s.goalsFor,
				goalsAgainst: s.goalsAgainst,
				goalDifference: s.goalsFor - s.goalsAgainst,
				points: s.points,
				zone: s.zone ?? undefined,
			})),
		);
	}

	// ── Prioridad 2: cálculo en vivo desde partidos capturados (V2) ───────────
	const [leagueTeams, countedMatches] = await Promise.all([
		db.query.teams.findMany({
			where: and(eq(teams.leagueId, leagueId), eq(teams.status, "active")),
			with: { league: true },
		}),
		db.query.matches.findMany({
			where: and(eq(matches.leagueId, leagueId), inArray(matches.status, [...COUNTED_STATUSES])),
			columns: {
				id: true,
				homeTeamId: true,
				awayTeamId: true,
				homeScore: true,
				awayScore: true,
				status: true,
			},
		}),
	]);

	const standings: TeamStanding[] = leagueTeams.map((team) => {
		let wins = 0,
			draws = 0,
			losses = 0,
			goalsFor = 0,
			goalsAgainst = 0;

		for (const match of countedMatches) {
			const isHome = match.homeTeamId === team.id;
			const isAway = match.awayTeamId === team.id;
			if (!isHome && !isAway) continue;

			const { homeGoals, awayGoals } = resolveGoals(match.status, match.homeScore, match.awayScore);
			const myGoals = isHome ? homeGoals : awayGoals;
			const theirGoals = isHome ? awayGoals : homeGoals;

			goalsFor += myGoals;
			goalsAgainst += theirGoals;

			if (myGoals > theirGoals) wins++;
			else if (myGoals === theirGoals) draws++;
			else losses++;
		}

		const played = wins + draws + losses;
		const points = wins * 3 + draws;

		return {
			teamId: team.id,
			teamName: team.name,
			leagueId,
			leagueName: team.league.name,
			season: team.league.season,
			played,
			wins,
			draws,
			losses,
			goalsFor,
			goalsAgainst,
			goalDifference: goalsFor - goalsAgainst,
			points,
		};
	});

	return sortStandings(standings);
}
