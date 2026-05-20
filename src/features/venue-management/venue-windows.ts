/**
 * features/venue-management/venue-windows.ts
 * CRUD de venue_time_windows.
 * Valida solapamiento con ventanas existentes del mismo venue+día+liga.
 */

import { db } from "@/db";
import { venueTimeWindows } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import type { VenueTimeWindow } from "@/db/schema";
import type { CreateVenueWindowInput, UpdateVenueWindowInput } from "@/types";

type WindowResult =
	| { ok: true; window: VenueTimeWindow }
	| { ok: false; error: string; status: 404 | 409 | 400 };

/** Devuelve true si dos rangos HH:MM se solapan (exclusivo en los extremos). */
function windowsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
	return aStart < bEnd && bStart < aEnd;
}

async function checkOverlap(
	leagueId: string,
	venueId: string,
	dayOfWeek: string,
	startTime: string,
	endTime: string,
	excludeId?: string,
): Promise<VenueTimeWindow | null> {
	const existing = await db.query.venueTimeWindows.findMany({
		where: and(
			eq(venueTimeWindows.leagueId, leagueId),
			eq(venueTimeWindows.venueId, venueId),
			eq(venueTimeWindows.dayOfWeek, dayOfWeek),
			excludeId ? ne(venueTimeWindows.id, excludeId) : undefined,
		),
	});
	return existing.find((w) => windowsOverlap(startTime, endTime, w.startTime, w.endTime)) ?? null;
}

export async function createWindow(
	leagueId: string,
	input: CreateVenueWindowInput,
): Promise<WindowResult> {
	const overlap = await checkOverlap(
		leagueId,
		input.venueId,
		input.dayOfWeek,
		input.startTime,
		input.endTime,
	);
	if (overlap) {
		return {
			ok: false,
			error: `Se solapa con una ventana existente (${overlap.startTime}–${overlap.endTime})`,
			status: 409,
		};
	}

	const [window] = await db
		.insert(venueTimeWindows)
		.values({ leagueId, ...input })
		.returning();

	return { ok: true, window: window! };
}

export async function updateWindow(
	id: string,
	input: UpdateVenueWindowInput,
): Promise<WindowResult> {
	const current = await db.query.venueTimeWindows.findFirst({
		where: eq(venueTimeWindows.id, id),
	});
	if (!current) return { ok: false, error: "Ventana horaria no encontrada", status: 404 };

	const merged = {
		dayOfWeek: input.dayOfWeek ?? current.dayOfWeek,
		startTime: input.startTime ?? current.startTime,
		endTime: input.endTime ?? current.endTime,
	};

	if (merged.startTime >= merged.endTime) {
		return { ok: false, error: "startTime debe ser anterior a endTime", status: 400 };
	}

	const overlap = await checkOverlap(
		current.leagueId,
		current.venueId,
		merged.dayOfWeek,
		merged.startTime,
		merged.endTime,
		id,
	);
	if (overlap) {
		return {
			ok: false,
			error: `Se solapa con una ventana existente (${overlap.startTime}–${overlap.endTime})`,
			status: 409,
		};
	}

	const [updated] = await db
		.update(venueTimeWindows)
		.set({ ...merged, ...(input.isActive !== undefined && { isActive: input.isActive }) })
		.where(eq(venueTimeWindows.id, id))
		.returning();

	return { ok: true, window: updated! };
}

export async function deleteWindow(
	id: string,
): Promise<{ ok: true } | { ok: false; error: string; status: 404 }> {
	const existing = await db.query.venueTimeWindows.findFirst({
		where: eq(venueTimeWindows.id, id),
		columns: { id: true },
	});
	if (!existing) return { ok: false, error: "Ventana horaria no encontrada", status: 404 };

	await db.delete(venueTimeWindows).where(eq(venueTimeWindows.id, id));
	return { ok: true };
}
