/**
 * shared/config/flags.ts
 *
 * Feature flags del sistema. Controlados por variables de entorno.
 *
 * Para activar en staging/QA, agregar a .env.local:
 *   FEATURE_CROSS_ORG_SUGGESTIONS=true
 *
 * En producción (primer release) todos los flags cross-org están APAGADOS.
 * La lógica de L4 existe en el código pero no se ejecuta hasta que el flag esté ON.
 *
 * Historial:
 *   Historia 03 — CROSS_ORG_SUGGESTIONS: OFF por default (L4 en matching pipeline)
 */

export const flags = {
	/**
	 * Activa la capa L4 del motor de matching: sugerencias cross-org exactas.
	 * Cuando está OFF (default), un nombre exacto en otra org → create_new.
	 * Cuando está ON, se devuelve un GlobalCandidate con metadata mínima.
	 */
	CROSS_ORG_SUGGESTIONS: process.env.FEATURE_CROSS_ORG_SUGGESTIONS === "true",
} as const;

export type FeatureFlags = typeof flags;
