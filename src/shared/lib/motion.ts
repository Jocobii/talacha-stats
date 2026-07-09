/**
 * shared/lib/motion.ts
 * Constantes compartidas para animaciones con `motion/react` (antes framer-motion).
 * Usar esta curva/duraciones en vez de valores sueltos para que las transiciones
 * "premium" (login, logout, overlays de estado) se sientan consistentes.
 */

/** Curva "expo out" — arranque rápido, aterrizaje suave. Da la sensación premium. */
export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export const TRANSITION_PREMIUM = { duration: 0.4, ease: EASE_PREMIUM };
