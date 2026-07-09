/**
 * features/narrator-analysis/types.ts
 * Tipos compartidos de la feature (flujo BD del análisis pre-partido). No
 * duplicar en subcomponentes — importar desde aquí.
 */

/** Opción lista para pintar en los <select> de equipo (ViewModel, §19). */
export type TeamOption = {
	id: string;
	name: string;
};

/** Selección de liga + equipos que llega codificada en la URL (enlace compartido). */
export type LinkParams = {
	leagueId: string;
	teamA: string;
	teamB: string;
};

/** Selección confirmada (por "Generar" o por un enlace válido) que dispara el análisis. */
export type ConfirmedMatchup = {
	leagueId: string;
	teamA: string;
	teamB: string;
};

/**
 * Código de error de validación del matchup (sin traducir). La UI decide el
 * copy final con `useTranslations` — el hook no importa i18n (§3.5/§7.2:
 * lógica de estado en `model/`, texto en `ui/`).
 */
export type MatchupErrorCode =
	| { code: "bothLinkTeams" }
	| { code: "oneLinkTeam"; team: "A" | "B" }
	| { code: "bothTeams" }
	| null;
