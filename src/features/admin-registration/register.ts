/**
 * features/admin-registration/register.ts
 *
 * Caso de uso: registrar un jugador (opcionalmente en una liga).
 *
 * El paso "Liga y equipo" nunca bloquea el alta — cubre cinco caminos:
 *
 *   A. Jugador conocido + ya es miembro de la liga
 *      → Error: "ya registrado en esta liga"
 *
 *   B. Jugador conocido + NO es miembro de la liga
 *      → createLeagueMember + (si teamId) createInscription
 *
 *   C. Jugador nuevo (CURP no existe en global_players)
 *      → createGlobalPlayer + createLeagueMember + (si teamId) createInscription
 *
 *   D. CURP inválida
 *      → Error de validación — nunca llega a DB
 *
 *   E. Sin leagueId (paso 3 omitido)
 *      → solo createGlobalPlayer (si es nuevo) — leagueMember es null, no hay
 *        dónde guardar dorsal/equipo/contacto de emergencia todavía. Se graba
 *        (o actualiza, si el jugador ya existía de otra organización) el
 *        registeredByOrganizationId para que el jugador siga siendo visible
 *        en /admin/players de quien lo dio de alta (ver listOrgPlayers). Sin
 *        el update explícito para jugadores ya existentes, un jugador con
 *        historial en otra organización quedaba invisible al registrarlo sin
 *        liga en una organización nueva — el insert solo cubre el alta 100%
 *        nueva (Camino C).
 *
 * Todo se ejecuta en una transacción atómica. Si la inscripción al equipo
 * falla (ej: teamId inválido), se revierte el league_member también.
 */

import { z } from "zod";
import { db } from "@/db";
import { globalPlayers, leagueMembers, inscriptions, leagues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CurpSchema, GenderSchema } from "@/entities/player/model";
import type { GlobalPlayer, LeagueMember, Inscription } from "@/entities/player/model";
import { PlayerCredentialScopeSchema } from "@/entities/player-credential/model";
import type { PlayerCredentialScope } from "@/entities/player-credential/model";
import { hashCurp } from "./hash";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { assignNextCredential } from "@/entities/player/lib/assign-credential";
import { findCoveringCredential } from "@/entities/player-credential/queries";
import {
	resolveCredentialScope,
	insertCredentialForScope,
} from "@/entities/player-credential/lib/issue-credential";

// ---------------------------------------------------------------------------
// Input schema — validado en el API route antes de llamar a registerPlayer
// ---------------------------------------------------------------------------

export const RegisterPlayerInputSchema = z.object({
	/** CURP del jugador — solo existe en el request, nunca se persiste. */
	curp: CurpSchema,
	/** Datos del jugador (requeridos solo si es nuevo en el sistema). */
	fullName: z.string().min(2).max(100).trim(),
	birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de nacimiento en formato YYYY-MM-DD"),
	/** Género (opcional — nunca bloquea el alta). */
	gender: GenderSchema.nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	/**
	 * Liga a la que se inscribe — opcional. El paso "Liga y equipo" nunca
	 * bloquea la creación del jugador: si no se especifica, se crea solo el
	 * global_player, sin fila en league_members.
	 */
	leagueId: z.string().uuid().nullable().optional(),
	/** Equipo al que se asigna (opcional — puede dejarse sin equipo). */
	teamId: z.string().uuid().nullable().optional(),
	/** Dorsal (opcional). */
	dorsal: z.number().int().min(1).max(99).nullable().optional(),
	/**
	 * Modalidad de pase a emitir si el jugador no tiene uno vigente para esta
	 * liga (siempre el caso en un jugador nuevo). Solo requerido si la org
	 * permite ambas modalidades — ver resolveCredentialScope.
	 */
	credentialScope: PlayerCredentialScopeSchema.optional(),
	/** Notas internas de la liga (opcional). */
	internalNotes: z.string().max(500).nullable().optional(),
	/** Datos de contacto — opcionales, "por si hay una emergencia". Siloed por liga. */
	phone: z.string().max(30).trim().nullable().optional(),
	residenceArea: z.string().max(150).trim().nullable().optional(),
	emergencyContactName: z.string().max(150).trim().nullable().optional(),
	emergencyContactPhone: z.string().max(30).trim().nullable().optional(),
	medicalNotes: z.string().max(500).trim().nullable().optional(),
});

