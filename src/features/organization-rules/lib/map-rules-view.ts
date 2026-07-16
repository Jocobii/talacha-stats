import type { OrganizationConfigDto } from "@/entities/organization-config";
import type { UserTiebreakerCriterion } from "@/entities/league-config";
import type { OrgRulesFormView } from "../types";

/** DTO (con "name" al fondo del arreglo) → ViewModel (solo los 4 reordenables). */
export function mapOrganizationConfigToRulesView(dto: OrganizationConfigDto): OrgRulesFormView {
	return {
		organizationId: dto.organizationId,
		tiebreakers: dto.tiebreakers.filter((t): t is UserTiebreakerCriterion => t !== "name"),
		yellowThreshold: dto.yellowThreshold,
		redCardMatches: dto.redCardMatches,
		blueCardMeaning: dto.blueCardMeaning,
		reinforcementLimit: dto.reinforcementLimit,
		financeLevel: dto.financeLevel as 0 | 1 | 2,
	};
}
