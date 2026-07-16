/**
 * entities/match/queries.ts
 * Acceso de lectura a DB para la entidad Match.
 */

import { db } from "@/db";
import { matches, matchPlayerStats, inscriptions, leagueMembers, globalPlayers } from "@/db/schema";
import { eq, and, or, sql, asc, inArray, isNotNull } from "drizzle-orm";
import type { Match } from "@/db/schema";
import type {
	MatchResolutionData,
	PlayerResolutionRow,
	CedulaMatchData,
	CedulaPlayerRow,
} from "./model";
import { listActiveSuspensionsByLeague } from "@/entities/suspension/queries";
import { buildSuspendedMapForMatchDate, type CedulaSuspensionLabel } from "@/entities/suspension";
import type { LeaguePermissionContext } from "@/entities/league";

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

	// Consulta del roster del equipo via inscriptions → leagueMembers → globalPlayers.
	// Se ordena por credentialCode (mismo criterio que fetchCedulaRoster) para que
	// el orden en pantalla coincida con el de la cédula impresa que trae el árbitro.
	const fetchRoster = (teamId: string) =>
		db
			.select({
				inscriptionId: inscriptions.id,
				globalPlayerId: globalPlayers.id,
				fullName: globalPlayers.fullName,
				dorsal: leagueMembers.dorsal,
				credentialCode: leagueMembers.credentialCode,
			})
			.from(inscriptions)
			.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
			.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.where(and(eq(inscriptions.teamId, teamId), eq(leagueMembers.leagueId, row.leagueId)))
			.orderBy(asc(leagueMembers.credentialCode));

	const [homeRoster, awayRoster, existingStats, leagueSuspensions] = await Promise.all([
		fetchRoster(row.homeTeamId),
		fetchRoster(row.awayTeamId),
		db.query.matchPlayerStats.findMany({
			where: eq(matchPlayerStats.matchId, matchId),
		}),
		listActiveSuspensionsByLeague(row.leagueId),
	]);

	const statsByRegId = new Map(existingStats.map((s) => [s.playerRegistrationId, s]));
	// Mismo cruce que la cédula impresa (getCedulaDataForMatch): sin esto, un
	// jugador sancionado aparece disponible para capturar goles/asistencias.
	const suspendedMap = buildSuspendedMapForMatchDate(leagueSuspensions, row.matchDate);

	const buildPlayerRows = (
		roster: {
			inscriptionId: string;
			globalPlayerId: string;
			fullName: string;
			dorsal: number | null;
			credentialCode: number | null;
		}[],
	): PlayerResolutionRow[] =>
		roster.map((p) => {
			const stat = statsByRegId.get(p.inscriptionId) ?? null;
			return {
				registrationId: p.inscriptionId,
				playerProfileId: p.globalPlayerId,
				fullName: p.fullName,
				jerseyNumber: p.dorsal,
				credentialCode: p.credentialCode,
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
				suspended: suspendedMap.get(p.globalPlayerId) ?? null,
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

/**
 * Lo mínimo para resolver `canManageLeague(user, ...)` desde una page — evita
 * que `app/(print)/cedula/partido/[matchId]/page.tsx` arme su propio
 * `db.query.matches.findFirst` (§3.3 AGENTS.md: la page llama a entities).
 */
export async function getMatchPermissionContext(
	matchId: string,
): Promise<LeaguePermissionContext | null> {
	const row = await db.query.matches.findFirst({
		where: eq(matches.id, matchId),
		columns: { leagueId: true },
		with: { league: { columns: { organizationId: true } } },
	});
	if (!row) return null;
	return { leagueId: row.leagueId, organizationId: row.league?.organizationId ?? null };
}

// ---------------------------------------------------------------------------
// Cédula imprimible (docs/PLAN-CEDULA-IMPRESA.md)
// ---------------------------------------------------------------------------

const CEDULA_MATCH_RELATIONS = {
	matchday: { columns: { id: true, number: true, scheduledDate: true } },
	venue: { columns: { id: true, name: true } },
	homeTeam: { columns: { id: true, name: true } },
	awayTeam: { columns: { id: true, name: true } },
	league: { columns: { id: true, name: true, code: true, season: true, category: true } },
} as const;

type CedulaRosterRow = {
	globalPlayerId: string;
	fullName: string;
	dorsal: number | null;
	credentialCode: number | null;
};

/** Filas del roster con `credentialCode`, sólo jugadores con credencial asignada (decisión Jocobi, plan §12.2). */
function fetchCedulaRoster(teamId: string, leagueId: string) {
	return db
		.select({
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			dorsal: leagueMembers.dorsal,
			credentialCode: leagueMembers.credentialCode,
		})
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.where(
			and(
				eq(inscriptions.teamId, teamId),
				eq(leagueMembers.leagueId, leagueId),
				isNotNull(leagueMembers.credentialCode),
			),
		)
		.orderBy(asc(leagueMembers.credentialCode));
}

function buildCedulaRows(
	roster: CedulaRosterRow[],
	suspendedMap: Map<string, CedulaSuspensionLabel>,
): CedulaPlayerRow[] {
	return roster.map((p) => ({
		globalPlayerId: p.globalPlayerId,
		fullName: p.fullName,
		credentialCode: p.credentialCode as number, // NOT NULL por el where de fetchCedulaRoster
		dorsal: p.dorsal,
		suspended: suspendedMap.get(p.globalPlayerId) ?? null,
	}));
}

/** Datos de la cédula de UN partido — impresión individual. */
export async function getCedulaDataForMatch(matchId: string): Promise<CedulaMatchData | null> {
	const row = await db.query.matches.findFirst({
		where: eq(matches.id, matchId),
		with: CEDULA_MATCH_RELATIONS,
	});
	if (!row) return null;

	const [leagueSuspensions, homeRoster, awayRoster] = await Promise.all([
		listActiveSuspensionsByLeague(row.leagueId),
		fetchCedulaRoster(row.homeTeamId, row.leagueId),
		fetchCedulaRoster(row.awayTeamId, row.leagueId),
	]);

	const suspendedMap = buildSuspendedMapForMatchDate(leagueSuspensions, row.matchDate);

	return {
		matchId: row.id,
		cedula: row.cedula ?? null,
		matchdayNumber: row.matchday?.number ?? null,
		matchDate: row.matchDate,
		kickoffAt: row.kickoffAt ?? null,
		venueName: row.venue?.name ?? null,
		league: {
			name: row.league.name,
			code: row.league.code ?? null,
			season: row.league.season,
			category: row.league.category ?? null,
		},
		homeTeam: { id: row.homeTeam.id, name: row.homeTeam.name },
		awayTeam: { id: row.awayTeam.id, name: row.awayTeam.name },
		homePlayers: buildCedulaRows(homeRoster, suspendedMap),
		awayPlayers: buildCedulaRows(awayRoster, suspendedMap),
	};
}

/**
 * Datos de cédula de TODOS los partidos de una jornada — impresión en lote.
 * Una sola query de roster (batched por equipos de la jornada, no N+1) y una
 * sola carga de suspensiones activas de la liga; el cruce por fecha se hace
 * en memoria por partido (la fecha puede variar si hay reprogramados).
 */
export async function getCedulaDataForMatchday(matchdayId: string): Promise<CedulaMatchData[]> {
	const matchRows = await db.query.matches.findMany({
		where: eq(matches.matchdayId, matchdayId),
		with: CEDULA_MATCH_RELATIONS,
		orderBy: [asc(matches.kickoffAt), asc(matches.matchDate)],
	});
	if (matchRows.length === 0) return [];

	const leagueId = matchRows[0]!.leagueId;
	const teamIds = Array.from(new Set(matchRows.flatMap((m) => [m.homeTeamId, m.awayTeamId])));

	const [leagueSuspensions, rosterRows] = await Promise.all([
		listActiveSuspensionsByLeague(leagueId),
		db
			.select({
				teamId: inscriptions.teamId,
				globalPlayerId: globalPlayers.id,
				fullName: globalPlayers.fullName,
				dorsal: leagueMembers.dorsal,
				credentialCode: leagueMembers.credentialCode,
			})
			.from(inscriptions)
			.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
			.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.where(
				and(
					inArray(inscriptions.teamId, teamIds),
					eq(leagueMembers.leagueId, leagueId),
					isNotNull(leagueMembers.credentialCode),
				),
			)
			.orderBy(asc(leagueMembers.credentialCode)),
	]);

	const rosterByTeam = new Map<string, CedulaRosterRow[]>();
	for (const r of rosterRows) {
		const list = rosterByTeam.get(r.teamId) ?? [];
		list.push(r);
		rosterByTeam.set(r.teamId, list);
	}

	return matchRows.map((row) => {
		const suspendedMap = buildSuspendedMapForMatchDate(leagueSuspensions, row.matchDate);
		return {
			matchId: row.id,
			cedula: row.cedula ?? null,
			matchdayNumber: row.matchday?.number ?? null,
			matchDate: row.matchDate,
			kickoffAt: row.kickoffAt ?? null,
			venueName: row.venue?.name ?? null,
			league: {
				name: row.league.name,
				code: row.league.code ?? null,
				season: row.league.season,
				category: row.league.category ?? null,
			},
			homeTeam: { id: row.homeTeam.id, name: row.homeTeam.name },
			awayTeam: { id: row.awayTeam.id, name: row.awayTeam.name },
			homePlayers: buildCedulaRows(rosterByTeam.get(row.homeTeamId) ?? [], suspendedMap),
			awayPlayers: buildCedulaRows(rosterByTeam.get(row.awayTeamId) ?? [], suspendedMap),
		};
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
