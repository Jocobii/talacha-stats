/**
 * features/match-resolution/resolve-match.ts
 * Persiste la resolución completa de un partido (guardado explícito).
 */
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ResolveMatchInput } from "@/entities/match/model";
import {
	upsertMatchPlayerStat,
	deleteMatchPlayerStats,
} from "@/entities/match-player-stat/queries";
import { applyWalkoverDefaults } from "./lib/walkover-defaults";
import { maybeFreezeLeagueConfig, COUNTED_RESOLUTION_STATUSES } from "./lib/freeze-league-config";
import { applyCardDiscipline } from "@/features/discipline/apply-card-discipline";
import { decrementSuspensionsForMatch } from "@/features/discipline/decrement-suspensions";
import { CLEAR_STATS_STATUSES } from "./constants";

export async function resolveMatch(
	matchId: string,
	input: ResolveMatchInput,
	userId: string,
): Promise<void> {
	const isClearStatus = (CLEAR_STATS_STATUSES as readonly string[]).includes(input.status);
	const isWalkover = input.status === "walkover_home" || input.status === "walkover_away";

	await db.transaction(async (tx) => {
		// 1. Limpiar stats si el status no tiene jugadores
		if (isClearStatus) {
			await deleteMatchPlayerStats(tx, matchId);
		}

		// 2. Calcular marcador y bonus para walkover
		const scoreData = isWalkover
			? applyWalkoverDefaults(input.status as "walkover_home" | "walkover_away")
			: {
					homeScore: input.homeScore,
					awayScore: input.awayScore,
					homeBonusGoals: input.homeBonusGoals,
					awayBonusGoals: input.awayBonusGoals,
				};

		// 3. Upsert stats de jugadores si es partido jugado
		if (input.status === "played") {
			const allPlayers = [
				...input.homePlayers.map((p) => ({ ...p, side: "home" as const })),
				...input.awayPlayers.map((p) => ({ ...p, side: "away" as const })),
			];

			for (const player of allPlayers) {
				// Marcar presente automáticamente si tiene stats > 0
				const hasStats =
					player.goals + player.assists + player.yellowCards + player.blueCards + player.redCards >
					0;
				const isPresent = player.isPresent || hasStats;

				await upsertMatchPlayerStat(tx, matchId, player.playerRegistrationId, {
					teamSide: player.side,
					isPresent,
					shirtNumber: player.shirtNumber ?? null,
					goals: player.goals,
					assists: player.assists,
					yellowCards: player.yellowCards,
					blueCards: player.blueCards,
					redCards: player.redCards,
				});
			}
		}

		// 4. Actualizar el partido
		const [updated] = await tx
			.update(matches)
			.set({
				status: input.status,
				homeScore: scoreData.homeScore,
				awayScore: scoreData.awayScore,
				homeBonusGoals: scoreData.homeBonusGoals,
				awayBonusGoals: scoreData.awayBonusGoals,
				refereeObservations: input.refereeObservations ?? null,
				resolvedAt: new Date(),
				resolvedBy: userId,
			})
			.where(eq(matches.id, matchId))
			.returning({
				leagueId: matches.leagueId,
				homeTeamId: matches.homeTeamId,
				awayTeamId: matches.awayTeamId,
			});

		// 5. Si es la primera cédula "real" de la liga, congelar el reglamento
		// (league_config.locked_at) — §4.4 de docs/MODULOS-GESTION-LIGA.md.
		if (updated) {
			await maybeFreezeLeagueConfig(tx, updated.leagueId, matchId, input.status);

			// 6. Motor de disciplina (B3/B4, §5.2 docs/MODULOS-GESTION-LIGA.md):
			// roja directa y acumulación de amarillas materializan suspensiones
			// dentro de la misma tx, sobre las stats recién escritas en el paso 3.
			if (input.status === "played") {
				await applyCardDiscipline(tx, matchId, updated.leagueId);
			}

			// 7. Descontar fecha a suspensiones 'matches' activas de jugadores cuyo
			// equipo jugó esta cédula contable (B5, §5.2 docs/MODULOS-GESTION-LIGA.md).
			if ((COUNTED_RESOLUTION_STATUSES as readonly string[]).includes(input.status)) {
				await decrementSuspensionsForMatch(
					tx,
					matchId,
					updated.leagueId,
					updated.homeTeamId,
					updated.awayTeamId,
				);
			}
		}
	});
}
