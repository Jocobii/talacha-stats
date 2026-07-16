/**
 * features/discipline/sync-league-member-status.ts
 *
 * Mantiene `league_members.status` reflejando si el jugador tiene alguna
 * suspensión `status='active'` (cualquier `reason`/`duration_type`) en esa
 * liga — §5.2 docs/MODULOS-GESTION-LIGA.md (B5). Se llama después de crear
 * (B3/B4), servir (B5) o escalar/levantar (B6) una suspensión.
 *
 * Asimétrico a propósito:
 *  - Al entrar en suspensión, SIEMPRE pisa a 'suspended' — la disciplina
 *    tiene prioridad sobre cualquier otro estado para efectos de alineación.
 *  - Al salir, solo revierte a 'active' si el valor actual es 'suspended'.
 *    Nunca toca 'inactive' (baja del jugador por otra razón — ese estado no
 *    es competencia de este módulo, y pisarlo sería un bug silencioso).
 */

import type { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { leagueMembers } from "@/db/schema";
import { hasActiveSuspension } from "@/entities/suspension/queries";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function syncLeagueMemberStatus(
	tx: DbTx,
	globalPlayerId: string,
	leagueId: string,
): Promise<void> {
	const suspended = await hasActiveSuspension(globalPlayerId, leagueId, tx);

	if (suspended) {
		await tx
			.update(leagueMembers)
			.set({ status: "suspended" })
			.where(
				and(eq(leagueMembers.globalPlayerId, globalPlayerId), eq(leagueMembers.leagueId, leagueId)),
			);
		return;
	}

	await tx
		.update(leagueMembers)
		.set({ status: "active" })
		.where(
			and(
				eq(leagueMembers.globalPlayerId, globalPlayerId),
				eq(leagueMembers.leagueId, leagueId),
				eq(leagueMembers.status, "suspended"),
			),
		);
}
