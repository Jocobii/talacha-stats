/**
 * POST /api/players/register
 *
 * Registra un jugador en una liga (y opcionalmente en un equipo).
 * Llamado por el RegistrationForm cuando el oficinista confirma el registro.
 *
 * Body (JSON):
 *   curp           string   — CURP del jugador (nunca se persiste)
 *   fullName       string   — Nombre completo (requerido, usado si el jugador es nuevo)
 *   birthDate      string   — YYYY-MM-DD
 *   leagueId       string   — UUID de la liga
 *   teamId?        string   — UUID del equipo (opcional en v1)
 *   dorsal?        number   — 1–99 (opcional)
 *   internalNotes? string   — Notas privadas de la liga (opcional)
 *   avatarUrl?     string   — URL de foto (opcional)
 *
 * Responses:
 *   201 { ok: true, data: { isNew, globalPlayer, leagueMember, inscription } }
 *   400 { ok: false, error: "…" }   — validación Zod o ya en liga
 *   409 { ok: false, error: "…" }   — jugador ya registrado en esta liga
 *   422 { ok: false, error: "…" }   — liga o equipo inválidos
 *   500 { ok: false, error: "…" }   — error DB inesperado
 */

import { apiSuccess, apiError } from "@/types";
import { registerPlayer, RegisterPlayerInputSchema } from "@/features/admin-registration";

export async function POST(request: Request): Promise<Response> {
	// 1. Parsear body
	const body = await request.json().catch(() => null);
	if (!body) return apiError("Body JSON inválido", 400);

	// 2. Validar con Zod (incluye validación de formato CURP)
	const parsed = RegisterPlayerInputSchema.safeParse(body);
	if (!parsed.success) {
		const msg = parsed.error.issues[0]?.message ?? parsed.error.message;
		return apiError(msg, 400);
	}

	// 3. Ejecutar caso de uso (transacción atómica)
	const result = await registerPlayer(parsed.data);

	if (!result.ok) {
		switch (result.code) {
			case "INVALID_CURP":
				return apiError(result.error, 400);
			case "ALREADY_IN_LEAGUE":
				return apiError(result.error, 409);
			case "INVALID_LEAGUE":
			case "INVALID_TEAM":
				return apiError(result.error, 422);
			case "DB_ERROR":
			default:
				return apiError(result.error, 500);
		}
	}

	// 4. Omitir curpHash del response (nunca sale del servidor)
	const { globalPlayer, ...rest } = result;
	const { ...playerPublic } = globalPlayer;

	return apiSuccess({ ...rest, globalPlayer: playerPublic }, 201);
}
