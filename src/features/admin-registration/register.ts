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
 *        dónde guardar dorsal/equipo/contacto de emergencia todavía
 *
 * Todo se ejecuta en una transacción atómica. Si la inscripción al equipo
 * falla (ej: teamId inválido), se revierte el league_member también.
 */

import { z } from "zod";
import { db } from "@/db";
import { globalPlayers, leagueMembers, inscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CurpSchema, GenderSchema } from "@/entities/player/model";
import type { GlobalPlayer, LeagueMember, Inscription } from "@/entities/player/model";
import { hashCurp } from "./hash";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { assignNextCredential } from "@/entities/player/lib/assign-credential";

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

export type RegisterError = {
	ok: false;
	error: string;
	code: "INVALID_CURP" | "ALREADY_IN_LEAGUE" | "INVALID_TEAM" | "INVALID_LEAGUE" | "DB_ERROR";
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
export async function registerPlayer(input: RegisterPlayerInput): Promise<RegisterResult> {
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
				// Camino C: jugador completamente nuevo
				const inserted = await tx
					.insert(globalPlayers)
					.values({
						curpHash,
						fullName: input.fullName,
						fullNameCanonical: sanitizeToCanonical(input.fullName),
						birthDate: input.birthDate,
						gender: input.gender ?? null,
						avatarUrl: input.avatarUrl ?? null,
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
		// Error de constraint ALREADY_IN_LEAGUE (lanzado desde dentro de la tx)
		if (err instanceof Error && "code" in err && err.code === "ALREADY_IN_LEAGUE") {
			return { ok: false, error: err.message, code: "ALREADY_IN_LEAGUE" };
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
