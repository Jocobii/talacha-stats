/**
 * features/team-management/lib/map-team-option.ts
 *
 * Mapper DTO → ViewModel (§19). Convierte la fila cruda de equipo que devuelve
 * la API (`/api/teams`) en el `TeamOption` que consume el selector de
 * transferencia. La UI nunca toca la fila cruda de DB: solo ve `TeamOption`.
 *
 * Función pura, sin imports de `@/db` ni ciclo de vida React → testeable directo.
 */

import type { Team } from "@/entities/team";
import type { TeamOption } from "../types";

/**
 * Subconjunto mínimo del DTO que el mapper necesita. Se deriva de `Team`
 * (`$inferSelect`, §4.1) en lugar de redeclararse a mano, para no duplicar tipos.
 */
export type TeamOptionDto = Pick<Team, "id" | "name" | "color">;

export function mapTeamToTeamOption(team: TeamOptionDto): TeamOption {
	return {
		id: team.id,
		name: team.name,
		color: team.color ?? null,
	};
}
