/**
 * features/onboarding-wizard/lib/map-league-to-summary.ts
 * Mapper puro DTO (QuickCreatedLeague) → ViewModel (CreatedLeagueView) para
 * el contexto mostrado en Horario/Listo (§19).
 */

import { titleCase } from "@/shared/lib/normalize";
import type { CreatedLeagueView } from "../types";

// Espeja QuickCreatedLeague de features/league-onboarding/quick-create.ts.
// No se importa directamente: §3.1 prohíbe features → features. El tipo
// "correcto" según §7.4 viviría en entities/league, pero ese DTO no existe
// hoy (deuda preexistente de quick-create.ts, fuera de alcance de esta
// feature). Se espeja el shape de la respuesta real del endpoint.
type QuickCreatedLeagueDto = {
	id: string;
	name: string;
	season: string;
	dayOfWeek: string;
};

export function mapLeagueToSummary(league: QuickCreatedLeagueDto): CreatedLeagueView {
	return {
		id: league.id,
		name: titleCase(league.name),
		dayOfWeek: league.dayOfWeek,
		season: league.season,
	};
}
