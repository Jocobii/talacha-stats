/**
 * features/tournament-rules/lib/map-rules-view.ts
 * Único puente DTO → ViewModel (§19). Puro, testeado aparte.
 */
import { USER_TIEBREAKER_CRITERIA, type LeagueConfigDto } from "@/entities/league-config";
import type { RulesFormView } from "../types";

export function mapLeagueConfigToRulesView(dto: LeagueConfigDto): RulesFormView {
	const knownCriteria = new Set<string>(USER_TIEBREAKER_CRITERIA);
	const tiebreakers = dto.tiebreakers.filter((t): t is RulesFormView["tiebreakers"][number] =>
		knownCriteria.has(t),
	);

	return {
		leagueId: dto.leagueId,
		// Defensivo: si faltara algún criterio (dato viejo/corrupto), completa
		// con el default al final para que la UI siempre muestre los 4.
		tiebreakers:
			tiebreakers.length === USER_TIEBREAKER_CRITERIA.length
				? tiebreakers
				: [...tiebreakers, ...USER_TIEBREAKER_CRITERIA.filter((c) => !tiebreakers.includes(c))],
		yellowThreshold: dto.yellowThreshold,
		redCardMatches: dto.redCardMatches,
		blueCardMeaning: dto.blueCardMeaning,
		reinforcementLimit: dto.reinforcementLimit,
		financeLevel: dto.financeLevel as 0 | 1 | 2,
		isLocked: dto.lockedAt !== null,
	};
}
