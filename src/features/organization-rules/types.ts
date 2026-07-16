/**
 * features/organization-rules/types.ts
 * ViewModel del Reglamento por defecto — calco de tournament-rules/types.ts
 * sin isLocked (una plantilla de organización nunca se congela).
 */
import type { BlueCardMeaning, UserTiebreakerCriterion } from "@/entities/league-config";

export type OrgRulesFormView = {
	organizationId: string;
	tiebreakers: UserTiebreakerCriterion[];
	yellowThreshold: number;
	redCardMatches: number;
	blueCardMeaning: BlueCardMeaning;
	reinforcementLimit: number | null;
	financeLevel: 0 | 1 | 2;
};
