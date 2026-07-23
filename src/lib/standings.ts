import { db, matches, teams } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import type { TeamStanding } from "@/types";
import { findLeagueConfigOrDefaults } from "@/entities/league-config/queries";
import type { LeagueConfigDto, TiebreakerCriterion } from "@/entities/league-config";

/**
 * Statuses que cuentan como partido jugado para la tabla.
 * - "played"        → partido normal con marcador real (cédula V2).
 * - "walkover_home" → local gana 3-0 por W.O. del visitante.
 * - "walkover_away" → visitante gana 3-0 por W.O. del local.
 * - "completed"     → status legacy de partidos que sí quedaron en `matches`
 *   con marcador real desde el import de Excel (V1) — se conserva porque son
 *   filas de partido reales, no infra V1 (a diferencia del snapshot que se
 *   retiró abajo, ver docs/V1-REMOVAL-PLAN.md P7/D1).
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
 * Devuelve la tabla de posiciones de una liga, calculada en vivo desde
 * partidos capturados: cuenta played + walkover_home + walkover_away +
 * completed. Los W.O. se contabilizan como 3-0 para el ganador.
 *
 * El orden final respeta `league_config.tiebreakers`
 * (§4.1 de docs/MODULOS-GESTION-LIGA.md) — nunca hardcodeado.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P7/D1): antes
 * priorizaba `team_standings_snapshot` (V1, snapshot de la última jornada
 * importada desde Excel) sobre este cálculo en vivo. Se retiró esa
 * prioridad — sin backfill (D1), una liga cuyo único historial vive en el
 * snapshot ahora no tiene tabla de posiciones (antes tampoco la tenía si
 * nunca corrió el import). El campo `zone` (LIGUILLA/COPA/RECOPA, solo
 * poblado por el snapshot) se retiró de `TeamStanding` — la zona real de una
 * liga V2 vive en `league_playoff_zones` (ver `shared/lib/zone-colors.ts`).
 */
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> {
	const [config, resolvedMatches] = await Promise.all([
		findLeagueConfigOrDefaults(leagueId),
		getResolvedMatches(leagueId),
	]);

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
