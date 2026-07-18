/**
 * entities/player-credential/lib/credential-status.ts
 *
 * Traduce un pase (o su ausencia) al estado presentable que muestran las
 * pantallas de UI — paso de registro (A), roster (C) y perfil (D):
 * "vigente" | "pendiente" | "porvencer" | "vencida" | "suspendida" | "cancelada".
 *
 * `player_credentials.status` NUNCA se transiciona solo a "expired" (ver §7
 * docs/CREDENCIAL-PASE-JUGADOR.md — la vigencia real se calcula al vuelo).
 * Por eso este helper no confía ciegamente en el status guardado: para el
 * anual, "vencida"/"porvencer" se derivan comparando validUntil contra hoy;
 * para el desechable, del status de la liga (el mismo criterio que
 * canPlayInLeague). "porvencer" solo aplica al anual — el desechable no tiene
 * aviso anticipado, su vigencia es binaria (liga active o no).
 *
 * Pura y sin imports de `@/db`.
 */

import { isWithinValidity, type CredentialForAuthCheck } from "./can-play-in-league";
import { daysUntil } from "./dates";

export const CREDENTIAL_DISPLAY_STATUSES = [
	"vigente",
	"pendiente",
	"porvencer",
	"vencida",
	"suspendida",
	"cancelada",
] as const;

export type CredentialDisplayStatus = (typeof CREDENTIAL_DISPLAY_STATUSES)[number];

/** Días antes de valid_until en los que el anual pasa a mostrarse "por vencer". */
export const EXPIRING_SOON_THRESHOLD_DAYS = 15;

/** Sin pase enlazado — "pendiente de credencial" (§6, §8). */
function statusForMissingCredential(): CredentialDisplayStatus {
	return "pendiente";
}

/**
 * Deriva el estado de un pase `organization`: "vencida" si ya pasó
 * valid_until, "porvencer" si faltan <= EXPIRING_SOON_THRESHOLD_DAYS días,
 * si no "vigente".
 */
function statusForOrganizationScope(
	credential: CredentialForAuthCheck,
	today: string,
): CredentialDisplayStatus {
	if (!isWithinValidity(credential, today)) return "vencida";
	const remainingDays = daysUntil(credential.validUntil!, today);
	return remainingDays <= EXPIRING_SOON_THRESHOLD_DAYS ? "porvencer" : "vigente";
}

/** Deriva el estado de un pase `single_league`: vigente mientras la liga siga `active`. */
function statusForSingleLeagueScope(leagueStatus: string): CredentialDisplayStatus {
	return leagueStatus === "active" ? "vigente" : "vencida";
}

/**
 * Estado presentable de un pase para una liga concreta (o su ausencia).
 * `credential` puede ser null (jugador sin pase enlazado todavía).
 */
export function computeCredentialDisplayStatus(
	credential: CredentialForAuthCheck | null,
	leagueStatus: string,
	today: string,
): CredentialDisplayStatus {
	if (!credential) return statusForMissingCredential();
	if (credential.status === "suspended") return "suspendida";
	if (credential.status === "cancelled") return "cancelada";
	if (credential.status === "expired") return "vencida";

	if (credential.scope === "organization") return statusForOrganizationScope(credential, today);
	return statusForSingleLeagueScope(leagueStatus);
}
