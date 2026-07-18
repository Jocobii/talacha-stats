/**
 * entities/suspension/queries.ts
 * Acceso a DB para suspensions. Sin decisión de negocio (cuándo se dispara
 * una automática, cómo se escala una manual) — eso vive en features/discipline
 * (§3.7). Acepta `client` opcional para correr dentro de la tx de
 * match-resolution (mismo patrón que entities/league-config).
 */

import { and, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";
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
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { orgSuspensionFilters } from "./filters";
import { isSuspensionActive } from "./lib/is-suspension-active";
import type {
	DisciplinePlayerSearchResult,
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

/** Fila pública de sancionados — sin campos internos (recordedBy, sourceMatchId). */
export type PublicSuspensionListItem = Pick<
	SuspensionDto,
	| "id"
	| "reason"
	| "reasonDetail"
	| "durationType"
	| "matchesTotal"
	| "matchesServed"
	| "durationValue"
	| "durationUnit"
	| "endsOn"
	| "status"
> & { playerName: string; teamName: string };

/**
 * Sancionados VIGENTES de una liga para la página pública — a diferencia de
 * `listSuspensionsByLeagueDetailed` (admin, historial completo), esto:
 *  1. Solo trae `status = 'active'` en DB (excluye 'served'/'lifted').
 *  2. Filtra en JS con `isSuspensionActive` porque 'active' + duration_type
 *     'time' puede ya estar vencida (nada la voltea sola — ver esa función).
 *  3. Expone solo lo mínimo para acceso público (nombre, equipo, motivo,
 *     duración restante) — nunca `recordedBy`/`sourceMatchId`.
 */
export async function getPublicActiveSuspensions(
	leagueId: string,
	client: DbOrTx = db,
): Promise<PublicSuspensionListItem[]> {
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
		.where(and(eq(suspensions.leagueId, leagueId), eq(suspensions.status, "active")))
		.orderBy(desc(suspensions.createdAt));

	const todayIso = new Date().toISOString().slice(0, 10);

	return rows
		.filter((r) => isSuspensionActive(r, todayIso))
		.map((r) => ({
			id: r.id,
			reason: r.reason,
			reasonDetail: r.reasonDetail,
			durationType: r.durationType,
			matchesTotal: r.matchesTotal,
			matchesServed: r.matchesServed,
			durationValue: r.durationValue,
			durationUnit: r.durationUnit,
			endsOn: r.endsOn,
			status: r.status,
			playerName: r.playerName,
			teamName: r.teamName,
		}));
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

/**
 * Ligas visibles para el usuario — para el selector de liga en el alta manual
 * global (B7b) y el filtro "Todas las ligas" de la vista global. Solo activas:
 * no tiene sentido registrar/filtrar sanciones sobre una liga ya terminada
 * desde el flujo de día a día — el histórico se consulta liga por liga.
 */
export async function listLeagueOptionsForScope(
	scope: SuspensionScope,
	client: DbOrTx = db,
): Promise<SuspensionLeagueOption[]> {
	return client
		.select({ id: leagues.id, name: leagues.name })
		.from(leagues)
		.where(
			and(
				eq(leagues.status, "active"),
				scope.kind === "org" ? eq(leagues.organizationId, scope.organizationId) : undefined,
			),
		)
		.orderBy(leagues.name);
}

/**
 * Roster vigente de la liga (jugador + equipo actual) — para el picker de
 * "Registrar sanción" (B7, modo manual desde cero). Sin límite ni búsqueda —
 * usado solo por la carga SSR inicial de la page (app/admin/leagues/[id]/
 * suspensiones/page.tsx); el picker en vivo usa searchLeagueRosterForDiscipline.
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
 * Roster de la liga con búsqueda por nombre y límite — picker "autocomplete"
 * del jugador en "Registrar sanción" (reemplaza el Listbox con todo el
 * roster, que en ligas grandes era impracticable de desplazar). Sin `q`,
 * devuelve los primeros `limit` alfabéticamente — el picker le indica al
 * usuario que escriba si no encuentra al jugador ahí.
 */
export async function searchLeagueRosterForDiscipline(
	leagueId: string,
	opts: { q?: string; limit?: number },
	client: DbOrTx = db,
): Promise<SuspensionRosterPlayer[]> {
	const q = opts.q?.trim();
	const canonical = q ? sanitizeToCanonical(q) : "";
	const limit = opts.limit ?? 10;

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
		.where(
			canonical
				? and(
						eq(leagueMembers.leagueId, leagueId),
						ilike(globalPlayers.fullNameCanonical, `%${canonical}%`),
					)
				: eq(leagueMembers.leagueId, leagueId),
		)
		.orderBy(globalPlayers.fullName)
		.limit(limit);
}

/**
 * Búsqueda de jugador por nombre org/owner-wide (según `scope`), con sus
 * membresías de liga incluidas — paso 1 del flujo invertido de "Registrar
 * sanción" en modo global (B7b): primero se busca al jugador, luego se
 * deriva/elige la liga entre sus membresías, en vez de elegir liga primero y
 * navegar su roster completo. Requiere `q` (mínimo 2 letras, igual que
 * searchOrgGlobalPlayers) — a diferencia del roster de una sola liga, un
 * "primeros 10" sin texto sobre TODOS los jugadores de la organización no es
 * útil. Dos queries: primero los `limit` jugadores distintos que matchean
 * (paginación real), luego todas sus membresías — evita que un jugador con
 * muchas ligas desplace a otros jugadores del límite.
 */
export async function searchPlayersForDiscipline(
	scope: SuspensionScope,
	opts: { q: string; limit?: number },
	client: DbOrTx = db,
): Promise<DisciplinePlayerSearchResult[]> {
	const canonical = sanitizeToCanonical(opts.q.trim());
	const limit = opts.limit ?? 10;
	if (!canonical) return [];

	const scopeWhere =
		scope.kind === "org" ? eq(leagues.organizationId, scope.organizationId) : undefined;

	const playerRows = await client
		.selectDistinctOn([globalPlayers.id], {
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
		})
		.from(globalPlayers)
		.innerJoin(leagueMembers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.where(and(scopeWhere, ilike(globalPlayers.fullNameCanonical, `%${canonical}%`)))
		.orderBy(globalPlayers.id)
		.limit(limit);

	if (playerRows.length === 0) return [];
	const ids = playerRows.map((p) => p.globalPlayerId);

	const [memberRows, activeSuspensionRows] = await Promise.all([
		client
			.select({
				globalPlayerId: globalPlayers.id,
				leagueId: leagues.id,
				leagueName: leagues.name,
				teamName: teams.name,
			})
			.from(leagueMembers)
			.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
			.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
			.innerJoin(teams, eq(teams.id, inscriptions.teamId))
			// Solo membresías en ligas activas: no tiene sentido ofrecer una liga
			// terminada como destino al registrar una sanción nueva (§ Registrar
			// sanción, flujo global).
			.where(and(inArray(globalPlayers.id, ids), eq(leagues.status, "active"), scopeWhere))
			.orderBy(leagues.name),

		// Para marcar en el picker qué membresías ya tienen una sanción activa —
		// no tiene sentido registrar otra sobre la misma liga (ver nota en model.ts).
		client
			.select({ globalPlayerId: suspensions.globalPlayerId, leagueId: suspensions.leagueId })
			.from(suspensions)
			.where(and(inArray(suspensions.globalPlayerId, ids), eq(suspensions.status, "active"))),
	]);

	const activeSet = new Set(activeSuspensionRows.map((r) => `${r.globalPlayerId}:${r.leagueId}`));

	const memberships = new Map<string, DisciplinePlayerSearchResult["memberships"]>();
	for (const r of memberRows) {
		const list = memberships.get(r.globalPlayerId) ?? [];
		list.push({
			leagueId: r.leagueId,
			leagueName: r.leagueName,
			teamName: r.teamName,
			hasActiveSuspension: activeSet.has(`${r.globalPlayerId}:${r.leagueId}`),
		});
		memberships.set(r.globalPlayerId, list);
	}

	return playerRows
		.map((p) => ({ ...p, memberships: memberships.get(p.globalPlayerId) ?? [] }))
		.sort((a, b) => a.fullName.localeCompare(b.fullName));
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
