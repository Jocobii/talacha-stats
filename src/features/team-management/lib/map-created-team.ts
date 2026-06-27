/**
 * features/team-management/lib/map-created-team.ts
 *
 * Mapper DTO → ViewModel (§19). Convierte la fila cruda de equipo que devuelve
 * el POST /api/teams en el `CreatedTeamView` que el hook expone a la UI. Aquí
 * vive el formateo de presentación (`titleCase`, §5); la UI nunca toca la fila
 * cruda de DB.
 *
 * Función pura, sin imports de `@/db` ni ciclo de vida React → testeable directo.
 */

import { titleCase } from "@/shared/lib/normalize";
import type { Team } from "@/entities/team";
import type { CreatedTeamView } from "../types";

/**
 * Subconjunto mínimo del DTO que el mapper necesita, derivado de `Team`
 * (`$inferSelect`, §4.1) en lugar de redeclararse a mano (no duplicar tipos).
 */
export type CreatedTeamDto = Pick<Team, "id" | "name" | "color">;

export function mapTeamToCreatedView(team: CreatedTeamDto): CreatedTeamView {
	return {
		id: team.id,
		displayName: titleCase(team.name),
		color: team.color ?? null,
	};
}
