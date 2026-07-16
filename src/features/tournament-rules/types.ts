/**
 * features/tournament-rules/types.ts
 * ViewModel de "Reglamento del torneo" — lo único que ve la UI (§7.3/§19).
 */
import type { BlueCardMeaning, UserTiebreakerCriterion } from "@/entities/league-config";

export type RulesFormView = {
	leagueId: string;
	tiebreakers: UserTiebreakerCriterion[];
	yellowThreshold: number;
	redCardMatches: number;
	blueCardMeaning: BlueCardMeaning;
	reinforcementLimit: number | null;
	financeLevel: 0 | 1 | 2;
	isLocked: boolean;
};

export const TIEBREAKER_LABELS: Record<UserTiebreakerCriterion, string> = {
	points: "Puntos",
	head_to_head: "Enfrentamiento directo",
	goal_diff: "Diferencia de goles",
	goals_for: "Goles a favor",
};

export const BLUE_CARD_LABELS: Record<BlueCardMeaning, string> = {
	temp: "Expulsión temporal (5 min)",
	yellow: "Cuenta como amarilla",
	none: "No se usa",
};

export const FINANCE_LEVEL_LABELS: Record<0 | 1 | 2, string> = {
	0: "Apagado",
	1: "Básico",
	2: "Completo",
};
