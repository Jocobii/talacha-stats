/**
 * features/discipline/manage-suspensions.ts
 *
 * Lógica server de administración manual de suspensiones (B6/B7,
 * §5.2 docs/MODULOS-GESTION-LIGA.md): listar para el admin, dar de alta un
 * caso manual desde cero, y escalar/levantar una suspensión existente.
 *
 * El motor automático (B3, apply-card-discipline.ts) es la ÚNICA vía para
 * `reason: 'red_card'/'yellow_accumulation'` — este módulo nunca crea esas
 * razones, solo 'manual', y nunca las re-clasifica.
 *
 * SOLO SERVER — importa @/db. No se re-exporta desde index.ts.
 */

import { db } from "@/db";
import type { SessionUser } from "@/shared/lib/auth";
import {
	countSuspensionsForScope,
	findSuspension,
	insertSuspension,
	listLeagueOptionsForScope,
	listLeagueRosterForDiscipline,
	listSuspensionsByLeagueDetailed,
	listSuspensionsForScopeDetailed,
	listSuspensionsForScopePaged,
	searchLeagueRosterForDiscipline,
	searchPlayersForDiscipline,
	updateSuspension,
	type SuspensionScope,
} from "@/entities/suspension/queries";
import type { ListQuery } from "@/shared/lib/list-query";
import type {
	CreateManualSuspensionInput,
	DisciplinePlayerSearchResult,
	EscalateSuspensionInput,
	GlobalSuspensionListItemDto,
	SuspensionDto,
	SuspensionLeagueOption,
	SuspensionListItemDto,
	SuspensionRosterPlayer,
} from "@/entities/suspension/model";
import { syncLeagueMemberStatus } from "./sync-league-member-status";
import { addDurationIso, todayIso } from "./lib/add-duration";

export async function listSuspensionsForLeague(leagueId: string): Promise<SuspensionListItemDto[]> {
	return listSuspensionsByLeagueDetailed(leagueId);
}

export async function listRosterForLeague(leagueId: string): Promise<SuspensionRosterPlayer[]> {
	return listLeagueRosterForDiscipline(leagueId);
}

/**
 * Roster con búsqueda por nombre y límite — picker "autocomplete" del
 * jugador en "Registrar sanción" (B7/B7b). Sin `q`, primeros `limit`
 * alfabéticamente.
 */
export async function searchRosterForLeague(
	leagueId: string,
	opts: { q?: string; limit?: number },
): Promise<SuspensionRosterPlayer[]> {
	return searchLeagueRosterForDiscipline(leagueId, opts);
}

/**
 * Búsqueda de jugador por nombre org/owner-wide, con sus membresías de liga
 * — paso 1 de "Registrar sanción" en modo global (B7b). Ver detalle en
 * entities/suspension/queries.ts.
 */
export async function searchPlayersForScope(
	scope: SuspensionScope,
	opts: { q: string; limit?: number },
): Promise<DisciplinePlayerSearchResult[]> {
	return searchPlayersForDiscipline(scope, opts);
}

/**
 * A qué ligas puede ver/operar el usuario (B7b, /admin/suspensiones):
 * owner ve todas, organizer solo las de su propia organización — mismo
 * criterio que `canManageLeague`.
 */
export function scopeForUser(user: SessionUser): SuspensionScope | null {
	if (user.role === "owner") return { kind: "all" };
	if (!user.organizationId) return null; // organizer sin org: no gestiona ninguna liga
	return { kind: "org", organizationId: user.organizationId };
}

/** Listado global de suspensiones (B7b) — todas las ligas visibles para el usuario. */
export async function listSuspensionsForScope(
	scope: SuspensionScope,
): Promise<GlobalSuspensionListItemDto[]> {
	return listSuspensionsForScopeDetailed(scope);
}

/** Ligas visibles para el usuario — para el selector de liga del alta manual global (B7b). */
export async function listLeaguesForScope(
	scope: SuspensionScope,
): Promise<SuspensionLeagueOption[]> {
	return listLeagueOptionsForScope(scope);
}

/**
 * Listado paginado/filtrado/ordenado (molde data-heavy, /admin/suspensiones)
 * — contrato ListQuery. Usado tanto por la vista owner (búsqueda simple) como
 * por la vista organizador (FilterBar completo).
 */
export async function listSuspensionsForScopePage(
	scope: SuspensionScope,
	query: ListQuery,
): Promise<{ rows: GlobalSuspensionListItemDto[]; total: number }> {
	return listSuspensionsForScopePaged(scope, query);
}

/** Total sin filtros — distingue "vacío sin datos" de "vacío por filtros". */
export async function countSuspensionsForScopeTotal(scope: SuspensionScope): Promise<number> {
	return countSuspensionsForScope(scope);
}

