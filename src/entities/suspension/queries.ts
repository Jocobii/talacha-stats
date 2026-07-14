/**
 * entities/suspension/queries.ts
 * Acceso a DB para suspensions. Sin decisión de negocio (cuándo se dispara
 * una automática, cómo se escala una manual) — eso vive en features/discipline
 * (§3.7). Acepta `client` opcional para correr dentro de la tx de
 * match-resolution (mismo patrón que entities/league-config).
 */

import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { suspensions } from "@/db/schema";
import type { SuspensionDto } from "./model";

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
		columns: SUSPENSION_DTO_COLUMNS,
		orderBy: (s, { desc }) => [desc(s.createdAt)],
	});
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
		columns: SUSPENSION_DTO_COLUMNS,
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
		columns: SUSPENSION_DTO_COLUMNS,
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
