/**
 * features/discipline/decrement-suspensions.ts
 *
 * Descuenta una fecha a las suspensiones `duration_type: 'matches'` activas
 * cuando el EQUIPO del jugador sancionado juega una cédula contable — B5,
 * §5.2 docs/MODULOS-GESTION-LIGA.md. La fecha se sirve por calendario del
 * equipo, no por presencia del jugador (está suspendido, por eso no juega).
 *
 * Se llama dentro de la misma tx que resuelve la cédula, con el mismo
 * criterio de "cédula contable" que `maybeFreezeLeagueConfig`
 * (played/walkover_home/walkover_away — no suspended/postponed).
 *
 * Se llama DESPUÉS de `applyCardDiscipline` en la misma tx — por eso excluye
 * `sourceMatchId === matchId`: una suspensión recién creada por la roja/
 * acumulación de ESTA MISMA cédula no debe contarla como fecha ya servida,
 * empieza a descontar desde la siguiente.
 */

import { and, eq, inArray } from "drizzle-orm";
import type { db } from "@/db";
import { inscriptions, leagueMembers } from "@/db/schema";
import {
	listActiveMatchesSuspensionsByLeague,
	updateSuspension,
} from "@/entities/suspension/queries";
import { syncLeagueMemberStatus } from "./sync-league-member-status";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function decrementSuspensionsForMatch(
	tx: DbTx,
	matchId: string,
	leagueId: string,
	homeTeamId: string,
	awayTeamId: string,
): Promise<void> {
	const allActiveSuspensions = await listActiveMatchesSuspensionsByLeague(leagueId, tx);
	const activeSuspensions = allActiveSuspensions.filter((s) => s.sourceMatchId !== matchId);
	if (activeSuspensions.length === 0) return;

	const playerIds = activeSuspensions.map((s) => s.globalPlayerId);
	const teamRows = await tx
		.select({ globalPlayerId: leagueMembers.globalPlayerId, teamId: inscriptions.teamId })
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.where(
			and(eq(leagueMembers.leagueId, leagueId), inArray(leagueMembers.globalPlayerId, playerIds)),
		);
	const teamByPlayer = new Map(teamRows.map((r) => [r.globalPlayerId, r.teamId]));

	for (const suspension of activeSuspensions) {
		const teamId = teamByPlayer.get(suspension.globalPlayerId);
		// El equipo del jugador no jugó esta cédula — nada que descontar.
		if (teamId !== homeTeamId && teamId !== awayTeamId) continue;

		const matchesServed = suspension.matchesServed + 1;
		const served = matchesServed >= (suspension.matchesTotal ?? 0);

		await updateSuspension(
			suspension.id,
			{ matchesServed, status: served ? "served" : "active" },
			tx,
		);

		if (served) {
			await syncLeagueMemberStatus(tx, suspension.globalPlayerId, leagueId);
		}
	}
}
