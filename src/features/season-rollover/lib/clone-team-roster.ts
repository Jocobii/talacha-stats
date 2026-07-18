/**
 * features/season-rollover/lib/clone-team-roster.ts
 *
 * Copia el roster ACTIVO de un equipo origen a un equipo destino:
 * league_members + inscriptions, sin arrastrar credencial (§ ver abajo).
 *
 * Reutilizada por dos flujos (NUEVA-TEMPORADA-V2.md §4.1):
 *   1. El rollover de temporada (`createNextSeason`) — un equipo origen ya
 *      confirmado → su equipo recién creado en la liga nueva.
 *   2. La reactivación de un equipo `pending` desde la banca
 *      (`POST /api/teams/[id]/activate`) — el `sourceTeamId` del equipo →
 *      el propio equipo, ahora que pasa a `active`.
 *
 * Reglas de negocio (no tocar sin revisar docs/CREDENCIAL-PASE-JUGADOR.md §6):
 *   - Solo se copian league_members con status = 'active' — suspendidos/
 *     inactivos NO se copian, el equipo destino arranca disciplinariamente
 *     limpio.
 *   - `credential_id` NUNCA se copia del league_member origen. Solo se
 *     re-vincula el pase `organization` vigente del jugador para esta org, si
 *     existe — el anual cubre la temporada/reactivación sin recomprar. Sin
 *     pase `organization`, el league_member queda con credential_id = null
 *     ("pendiente de credencial").
 */

import { eq, and } from "drizzle-orm";
import { db, leagueMembers, inscriptions, teams, leagues } from "@/db";
import {
	findActiveOrganizationCredentialsForPlayers,
	type Executor,
} from "@/entities/player-credential/queries";

export type CloneTeamRosterResult = { playersCopied: number };

/**
 * Copia el roster activo de `sourceTeamId` hacia `targetTeamId`. Ambos IDs
 * pueden pertenecer a ligas distintas (rollover) o a la misma pieza de datos
 * (reactivación, donde el equipo destino ES el equipo origen). El equipo
 * destino debe existir ya en su liga antes de llamar esta función.
 */
export async function cloneTeamRoster(
	sourceTeamId: string,
	targetTeamId: string,
	executor: Executor = db,
): Promise<CloneTeamRosterResult> {
	const targetTeam = await executor
		.select({ leagueId: teams.leagueId, organizationId: leagues.organizationId })
		.from(teams)
		.innerJoin(leagues, eq(leagues.id, teams.leagueId))
		.where(eq(teams.id, targetTeamId))
		.limit(1);

	const target = targetTeam[0];
	if (!target) return { playersCopied: 0 };

	const sourceRoster = await executor
		.select({
			globalPlayerId: leagueMembers.globalPlayerId,
			dorsal: leagueMembers.dorsal,
		})
		.from(leagueMembers)
		.innerJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.where(and(eq(inscriptions.teamId, sourceTeamId), eq(leagueMembers.status, "active")));

	if (sourceRoster.length === 0) return { playersCopied: 0 };

	const inscriptionDate = new Date().toISOString().slice(0, 10);
	const insertedMembers = await executor
		.insert(leagueMembers)
		.values(
			sourceRoster.map((m) => ({
				globalPlayerId: m.globalPlayerId,
				leagueId: target.leagueId,
				dorsal: m.dorsal,
				inscriptionDate,
			})),
		)
		.returning({ id: leagueMembers.id });

	await executor.insert(inscriptions).values(
		insertedMembers.map((member) => ({
			leagueMemberId: member.id,
			teamId: targetTeamId,
		})),
	);

	// credential_id NUNCA se copia — solo se re-vincula el pase `organization`
	// vigente, si el jugador tiene uno para esta organización.
	if (target.organizationId) {
		const credentialByPlayer = await findActiveOrganizationCredentialsForPlayers(
			executor,
			sourceRoster.map((m) => m.globalPlayerId),
			target.organizationId,
		);

		for (const [i, member] of insertedMembers.entries()) {
			const credential = credentialByPlayer.get(sourceRoster[i].globalPlayerId);
			if (!credential) continue;
			await executor
				.update(leagueMembers)
				.set({ credentialId: credential.id })
				.where(eq(leagueMembers.id, member.id));
		}
	}

	return { playersCopied: insertedMembers.length };
}
