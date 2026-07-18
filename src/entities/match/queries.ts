/**
 * entities/match/queries.ts
 * Acceso de lectura a DB para la entidad Match.
 */

import { db } from "@/db";
import {
	matches,
	matchPlayerStats,
	inscriptions,
	leagueMembers,
	globalPlayers,
	playoffSlots,
} from "@/db/schema";
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
import { findCoveringCredentialsForPlayers } from "@/entities/player-credential/queries";
import type { LeagueForAuthCheck } from "@/entities/player-credential/lib/can-play-in-league";

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

export type PlayoffMatchRoundInfo = {
	round: number;
	isThirdPlace: boolean;
	zoneName: string;
	zoneColor: string;
	/** Ronda más alta de ESE bracket — para poder etiquetar "Cuartos"/"Semifinal"/"Final". */
	maxRound: number;
};

/**
 * Info de ronda/zona de playoff por partido, indexada por `matchId`. Todos
 * los partidos de TODAS las rondas de una liga (cuartos, semis, final, de
 * cualquier zona) cuelgan del mismo matchday sentinel (`phase: "playoff"`),
 * así que la pantalla de captura necesita esto para poder agrupar/etiquetar
 * en vez de mostrar una tabla plana mezclando rondas — ver
 * jornadas/[matchdayId]/page.tsx y playoff-round-label.ts.
 */
