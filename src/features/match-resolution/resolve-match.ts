/**
 * features/match-resolution/resolve-match.ts
 * Persiste la resolución completa de un partido (guardado explícito).
 */
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ResolveMatchInput } from "@/entities/match/model";
import { upsertMatchPlayerStat, deleteMatchPlayerStats } from "@/entities/match-player-stat";
import { applyWalkoverDefaults } from "./lib/walkover-defaults";
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
		await tx
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
			.where(eq(matches.id, matchId));
	});
}
