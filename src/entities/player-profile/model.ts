/**
 * entities/player-profile/model.ts
 *
 * Tipos de dominio para player_profiles — la identidad LOCAL de un jugador
 * dentro de una organización (capa 1 del modelo de dos capas, Historia 02).
 *
 * Relación con players:
 *   player_profiles.claimed_player_id → players.id   (opcional — puede estar unclaimed)
 *
 * claim_status lifecycle:
 *   unclaimed  → el perfil fue creado por backfill / importación, sin vínculo global
 *   proposed   → el sistema propone un match cross-org (Historia 03, feature flag)
 *   verified   → el operador confirmó que este perfil = ese jugador global
 *   rejected   → el operador rechazó la propuesta; se crea nuevo jugador global si procede
 */

import { z } from "zod";
import { CLAIM_STATUSES } from "@/db/schema";

// ---------------------------------------------------------------------------
// Schema Zod + tipo inferido
// ---------------------------------------------------------------------------

export const PlayerProfileSchema = z.object({
	id: z.string().uuid(),
	organizationId: z.string().uuid(),
	fullName: z.string().min(2).max(200),
	alias: z.string().max(100).nullable(),
	/** Clave de matching exacto intra-org — producida por normalizePlayerName() */
	normalizedName: z.string().min(1),
	/** Clave de deduplicación compuesta — producida por fingerprintPlayer() */
	fingerprint: z.string().min(1),
	/** null si todavía no está vinculado a una identidad global */
	claimedPlayerId: z.string().uuid().nullable(),
	claimStatus: z.enum(CLAIM_STATUSES),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type PlayerProfileEntity = z.infer<typeof PlayerProfileSchema>;

// Schema para creación (sin id ni timestamps — los genera la DB)
export const NewPlayerProfileSchema = PlayerProfileSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).partial({
	alias: true,
	claimedPlayerId: true,
	claimStatus: true,
});

export type NewPlayerProfile = z.infer<typeof NewPlayerProfileSchema>;

// Schema para upsert desde importación (campos mínimos requeridos)
export const UpsertPlayerProfileSchema = z.object({
	organizationId: z.string().uuid(),
	fullName: z.string().min(2).max(200),
	alias: z.string().max(100).optional().nullable(),
	normalizedName: z.string().min(1),
	fingerprint: z.string().min(1),
});

export type UpsertPlayerProfile = z.infer<typeof UpsertPlayerProfileSchema>;