export async function getPlayoffSlotInfoForMatches(
	matchIds: string[],
): Promise<Map<string, PlayoffMatchRoundInfo>> {
	if (matchIds.length === 0) return new Map();

	const slots = await db.query.playoffSlots.findMany({
		where: inArray(playoffSlots.matchId, matchIds),
		columns: { matchId: true, round: true, isThirdPlace: true, bracketId: true },
		with: { bracket: { columns: { zoneName: true, zoneColor: true } } },
	});
	if (slots.length === 0) return new Map();

	// El round máximo se calcula sobre TODOS los slots del bracket, no solo los
	// que ya tienen match creado — si no, un bracket que aún no llegó a la
	// final subestimaría maxRound y etiquetaría mal la ronda actual.
	const bracketIds = [...new Set(slots.map((s) => s.bracketId))];
	const allBracketSlots = await db.query.playoffSlots.findMany({
		where: inArray(playoffSlots.bracketId, bracketIds),
		columns: { bracketId: true, round: true },
	});
	const maxRoundByBracket = new Map<string, number>();
	for (const s of allBracketSlots) {
		maxRoundByBracket.set(s.bracketId, Math.max(maxRoundByBracket.get(s.bracketId) ?? 0, s.round));
	}

	const result = new Map<string, PlayoffMatchRoundInfo>();
	for (const s of slots) {
		if (!s.matchId) continue;
		result.set(s.matchId, {
			round: s.round,
			isThirdPlace: s.isThirdPlace,
			zoneName: s.bracket.zoneName,
			zoneColor: s.bracket.zoneColor,
			maxRound: maxRoundByBracket.get(s.bracketId) ?? s.round,
		});
	}
	return result;
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
	league: {
		columns: {
			id: true,
			name: true,
			code: true,
			season: true,
			category: true,
			organizationId: true,
			status: true,
		},
	},
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

/**
 * Resuelve, para un conjunto de jugadores, el motivo de bloqueo a imprimir en
 * la cédula — en orden de importancia (decisión Jocobi, jul 2026):
 *   1. Sin pase (`player_credentials`) vigente para la liga → "NO JUEGA".
 *   2. Suspensión activa a la fecha del partido → tag/motivo de la suspensión.
 * Nunca se oculta al jugador de la lista por ninguna de las dos razones —
 * solo se marca (docs/CEDULA-IMPRESA-SPEC.md §4: el suspendido nunca se omite;
 * aplicamos la misma regla a la falta de credencial vigente).
 */
function buildBlockedMap(
	globalPlayerIds: string[],
	credentialCoverage: Map<string, boolean>,
	suspendedMap: Map<string, CedulaSuspensionLabel>,
): Map<string, { reason: "credential" | "suspension"; tag: string; why: string }> {
	const blocked = new Map<
		string,
		{ reason: "credential" | "suspension"; tag: string; why: string }
	>();
	for (const id of globalPlayerIds) {
		if (credentialCoverage.get(id) !== true) {
			blocked.set(id, { reason: "credential", tag: "NO JUEGA", why: "Sin credencial vigente" });
			continue;
		}
		const suspension = suspendedMap.get(id);
		if (suspension) blocked.set(id, { reason: "suspension", ...suspension });
	}
	return blocked;
}

function buildCedulaRows(
	roster: CedulaRosterRow[],
	blockedMap: Map<string, { reason: "credential" | "suspension"; tag: string; why: string }>,
): CedulaPlayerRow[] {
	return roster.map((p) => ({
		globalPlayerId: p.globalPlayerId,
		fullName: p.fullName,
		credentialCode: p.credentialCode as number, // NOT NULL por el where de fetchCedulaRoster
		dorsal: p.dorsal,
		blocked: blockedMap.get(p.globalPlayerId) ?? null,
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

	const leagueForCheck: LeagueForAuthCheck = {
		id: row.league.id,
		organizationId: row.league.organizationId,
		status: row.league.status,
	};
	const allPlayerIds = [...homeRoster, ...awayRoster].map((p) => p.globalPlayerId);
	const credentialCoverage = await findCoveringCredentialsForPlayers(
		db,
		allPlayerIds,
		leagueForCheck,
	);

	const homeBlocked = buildBlockedMap(
		homeRoster.map((p) => p.globalPlayerId),
		credentialCoverage,
		suspendedMap,
	);
	const awayBlocked = buildBlockedMap(
		awayRoster.map((p) => p.globalPlayerId),
		credentialCoverage,
		suspendedMap,
	);

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
		homePlayers: buildCedulaRows(homeRoster, homeBlocked),
		awayPlayers: buildCedulaRows(awayRoster, awayBlocked),
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

	// Una sola resolución de cobertura de credencial para toda la jornada — la
	// liga es la misma para todos los partidos de un matchday.
	const firstRow = matchRows[0]!;
	const leagueForCheck: LeagueForAuthCheck = {
		id: firstRow.league.id,
		organizationId: firstRow.league.organizationId,
		status: firstRow.league.status,
	};
	const allPlayerIds = Array.from(new Set(rosterRows.map((r) => r.globalPlayerId)));
	const credentialCoverage = await findCoveringCredentialsForPlayers(
		db,
		allPlayerIds,
		leagueForCheck,
	);

	return matchRows.map((row) => {
		const suspendedMap = buildSuspendedMapForMatchDate(leagueSuspensions, row.matchDate);
		const homeRoster = rosterByTeam.get(row.homeTeamId) ?? [];
		const awayRoster = rosterByTeam.get(row.awayTeamId) ?? [];
		const homeBlocked = buildBlockedMap(
			homeRoster.map((p) => p.globalPlayerId),
			credentialCoverage,
			suspendedMap,
		);
		const awayBlocked = buildBlockedMap(
			awayRoster.map((p) => p.globalPlayerId),
			credentialCoverage,
			suspendedMap,
		);
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
			homePlayers: buildCedulaRows(homeRoster, homeBlocked),
			awayPlayers: buildCedulaRows(awayRoster, awayBlocked),
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

/**
 * Variante playoff-aware de `getNextScheduledMatch`. Todos los partidos de
 * TODAS las rondas de una liga (cuartos, semis, final...) cuelgan del mismo
 * matchday sentinel (`phase: "playoff"`, ver playoffs/start), así que filtrar
 * solo por `matchdayId` no alcanza: en cuanto se resuelve el último partido
 * de una ronda, `propagatePlayoffWinner` puede crear en el acto el partido de
 * la ronda siguiente con `status: "scheduled"`, y ese candidato "cuela" como
 * el "siguiente partido" del flujo "Guardar y siguiente" — llevando al
 * organizador a capturar una ronda que todavía no se ha jugado.
 *
 * Acota los candidatos a los que su `playoff_slot.round` coincide con la
 * ronda del partido recién resuelto (`round`), para que el auto-avance nunca
 * cruce a una ronda posterior. No toca el flujo de jornadas regulares — esos
 * partidos no tienen `playoff_slot` asociado y usan `getNextScheduledMatch`.
 */
export async function getNextScheduledPlayoffMatch(
	matchdayId: string,
	afterMatchId: string,
	round: number,
): Promise<{ id: string } | null> {
	const all = await db.query.matches.findMany({
		where: and(eq(matches.matchdayId, matchdayId), eq(matches.status, "scheduled")),
		orderBy: [asc(matches.kickoffAt), asc(matches.createdAt)],
		columns: { id: true },
	});
	if (all.length === 0) return null;

	const matchIds = all.map((m) => m.id);
	const slots = await db.query.playoffSlots.findMany({
		where: and(isNotNull(playoffSlots.matchId), inArray(playoffSlots.matchId, matchIds)),
		columns: { matchId: true, round: true },
	});
	const roundByMatchId = new Map(slots.map((s) => [s.matchId as string, s.round]));

	const sameRound = all.filter((m) => roundByMatchId.get(m.id) === round);
	if (sameRound.length === 0) return null;

	const currentIdx = sameRound.findIndex((m) => m.id === afterMatchId);
	if (currentIdx === -1) return sameRound[0] ?? null;
	return sameRound[currentIdx + 1] ?? null;
}
