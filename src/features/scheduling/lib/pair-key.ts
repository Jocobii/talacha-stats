/**
 * features/scheduling/lib/pair-key.ts
 * Clave canónica para un par de equipos — independiente del orden home/away.
 * Uso: detectar duplicados y el índice único parcial de S4.
 */

/**
 * Devuelve una clave estable para el par (a, b).
 * sort léxico garantiza que pairKey(a,b) === pairKey(b,a).
 * BYE (null) se representa como "BYE" para poder indexar sin condicionales.
 */
export function pairKey(a: string, b: string | null): string {
	const bStr = b ?? "BYE";
	return a < bStr ? `${a}::${bStr}` : `${bStr}::${a}`;
}
