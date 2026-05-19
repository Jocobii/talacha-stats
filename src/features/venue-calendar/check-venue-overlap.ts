/**
 * features/venue-calendar/check-venue-overlap.ts
 * Valida que un rango [start, end) no se encime con ningún evento existente
 * en la cancha: ni rentas ni partidos de torneo.
 * Tolerancia cero: el rango debe terminar ≤ inicio del evento vecino
 * o empezar ≥ fin del evento vecino.
 */

import { db } from "@/db";
import { venueRentals, matches } from "@/db/schema";
import { and, eq, lt, gt, gte, ne, isNotNull } from "drizzle-orm";

/** Buffer máximo de duración de partido para acotar la consulta de matches. */
const MAX_MATCH_DURATION_MS = 3 * 60 * 60 * 1000; // 3 h
const DEFAULT_MATCH_DURATION_MS = 60 * 60 * 1000; // 1 h fallback

type OverlapResult = { hasConflict: false } | { hasConflict: true; label: string };

type Params = {
	venueId: string;
	start: Date;
	end: Date;
	/** ID de renta a ignorar en la comprobación (para edición de la misma renta). */
	excludeRentalId?: string;
};

/**
 * Devuelve `{ hasConflict: false }` si el rango está libre,
 * o `{ hasConflict: true, label }` indicando qué evento ocupa ese tiempo.
 */
export async function checkVenueOverlap({
	venueId,
	start,
	end,
	excludeRentalId,
}: Params): Promise<OverlapResult> {
	// ── 1. Rentas ──────────────────────────────────────────────────────────────
	const rentalWhere = [
		eq(venueRentals.venueId, venueId),
		lt(venueRentals.startAt, end), // renta empieza antes de que termine el rango
		gt(venueRentals.endAt, start), // renta termina después de que empieza el rango
		...(excludeRentalId ? [ne(venueRentals.id, excludeRentalId)] : []),
	];

	const rentalConflict = await db.query.venueRentals.findFirst({
		where: and(...rentalWhere),
		columns: { title: true, startAt: true, endAt: true },
	});

	if (rentalConflict) {
		return {
			hasConflict: true,
			label: `renta "${rentalConflict.title}"`,
		};
	}

	// ── 2. Partidos de torneo ──────────────────────────────────────────────────
	// La hora de fin del partido no está almacenada: se computa con matchDurationMinutes.
	// Consultamos partidos cuyo kickoffAt cae dentro del buffer antes del fin del rango
	// para no escanear toda la tabla; luego filtramos en JS por fin real.
	const bufferStart = new Date(start.getTime() - MAX_MATCH_DURATION_MS);

	const matchRows = await db.query.matches.findMany({
		where: and(
			eq(matches.venueId, venueId),
			isNotNull(matches.kickoffAt),
			gte(matches.kickoffAt, bufferStart),
			lt(matches.kickoffAt, end),
		),
		columns: { kickoffAt: true },
		with: {
			matchday: {
				columns: {},
				with: {
					league: {
						columns: { name: true },
						with: {
							schedulingConfig: { columns: { matchDurationMinutes: true } },
						},
					},
				},
			},
		},
	});

	for (const m of matchRows) {
		const kickoff = m.kickoffAt!;
		const configMin = m.matchday?.league?.schedulingConfig?.matchDurationMinutes ?? null;
		const durationMs = configMin !== null ? configMin * 60 * 1000 : DEFAULT_MATCH_DURATION_MS;
		const matchEnd = new Date(kickoff.getTime() + durationMs);

		// Solapamiento: kickoff < end  Y  matchEnd > start
		if (kickoff < end && matchEnd > start) {
			const leagueName = m.matchday?.league?.name ?? "Torneo";
			return {
				hasConflict: true,
				label: `partido de ${leagueName}`,
			};
		}
	}

	return { hasConflict: false };
}
