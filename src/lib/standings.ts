import { db, matches, teams, teamStandingsSnapshot } from "@/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { TeamStanding } from "@/types";
import { findLeagueConfigOrDefaults } from "@/entities/league-config/queries";
import type { LeagueConfigDto, TiebreakerCriterion } from "@/entities/league-config";

/**
 * Statuses que cuentan como partido jugado para la tabla (V2 capture + V1 legacy).
 * - "played"        → partido normal con marcador real.
 * - "walkover_home" → local gana 3-0 por W.O. del visitante.
 * - "walkover_away" → visitante gana 3-0 por W.O. del local.
 * - "completed"     → estado legacy de partidos importados desde Excel (V1).
 * "suspended" y "postponed" no cuentan: el partido no se jugó aún.
 */
const COUNTED_STATUSES = ["played", "walkover_home", "walkover_away", "completed"] as const;

type ResolvedMatch = {
	homeTeamId: string;
	awayTeamId: string;
	homeGoals: number;
	awayGoals: number;
};

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
 * Enfrentamiento directo entre dos equipos: suma puntos (con la misma
 * ponderación configurada) y diferencia de gol, pero solo de los partidos
 * jugados entre ellos dos. No arma minitabla de grupo — en single
 * round-robin normalmente es un único partido.
 */
function compareHeadToHead(
	a: TeamStanding,
	b: TeamStanding,
	resolvedMatches: ResolvedMatch[],
	config: Pick<LeagueConfigDto, "pointsWin" | "pointsDraw">,
): number {
	let aPoints = 0,
		bPoints = 0,
		aGoals = 0,
		bGoals = 0;
	let found = false;

	for (const m of resolvedMatches) {
		const aIsHome = m.homeTeamId === a.teamId && m.awayTeamId === b.teamId;
		const aIsAway = m.awayTeamId === a.teamId && m.homeTeamId === b.teamId;
		if (!aIsHome && !aIsAway) continue;

		found = true;
		const [aGoalsInMatch, bGoalsInMatch] = aIsHome
			? [m.homeGoals, m.awayGoals]
			: [m.awayGoals, m.homeGoals];

		aGoals += aGoalsInMatch;
		bGoals += bGoalsInMatch;
		if (aGoalsInMatch > bGoalsInMatch) aPoints += config.pointsWin;
		else if (aGoalsInMatch === bGoalsInMatch) {
			aPoints += config.pointsDraw;
			bPoints += config.pointsDraw;
		} else bPoints += config.pointsWin;
	}

	// Sin partidos directos entre ellos → no decide, pasa al siguiente criterio.
	if (!found) return 0;
	if (bPoints !== aPoints) return bPoints - aPoints;
	// Empate en puntos directos → desempata por goles anotados en esos partidos.
	return bGoals - aGoals;
}

const TIEBREAKER_COMPARATORS: Record<
	Exclude<TiebreakerCriterion, "head_to_head">,
	(a: TeamStanding, b: TeamStanding) => number
> = {
	points: (a, b) => b.points - a.points,
	goal_diff: (a, b) => b.goalDifference - a.goalDifference,
	goals_for: (a, b) => b.goalsFor - a.goalsFor,
	name: (a, b) => a.teamName.localeCompare(b.teamName),
};

/**
 * Ordena la tabla según los criterios configurados en `league_config.tiebreakers`
 * (default: Pts → head-to-head → DG → GF → nombre). Cada criterio solo decide
 * si el anterior empató.
 */
function sortStandings(
	rows: TeamStanding[],
	tiebreakers: TiebreakerCriterion[],
	resolvedMatches: ResolvedMatch[],
	config: Pick<LeagueConfigDto, "pointsWin" | "pointsDraw">,
): TeamStanding[] {
	return rows.sort((a, b) => {
		for (const criterion of tiebreakers) {
			const result =
				criterion === "head_to_head"
					? compareHeadToHead(a, b, resolvedMatches, config)
					: TIEBREAKER_COMPARATORS[criterion](a, b);
			if (result !== 0) return result;
		}
		return 0;
	});
}

async function getResolvedMatches(leagueId: string): Promise<ResolvedMatch[]> {
	const countedMatches = await db.query.matches.findMany({
		where: and(eq(matches.leagueId, leagueId), inArray(matches.status, [...COUNTED_STATUSES])),
		columns: {
			homeTeamId: true,
			awayTeamId: true,
			homeScore: true,
			awayScore: true,
			status: true,
		},
	});

	return countedMatches.map((m) => {
		const { homeGoals, awayGoals } = resolveGoals(m.status, m.homeScore, m.awayScore);
		return { homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, homeGoals, awayGoals };
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
 *
 * En ambos casos el orden final respeta `league_config.tiebreakers`
 * (§4.1 de docs/MODULOS-GESTION-LIGA.md) — nunca hardcodeado.
 */
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> {
	const [config, resolvedMatches] = await Promise.all([
		findLeagueConfigOrDefaults(leagueId),
		getResolvedMatches(leagueId),
	]);

	// ── Prioridad 1: snapshots Excel ──────────────────────────────────────────
	const snapshots = await db.query.teamStandingsSnapshot.findMany({
		where: eq(teamStandingsSnapshot.leagueId, leagueId),
		orderBy: [desc(teamStandingsSnapshot.jornada), desc(teamStandingsSnapshot.points)],
		with: { team: true, league: true },
	});

	if (snapshots.length > 0) {
		const latestJornada = snapshots[0].jornada;
		const latest = snapshots.filter((s) => s.jornada === latestJornada);

		const standings = latest.map((s) => ({
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
		}));

		return sortStandings(
			standings,
			config.tiebreakers as TiebreakerCriterion[],
			resolvedMatches,
			config,
		);
	}

	// ── Prioridad 2: cálculo en vivo desde partidos capturados (V2) ───────────
	const leagueTeams = await db.query.teams.findMany({
		where: and(eq(teams.leagueId, leagueId), eq(teams.status, "active")),
		with: { league: true },
	});

	const standings: TeamStanding[] = leagueTeams.map((team) => {
		let wins = 0,
			draws = 0,
			losses = 0,
			goalsFor = 0,
			goalsAgainst = 0;

		for (const match of resolvedMatches) {
			const isHome = match.homeTeamId === team.id;
			const isAway = match.awayTeamId === team.id;
			if (!isHome && !isAway) continue;

			const myGoals = isHome ? match.homeGoals : match.awayGoals;
			const theirGoals = isHome ? match.awayGoals : match.homeGoals;

			goalsFor += myGoals;
			goalsAgainst += theirGoals;

			if (myGoals > theirGoals) wins++;
			else if (myGoals === theirGoals) draws++;
			else losses++;
		}

		const played = wins + draws + losses;
		const points = wins * config.pointsWin + draws * config.pointsDraw;

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

	return sortStandings(
		standings,
		config.tiebreakers as TiebreakerCriterion[],
		resolvedMatches,
		config,
	);
}
