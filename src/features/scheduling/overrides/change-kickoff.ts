/**
 * features/scheduling/overrides/change-kickoff.ts
 *
 * Override S6 — cambiar la hora de kickoff de un partido.
 * Registra el cambio en match_schedule_overrides para auditoría.
 *
 * Restricciones:
 *   - El partido debe existir y pertenecer a la liga
 *   - El partido no puede estar en estado "completed" ni "cancelled"
 *   - Registra snapshot (previousValue / newValue) para auditoría
 */

import { db } from "@/db";
import { matches, matchScheduleOverrides } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ChangeKickoffArgs = {
	matchId: string;
	leagueId: string;
	changedBy: string | null;
	kickoffAt: string; // ISO 8601 datetime
	reason?: string;
};

export type ChangeKickoffResult =
	| { ok: true; matchId: string; kickoffAt: Date }
	| { ok: false; error: string };

export async function changeKickoff(args: ChangeKickoffArgs): Promise<ChangeKickoffResult> {
	const match = await db.query.matches.findFirst({
		where: eq(matches.id, args.matchId),
		columns: { id: true, leagueId: true, status: true, kickoffAt: true, venueId: true },
	});

	if (!match) return { ok: false, error: "Partido no encontrado" };
	if (match.leagueId !== args.leagueId)
		return { ok: false, error: "El partido no pertenece a esta liga" };
	if (match.status === "completed")
		return { ok: false, error: "No se puede modificar un partido ya completado" };
	if (match.status === "cancelled")
		return { ok: false, error: "No se puede modificar un partido cancelado" };

	const newKickoffAt = new Date(args.kickoffAt);
	if (isNaN(newKickoffAt.getTime())) return { ok: false, error: "Fecha/hora inválida" };

	await db.transaction(async (tx) => {
		await tx.update(matches).set({ kickoffAt: newKickoffAt }).where(eq(matches.id, args.matchId));

		await tx.insert(matchScheduleOverrides).values({
			matchId: args.matchId,
			changedBy: args.changedBy,
			changeType: "time",
			previousValue: { kickoffAt: match.kickoffAt?.toISOString() ?? null },
			newValue: { kickoffAt: newKickoffAt.toISOString() },
			reason: args.reason ?? null,
		});
	});

	return { ok: true, matchId: args.matchId, kickoffAt: newKickoffAt };
}
