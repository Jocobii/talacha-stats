/**
 * features/narrator-analysis/lib/map-analysis-view.ts
 *
 * Mapper de display (§19). El motor trabaja con nombres sanitizados (lowercase);
 * para la UI los pasamos por titleCase. Es PURO y no quita campos — solo formatea
 * nombres visibles. Útil sobre todo para el flujo Excel, donde los nombres salen
 * en minúsculas desde la tabla de posiciones.
 */

import type { NarratorAnalysis, RosterPlayer, TeamAnalysis } from "@/entities/narrator/model";
import { titleCase } from "@/shared/lib/normalize";

export function titleCaseAnalysisNames(analysis: NarratorAnalysis): NarratorAnalysis {
	return {
		...analysis,
		league: { ...analysis.league, name: titleCase(analysis.league.name) },
		teamA: titleCaseTeam(analysis.teamA),
		teamB: titleCaseTeam(analysis.teamB),
	};
}

function titleCaseTeam(team: TeamAnalysis): TeamAnalysis {
	return {
		...team,
		team: { ...team.team, name: titleCase(team.team.name) },
		roster: team.roster.map(titleCasePlayer),
		topScorer: team.topScorer ? titleCasePlayer(team.topScorer) : null,
		topAssist: team.topAssist ? titleCasePlayer(team.topAssist) : null,
		topContributor: team.topContributor ? titleCasePlayer(team.topContributor) : null,
		topScoringThreats: team.topScoringThreats.map(titleCasePlayer),
		cardRisk: team.cardRisk.map((c) => ({ ...c, player: titleCase(c.player) })),
	};
}

function titleCasePlayer(p: RosterPlayer): RosterPlayer {
	return { ...p, fullName: titleCase(p.fullName) };
}
