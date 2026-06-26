/**
 * features/league-selection/lib/map-league-option.ts
 *
 * Mapper DTO → ViewModel (§19) del selector de liga. Convierte la fila cruda de
 * `/api/leagues` en una opción lista para pintar (`LeagueOption`), aplicando
 * `titleCase` (§5) al nombre y al día. La UI nunca formatea ni toca la fila cruda.
 *
 * El DTO se deriva del tipo de la entidad (`Pick<League, …>`, §4.1/§7.4), no se
 * re-declara a mano. Función pura, sin imports de `@/db` ni ciclo de vida React.
 */

import { titleCase } from "@/shared/lib/normalize";
import type { League } from "@/entities/league";
import type { LeagueOption } from "../types";

/** Subconjunto mínimo del DTO de entidad que el mapper necesita. */
export type LeagueOptionDto = Pick<League, "id" | "name" | "dayOfWeek">;

export function mapLeagueToOption(league: LeagueOptionDto): LeagueOption {
	return {
		id: league.id,
		label: `${titleCase(league.name)} - ${titleCase(league.dayOfWeek)}`,
	};
}
