/**
 * entities/player-credential/model.ts
 * Tipos del dominio para el pase del jugador (docs/CREDENCIAL-PASE-JUGADOR.md).
 *
 * No confundir con `league_members.credential_code` (entities/player):
 * ese es una etiqueta de asistencia por liga. El pase (`player_credentials`)
 * es el derecho a jugar — alcance (liga u organización) + vigencia.
 *
 * Un tipo = un schema Zod (AGENTS.md §7). `scope` discrimina la forma tanto
 * en la entidad completa como en el input de creación.
 */

import { z } from "zod";
import { PLAYER_CREDENTIAL_SCOPES, PLAYER_CREDENTIAL_STATUSES } from "@/db/schema";
import { CREDENTIAL_DISPLAY_STATUSES } from "./lib/credential-status";

/** Fecha ISO 8601 (YYYY-MM-DD) — formato que retorna Drizzle para columnas `date`. */
const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe estar en formato YYYY-MM-DD");

export const PlayerCredentialScopeSchema = z.enum(PLAYER_CREDENTIAL_SCOPES);
export type PlayerCredentialScope = z.infer<typeof PlayerCredentialScopeSchema>;

export const PlayerCredentialStatusSchema = z.enum(PLAYER_CREDENTIAL_STATUSES);
export type PlayerCredentialStatus = z.infer<typeof PlayerCredentialStatusSchema>;

// ---------------------------------------------------------------------------
// PlayerCredential — el pase completo, tal como sale de la DB
// ---------------------------------------------------------------------------

export const PlayerCredentialSchema = z.object({
	id: z.string().uuid(),
	globalPlayerId: z.string().uuid(),
	organizationId: z.string().uuid(),
	scope: PlayerCredentialScopeSchema,
	// Solo tiene valor cuando scope = 'single_league'.
	leagueId: z.string().uuid().nullable(),
	status: PlayerCredentialStatusSchema,
	// Solo requeridos (no-null) cuando scope = 'organization' — el check de DB
	// (chk_credential_scope_shape) es la fuente de verdad; aquí se modelan
	// nullable porque el shape completo se valida en el discriminated union
	// de creación, no en la lectura genérica.
	validFrom: isoDate.nullable(),
	validUntil: isoDate.nullable(),
	createdAt: z.coerce.date(),
});

export type PlayerCredential = z.infer<typeof PlayerCredentialSchema>;

// ---------------------------------------------------------------------------
// CreatePlayerCredential — lo que pide el cliente al comprar un pase
//
// El cliente siempre opera desde el contexto de una liga (el panel de
// registro/roster donde está inscribiendo o consultando al jugador); el
// server deriva organization_id de esa liga. `scope` es opcional: solo hace
// falta cuando organization_credential_config permite AMBAS modalidades — en
// ese caso el cliente debe elegir (la UI muestra el modal) y el server
// rechaza con "SCOPE_SELECTION_REQUIRED" si no llega. Si la org solo permite
// una modalidad, el server la infiere sin necesidad de que el cliente la
// mande (ver features/player-credential/issue-credential.ts).
// ---------------------------------------------------------------------------

export const CreatePlayerCredentialSchema = z.object({
	globalPlayerId: z.string().uuid(),
	leagueId: z.string().uuid(),
	scope: PlayerCredentialScopeSchema.optional(),
});

export type CreatePlayerCredential = z.infer<typeof CreatePlayerCredentialSchema>;

// ---------------------------------------------------------------------------
// CredentialStatusResponse — GET /api/player-credentials (pantalla A del
// paso de registro: A1 cubierto / A2 sin credencial / A3 recién emitida)
// ---------------------------------------------------------------------------

export const CredentialDisplayStatusSchema = z.enum(CREDENTIAL_DISPLAY_STATUSES);
export type CredentialDisplayStatus = z.infer<typeof CredentialDisplayStatusSchema>;

/**
 * Qué modalidad(es) puede emitir la organización, ya resuelto contra
 * organization_credential_config — insumo para que la UI sepa si debe
 * preguntar (mode "choice") o no (mode "auto") antes de registrar/emitir.
 * Mismo cómputo que resolveCredentialScope con requestedScope=undefined.
 */
export const CredentialScopeOptionsSchema = z.union([
	z.object({ mode: z.literal("auto"), scope: PlayerCredentialScopeSchema }),
	z.object({ mode: z.literal("choice"), allowedScopes: z.array(PlayerCredentialScopeSchema) }),
]);
export type CredentialScopeOptions = z.infer<typeof CredentialScopeOptionsSchema>;

export const CredentialStatusResponseSchema = z.object({
	credential: PlayerCredentialSchema.nullable(),
	displayStatus: CredentialDisplayStatusSchema,
	scopeOptions: CredentialScopeOptionsSchema,
});

export type CredentialStatusResponse = z.infer<typeof CredentialStatusResponseSchema>;

// ---------------------------------------------------------------------------
// LeagueMemberCredentialStatus — GET /api/leagues/[id]/credentials (pantalla
// C: badge de credencial por fila del roster)
// ---------------------------------------------------------------------------

export const LeagueMemberCredentialStatusSchema = z.object({
	leagueMemberId: z.string().uuid(),
	globalPlayerId: z.string().uuid(),
	credential: PlayerCredentialSchema.nullable(),
	displayStatus: CredentialDisplayStatusSchema,
});

export type LeagueMemberCredentialStatus = z.infer<typeof LeagueMemberCredentialStatusSchema>;

export const LeagueCredentialStatusesResponseSchema = z.array(LeagueMemberCredentialStatusSchema);
export type LeagueCredentialStatusesResponse = z.infer<
	typeof LeagueCredentialStatusesResponseSchema
>;

// ---------------------------------------------------------------------------
// PlayerCredentialWithContext — GET /api/players/[id]/credentials (pantalla
// D: pases del jugador agrupados por organización en su perfil)
// ---------------------------------------------------------------------------

export const PlayerCredentialWithContextSchema = PlayerCredentialSchema.extend({
	organizationName: z.string(),
	leagueName: z.string().nullable(),
	displayStatus: CredentialDisplayStatusSchema,
});

export type PlayerCredentialWithContext = z.infer<typeof PlayerCredentialWithContextSchema>;

export const PlayerCredentialsListResponseSchema = z.array(PlayerCredentialWithContextSchema);
export type PlayerCredentialsListResponse = z.infer<typeof PlayerCredentialsListResponseSchema>;
