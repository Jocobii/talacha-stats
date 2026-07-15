/**
 * entities/suspension/queries.ts
 * Acceso a DB para suspensions. Sin decisión de negocio (cuándo se dispara
 * una automática, cómo se escala una manual) — eso vive en features/discipline
 * (§3.7). Acepta `client` opcional para correr dentro de la tx de
 * match-resolution (mismo patrón que entities/league-config).
 */

import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	suspensions,
	globalPlayers,
	leagueMembers,
	inscriptions,
	teams,
	leagues,
} from "@/db/schema";
import type { ListQuery } from "@/shared/lib/list-query";
import { buildWhere, buildOrderBy } from "@/shared/lib/list-query";
import { orgSuspensionFilters } from "./filters";
import type {
	GlobalSuspensionListItemDto,
	SuspensionDto,
	SuspensionLeagueOption,
	SuspensionListItemDto,
	SuspensionRosterPlayer,
} from "./model";

/** A qué ligas puede ver/operar el usuario — owner: todas; organizer: solo las de su organización. */
export type SuspensionScope = { kind: "all" } | { kind: "org"; organizationId: string };

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export const SUSPENSION_DTO_COLUMNS = {
	id: suspensions.id,
	globalPlayerId: suspensions.globalPlayerId,
	leagueId: suspensions.leagueId,
	reason: suspensions.reason,
	reasonDetail: suspensions.reasonDetail,
	durationType: suspensions.durationType,
	matchesTotal: suspensions.matchesTotal,
	matchesServed: suspensions.matchesServed,
	durationValue: suspensions.durationValue,
	durationUnit: suspensions.durationUnit,
	startsOn: suspensions.startsOn,
	endsOn: suspensions.endsOn,
	status: suspensions.status,
	sourceMatchId: suspensions.sourceMatchId,
	recordedBy: suspensions.recordedBy,
	createdAt: suspensions.createdAt,
} as const;

/**
 * Mismas columnas que SUSPENSION_DTO_COLUMNS pero en el shape que espera
 * `columns` de la API relacional (`db.query.suspensions.findMany`) — ahí
 * es un mapa de booleans, no las referencias de columna que usa `.select()`.
 */
const SUSPENSION_QUERY_COLUMNS = {
	id: true,
	globalPlayerId: true,
	leagueId: true,
	reason: true,
	reasonDetail: true,
	durationType: true,
	matchesTotal: true,
	matchesServed: true,
	durationValue: true,
	durationUnit: true,
	startsOn: true,
	endsOn: true,
	status: true,
	sourceMatchId: true,
	recordedBy: true,
	createdAt: true,
} as const;

export async function findSuspension(
	id: string,
	client: DbOrTx = db,
): Promise<SuspensionDto | null> {
	const rows = await client
		.select(SUSPENSION_DTO_COLUMNS)
		.from(suspensions)
		.where(eq(suspensions.id, id))
		.limit(1);
	return rows[0] ?? null;
}

/** Todas las suspensiones de una liga, más recientes primero — para el admin. */
export async function listSuspensionsByLeague(
	leagueId: string,
	client: DbOrTx = db,
): Promise<SuspensionDto[]> {
	return client.query.suspensions.findMany({
		where: eq(suspensions.leagueId, leagueId),
		columns: SUSPENSION_QUERY_COLUMNS,
		orderBy: (s, { desc }) => [desc(s.createdAt)],
	});
}

/**
 * Todas las suspensiones de una liga con nombre del jugador y equipo ACTUAL
 * (via inscriptions — no el equipo al momento de la sanción, que no se
 * guarda) — para el listado de admin (B7). Más recientes primero.
 */
export async function listSuspensionsByLeagueDetailed(
	leagueId: string,
	client: DbOrTx = db,
): Promise<SuspensionListItemDto[]> {
	const rows = await client
		.select({
			...SUSPENSION_DTO_COLUMNS,
			playerName: globalPlayers.fullName,
			teamName: teams.name,
		})
		.from(suspensions)
		.innerJoin(globalPlayers, eq(suspensions.globalPlayerId, globalPlayers.id))
		.innerJoin(
			leagueMembers,
			and(eq(leagueMembers.globalPlayerId, globalPlayers.id), eq(leagueMembers.leagueId, leagueId)),
		)
		.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(eq(suspensions.leagueId, leagueId))
		.orderBy(desc(suspensions.createdAt));

	return rows;
}

/**
 * Suspensiones de TODAS las ligas visibles para el usuario (B7b,
 * /admin/suspensiones) — mismo shape que listSuspensionsByLeagueDetailed
 * más el nombre de la liga, para operar sanciones de varias ligas sin
 * cambiar de pantalla.
 */
