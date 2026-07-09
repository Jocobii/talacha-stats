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
 * Puntua una contrasena de 1 a 4 (0 solo para vacia) sumando senales de
 * complejidad sobre una base de 1: longitud >= 8, mayuscula+digito juntos,
 * caracter especial. La base de 1 es intencional (toda contrasena no vacia
 * es al menos "Debil"), pero antes se calculaba con Math.max(score, 1) SOBRE
 * el score de señales — eso hacia que "aaaaaaa" (0 senales) y "aaaaaaaa"
 * (1 senal: longitud) empataran en 1 en vez de subir. Ahora la base y las
 * senales se suman en vez de compararse, así cada senal adicional sí sube
 * el puntaje (ver password-strength.test.ts).
 */
export function scorePasswordStrength(value: string): PasswordScore {
	if (!value) return 0;

	let score = 1;
	if (value.length >= 8) score++;
	if (/[A-Z]/.test(value) && /\d/.test(value)) score++;
	if (/[^A-Za-z0-9]/.test(value)) score++;

	return Math.min(score, 4) as PasswordScore;
}
