/**
 * entities/match-player-stat/model.ts
 * Tipos de dominio para match_player_stats.
 */
import type { MatchPlayerStat } from "@/db/schema";

export type { MatchPlayerStat };

/**
 * Contrato de respuesta de POST /api/matches/[id]/players (alta de jugador
 * ad-hoc). Tipo nombrado único (§7.4): lo devuelve el caso de uso y lo consume
 * el cliente vía `apiFetch<AdHocPlayerResult>`; nunca se re-declara inline.
 */
export type AdHocPlayerResult = {
	registrationId: string;
	playerProfileId: string;
};