export async function listSuspensionsForScopeDetailed(
	scope: SuspensionScope,
	client: DbOrTx = db,
): Promise<GlobalSuspensionListItemDto[]> {
	const rows = await client
		.select({
			...SUSPENSION_DTO_COLUMNS,
			playerName: globalPlayers.fullName,
			teamName: teams.name,
			leagueName: leagues.name,
		})
		.from(suspensions)
		.innerJoin(globalPlayers, eq(suspensions.globalPlayerId, globalPlayers.id))
		.innerJoin(leagues, eq(leagues.id, suspensions.leagueId))
		.innerJoin(
			leagueMembers,
			and(
				eq(leagueMembers.globalPlayerId, globalPlayers.id),
				eq(leagueMembers.leagueId, leagues.id),
			),
		)
		.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(scope.kind === "org" ? eq(leagues.organizationId, scope.organizationId) : undefined)
		.orderBy(desc(suspensions.createdAt));

	return rows;
}

/** Ligas visibles para el usuario — para el selector de liga en el alta manual global (B7b). */
export async function listLeagueOptionsForScope(
	scope: SuspensionScope,
	client: DbOrTx = db,
): Promise<SuspensionLeagueOption[]> {
	return client
		.select({ id: leagues.id, name: leagues.name })
		.from(leagues)
		.where(scope.kind === "org" ? eq(leagues.organizationId, scope.organizationId) : undefined)
		.orderBy(leagues.name);
}

/**
 * Roster vigente de la liga (jugador + equipo actual) — para el picker de
 * "Registrar sanción" (B7, modo manual desde cero).
 */
export async function listLeagueRosterForDiscipline(
	leagueId: string,
	client: DbOrTx = db,
): Promise<SuspensionRosterPlayer[]> {
	return client
		.select({
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			teamName: teams.name,
		})
		.from(leagueMembers)
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(eq(leagueMembers.leagueId, leagueId))
		.orderBy(globalPlayers.fullName);
}

/**
 * Filtra por `status = 'active'` en DB — NO es lo mismo que "vigente hoy":
 * una suspensión 'time' con `status` todavía 'active' puede ya haber pasado
 * su `ends_on` (nada la voltea a 'served' automáticamente). Quien consuma
 * esto y le importe la precisión debe aplicar `isSuspensionActive()` encima.
 */
export async function listActiveSuspensionsByLeague(
	leagueId: string,
	client: DbOrTx = db,
): Promise<SuspensionDto[]> {
	return client.query.suspensions.findMany({
		where: and(eq(suspensions.leagueId, leagueId), eq(suspensions.status, "active")),
		columns: SUSPENSION_QUERY_COLUMNS,
	});
}

/**
 * Suspensión 'matches' activa de un jugador en una liga, si existe — el motor
 * (B3) la consulta antes de crear una nueva para no duplicar sanciones por el
 * mismo ciclo de acumulación.
 */
