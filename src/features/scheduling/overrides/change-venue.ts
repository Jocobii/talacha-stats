/**
 * features/scheduling/overrides/change-venue.ts
 *
 * Override S6 — cambiar la cancha (y opcionalmente la hora) de un partido.
 * Valida que la nueva venue esté asignada a la liga antes de persistir.
 * Registra el cambio en match_schedule_overrides para auditoría.
 */

import { db } from "@/db";
import { matches, matchScheduleOverrides, leagueVenues } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type ChangeVenueArgs = {
	matchId: string;
	leagueId: string;
	changedBy: string | null;
	venueId: string;
	kickoffAt?: string; // ISO 8601 — opcional, cambia también la hora
	reason?: string;
};

export type ChangeVenueResult = { ok: true; matchId: string } | { ok: false; error: string };

export async function changeVenue(args: ChangeVenueArgs): Promise<ChangeVenueResult> {
	const [match, assignment] = await Promise.all([
		db.query.matches.findFirst({
			where: eq(matches.id, args.matchId),
			columns: { id: true, leagueId: true, status: true, venueId: true, kickoffAt: true },
		}),
		db.query.leagueVenues.findFirst({
			where: and(eq(leagueVenues.leagueId, args.leagueId), eq(leagueVenues.venueId, args.venueId)),
			columns: { venueId: true },
		}),
	]);

	if (!match) return { ok: false, error: "Partido no encontrado" };
	if (match.leagueId !== args.leagueId)
		return { ok: false, error: "El partido no pertenece a esta liga" };
	if (match.status === "completed")
		return { ok: false, error: "No se puede modificar un partido ya completado" };
	if (match.status === "cancelled")
		return { ok: false, error: "No se puede modificar un partido cancelado" };
	if (!assignment) return { ok: false, error: "La cancha no está asignada a esta liga" };

	const newKickoffAt = resolveNewKickoff(args.kickoffAt);
	if (args.kickoffAt && !newKickoffAt) return { ok: false, error: "Fecha/hora inválida" };

	const updates: Partial<typeof matches.$inferInsert> = { venueId: args.venueId };
	if (newKickoffAt) updates.kickoffAt = newKickoffAt;

	await db.transaction(async (tx) => {
		await tx.update(matches).set(updates).where(eq(matches.id, args.matchId));

		await tx.insert(matchScheduleOverrides).values({
			matchId: args.matchId,
			changedBy: args.changedBy,
			changeType: "venue",
			previousValue: {
				venueId: match.venueId ?? null,
				kickoffAt: match.kickoffAt?.toISOString() ?? null,
			},
			newValue: {
				venueId: args.venueId,
				kickoffAt: newKickoffAt?.toISOString() ?? null,
			},
			reason: args.reason ?? null,
		});
	});

	return { ok: true, matchId: args.matchId };
}

function resolveNewKickoff(isoString: string | undefined): Date | null {
	if (!isoString) return null;
	const d = new Date(isoString);
	return isNaN(d.getTime()) ? null : d;
}