export type RegisterPlayerInput = z.infer<typeof RegisterPlayerInputSchema>;

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type RegisterSuccess = {
	ok: true;
	isNew: boolean; // true = jugador creado en este momento, false = ya existía
	globalPlayer: GlobalPlayer;
	leagueMember: LeagueMember | null; // null si no se asignó liga (paso 3 es opcional)
	inscription: Inscription | null; // null si no se asignó equipo
};

export type RegisterError =
	| {
			ok: false;
			error: string;
			code:
				| "INVALID_CURP"
				| "ALREADY_IN_LEAGUE"
				| "INVALID_TEAM"
				| "INVALID_LEAGUE"
				| "SCOPE_NOT_ALLOWED"
				| "ALREADY_ACTIVE_ORG_PASS"
				| "DB_ERROR";
	  }
	| {
			ok: false;
			error: string;
			code: "SCOPE_SELECTION_REQUIRED";
			allowedScopes: PlayerCredentialScope[];
	  };

export type RegisterResult = RegisterSuccess | RegisterError;

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------

/**
 * Registra un jugador en una liga dentro de una transacción atómica.
 *
 * El input ya debe estar validado con RegisterPlayerInputSchema.safeParse()
 * antes de llamar a esta función (el API route es responsable de eso).
 */
export async function registerPlayer(
	input: RegisterPlayerInput,
	organizationId: string | null,
): Promise<RegisterResult> {
	// 1. Derivar hash — a partir de aquí el CURP raw no se usa
	const curpHash = hashCurp(input.curp);
	const today = new Date().toISOString().slice(0, 10);

	try {
		return await db.transaction(async (tx) => {
			// ── Paso 1: resolver globalPlayer ──────────────────────────────────
			let existingPlayer = await tx.query.globalPlayers.findFirst({
				where: eq(globalPlayers.curpHash, curpHash),
			});

			const isNew = !existingPlayer;

			if (!existingPlayer) {
				// Camino C: jugador completamente nuevo.
				// registeredByOrganizationId queda grabado al crear (nunca se
				// reescribe después): es el único vínculo con una organización
				// que tiene un jugador dado de alta sin liga (Camino E) — sin
				// esto listOrgPlayers no puede mostrarlo (ver entities/player/
				// queries.ts). null si registra el owner (sin org propia).
				const inserted = await tx
					.insert(globalPlayers)
					.values({
						curpHash,
						fullName: input.fullName,
						fullNameCanonical: sanitizeToCanonical(input.fullName),
						birthDate: input.birthDate,
						gender: input.gender ?? null,
						avatarUrl: input.avatarUrl ?? null,
						registeredByOrganizationId: organizationId,
					})
					.returning();

				existingPlayer = inserted[0];
				if (!existingPlayer) throw new Error("No se pudo crear el jugador global");
			}

			const globalPlayerId = existingPlayer.id;

			const globalPlayer: GlobalPlayer = {
				id: existingPlayer.id,
				curpHash: existingPlayer.curpHash,
				fullName: existingPlayer.fullName,
				birthDate: existingPlayer.birthDate,
				gender: existingPlayer.gender ?? null,
				avatarUrl: existingPlayer.avatarUrl ?? null,
				createdAt: existingPlayer.createdAt,
			};

			// El paso "Liga y equipo" es opcional — nunca bloquea el alta del
			// jugador. Sin leagueId no hay dónde adjuntar los datos de contacto
			// (viven en league_members), así que se crea solo el global_player.
			if (!input.leagueId) {
				// Jugador ya existente (Camino B, sin liga) — el insert de arriba
				// solo cubre altas 100% nuevas (Camino C). Sin este update, un
				// jugador con historial en OTRA organización que se "pre-registra"
				// aquí sin liga queda con el registeredByOrganizationId de su
				// organización original (o null) y nunca aparece en /admin/players
				// de esta organización (ver listOrgPlayers, que usa este campo
				// como fallback cuando no hay league_members). No aplica si
				// registra el owner (organizationId null) — no hay a quién asignar.
				if (organizationId && existingPlayer.registeredByOrganizationId !== organizationId) {
					await tx
						.update(globalPlayers)
						.set({ registeredByOrganizationId: organizationId })
						.where(eq(globalPlayers.id, globalPlayerId));
				}
				return { ok: true, isNew, globalPlayer, leagueMember: null, inscription: null };
			}

			// ── Paso 2: verificar que no esté ya en la liga ────────────────────
			const existing = await tx.query.leagueMembers.findFirst({
				where: and(
					eq(leagueMembers.globalPlayerId, globalPlayerId),
					eq(leagueMembers.leagueId, input.leagueId),
				),
			});

			if (existing) {
				// Camino A: ya registrado — rollback implícito al lanzar
				throw Object.assign(new Error("El jugador ya está registrado en esta liga"), {
					code: "ALREADY_IN_LEAGUE" as const,
				});
			}

			// ── Paso 2b: asegurar un pase (player_credentials) vigente para esta liga ──
			// docs/CREDENCIAL-PASE-JUGADOR.md §5 — no confundir con credential_code
			// (etiqueta de asistencia, ver Paso 3). Un jugador nuevo nunca puede
			// tener un pase preexistente, así que si no hay uno vigente se emite
			// aquí mismo, dentro de la misma transacción (§4.1), en vez de
			// bloquear el alta.
			const coveringCredential = await findCoveringCredential(tx, globalPlayerId, input.leagueId);

			let credentialId: string;

			if (coveringCredential) {
				credentialId = coveringCredential.id;
			} else {
				const league = await tx.query.leagues.findFirst({ where: eq(leagues.id, input.leagueId) });
				if (!league) {
					throw Object.assign(new Error("La liga especificada no existe"), {
						code: "INVALID_LEAGUE" as const,
					});
				}
				if (!league.organizationId) {
					throw Object.assign(new Error("La liga no tiene organización asignada"), {
						code: "INVALID_LEAGUE" as const,
					});
				}

				const scopeResolution = await resolveCredentialScope(
					tx,
					input.credentialScope,
					league.organizationId,
				);
				if (!scopeResolution.ok) {
					throw Object.assign(new Error(scopeResolution.error), {
						code: scopeResolution.code,
						allowedScopes:
							scopeResolution.code === "SCOPE_SELECTION_REQUIRED"
								? scopeResolution.allowedScopes
								: undefined,
					});
				}

				const inserted = await insertCredentialForScope(
					tx,
					scopeResolution.scope,
					globalPlayerId,
					input.leagueId,
					league.organizationId,
				);
				if (!inserted.ok) {
					throw Object.assign(new Error(inserted.error), { code: inserted.code });
				}
				credentialId = inserted.credential.id;
			}

			// ── Paso 3: crear league_member (caminos B y C) ────────────────────
			// credential_code se asigna en el server, dentro de la misma tx —
			// nunca lo propone el cliente (ver docs/CREDENCIAL-CODIGO-JUGADOR.md).
			const credentialCode = await assignNextCredential(tx, input.leagueId);

			const memberRows = await tx
				.insert(leagueMembers)
				.values({
					globalPlayerId,
					leagueId: input.leagueId,
					status: "active",
					dorsal: input.dorsal ?? null,
					credentialCode,
					credentialId,
					inscriptionDate: today,
					internalNotes: input.internalNotes ?? null,
					phone: input.phone ?? null,
					residenceArea: input.residenceArea ?? null,
					emergencyContactName: input.emergencyContactName ?? null,
					emergencyContactPhone: input.emergencyContactPhone ?? null,
					medicalNotes: input.medicalNotes ?? null,
				})
				.returning();

			const member = memberRows[0];
			if (!member) throw new Error("No se pudo crear la membresía en la liga");

			// ── Paso 4: crear inscription si se especificó equipo ──────────────
			let inscription: Inscription | null = null;

			if (input.teamId) {
				const inscriptionRows = await tx
					.insert(inscriptions)
					.values({
						leagueMemberId: member.id,
						teamId: input.teamId,
					})
					.returning();

				const ins = inscriptionRows[0];
				if (!ins) throw new Error("No se pudo crear la inscripción al equipo");

				inscription = {
					id: ins.id,
					leagueMemberId: ins.leagueMemberId,
					teamId: ins.teamId,
					createdAt: ins.createdAt,
				};
			}

			// ── Resultado ──────────────────────────────────────────────────────
			const leagueMember: LeagueMember = {
				id: member.id,
				globalPlayerId: member.globalPlayerId,
				leagueId: member.leagueId,
				status: member.status,
				dorsal: member.dorsal ?? null,
				credentialCode: member.credentialCode ?? null,
				credentialId: member.credentialId ?? null,
				inscriptionDate: member.inscriptionDate,
				institutionPhotoUrl: member.institutionPhotoUrl ?? null,
				internalNotes: member.internalNotes ?? null,
				phone: member.phone ?? null,
				residenceArea: member.residenceArea ?? null,
				emergencyContactName: member.emergencyContactName ?? null,
				emergencyContactPhone: member.emergencyContactPhone ?? null,
				medicalNotes: member.medicalNotes ?? null,
				createdAt: member.createdAt,
			};

			return { ok: true, isNew, globalPlayer, leagueMember, inscription };
		});
	} catch (err: unknown) {
		// Errores de negocio lanzados desde dentro de la tx (rollback implícito)
		if (err instanceof Error && "code" in err && err.code === "ALREADY_IN_LEAGUE") {
			return { ok: false, error: err.message, code: "ALREADY_IN_LEAGUE" };
		}
		if (err instanceof Error && "code" in err && err.code === "INVALID_LEAGUE") {
			return { ok: false, error: err.message, code: "INVALID_LEAGUE" };
		}
		if (err instanceof Error && "code" in err && err.code === "SCOPE_NOT_ALLOWED") {
			return { ok: false, error: err.message, code: "SCOPE_NOT_ALLOWED" };
		}
		if (err instanceof Error && "code" in err && err.code === "ALREADY_ACTIVE_ORG_PASS") {
			return { ok: false, error: err.message, code: "ALREADY_ACTIVE_ORG_PASS" };
		}
		if (err instanceof Error && "code" in err && err.code === "SCOPE_SELECTION_REQUIRED") {
			const allowedScopes =
				(err as Error & { allowedScopes?: PlayerCredentialScope[] }).allowedScopes ?? [];
			return { ok: false, error: err.message, code: "SCOPE_SELECTION_REQUIRED", allowedScopes };
		}

		// Errores de FK de Postgres (liga o equipo inválidos)
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes("league_members_league_id_fkey")) {
			return { ok: false, error: "La liga especificada no existe", code: "INVALID_LEAGUE" };
		}
		if (msg.includes("inscriptions_team_id_fkey")) {
			return { ok: false, error: "El equipo especificado no existe", code: "INVALID_TEAM" };
		}

		console.error("[registerPlayer] Error inesperado:", err);
		return { ok: false, error: "Error interno al registrar el jugador", code: "DB_ERROR" };
	}
}
