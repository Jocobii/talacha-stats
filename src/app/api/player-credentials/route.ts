import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { apiError, apiSuccess } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { CreatePlayerCredentialSchema } from "@/entities/player-credential/model";
import type {
	CredentialScopeOptions,
	CredentialStatusResponse,
} from "@/entities/player-credential/model";
import { issuePlayerCredential } from "@/features/player-credential";
import { resolveCredentialScope } from "@/entities/player-credential/lib/issue-credential";
import { findCredentialStatusForLeague } from "@/entities/player-credential/queries";

const StatusQuerySchema = z.object({
	// Opcional: un jugador recién capturado (paso 2 del registro, "not_found")
	// todavía no tiene global_player_id — en ese caso solo se resuelve
	// scopeOptions (para saber si hay que preguntar la modalidad) y el estado
	// se reporta como "pendiente" (nunca puede tener un pase preexistente).
	globalPlayerId: z.string().uuid().optional(),
	leagueId: z.string().uuid(),
});

/** scopeOptions: qué modalidad(es) puede emitir la org — insumo para el paso 3. */
async function resolveScopeOptions(organizationId: string): Promise<CredentialScopeOptions> {
	const resolution = await resolveCredentialScope(db, undefined, organizationId);
	if (resolution.ok) return { mode: "auto", scope: resolution.scope };
	// requestedScope=undefined nunca produce SCOPE_NOT_ALLOWED — solo queda
	// SCOPE_SELECTION_REQUIRED cuando la org permite ambas modalidades.
	return { mode: "choice", allowedScopes: resolution.allowedScopes ?? [] };
}

// GET /api/player-credentials?leagueId=&globalPlayerId=
// Estado de credencial del jugador para esta liga — pantalla A del paso de
// registro (A1 cubierto / A2 sin credencial / A3 recién emitida, ya que la UI
// vuelve a llamar este GET tras un POST exitoso) + scopeOptions de la org.
export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { searchParams } = new URL(request.url);
	const parsed = StatusQuerySchema.safeParse({
		globalPlayerId: searchParams.get("globalPlayerId") ?? undefined,
		leagueId: searchParams.get("leagueId"),
	});
	if (!parsed.success) return apiError(parsed.error.message, 400);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, parsed.data.leagueId),
		columns: { organizationId: true },
	});
	if (!league) return apiError("La liga especificada no existe", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) {
		return apiError("Sin permiso para ver este pase", 403);
	}
	if (!league.organizationId) return apiError("La liga no tiene organización asignada", 422);

	const scopeOptions = await resolveScopeOptions(league.organizationId);

	if (!parsed.data.globalPlayerId) {
		return apiSuccess<CredentialStatusResponse>({
			credential: null,
			displayStatus: "pendiente",
			scopeOptions,
		});
	}

	const result = await findCredentialStatusForLeague(
		db,
		parsed.data.globalPlayerId,
		parsed.data.leagueId,
	);
	if (!result) return apiError("La liga especificada no existe", 404);

	return apiSuccess<CredentialStatusResponse>({ ...result, scopeOptions });
}

// POST /api/player-credentials
export async function POST(request: Request) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const body = await request.json().catch(() => null);
	const parsed = CreatePlayerCredentialSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message);

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, parsed.data.leagueId),
		columns: { organizationId: true },
	});
	if (!league) return apiError("La liga especificada no existe", 404);
	if (!canManageLeague(session, league.organizationId ?? null)) {
		return apiError("Sin permiso para emitir este pase", 403);
	}

	const result = await issuePlayerCredential(parsed.data);
	if (!result.ok) {
		if (result.code === "SCOPE_SELECTION_REQUIRED") {
			return apiError(result.error, 422, {
				code: result.code,
				allowedScopes: result.allowedScopes,
			});
		}
		const status = result.code === "ALREADY_ACTIVE_ORG_PASS" ? 409 : 400;
		return apiError(result.error, status, { code: result.code });
	}

	return apiSuccess(result.credential, 201);
}
