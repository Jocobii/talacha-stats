/**
 * entities/player-profile/queries.ts
 *
 * Acceso a DB para player_profiles.
 *
 * Patrones implementados:
 *   findByOrgAndNormalized  — lookup L1/L2 por clave normalizada dentro de una org
 *   findByFingerprint       — lookup por fingerprint (nombre + dorsal) dentro de una org
 *   upsertProfile           — crear o retornar el perfil existente (idempotente)
 *   claimProfile            — vincular un perfil a un jugador global (claim_status → verified)
 *   rejectClaim             — marcar propuesta como rechazada (claim_status → rejected)
 *   listUnclaimed           — listar perfiles sin vínculo global (para revisión manual)
 */

import { and, eq } from "drizzle-orm";
import { db, playerProfiles } from "@/db";
import { normalizePlayerName, fingerprintPlayer } from "@/shared/lib/normalize";
import type { UpsertPlayerProfile } from "./model";

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * Busca un player_profile por nombre normalizado dentro de una organización.
 * Cubre matching L1 (intra-league) y L2 (intra-org cross-league).
 */
export async function findByOrgAndNormalized(
	organizationId: string,
	rawName: string,
): Promise<typeof playerProfiles.$inferSelect | null> {
	const normalized = normalizePlayerName(rawName);

	const result = await db.query.playerProfiles.findFirst({
		where: and(
			eq(playerProfiles.organizationId, organizationId),
			eq(playerProfiles.normalizedName, normalized),
		),
	});

	return result ?? null;
}

/**
 * Busca un player_profile por fingerprint (nombre + dorsal opcional).
 * Más preciso que solo el nombre cuando el dorsal está disponible.
 */
export async function findByFingerprint(
	organizationId: string,
	rawName: string,
	jersey?: string | number | null,
): Promise<typeof playerProfiles.$inferSelect | null> {
	const fp = fingerprintPlayer(rawName, jersey);

	const result = await db.query.playerProfiles.findFirst({
		where: and(
			eq(playerProfiles.organizationId, organizationId),
			eq(playerProfiles.fingerprint, fp),
		),
	});

	return result ?? null;
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

/**
 * Crea un player_profile si no existe para (organizationId, normalizedName).
 * Si ya existe, retorna el existente sin modificarlo.
 *
 * Idempotente — seguro de llamar múltiples veces con los mismos datos.
 * Usado durante importación Excel y backfill.
 */
export async function upsertProfile(
	data: UpsertPlayerProfile,
): Promise<typeof playerProfiles.$inferSelect> {
	const normalized = normalizePlayerName(data.fullName);
	const fp = fingerprintPlayer(data.fullName);

	const [row] = await db
		.insert(playerProfiles)
		.values({
			organizationId: data.organizationId,
			fullName: data.fullName,
			alias: data.alias ?? null,
			normalizedName: normalized,
			fingerprint: fp,
			claimStatus: "unclaimed",
		})
		.onConflictDoUpdate({
			target: [playerProfiles.organizationId, playerProfiles.normalizedName],
			// Solo actualizar alias si viene un valor nuevo — no sobreescribir con null
			set: {
				alias: data.alias ?? playerProfiles.alias,
				updatedAt: new Date(),
			},
		})
		.returning();

	return row;
}

// ---------------------------------------------------------------------------
// Claim / reject
// ---------------------------------------------------------------------------

/**
 * Vincula un player_profile a un jugador global existente.
 * Establece claim_status = 'verified'.
 *
 * Retorna null si el perfil no existe.
 */
export async function claimProfile(
	profileId: string,
	globalPlayerId: string,
): Promise<typeof playerProfiles.$inferSelect | null> {
	const [updated] = await db
		.update(playerProfiles)
		.set({
			claimedPlayerId: globalPlayerId,
			claimStatus: "verified",
			updatedAt: new Date(),
		})
		.where(eq(playerProfiles.id, profileId))
		.returning();

	return updated ?? null;
}

/**
 * Marca una propuesta de claim como rechazada.
 * Limpia el claimed_player_id para que el backfill no lo vuelva a proponer.
 */
export async function rejectClaim(
	profileId: string,
): Promise<typeof playerProfiles.$inferSelect | null> {
	const [updated] = await db
		.update(playerProfiles)
		.set({
			claimedPlayerId: null,
			claimStatus: "rejected",
			updatedAt: new Date(),
		})
		.where(eq(playerProfiles.id, profileId))
		.returning();

	return updated ?? null;
}

// ---------------------------------------------------------------------------
// Listados para revisión
// ---------------------------------------------------------------------------

/**
 * Lista todos los perfiles sin vínculo global (claim_status = 'unclaimed')
 * dentro de una organización.
 * Usado por el script de auditoría y por futuros flujos de revisión en la UI.
 */
export async function listUnclaimed(
	organizationId: string,
): Promise<(typeof playerProfiles.$inferSelect)[]> {
	return db.query.playerProfiles.findMany({
		where: and(
			eq(playerProfiles.organizationId, organizationId),
			eq(playerProfiles.claimStatus, "unclaimed"),
		),
		orderBy: playerProfiles.normalizedName,
	});
}
