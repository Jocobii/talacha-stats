/**
 * features/narrator-analysis/lib/parse-link-params.ts
 *
 * Lee los params de un enlace de análisis compartido (`?leagueId=&teamA=&teamB=`)
 * desde `URLSearchParams` y los valida como completos. Función pura — no decide
 * si los ids EXISTEN de verdad (eso requiere la lista de equipos ya cargada,
 * responsabilidad del hook que reconcilia el enlace contra `useLeagueTeamOptions`).
 */

import type { LinkParams } from "../types";

export function parseLinkParams(searchParams: URLSearchParams): LinkParams | null {
	const leagueId = searchParams.get("leagueId");
	const teamA = searchParams.get("teamA");
	const teamB = searchParams.get("teamB");

	if (!leagueId || !teamA || !teamB) return null;

	return { leagueId, teamA, teamB };
}
