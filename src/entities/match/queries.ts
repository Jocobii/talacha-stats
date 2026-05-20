/**
 * entities/match/queries.ts
 * Acceso de lectura a DB para la entidad Match.
 */

import { db } from "@/db";
import { matches, matchPlayerStats, inscriptions, leagueMembers, globalPlayers } from "@/db/schema";
import { eq, and, or, sql, asc } from "drizzle-orm";
import type { Match } from "@/db/schema";
import type { MatchResolutionData, PlayerResolutionRow } from "./model";

const WITH_RELATIONS = {
	matchday: { columns: { id: true, number: true, phase: true, scheduledDate: true } },
	venue: { columns: { id: true, name: true, city: true } },
} as const;

export async function getMatch(id: string): Promise<Match | null> {
	const row = await db.query.matches.findFirst({ where: eq(matches.id, id) });
	return row ?? null;
}

export async function listMatchesByMatchday(matchdayId: string) {
	return db.query.matches.findMany({
		where: eq(matches.matchdayId, matchdayId),
		with: WITH_RELATIONS,
		orderBy: (m, { asc }) => [asc(m.kickoffAt), asc(m.matchDate)],
	});
}

export async function listMatchesByTeamLeague(teamId: string, leagueId: string) {
	return db.query.matches.findMany({
		where: and(
			eq(matches.leagueId, leagueId),
			or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)),
		),
		with: WITH_RELATIONS,
		orderBy: (m, { asc }) => [asc(m.kickoffAt), asc(m.matchDate)],
	});
}

// ---------------------------------------------------------------------------
// Módulo de Resolución de Partidos
// ---------------------------------------------------------------------------

/** Carga un partido con todos sus datos para la pantalla de captura */
export async function getMatchForResolution(matchId: string): Promise<MatchResolutionData | null> {
	const row = await db.query.matches.findFirst({
		where: eq(matches.id, matchId),
		with: {
			matchday: { columns: { id: true, number: true, scheduledDate: true } },
			homeTeam: { columns: { id: true, name: true, color: true } },
			awayTeam: { columns: { id: true, name: true, color: true } },
			league: { columns: { id: true, name: true, code: true } },
		},
	});

	if (!row) return null;

	// Consulta del roster del equipo via inscriptions → leagueMembers → globalPlayers
	const fetchRoster = (teamId: string) =>
		db
			.select({
				inscriptionId: inscriptions.id,
				globalPlayerId: globalPlayers.id,
				fullName: globalPlayers.fullName,
				dorsal: leagueMembers.dorsal,
			})
			.from(inscriptions)
			.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
			.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.where(and(eq(inscriptions.teamId, teamId), eq(leagueMembers.leagueId, row.leagueId)));

	const [homeRoster, awayRoster, existingStats] = await Promise.all([
		fetchRoster(row.homeTeamId),
		fetchRoster(row.awayTeamId),
		db.query.matchPlayerStats.findMany({
			where: eq(matchPlayerStats.matchId, matchId),
		}),
	]);

	const statsByRegId = new Map(existingStats.map((s) => [s.playerRegistrationId, s]));

	const buildPlayerRows = (
		roster: {
			inscriptionId: string;
			globalPlayerId: string;
			fullName: string;
			dorsal: number | null;
		}[],
	): PlayerResolutionRow[] =>
		roster.map((p) => {
			const stat = statsByRegId.get(p.inscriptionId) ?? null;
			return {
				registrationId: p.inscriptionId,
				playerProfileId: p.globalPlayerId,
				fullName: p.fullName,
				jerseyNumber: p.dorsal,
				isAdHoc: false,
				stat: stat
					? {
							id: stat.id,
							isPresent: stat.isPresent,
							shirtNumber: stat.shirtNumber ?? null,
							goals: stat.goals,
							assists: stat.assists,
							yellowCards: stat.yellowCards,
							blueCards: stat.blueCards,
							redCards: stat.redCards,
						}
					: null,
			};
		});

	return {
		match: {
			id: row.id,
			cedula: row.cedula ?? null,
			status: row.status,
			homeScore: row.homeScore ?? null,
			awayScore: row.awayScore ?? null,
			homeBonusGoals: row.homeBonusGoals,
			awayBonusGoals: row.awayBonusGoals,
			refereeObservations: row.refereeObservations ?? null,
			matchDate: row.matchDate,
			kickoffAt: row.kickoffAt ?? null,
		},
		matchday: row.matchday
			? {
					id: row.matchday.id,
					number: row.matchday.number,
					scheduledDate: row.matchday.scheduledDate,
				}
			: null,
		league: {
			id: row.league.id,
			name: row.league.name,
			code: row.league.code ?? null,
		},
		homeTeam: { id: row.homeTeam.id, name: row.homeTeam.name, color: row.homeTeam.color ?? null },
		awayTeam: { id: row.awayTeam.id, name: row.awayTeam.name, color: row.awayTeam.color ?? null },
		homePlayers: buildPlayerRows(homeRoster),
		awayPlayers: buildPlayerRows(awayRoster),
	};
}

/** Lista los partidos de una jornada con resumen de estado para el dashboard */
export async function listMatchesByRound(matchdayId: string) {
	return db.query.matches.findMany({
		where: eq(matches.matchdayId, matchdayId),
		with: {
			homeTeam: { columns: { id: true, name: true, color: true } },
			awayTeam: { columns: { id: true, name: true, color: true } },
		},
		orderBy: [asc(matches.kickoffAt), asc(matches.matchDate)],
	});
}

/** Busca partidos por cédula (parcial). Acepta sólo dígitos o texto completo. */
export async function findMatchByCedula(leagueId: string, query: string) {
	const isNumeric = /^\d+$/.test(query);

	const condition = isNumeric
		? sql`${matches.leagueId} = ${leagueId} AND SUBSTRING(${matches.cedula} FROM '\\d+$') LIKE ${"%" + query + "%"}`
		: sql`${matches.leagueId} = ${leagueId} AND UPPER(${matches.cedula}) LIKE ${("%" + query + "%").toUpperCase()}`;

	return db.query.matches.findMany({
		where: condition,
		with: {
			homeTeam: { columns: { id: true, name: true } },
			awayTeam: { columns: { id: true, name: true } },
			matchday: { columns: { id: true, number: true } },
		},
		limit: 20,
	});
}

/** Devuelve el siguiente partido scheduled de la jornada, después del dado */
export async function getNextScheduledMatch(
	matchdayId: string,
	afterMatchId?: string,
): Promise<{ id: string } | null> {
	const all = await db.query.matches.findMany({
		where: and(eq(matches.matchdayId, matchdayId), eq(matches.status, "scheduled")),
		orderBy: [asc(matches.kickoffAt), asc(matches.createdAt)],
		columns: { id: true },
	});

	if (all.length === 0) return null;
	if (!afterMatchId) return all[0] ?? null;

	const currentIdx = all.findIndex((m) => m.id === afterMatchId);
	return all[currentIdx + 1] ?? null;
}
