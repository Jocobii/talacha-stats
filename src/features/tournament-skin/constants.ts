/**
 * features/tournament-skin/constants.ts
 */

/** GET público — skin activo resuelto. */
export const ACTIVE_SKIN_URL = "/api/skin";

/** CRUD admin (owner) de activaciones. */
export const SKIN_ACTIVATIONS_URL = "/api/skin-activations";

/** Timezone de negocio: las fechas de activación se evalúan en hora de Tijuana. */
export const SKIN_TIMEZONE = "America/Tijuana";

/** Límites del nombre de la activación. */
export const ACTIVATION_NAME_MIN = 3;
export const ACTIVATION_NAME_MAX = 60;
