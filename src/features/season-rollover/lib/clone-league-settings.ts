/**
 * features/season-rollover/lib/clone-league-settings.ts
 *
 * Copia la configuración "no deportiva" de una liga origen a una liga nueva:
 * zonas de playoffs, configuración de sorteo, canchas asignadas, ventanas
 * horarias y reglamento del torneo. No toca equipos ni roster — eso vive en
 * clone-team-roster.ts.
 */

import { eq } from "drizzle-orm";
import {
	db,
	leaguePlayoffZones,
	leagueSchedulingConfig,
	leagueVenues,
	venueTimeWindows,
} from "@/db";
import { findLeagueConfigOrDefaults, insertLeagueConfig } from "@/entities/league-config/queries";
import type { Executor } from "@/entities/player-credential/queries";
import { DEFAULT_PLAYOFF_ZONE } from "../constants";

export type CloneLeagueSettingsResult = {
	zonesCopied: number;
	venuesCopied: number;
	hasSchedulingConfig: boolean;
};

/**
 * Lee la configuración de `sourceLeagueId` y la escribe en `targetLeagueId`.
 * Debe correr dentro de la misma transacción que crea la liga nueva.
 */
export async function cloneLeagueSettings(
	sourceLeagueId: string,
	targetLeagueId: string,
	executor: Executor = db,
): Promise<CloneLeagueSettingsResult> {
	const [sourceZones, sourceConfig, sourceVenues, sourceWindows, sourceRules] = await Promise.all([
		executor.query.leaguePlayoffZones.findMany({
			where: eq(leaguePlayoffZones.leagueId, sourceLeagueId),
			columns: { name: true, fromPosition: true, toPosition: true, color: true, order: true },
		}),
		executor.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, sourceLeagueId),
			columns: {
				regularMatchdays: true,
				regularFormat: true,
				matchDurationMinutes: true,
				bufferMinutes: true,
				allowDuplicateMatchups: true,
				noRepeatWithin: true,
			},
		}),
		executor.query.leagueVenues.findMany({
			where: eq(leagueVenues.leagueId, sourceLeagueId),
			columns: { venueId: true, priority: true },
		}),
		executor.query.venueTimeWindows.findMany({
			where: eq(venueTimeWindows.leagueId, sourceLeagueId),
			columns: { venueId: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
		}),
		// Reglamento resuelto de la liga origen (propio o heredado de defaults) —
		// se copia tal cual, no desde organization_config (§4.5 doc).
		findLeagueConfigOrDefaults(sourceLeagueId),
	]);

	// Zonas de playoffs (si no hay, crear la zona por defecto)
	if (sourceZones.length > 0) {
		await executor.insert(leaguePlayoffZones).values(
			sourceZones.map((z) => ({
				leagueId: targetLeagueId,
				name: z.name,
				fromPosition: z.fromPosition,
				toPosition: z.toPosition,
				color: z.color,
				order: z.order,
			})),
		);
	} else {
		await executor.insert(leaguePlayoffZones).values({
			leagueId: targetLeagueId,
			...DEFAULT_PLAYOFF_ZONE,
		});
	}

	// Configuración de sorteo
	if (sourceConfig) {
		await executor.insert(leagueSchedulingConfig).values({
			leagueId: targetLeagueId,
			regularMatchdays: sourceConfig.regularMatchdays,
			regularFormat: sourceConfig.regularFormat,
			matchDurationMinutes: sourceConfig.matchDurationMinutes,
			bufferMinutes: sourceConfig.bufferMinutes,
			allowDuplicateMatchups: sourceConfig.allowDuplicateMatchups,
			noRepeatWithin: sourceConfig.noRepeatWithin,
		});
	}

	// Canchas asignadas
	if (sourceVenues.length > 0) {
		await executor.insert(leagueVenues).values(
			sourceVenues.map((v) => ({
				leagueId: targetLeagueId,
				venueId: v.venueId,
				priority: v.priority,
			})),
		);
	}

	// Ventanas horarias de canchas
	if (sourceWindows.length > 0) {
		await executor.insert(venueTimeWindows).values(
			sourceWindows.map((w) => ({
				leagueId: targetLeagueId,
				venueId: w.venueId,
				dayOfWeek: w.dayOfWeek,
				startTime: w.startTime,
				endTime: w.endTime,
				isActive: w.isActive,
			})),
		);
	}

	// Reglamento del torneo (league_config) — copia el de la liga origen, nunca
	// el de la organización: preserva las reglas propias de esta liga
	// (incluidas las de un torneo relámpago) temporada tras temporada.
	await insertLeagueConfig(
		targetLeagueId,
		{
			pointsWin: sourceRules.pointsWin,
			pointsDraw: sourceRules.pointsDraw,
			tiebreakers: sourceRules.tiebreakers,
			yellowThreshold: sourceRules.yellowThreshold,
			redCardMatches: sourceRules.redCardMatches,
			blueCardMeaning: sourceRules.blueCardMeaning,
			reinforcementLimit: sourceRules.reinforcementLimit,
			financeLevel: sourceRules.financeLevel,
		},
		executor,
	);

	return {
		zonesCopied: sourceZones.length,
		venuesCopied: sourceVenues.length,
		hasSchedulingConfig: !!sourceConfig,
	};
}
