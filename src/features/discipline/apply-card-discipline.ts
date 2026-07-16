/**
 * features/discipline/apply-card-discipline.ts
 *
 * Motor automático de disciplina (B3, §5.2 docs/MODULOS-GESTION-LIGA.md).
 * Se llama dentro de la misma tx que resuelve la cédula (B4, mismo patrón que
 * `maybeFreezeLeagueConfig`) — así ve las `match_player_stats` recién
 * escritas por esa misma transacción antes de sumar totales.
 *
 * Dos disparadores, ambos crean suspensiones `duration_type: 'matches'`:
 *  - Roja directa: >=1 tarjeta roja en la cédula → `matchesTotal = redCardMatches`.
 *  - Acumulación de amarillas: se suma `yellowCards` del jugador en TODA la
 *    liga (partidos `status = 'played'`) y se compara contra múltiplos de
 *    `yellowThreshold`, descontando los ciclos ya sancionados (conteo de
 *    suspensiones `yellow_accumulation` previas, incluso si ya fueron
 *    'lifted' — perdonar la sanción no des-cruza el umbral). Un `while` cubre
 *    el caso raro de cruzar más de un múltiplo en una sola cédula.
 *
 * NO decide escalado a `duration_type: 'time'/'permanent'` — eso es manual
 * (B6, `EscalateSuspensionSchema`). Este motor solo crea/verifica; nunca
 * toca una suspensión que ya exista.
 *
 * Idempotente ante re-resolución de la misma cédula: cada suspensión que crea
 * queda con `sourceMatchId = matchId`, y antes de crear una nueva se checa si
 * ya existe una con ese `sourceMatchId` + jugador + motivo.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { matchPlayerStats, inscriptions, leagueMembers, matches } from "@/db/schema";
import { findLeagueConfigOrDefaults } from "@/entities/league-config/queries";
import {
	countSuspensionsByReason,
	findSuspensionBySourceMatch,
	insertSuspension,
} from "@/entities/suspension/queries";
import { syncLeagueMemberStatus } from "./sync-league-member-status";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Fila mínima de match_player_stats de esta cédula, con el jugador ya resuelto a global_player_id. */
async function findCardedPlayersInMatch(tx: DbTx, matchId: string) {
	const rows = await tx
		.select({
			globalPlayerId: leagueMembers.globalPlayerId,
			redCards: matchPlayerStats.redCards,
			yellowCards: matchPlayerStats.yellowCards,
		})
		.from(matchPlayerStats)
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.where(eq(matchPlayerStats.matchId, matchId));

	return rows.filter((r) => r.redCards > 0 || r.yellowCards > 0);
}

/** Suma de amarillas del jugador en toda la liga, solo partidos `played` — mismo criterio que getLeagueTopScorersV2. */
async function sumYellowCardsForPlayer(
	tx: DbTx,
	globalPlayerId: string,
	leagueId: string,
): Promise<number> {
	const yellowSum = sql<number>`coalesce(sum(${matchPlayerStats.yellowCards}), 0)::int`;

	const [row] = await tx
		.select({ total: yellowSum })
		.from(matchPlayerStats)
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(matches, eq(matchPlayerStats.matchId, matches.id))
		.where(
			and(
				eq(leagueMembers.globalPlayerId, globalPlayerId),
				eq(matches.leagueId, leagueId),
				eq(matches.status, "played"),
			),
		);

	return row?.total ?? 0;
}

async function maybeSuspendForRedCard(
	tx: DbTx,
	globalPlayerId: string,
	leagueId: string,
	matchId: string,
	redCardMatches: number,
): Promise<void> {
	const existing = await findSuspensionBySourceMatch(matchId, globalPlayerId, "red_card", tx);
	if (existing) return;

	await insertSuspension(
		{
			globalPlayerId,
			leagueId,
			reason: "red_card",
			reasonDetail: null,
			durationType: "matches",
			matchesTotal: redCardMatches,
			matchesServed: 0,
			durationValue: null,
			durationUnit: null,
			startsOn: null,
			endsOn: null,
			status: "active",
			sourceMatchId: matchId,
			recordedBy: null,
		},
		tx,
	);
	await syncLeagueMemberStatus(tx, globalPlayerId, leagueId);
}

async function maybeSuspendForYellowAccumulation(
	tx: DbTx,
	globalPlayerId: string,
	leagueId: string,
	matchId: string,
	yellowThreshold: number,
): Promise<void> {
	// Re-resolución idempotente: este partido ya disparó una acumulación para este jugador.
	const alreadyFromThisMatch = await findSuspensionBySourceMatch(
		matchId,
		globalPlayerId,
		"yellow_accumulation",
		tx,
	);
	if (alreadyFromThisMatch) return;

	const totalYellows = await sumYellowCardsForPlayer(tx, globalPlayerId, leagueId);
	const priorCycles = await countSuspensionsByReason(
		globalPlayerId,
		leagueId,
		"yellow_accumulation",
		tx,
	);
	let cyclesUsed = priorCycles;

	while (totalYellows >= (cyclesUsed + 1) * yellowThreshold) {
		await insertSuspension(
			{
				globalPlayerId,
				leagueId,
				reason: "yellow_accumulation",
				reasonDetail: null,
				durationType: "matches",
				matchesTotal: 1,
				matchesServed: 0,
				durationValue: null,
				durationUnit: null,
				startsOn: null,
				endsOn: null,
				status: "active",
				sourceMatchId: matchId,
				recordedBy: null,
			},
			tx,
		);
		cyclesUsed += 1;
	}
	if (cyclesUsed > priorCycles) {
		await syncLeagueMemberStatus(tx, globalPlayerId, leagueId);
	}
}

/** Punto de entrada — llamar dentro de la tx de resolveMatch, después de upsert-ear las stats. */
export async function applyCardDiscipline(
	tx: DbTx,
	matchId: string,
	leagueId: string,
): Promise<void> {
	const cardedPlayers = await findCardedPlayersInMatch(tx, matchId);
	if (cardedPlayers.length === 0) return;

	const config = await findLeagueConfigOrDefaults(leagueId, tx);

	for (const player of cardedPlayers) {
		if (player.redCards > 0) {
			await maybeSuspendForRedCard(
				tx,
				player.globalPlayerId,
				leagueId,
				matchId,
				config.redCardMatches,
			);
		}
		if (player.yellowCards > 0) {
			await maybeSuspendForYellowAccumulation(
				tx,
				player.globalPlayerId,
				leagueId,
				matchId,
				config.yellowThreshold,
			);
		}
	}
}
