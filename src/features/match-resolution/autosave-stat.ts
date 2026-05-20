/**
 * features/match-resolution/autosave-stat.ts
 * Funciones de autosave parcial para stats y campos del partido.
 */
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { patchMatchPlayerStat } from "@/entities/match-player-stat";
import type { AutosaveStatInput, AutosaveMatchFieldsInput } from "@/entities/match/model";

/** Autosave parcial de las stats de un jugador en un partido */
export async function autosaveStat(
	matchId: string,
	registrationId: string,
	partial: AutosaveStatInput,
): Promise<void> {
	await patchMatchPlayerStat(matchId, registrationId, partial);
}

/** Autosave parcial de campos del partido (marcador, bonus, observaciones) */
export async function autosaveMatchField(
	matchId: string,
	partial: AutosaveMatchFieldsInput,
): Promise<void> {
	type MatchPatch = Partial<typeof matches.$inferInsert>;
	const set: MatchPatch = {};
	if (partial.homeScore !== undefined) set.homeScore = partial.homeScore;
	if (partial.awayScore !== undefined) set.awayScore = partial.awayScore;
	if (partial.homeBonusGoals !== undefined) set.homeBonusGoals = partial.homeBonusGoals;
	if (partial.awayBonusGoals !== undefined) set.awayBonusGoals = partial.awayBonusGoals;
	if (partial.refereeObservations !== undefined)
		set.refereeObservations = partial.refereeObservations;

	if (Object.keys(set).length === 0) return;

	await db.update(matches).set(set).where(eq(matches.id, matchId));
}