export async function findActiveMatchesSuspension(
	globalPlayerId: string,
	leagueId: string,
	client: DbOrTx = db,
): Promise<SuspensionDto | null> {
	const rows = await client
		.select(SUSPENSION_DTO_COLUMNS)
		.from(suspensions)
		.where(
			and(
				eq(suspensions.globalPlayerId, globalPlayerId),
				eq(suspensions.leagueId, leagueId),
				eq(suspensions.durationType, "matches"),
				eq(suspensions.status, "active"),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

/** Todas las suspensiones 'matches' activas de una liga — para el decremento por jornada (B5). */
export async function listActiveMatchesSuspensionsByLeague(
	leagueId: string,
	client: DbOrTx = db,
): Promise<SuspensionDto[]> {
	return client.query.suspensions.findMany({
		where: and(
			eq(suspensions.leagueId, leagueId),
			eq(suspensions.durationType, "matches"),
			eq(suspensions.status, "active"),
		),
		columns: SUSPENSION_QUERY_COLUMNS,
	});
}

/**
 * Suspensión ya creada a partir de este partido, para este jugador y motivo —
 * el motor automático (B3) la consulta antes de crear una nueva, así
 * re-resolver una cédula (editar y volver a guardar) no duplica sanciones.
 */
export async function findSuspensionBySourceMatch(
	sourceMatchId: string,
	globalPlayerId: string,
	reason: SuspensionDto["reason"],
	client: DbOrTx = db,
): Promise<SuspensionDto | null> {
	const rows = await client
		.select(SUSPENSION_DTO_COLUMNS)
		.from(suspensions)
		.where(
			and(
				eq(suspensions.sourceMatchId, sourceMatchId),
				eq(suspensions.globalPlayerId, globalPlayerId),
				eq(suspensions.reason, reason),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Cuántas suspensiones por `reason` tiene un jugador en una liga — el motor
 * (B3) usa esto para 'yellow_accumulation': cada fila ya creada representa un
 * ciclo de `yellow_threshold` ya sancionado (se cuenta aunque esté 'lifted':
 * perdonar la sanción no des-cruza el umbral que la disparó).
 */
export async function countSuspensionsByReason(
	globalPlayerId: string,
	leagueId: string,
	reason: SuspensionDto["reason"],
	client: DbOrTx = db,
): Promise<number> {
	const [row] = await client
		.select({ total: count() })
		.from(suspensions)
		.where(
			and(
				eq(suspensions.globalPlayerId, globalPlayerId),
				eq(suspensions.leagueId, leagueId),
				eq(suspensions.reason, reason),
			),
		);
	return row?.total ?? 0;
}

/**
 * ¿El jugador tiene alguna suspensión `status='active'` en esta liga, sin
 * importar `reason`/`duration_type`? El sync de `leagueMembers.status` (B5)
 * usa esto: cualquier tipo de sanción vigente debe reflejarse en el roster,
 * no solo las de 'matches'.
 */
export async function hasActiveSuspension(
	globalPlayerId: string,
	leagueId: string,
	client: DbOrTx = db,
): Promise<boolean> {
	const rows = await client
		.select({ id: suspensions.id })
		.from(suspensions)
		.where(
			and(
				eq(suspensions.globalPlayerId, globalPlayerId),
				eq(suspensions.leagueId, leagueId),
				eq(suspensions.status, "active"),
			),
		)
		.limit(1);
	return rows.length > 0;
}

export async function insertSuspension(
	data: Omit<SuspensionDto, "id" | "createdAt">,
	client: DbOrTx = db,
): Promise<SuspensionDto> {
	const [row] = await client.insert(suspensions).values(data).returning(SUSPENSION_DTO_COLUMNS);
	return row!;
}

export async function updateSuspension(
	id: string,
	values: Partial<Omit<SuspensionDto, "id" | "createdAt">>,
	client: DbOrTx = db,
): Promise<SuspensionDto | null> {
	const rows = await client
		.update(suspensions)
		.set({ ...values, updatedAt: new Date() })
		.where(eq(suspensions.id, id))
		.returning(SUSPENSION_DTO_COLUMNS);
	return rows[0] ?? null;
}

/**
 * Listado paginado/filtrado/ordenado de suspensiones para el molde
 * "módulo data-heavy" de /admin/suspensiones (AdminTable + FilterBar en URL,
 * espejo de listOrgPlayers/listOrgTeams) — contrato ListQuery. `scope` decide
 * el alcance de negocio (owner: todas las ligas; organizer: solo las suyas),
 * igual que listSuspensionsForScopeDetailed, pero aquí se combina con los
 * filtros/orden/paginación que manda la URL.
 */
export async function listSuspensionsForScopePaged(
	scope: SuspensionScope,
	query: ListQuery,
	client: DbOrTx = db,
): Promise<{ rows: GlobalSuspensionListItemDto[]; total: number }> {
	const filterWhere = buildWhere(orgSuspensionFilters, query.filters);
	const scopeWhere =
		scope.kind === "org" ? eq(leagues.organizationId, scope.organizationId) : undefined;
	const where = and(scopeWhere, filterWhere);
	const orderBy = buildOrderBy(orgSuspensionFilters, query.sort);
	const offset = (query.page - 1) * query.pageSize;

	const [rows, countResult] = await Promise.all([
		client
			.select({
				...SUSPENSION_DTO_COLUMNS,
				playerName: globalPlayers.fullName,
				teamName: teams.name,
				leagueName: leagues.name,
			})
			.from(suspensions)
			.innerJoin(globalPlayers, eq(suspensions.globalPlayerId, globalPlayers.id))
			.innerJoin(leagues, eq(leagues.id, suspensions.leagueId))
			.innerJoin(
				leagueMembers,
				and(
					eq(leagueMembers.globalPlayerId, globalPlayers.id),
					eq(leagueMembers.leagueId, leagues.id),
				),
			)
			.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
			.innerJoin(teams, eq(teams.id, inscriptions.teamId))
			.where(where)
			.orderBy(...(orderBy.length > 0 ? orderBy : [desc(suspensions.createdAt)]))
			.limit(query.pageSize)
			.offset(offset),

		client
			.select({ total: sql<number>`COUNT(*)::int` })
			.from(suspensions)
			.innerJoin(globalPlayers, eq(suspensions.globalPlayerId, globalPlayers.id))
			.innerJoin(leagues, eq(leagues.id, suspensions.leagueId))
			.innerJoin(
				leagueMembers,
				and(
					eq(leagueMembers.globalPlayerId, globalPlayers.id),
					eq(leagueMembers.leagueId, leagues.id),
				),
			)
			.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
			.innerJoin(teams, eq(teams.id, inscriptions.teamId))
			.where(where),
	]);

	return { rows, total: countResult[0]?.total ?? 0 };
}

/**
 * Total de suspensiones visibles para el scope, sin filtros — para distinguir
 * "vacío sin datos" de "vacío por filtros" y para el label "X de Y" (mismo
 * patrón que countOrgPlayers).
 */
export async function countSuspensionsForScope(
	scope: SuspensionScope,
	client: DbOrTx = db,
): Promise<number> {
	const rows = await client
		.select({ total: sql<number>`COUNT(*)::int` })
		.from(suspensions)
		.innerJoin(leagues, eq(leagues.id, suspensions.leagueId))
		.where(scope.kind === "org" ? eq(leagues.organizationId, scope.organizationId) : undefined);
	return rows[0]?.total ?? 0;
}
