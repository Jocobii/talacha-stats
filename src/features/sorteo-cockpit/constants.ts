export const COCKPIT_DEBOUNCE_MS = 800;

/** Config de sorteo de la liga (GET lee / PUT crea-actualiza). */
export const SCHEDULING_CONFIG_URL = (leagueId: string): string =>
	`/api/leagues/${leagueId}/scheduling-config`;

/**
 * Valores fijos que el cockpit envía siempre al guardar la config (formato
 * simple). Centralizados para no hardcodearlos en cada UI (§3.5).
 */
export const SCHEDULING_CONFIG_FIXED = {
	regularFormat: "single",
} as const;

export const STATUS_LABELS: Record<string, string> = {
	draft: "Borrador",
	published: "Publicada",
	in_progress: "En Juego",
	completed: "Cerrada",
};

export const NEXT_STEP_TEXT: Record<string, string> = {
	draft_no_matches: "Genera el sorteo para continuar",
	draft_with_matches: "Revisa la tabla y edita si hace falta",
	published: "Jornada publicada · puedes editar hasta el día del partido",
	in_progress: "Jornada en curso · puedes reagendar partidos",
	completed: "Jornada cerrada",
};
