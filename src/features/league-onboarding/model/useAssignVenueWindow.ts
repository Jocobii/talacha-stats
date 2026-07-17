"use client";

/**
 * features/league-onboarding/model/useAssignVenueWindow.ts
 * Asigna la cancha (autoseleccionada, ver useFirstOrgVenue) a la liga recién
 * creada y le crea su ventana horaria. Dos llamadas encadenadas (no hay
 * transacción entre ambas, viven en routes separados):
 *
 *   1. POST /api/leagues/[leagueId]/venues                    → assignVenueToLeague
 *   2. POST /api/leagues/[leagueId]/venues/[venueId]/windows  → createWindow
 *
 * Mismo patrón que features/onboarding-wizard/model/useAssignVenueWindow.ts
 * (no se reusa ese archivo por regla FSD §3.1: features del mismo nivel no se
 * importan entre sí).
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { LEAGUE_VENUES_URL, LEAGUE_VENUE_WINDOWS_URL } from "../constants";

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
			const assigned = await apiFetch(LEAGUE_VENUES_URL(leagueId), {
				method: "POST",
				body: { venueId },
			});
			if (!assigned.ok) throw new Error(assigned.error);

			const windowed = await apiFetch(LEAGUE_VENUE_WINDOWS_URL(leagueId, venueId), {
				method: "POST",
				body: { venueId, dayOfWeek, startTime, endTime },
			});
			if (!windowed.ok) throw new Error(windowed.error);
		},
	});
}
