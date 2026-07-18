/**
 * entities/player-credential/lib/issue-credential.ts
 *
 * Lógica compartida para emitir un pase (docs/CREDENCIAL-PASE-JUGADOR.md
 * §4.1). Vive en entities (no en un feature) porque DOS features la
 * necesitan y no pueden importarse entre sí (AGENTS.md §3.1):
 *   - features/player-credential/issue-credential.ts — endpoint standalone
 *     POST /api/player-credentials, corre con `db`.
 *   - features/admin-registration/register.ts — emisión inline dentro de la
 *     misma transacción que crea al jugador nuevo (un jugador recién creado
 *     nunca puede tener un pase previo — por eso se emite en el mismo tx en
 *     vez de exigir uno preexistente).
 *
 * Recibe `executor` (db o tx) como primer argumento — mismo patrón que
 * assignNextCredential y entities/player-credential/queries.ts.
 */

import { db } from "@/db";
import { playerCredentials } from "@/db/schema";
import type { PlayerCredentialScope } from "../model";
import { findActiveOrganizationCredential, type Executor } from "../queries";
import { findOrganizationCredentialConfigOrDefaults } from "@/entities/organization-credential-config/queries";
import { todayIsoDate, addYearsIso } from "./dates";

/** Duración del pase anual por organización (docs/CREDENCIAL-PASE-JUGADOR.md §10). */
export const ANNUAL_PASS_DURATION_YEARS = 1;

export type ResolveScopeError =
	| { ok: false; error: string; code: "SCOPE_NOT_ALLOWED" }
	| {
			ok: false;
			error: string;
			code: "SCOPE_SELECTION_REQUIRED";
			allowedScopes: PlayerCredentialScope[];
	  };

export type ResolveScopeResult = { ok: true; scope: PlayerCredentialScope } | ResolveScopeError;

/**
 * Decide qué scope emitir según organization_credential_config. Si el
 * cliente ya mandó uno, solo lo valida contra lo permitido; si la org solo
 * permite una modalidad, la infiere sin preguntar; si permite ambas y no
 * llegó scope, pide selección explícita.
 */
export async function resolveCredentialScope(
	executor: Executor,
	requestedScope: PlayerCredentialScope | undefined,
	organizationId: string,
): Promise<ResolveScopeResult> {
	const config = await findOrganizationCredentialConfigOrDefaults(organizationId, executor);
	const allowedScopes: PlayerCredentialScope[] = [
		...(config.allowSingleLeaguePass ? (["single_league"] as const) : []),
		...(config.allowOrganizationPass ? (["organization"] as const) : []),
	];

	if (requestedScope) {
		if (!allowedScopes.includes(requestedScope)) {
			return {
				ok: false,
				error: `Esta organización no permite pases de tipo "${requestedScope}"`,
				code: "SCOPE_NOT_ALLOWED",
			};
		}
		return { ok: true, scope: requestedScope };
	}

	if (allowedScopes.length === 1) return { ok: true, scope: allowedScopes[0]! };

	return {
		ok: false,
		error: "Esta organización permite pase por liga o anual — elige cuál emitir",
		code: "SCOPE_SELECTION_REQUIRED",
		allowedScopes,
	};
}

export type InsertCredentialError =
	| { ok: false; error: string; code: "ALREADY_ACTIVE_ORG_PASS" }
	| { ok: false; error: string; code: "DB_ERROR" };

type CredentialRow = Awaited<ReturnType<typeof db.query.playerCredentials.findMany>>[number];

export type InsertCredentialResult =
	| { ok: true; credential: CredentialRow }
	| InsertCredentialError;

/** Inserta un pase `single_league` — sin checks adicionales de negocio. */
export async function insertSingleLeaguePass(
	executor: Executor,
	globalPlayerId: string,
	leagueId: string,
	organizationId: string,
): Promise<InsertCredentialResult> {
	const [credential] = await executor
		.insert(playerCredentials)
		.values({ globalPlayerId, organizationId, scope: "single_league", leagueId, status: "active" })
		.returning();

	if (!credential)
		return { ok: false, error: "No se pudo crear el pase de liga", code: "DB_ERROR" };
	return { ok: true, credential };
}

/**
 * Inserta un pase `organization` — hoy → hoy+1año. Rechaza si ya existe uno
 * activo y vigente (renovación = crear nuevo tras dejar vencer/cancelar el
 * viejo, nunca editar — §7). uq_org_credential_active es el respaldo ante
 * una carrera entre el check y el insert.
 */
export async function insertOrganizationPass(
	executor: Executor,
	globalPlayerId: string,
	organizationId: string,
): Promise<InsertCredentialResult> {
	const existing = await findActiveOrganizationCredential(executor, globalPlayerId, organizationId);
	if (existing) {
		return {
			ok: false,
			error: "Ya existe un pase anual vigente para esta organización",
			code: "ALREADY_ACTIVE_ORG_PASS",
		};
	}

	const validFrom = todayIsoDate();
	const validUntil = addYearsIso(validFrom, ANNUAL_PASS_DURATION_YEARS);

	try {
		const [credential] = await executor
			.insert(playerCredentials)
			.values({
				globalPlayerId,
				organizationId,
				scope: "organization",
				leagueId: null,
				status: "active",
				validFrom,
				validUntil,
			})
			.returning();

		if (!credential)
			return { ok: false, error: "No se pudo crear el pase anual", code: "DB_ERROR" };
		return { ok: true, credential };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes("uq_org_credential_active")) {
			return {
				ok: false,
				error: "Ya existe un pase anual vigente para esta organización",
				code: "ALREADY_ACTIVE_ORG_PASS",
			};
		}
		throw err;
	}
}

/** Emite (single_league u organization, ya resuelto) — atajo para el caso simple. */
export async function insertCredentialForScope(
	executor: Executor,
	scope: PlayerCredentialScope,
	globalPlayerId: string,
	leagueId: string,
	organizationId: string,
): Promise<InsertCredentialResult> {
	if (scope === "single_league") {
		return insertSingleLeaguePass(executor, globalPlayerId, leagueId, organizationId);
	}
	return insertOrganizationPass(executor, globalPlayerId, organizationId);
}
