/**
 * features/match-resolution/lib/validate-resolution.ts
 * Validaciones de negocio que generan warnings (no bloquean el guardado).
 */
import type { ResolveMatchInput } from "@/entities/match/model";
import { computeTeamGoals, computeAttributionGap } from "./compute-totals";

export type ResolutionWarning = {
	level: "info" | "warning" | "error";
	code: "home_gap" | "away_gap" | "no_present" | "score_missing" | "stats_without_present";
	message: string;
};

export function validateResolution(input: ResolveMatchInput): ResolutionWarning[] {
	const warnings: ResolutionWarning[] = [];

	if (input.status !== "played") return warnings;

	// score_missing
	if (input.homeScore === null || input.awayScore === null) {
		warnings.push({
			level: "error",
			code: "score_missing",
			message: "Falta el marcador del partido",
		});
	}

	// no_present — local
	const homePresentCount = input.homePlayers.filter((p) => p.isPresent).length;
	if (homePresentCount === 0) {
		warnings.push({
			level: "error",
			code: "no_present",
			message: "El equipo local no tiene jugadores marcados como presentes",
		});
	}

	// no_present — visitante
	const awayPresentCount = input.awayPlayers.filter((p) => p.isPresent).length;
	if (awayPresentCount === 0) {
		warnings.push({
			level: "error",
			code: "no_present",
			message: "El equipo visitante no tiene jugadores marcados como presentes",
		});
	}

	// stats_without_present
	const hasStatsWithoutPresent = [...input.homePlayers, ...input.awayPlayers].some(
		(p) => !p.isPresent && p.goals + p.assists + p.yellowCards + p.blueCards + p.redCards > 0,
	);
	if (hasStatsWithoutPresent) {
		warnings.push({
			level: "warning",
			code: "stats_without_present",
			message: "Hay jugadores con estadísticas pero no marcados como presentes",
		});
	}

	// home_gap
	if (input.homeScore !== null) {
		const homeGap = computeAttributionGap(
			input.homeScore,
			computeTeamGoals(input.homePlayers),
			input.homeBonusGoals,
		);
		if (homeGap !== 0) {
			warnings.push({
				level: "warning",
				code: "home_gap",
				message:
					homeGap > 0
						? `Faltan ${homeGap} gol(es) del equipo local por atribuir`
						: `Sobran ${Math.abs(homeGap)} gol(es) atribuidos al equipo local`,
			});
		}
	}

	// away_gap
	if (input.awayScore !== null) {
		const awayGap = computeAttributionGap(
			input.awayScore,
			computeTeamGoals(input.awayPlayers),
			input.awayBonusGoals,
		);
		if (awayGap !== 0) {
			warnings.push({
				level: "warning",
				code: "away_gap",
				message:
					awayGap > 0
						? `Faltan ${awayGap} gol(es) del equipo visitante por atribuir`
						: `Sobran ${Math.abs(awayGap)} gol(es) atribuidos al equipo visitante`,
			});
		}
	}

	return warnings;
}
