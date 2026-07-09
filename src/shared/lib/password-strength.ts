/**
 * shared/lib/password-strength.ts
 * Heuristica simple de fuerza de contrasena (sin dependencias externas).
 * Usada por el formulario de registro para dar feedback en vivo.
 */

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export const PASSWORD_STRENGTH_LABELS: Record<PasswordScore, string> = {
	0: "",
	1: "Débil",
	2: "Aceptable",
	3: "Buena",
	4: "Excelente",
};

/**
 * Puntua una contrasena de 0 a 4 sumando senales de complejidad:
 * longitud >= 8, mayus+minus, digito, caracter especial.
 * Una contrasena no vacia nunca puntua 0 (minimo 1) para dar feedback visible.
 */
export function scorePasswordStrength(value: string): PasswordScore {
	if (!value) return 0;

	let score = 0;
	if (value.length >= 8) score++;
	if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
	if (/\d/.test(value)) score++;
	if (/[^A-Za-z0-9]/.test(value)) score++;

	return Math.max(score, 1) as PasswordScore;
}