export type CreateManualSuspensionResult =
	| { ok: true; suspension: SuspensionDto }
	| { ok: false; error: string; status: 400 };

/** Alta manual desde cero (mockup: panel "Registrar sanción", modo "new"). */
export async function createManualSuspension(
	leagueId: string,
	input: CreateManualSuspensionInput,
	recordedBy: string,
): Promise<CreateManualSuspensionResult> {
	return db.transaction(async (tx) => {
		const base = {
			globalPlayerId: input.globalPlayerId,
			leagueId,
			reason: "manual" as const,
			reasonDetail: input.reasonDetail,
			matchesServed: 0,
			status: "active" as const,
			sourceMatchId: null,
			recordedBy,
		};

		let suspension: SuspensionDto;
		if (input.durationType === "matches") {
			suspension = await insertSuspension(
				{
					...base,
					durationType: "matches",
					matchesTotal: input.matchesTotal,
					durationValue: null,
					durationUnit: null,
					startsOn: null,
					endsOn: null,
				},
				tx,
			);
		} else if (input.durationType === "time") {
			const startsOn = todayIso();
			suspension = await insertSuspension(
				{
					...base,
					durationType: "time",
					matchesTotal: null,
					durationValue: input.durationValue,
					durationUnit: input.durationUnit,
					startsOn,
					endsOn: addDurationIso(startsOn, input.durationValue, input.durationUnit),
				},
				tx,
			);
		} else {
			suspension = await insertSuspension(
				{
					...base,
					durationType: "permanent",
					matchesTotal: null,
					durationValue: null,
					durationUnit: null,
					startsOn: null,
					endsOn: null,
				},
				tx,
			);
		}

		await syncLeagueMemberStatus(tx, input.globalPlayerId, leagueId);
		return { ok: true, suspension };
	});
}

export type EscalateSuspensionResult =
	| { ok: true; suspension: SuspensionDto }
	| { ok: false; error: string; status: 404 | 409 };

/**
 * PATCH /api/suspensions/[id] — escalar (matches → time/permanent) o levantar.
 * `reasonDetail` de la fila original NUNCA se pisa: es el motivo de la
 * sanción. Al levantar, la nota opcional se anexa al final (la tabla no tiene
 * columna separada de auditoría — simplificación consciente, ver B6 en
 * docs/MODULOS-GESTION-LIGA.md).
 */
export async function escalateSuspension(
	suspensionId: string,
	input: EscalateSuspensionInput,
	recordedBy: string,
): Promise<EscalateSuspensionResult> {
	const current = await findSuspension(suspensionId);
	if (!current) return { ok: false, error: "Suspensión no encontrada", status: 404 };
	if (current.status !== "active") {
		return { ok: false, error: "Solo se puede modificar una suspensión activa", status: 409 };
	}

	return db.transaction(async (tx) => {
		if (input.action === "lift") {
			const note = input.reasonDetail
				? `${current.reasonDetail ?? ""}\n\n— Levantada: ${input.reasonDetail}`.trim()
				: current.reasonDetail;
			const suspension = await updateSuspension(
				suspensionId,
				{ status: "lifted", reasonDetail: note, recordedBy },
				tx,
			);
			await syncLeagueMemberStatus(tx, current.globalPlayerId, current.leagueId);
			return { ok: true, suspension: suspension! };
		}

		// action === "escalate": solo sube de severidad, nunca de vuelta a 'matches'.
		if (current.durationType === "permanent") {
			return {
				ok: false as const,
				error: "Ya es un veto indefinido — no hay nada más que escalar",
				status: 409 as const,
			};
		}

		let suspension: SuspensionDto;
		if (input.durationType === "time") {
			const startsOn = todayIso();
			suspension = (await updateSuspension(
				suspensionId,
				{
					durationType: "time",
					matchesTotal: null,
					durationValue: input.durationValue,
					durationUnit: input.durationUnit,
					startsOn,
					endsOn: addDurationIso(startsOn, input.durationValue, input.durationUnit),
					reasonDetail: input.reasonDetail,
					recordedBy,
				},
				tx,
			))!;
		} else {
			suspension = (await updateSuspension(
				suspensionId,
				{
					durationType: "permanent",
					matchesTotal: null,
					durationValue: null,
					durationUnit: null,
					startsOn: null,
					endsOn: null,
					reasonDetail: input.reasonDetail,
					recordedBy,
				},
				tx,
			))!;
		}

		// Escalar nunca "libera" al jugador — solo lift lo hace.
		await syncLeagueMemberStatus(tx, current.globalPlayerId, current.leagueId);
		return { ok: true, suspension };
	});
}
