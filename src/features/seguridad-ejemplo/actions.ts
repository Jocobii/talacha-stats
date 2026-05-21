/**
 * features/seguridad-ejemplo/actions.ts
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PLANTILLA DE REFERENCIA — Patrón seguro para Server Actions en TalachaStats
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Este archivo documenta el patrón definitivo que TODA Server Action del
 * proyecto debe seguir. Ver SECURITY_RULES.md para el razonamiento completo.
 *
 * Orden obligatorio dentro de cualquier mutación:
 *   1. Verificar sesión                → 401 si no hay sesión
 *   2. Verificar autorización          → 403 si no tiene permiso
 *   3. Parsear y validar input (Zod)   → 400 si el schema falla
 *   4. Verificar duplicados            → 409 si ya existe
 *   5. Operar en DB (Drizzle tipado)   → nunca sql`` crudo
 *   6. Retornar apiSuccess / apiError  → respuesta consistente
 *
 * IMPORTANTE: este archivo es solo de servidor. No importar en Client Components.
 */

"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { teams, leagues } from "@/db/schema";
import { getSessionUser, canManageLeague } from "@/shared/lib/auth";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { apiSuccess, apiError } from "@/types";

// ── 1. Schema de validación (Zod) ─────────────────────────────────────────────
//
// Un schema Zod → un tipo TypeScript. No duplicar manualmente.
// Siempre .trim() en strings libres. IDs siempre .uuid().

const CreateTeamSchema = z.object({
	/** Nombre visible del equipo tal como lo ingresa el usuario. */
	name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
	/** Liga a la que pertenece el equipo. */
	leagueId: z.string().uuid("leagueId debe ser un UUID válido"),
	/** Color del equipo en formato hexadecimal. Opcional. */
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Color debe ser un hex válido (#RRGGBB)")
		.optional(),
});

type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

// ── 2. Server Action ──────────────────────────────────────────────────────────

/**
 * Crea un equipo en una liga con protección completa.
 *
 * Llamada típica desde un API Route:
 * ```ts
 * const result = await createTeamAction(body);
 * return result; // ya es un Response
 * ```
 */
export async function createTeamAction(rawInput: unknown): Promise<Response> {
	// ── Paso 1: Verificar sesión ───────────────────────────────────────────────
	//
	// getSessionUser() verifica el HMAC del token Y consulta la DB.
	// Si el token expiró o el usuario está inactivo → null.
	const session = await getSessionUser();
	if (!session) {
		return apiError("No autenticado. Inicia sesión para continuar.", 401);
	}

	// ── Paso 2: Verificar autorización ────────────────────────────────────────
	//
	// Validar el input primero solo para obtener leagueId, sin tocar la DB aún.
	// La validación completa ocurre en el Paso 3.
	const leagueIdCheck = z.object({ leagueId: z.string().uuid() }).safeParse(rawInput);
	if (!leagueIdCheck.success) {
		return apiError("leagueId inválido.", 400);
	}

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueIdCheck.data.leagueId),
		columns: { id: true, organizationId: true },
	});

	if (!league) {
		return apiError("Liga no encontrada.", 404);
	}

	if (!canManageLeague(session, league.organizationId)) {
		// 403 y no 404: el recurso existe pero el usuario no tiene acceso.
		return apiError("No tienes permiso para gestionar esta liga.", 403);
	}

	// ── Paso 3: Validar input completo con Zod ────────────────────────────────
	//
	// safeParse en lugar de parse para control explícito del error.
	// Después de aquí `parsed.data` es 100% tipado y confiable.
	const parsed = CreateTeamSchema.safeParse(rawInput);
	if (!parsed.success) {
		// Zod v4: parsed.error.message devuelve el primer error legible.
		return apiError(parsed.error.message, 400);
	}

	const input: CreateTeamInput = parsed.data;

	// ── Paso 4: Verificar duplicados antes del INSERT ─────────────────────────
	//
	// NUNCA confiar solo en el constraint de la DB.
	// sanitizeToCanonical() siempre en backend — nunca en el cliente.
	const nameCanonical = sanitizeToCanonical(input.name);

	const existing = await db.query.teams.findFirst({
		where: and(eq(teams.leagueId, input.leagueId), eq(teams.nameCanonical, nameCanonical)),
		columns: { id: true, name: true },
	});

	if (existing) {
		// 409 Conflict con mensaje legible — nunca 500 por constraint de DB.
		return apiError(`Ya existe un equipo llamado "${existing.name}" en esta liga.`, 409);
	}

	// ── Paso 5: Escribir en DB con la API tipada de Drizzle ──────────────────
	//
	// Sin sql`` crudo. Drizzle parametriza todos los valores automáticamente.
	// Transacciones cuando se toquen múltiples tablas.
	const [created] = await db
		.insert(teams)
		.values({
			name: input.name, // Texto original del usuario (display)
			nameCanonical, // Texto normalizado (búsquedas/unicidad)
			leagueId: input.leagueId,
			color: input.color ?? null,
		})
		.returning();

	if (!created) {
		// Error inesperado — loggear en servidor, mensaje genérico al cliente.
		console.error("[createTeamAction] INSERT no retornó fila. Input:", input);
		return apiError("Error interno al crear el equipo. Intenta de nuevo.", 500);
	}

	// ── Paso 6: Respuesta consistente ─────────────────────────────────────────
	return apiSuccess(created, 201);
}

// ── Referencia: cuándo usar transacción ──────────────────────────────────────

/**
 * Ejemplo de acción que toca múltiples tablas → transacción atómica.
 * La transacción vive en features/, nunca en route.ts.
 */
export async function createTeamWithCaptainAction(rawInput: unknown): Promise<Response> {
	const session = await getSessionUser();
	if (!session) return apiError("No autenticado.", 401);

	const CreateWithCaptainSchema = CreateTeamSchema.extend({
		captainLeagueMemberId: z.string().uuid(),
	});

	const parsed = CreateWithCaptainSchema.safeParse(rawInput);
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const nameCanonical = sanitizeToCanonical(parsed.data.name);

	// Transacción: equipo + capitán en una sola operación atómica.
	const result = await db.transaction(async (tx) => {
		const [team] = await tx
			.insert(teams)
			.values({ name: parsed.data.name, nameCanonical, leagueId: parsed.data.leagueId })
			.returning();

		if (!team) throw new Error("No se pudo crear el equipo.");

		// Aquí irían más inserts dentro del mismo tx...
		return team;
	});

	return apiSuccess(result, 201);
}
