/**
 * features/tournament-rules/index.ts
 * Exportaciones públicas. App/ y otras capas solo importan desde aquí.
 *
 * NOTA: rules.ts importa @/db y es SOLO server — no se re-exporta aquí para
 * no arrastrar `pg` al bundle del navegador (mismo patrón que
 * tournament-skin/activations.ts). Server Components y API routes lo
 * importan por ruta directa: `@/features/tournament-rules/rules`.
 */

export { TIEBREAKER_CRITERIA, type TiebreakerCriterion } from "@/entities/league-config";

export { ReglamentoScreen } from "./ui/ReglamentoScreen";
export { useLeagueRules } from "./model/useLeagueRules";
export { useUpdateLeagueRules } from "./model/useUpdateLeagueRules";
export { mapLeagueConfigToRulesView } from "./lib/map-rules-view";
export {
	BLUE_CARD_LABELS,
	FINANCE_LEVEL_LABELS,
	TIEBREAKER_LABELS,
	type RulesFormView,
} from "./types";
