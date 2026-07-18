/**
 * entities/player-credential/lib/can-play-in-league.ts
 *
 * Función única de autorización — "¿este jugador puede jugar en la liga L
 * hoy?" (docs/CREDENCIAL-PASE-JUGADOR.md §5). Se reutiliza al inscribir
 * (league_members) y en cotejo/acta; ningún otro callsite reimplementa esta
 * regla.
 *
 * Pura y sin imports de `@/db` — recibe los pases y la liga ya resueltos
 * (entities/player-credential/queries.ts hace el fetch real).
 */

import type { PlayerCredentialScope, PlayerCredentialStatus } from "../model";

export type CredentialForAuthCheck = {
	organizationId: string;
	leagueId: string | null;
	status: PlayerCredentialStatus;
	scope: PlayerCredentialScope;
	validFrom: string | null; // YYYY-MM-DD
	validUntil: string | null; // YYYY-MM-DD
};

export type LeagueForAuthCheck = {
	id: string;
	organizationId: string | null;
	status: string; // "active" | "finished"
};

export function isWithinValidity(credential: CredentialForAuthCheck, today: string): boolean {
	if (!credential.validFrom || !credential.validUntil) return false;
	return credential.validFrom <= today && today <= credential.validUntil;
}

function coversAsOrganizationPass(
	credential: CredentialForAuthCheck,
	league: LeagueForAuthCheck,
	today: string,
): boolean {
	if (credential.scope !== "organization") return false;
	if (!league.organizationId) return false;
	if (credential.organizationId !== league.organizationId) return false;
	return isWithinValidity(credential, today);
}

function coversAsSingleLeaguePass(
	credential: CredentialForAuthCheck,
	league: LeagueForAuthCheck,
): boolean {
	if (credential.scope !== "single_league") return false;
	if (credential.leagueId !== league.id) return false;
	return league.status === "active";
}

function isCoveringCredential(
	credential: CredentialForAuthCheck,
	league: LeagueForAuthCheck,
	today: string,
): boolean {
	if (credential.status !== "active") return false;
	return (
		coversAsOrganizationPass(credential, league, today) ||
		coversAsSingleLeaguePass(credential, league)
	);
}

/**
 * Busca, dentro de una lista de pases ya resueltos, el primero que autorice
 * a jugar la liga L hoy. Genérico sobre `T` para que el caller (queries.ts)
 * pueda pasar las filas completas de la DB y recuperar el `id` real del pase
 * que cubre, no solo un booleano.
 */
export function findCoveringCredential<T extends CredentialForAuthCheck>(
	credentials: T[],
	league: LeagueForAuthCheck,
	today: string,
): T | null {
	return credentials.find((credential) => isCoveringCredential(credential, league, today)) ?? null;
}

/**
 * Un pase autoriza si está `active` y, según su alcance, cubre la liga L hoy:
 *   - organization: misma org que L, y hoy dentro de [valid_from, valid_until]
 *   - single_league: mismo league_id que L, y L sigue `active`
 */
export function canPlayInLeague(
	credentials: CredentialForAuthCheck[],
	league: LeagueForAuthCheck,
	today: string,
): boolean {
	return findCoveringCredential(credentials, league, today) !== null;
}
