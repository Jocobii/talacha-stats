import { describe, it, expect } from "vitest";
import { mapVenueEventToCalendarEvent } from "./map-calendar-event";
import { EVENT_COLORS } from "../constants";
import type { VenueEvent } from "../types";

function buildEvent(overrides: Partial<VenueEvent> = {}): VenueEvent {
	return {
		id: "e1",
		type: "rental_confirmed",
		title: "Título base",
		startAt: "2026-06-01T18:00:00Z",
		endAt: "2026-06-01T19:00:00Z",
		venueId: "v1",
		...overrides,
	};
}

describe("mapVenueEventToCalendarEvent", () => {
	it("prioriza clientName sobre leagueName y title", () => {
		const view = mapVenueEventToCalendarEvent(
			buildEvent({ clientName: "Cliente", leagueName: "Liga" }),
		);
		expect(view.title).toBe("Cliente");
	});

	it("usa leagueName cuando no hay clientName", () => {
		const view = mapVenueEventToCalendarEvent(buildEvent({ leagueName: "Liga" }));
		expect(view.title).toBe("Liga");
	});

	it("cae a title cuando no hay clientName ni leagueName", () => {
		const view = mapVenueEventToCalendarEvent(buildEvent({ title: "Solo título" }));
		expect(view.title).toBe("Solo título");
	});

	it("aplica los colores del tipo y conserva el evento en extendedProps", () => {
		const event = buildEvent({ type: "tournament" });
		const view = mapVenueEventToCalendarEvent(event);
		expect(view.backgroundColor).toBe(EVENT_COLORS.tournament.background);
		expect(view.extendedProps?.venueEvent).toBe(event);
	});
});
