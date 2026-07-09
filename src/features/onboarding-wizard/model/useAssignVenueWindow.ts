"use client";

/**
 * features/onboarding-wizard/model/useAssignVenueWindow.ts
 * Paso Horario: asigna la cancha a la liga y crea su ventana horaria. Dos
 * llamadas encadenadas a endpoints distintos (no hay transacción entre
 * ambas, viven en routes separados):
 *
 *   1. POST /api/leagues/[leagueId]/venues            → assignVenueToLeague
 *   2. POST /api/leagues/[leagueId]/venues/[venueId]/windows → createWindow
 *
 * `assignVenueToLeague` es idempotente (`onConflictDoUpdate` en la DB), así
 * que si (1) ya sucedió y (2) falló (p. ej. 409 por solapamiento), reintentar
 * la mutación completa es seguro: (1) vuelve a no-opear y solo (2) se
 * reintenta de verdad.
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { leagueVenuesUrl, leagueVenueWindowsUrl } from "../constants";

export type AssignVenueWindowInput = {
	leagueId: string;
	venueId: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
};

export function useAssignVenueWindow() {
	return useMutation<void, Error, AssignVenueWindowInput>({
		mutationFn: async ({ leagueId, venueId, dayOfWeek, startTime, endTime }) => {
			const assigned = await apiFetch(leagueVenuesUrl(leagueId), {
				method: "POST",
				body: { venueId },
			});
			if (!assigned.ok) throw new Error(assigned.error);

			const windowed = await apiFetch(leagueVenueWindowsUrl(leagueId, venueId), {
				method: "POST",
				body: { venueId, dayOfWeek, startTime, endTime },
			});
			if (!windowed.ok) throw new Error(windowed.error);
		},
	});
}
