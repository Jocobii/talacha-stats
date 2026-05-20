/**
 * entities/match-player-stat/queries.ts
 * Acceso y mutación de DB para match_player_stats.
 */
import { db } from "@/db";
import { matchPlayerStats } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { MatchPlayerStatInput } from "@/entities/match/model";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Upsert de una fila de stats. Usa ON CONFLICT para ser idempotente.
 * Si ya existe (match_id + player_registration_id), actualiza los campos.
 */
export async function upsertMatchPlayerStat(
	tx: DbTx,
	matchId: string,
	registrationId: string,
	data: Partial<MatchPlayerStatInput> & { teamSide: "home" | "away" },
): Promise<void> {
	await tx
		.insert(matchPlayerStats)
		.values({
			matchId,
			playerRegistrationId: registrationId,
			teamSide: data.teamSide,
			isPresent: data.isPresent ?? false,
			shirtNumber: data.shirtNumber ?? null,
			goals: data.goals ?? 0,
			assists: data.assists ?? 0,
			yellowCards: data.yellowCards ?? 0,
			blueCards: data.blueCards ?? 0,
			redCards: data.redCards ?? 0,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: [matchPlayerStats.matchId, matchPlayerStats.playerRegistrationId],
			set: {
				isPresent: data.isPresent ?? false,
				shirtNumber: data.shirtNumber ?? null,
				goals: data.goals ?? 0,
				assists: data.assists ?? 0,
				yellowCards: data.yellowCards ?? 0,
				blueCards: data.blueCards ?? 0,
				redCards: data.redCards ?? 0,
				updatedAt: new Date(),
			},
		});
}

/**
 * Actualización parcial de una fila de stats (autosave selectivo).
 * Solo actualiza las columnas que vienen en `partial`.
 */
export async function patchMatchPlayerStat(
	matchId: string,
	registrationId: string,
	partial: Partial<Omit<MatchPlayerStatInput, "playerRegistrationId">>,
): Promise<void> {
	type StatPatch = Partial<typeof matchPlayerStats.$inferInsert>;
	const set: StatPatch = { updatedAt: new Date() };
	if (partial.isPresent !== undefined) set.isPresent = partial.isPresent;
	if (partial.shirtNumber !== undefined) set.shirtNumber = partial.shirtNumber;
	if (partial.goals !== undefined) set.goals = partial.goals;
	if (partial.assists !== undefined) set.assists = partial.assists;
	if (partial.yellowCards !== undefined) set.yellowCards = partial.yellowCards;
	if (partial.blueCards !== undefined) set.blueCards = partial.blueCards;
	if (partial.redCards !== undefined) set.redCards = partial.redCards;

	await db
		.update(matchPlayerStats)
		.set(set)
		.where(
			and(
				eq(matchPlayerStats.matchId, matchId),
				eq(matchPlayerStats.playerRegistrationId, registrationId),
			),
		);
}

/** Elimina todas las stats de un partido (walkover / suspended / postponed) */
export async function deleteMatchPlayerStats(tx: DbTx, matchId: string): Promise<void> {
	await tx.delete(matchPlayerStats).where(eq(matchPlayerStats.matchId, matchId));
}

/** Lista las stats de un partido para lectura */
export async function listStatsByMatch(matchId: string) {
	return db.query.matchPlayerStats.findMany({
		where: eq(matchPlayerStats.matchId, matchId),
	});
}
