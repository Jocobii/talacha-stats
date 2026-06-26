/**
 * shared/lib/map-league-option.ts
 *
 * Mapper DTO → ViewModel (§19) para el selector de liga compartido
 * (`shared/ui/LeagueSelect`). Convierte la fila cruda de `/api/leagues` en una
 * opción lista para pintar (`LeagueOption`), aplicando `titleCase` (§5) al
 * nombre y al día. La UI nunca formatea ni toca la fila cruda.
 *
 * Vive en `shared` (no en una feature) porque lo consume un widget de
 * `shared/ui`; FSD prohíbe que `shared` importe de features/entities, así que el
 * DTO se declara localmente con los campos mínimos que el mapper necesita.
 *
 * Función pura, sin imports de `@/db` ni ciclo de vida React → testeable directo.
 */

import { titleCase } from "@/shared/lib/normalize";

export type LeagueOptionDto = {
	id: string;
	name: string;
	dayOfWeek: string;
};

export type LeagueOption = {
	id: string;
	label: string;
};

export function mapLeagueToOption(league: LeagueOptionDto): LeagueOption {
	return {
		id: league.id,
		label: `${titleCase(league.name)} - ${titleCase(league.dayOfWeek)}`,
	};
}
