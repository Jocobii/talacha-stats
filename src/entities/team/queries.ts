/**
 * entities/team/queries.ts
 * Acceso de lectura a DB para la entidad Team.
 * Las operaciones de escritura viven en features/team-management/actions.ts.
 */

import { db, teams, leagues, inscriptions, leagueMembers, globalPlayers } from "@/db";
import { eq, ne, and, asc } from "drizzle-orm";
import type { Team } from "@/db";
import type { RosterEntry, TeamWithLeague } from "./model";

export async function getTeam(id: string): Promise<Team | null> {
	const row = await db.query.teams.findFirst({ where: eq(teams.id, id) });
	return row ?? null;
}

export async function getTeamWithLeague(id: string): Promise<TeamWithLeague | null> {
	const rows = await db
		.select({
			id: teams.id,
			name: teams.name,
			leagueId: teams.leagueId,
			color: teams.color,
			createdAt: teams.createdAt,
			leagueName: leagues.name,
			leagueSeason: leagues.season,
			leagueDayOfWeek: leagues.dayOfWeek,
		})
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.where(eq(teams.id, id))
		.limit(1);

	return rows[0] ?? null;
}

export async function listTeamsByLeague(leagueId: string): Promise<Team[]> {
	return db.query.teams.findMany({
		where: eq(teams.leagueId, leagueId),
		orderBy: (t, { asc }) => [asc(t.name)],
	});
}

/** Equipos disponibles como destino de transferencia (misma liga, distinto equipo). */
export async function getTeamsForTransfer(
	leagueId: string,
	excludeTeamId: string,
): Promise<Team[]> {
	return db.query.teams.findMany({
		where: and(eq(teams.leagueId, leagueId), ne(teams.id, excludeTeamId)),
		orderBy: (t, { asc }) => [asc(t.name)],
	});
}

/** Roster V2: inscriptions -> league_members -> global_players. */
export async function getTeamRoster(teamId: string): Promise<RosterEntry[]> {
	const rows = await db
		.select({
			inscriptionId: inscriptions.id,
			memberId: leagueMembers.id,
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			dorsal: leagueMembers.dorsal,
			status: leagueMembers.status,
			inscriptionDate: leagueMembers.inscriptionDate,
		})
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.where(eq(inscriptions.teamId, teamId))
		.orderBy(asc(leagueMembers.dorsal), asc(globalPlayers.fullName));

	return rows.map((r) => ({
		inscriptionId: r.inscriptionId,
		memberId: r.memberId,
		globalPlayerId: r.globalPlayerId,
		fullName: r.fullName,
		birthDate: r.birthDate,
		avatarUrl: r.avatarUrl ?? null,
		dorsal: r.dorsal ?? null,
		status: r.status as RosterEntry["status"],
		inscriptionDate: r.inscriptionDate,
	}));
}
