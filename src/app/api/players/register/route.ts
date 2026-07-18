/**
 * POST /api/players/register
 *
 * Registra un jugador en una liga (y opcionalmente en un equipo).
 * Llamado por el RegistrationForm cuando el oficinista confirma el registro.
 *
 * Autenticación obligatoria — se usa para grabar registeredByOrganizationId
 * (ver register.ts Camino E), nunca se toma de campos del body.
 *
 * Body (JSON):
 *   curp                    string — CURP del jugador (nunca se persiste)
 *   fullName                string — Nombre completo (requerido, usado si el jugador es nuevo)
 *   birthDate               string — YYYY-MM-DD
 *   gender?                 string — "masculino" | "femenino" | "otro" (opcional)
 *   leagueId?                string — UUID de la liga (opcional — el paso 3 nunca bloquea el alta)
 *   teamId?                 string — UUID del equipo (opcional)
 *   dorsal?                 number — 1–99 (opcional)
 *   internalNotes?          string — Notas privadas de la liga (opcional)
 *   phone?                  string — Teléfono del jugador (opcional)
 *   residenceArea?          string — Ciudad/colonia de residencia (opcional)
 *   emergencyContactName?   string — Contacto de emergencia (opcional)
 *   emergencyContactPhone?  string — Teléfono de emergencia (opcional)
 *   medicalNotes?           string — Alergias/tipo de sangre/condición (opcional)
 *   avatarUrl?              string — URL de foto (opcional)
 *
 * Responses:
 *   201 { ok: true, data: { isNew, globalPlayer, leagueMember, inscription } }
 *   401 { ok: false, error: "…" }   — no autenticado
 *   400 { ok: false, error: "…" }   — validación Zod o ya en liga
 *   409 { ok: false, error: "…" }   — jugador ya registrado en esta liga, o ya tiene un pase
 *                                     anual vigente (ALREADY_ACTIVE_ORG_PASS)
 *   422 { ok: false, error: "…", code, allowedScopes? }
 *                                     — liga/equipo inválidos, o la org permite ambas
 *                                     modalidades de pase y el body no mandó
 *                                     credentialScope (SCOPE_SELECTION_REQUIRED — el
 *                                     cliente debe reintentar con el scope elegido)
 *   500 { ok: false, error: "…" }   — error DB inesperado
 */

import { apiSuccess, apiError } from "@/types";
import { registerPlayer, RegisterPlayerInputSchema } from "@/features/admin-registration";
import { getSessionUserFromRequest } from "@/shared/lib/auth";

export async function POST(request: Request): Promise<Response> {
	// 0. Autenticación — necesaria para saber qué organización da de alta al
	// jugador (registeredByOrganizationId, ver register.ts Camino E). null si
	// es el owner (sin org propia); nunca se toma del body del cliente.
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

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
	const result = await registerPlayer(parsed.data, session.organizationId);

	if (!result.ok) {
		switch (result.code) {
			case "INVALID_CURP":
				return apiError(result.error, 400);
			case "ALREADY_IN_LEAGUE":
			case "ALREADY_ACTIVE_ORG_PASS":
				return apiError(result.error, 409, { code: result.code });
			case "SCOPE_SELECTION_REQUIRED":
				return apiError(result.error, 422, {
					code: result.code,
					allowedScopes: result.allowedScopes,
				});
			case "INVALID_LEAGUE":
			case "INVALID_TEAM":
			case "SCOPE_NOT_ALLOWED":
				return apiError(result.error, 422, { code: result.code });
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
