/**
 * features/match-resolution/load-match.ts
 * Carga los datos de un partido para la pantalla de captura.
 */
import { getMatchForResolution } from "@/entities/match/queries";
import type { MatchResolutionData } from "@/entities/match/model";

export async function loadMatchForResolution(matchId: string): Promise<MatchResolutionData | null> {
	return getMatchForResolution(matchId);
}
