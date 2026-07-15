/**
 * entities/player/lib/credential.ts
 *
 * Helpers de presentación para el código de credencial del jugador
 * (credential_code en league_members). El código se guarda como entero
 * crudo en DB; el relleno de ceros es puramente de presentación.
 *
 * Ver docs/CREDENCIAL-CODIGO-JUGADOR.md para el modelo completo.
 */

/** Ancho de relleno por defecto para el código de credencial. */
export const CREDENTIAL_PAD_WIDTH = 4;

/** 42 → "0042". null → "—". */
export function formatCredentialCode(code: number | null, width = CREDENTIAL_PAD_WIDTH): string {
	if (code == null) return "—";
	return String(code).padStart(width, "0");
}
