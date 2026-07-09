/**
 * features/narrator-analysis/lib/map-team-option.ts
 *
 * Mapper DTO → ViewModel (§19). Convierte la fila cruda de equipo que devuelve
 * `/api/teams` en el `TeamOption` mínimo que consumen los <select> del análisis
 * pre-partido. Función pura, sin imports de `@/db` ni ciclo de vida React.
 */

import type { Team } from "@/entities/team";
import type { TeamOption } from "../types";

/** Subconjunto mínimo del DTO que el mapper necesita, derivado de `Team` (§4.1). */
export type TeamOptionDto = Pick<Team, "id" | "name">;

export function mapTeamToTeamOption(team: TeamOptionDto): TeamOption {
	return { id: team.id, name: team.name };
}
