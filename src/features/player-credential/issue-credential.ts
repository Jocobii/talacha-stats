/**
 * features/player-credential/issue-credential.ts
 *
 * Caso de uso del endpoint standalone POST /api/player-credentials. La
 * lógica real (resolver scope + insertar) vive en
 * entities/player-credential/lib/issue-credential.ts porque también la usa
 * features/admin-registration/register.ts (emisión inline al registrar un
 * jugador nuevo) — features no pueden importarse entre sí (AGENTS.md §3.1).
 */

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { leagues } from "@/db/schema";
import type {
	CreatePlayerCredential,
	PlayerCredential,
	PlayerCredentialScope,
} from "@/entities/player-credential/model";
import {
	resolveCredentialScope,
	insertCredentialForScope,
} from "@/entities/player-credential/lib/issue-credential";

export type IssueCredentialErrorCode =
	| "INVALID_LEAGUE"
	| "LEAGUE_WITHOUT_ORG"
	| "SCOPE_NOT_ALLOWED"
	| "SCOPE_SELECTION_REQUIRED"
	| "ALREADY_ACTIVE_ORG_PASS"
	| "DB_ERROR";

export type IssueCredentialError =
	| {
			ok: false;
			error: string;
			code: Exclude<IssueCredentialErrorCode, "SCOPE_SELECTION_REQUIRED">;
	  }
	| {
			ok: false;
			error: string;
			code: "SCOPE_SELECTION_REQUIRED";
			allowedScopes: PlayerCredentialScope[];
	  };

export type IssueCredentialResult =
	| { ok: true; credential: PlayerCredential }
	| IssueCredentialError;

/** Emite un pase nuevo. El input ya debe venir validado con CreatePlayerCredentialSchema. */
export async function issuePlayerCredential(
	input: CreatePlayerCredential,
): Promise<IssueCredentialResult> {
	const league = await db.query.leagues.findFirst({ where: eq(leagues.id, input.leagueId) });
	if (!league)
		return { ok: false, error: "La liga especificada no existe", code: "INVALID_LEAGUE" };
	if (!league.organizationId) {
		return {
			ok: false,
			error: "La liga no tiene organización asignada",
			code: "LEAGUE_WITHOUT_ORG",
		};
	}

	const scopeResolution = await resolveCredentialScope(db, input.scope, league.organizationId);
	if (!scopeResolution.ok) return scopeResolution;

	try {
		const inserted = await insertCredentialForScope(
			db,
			scopeResolution.scope,
			input.globalPlayerId,
			input.leagueId,
			league.organizationId,
		);
		if (!inserted.ok) return inserted;
		return { ok: true, credential: inserted.credential };
	} catch (err: unknown) {
		console.error("[issuePlayerCredential] Error inesperado:", err);
		return { ok: false, error: "Error interno al emitir el pase", code: "DB_ERROR" };
	}
}
