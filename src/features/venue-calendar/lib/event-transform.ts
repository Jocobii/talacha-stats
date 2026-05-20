/**
 * features/venue-calendar/lib/event-transform.ts
 * Convierte VenueEvent (API) → EventInput (FullCalendar).
 */

import type { EventInput } from "@fullcalendar/core";
import type { VenueEvent } from "../types";
import { EVENT_COLORS } from "../constants";

export function toCalendarEvent(event: VenueEvent): EventInput {
	const colors = EVENT_COLORS[event.type];
	const isRental = event.type.startsWith("rental");
	return {
		id: event.id,
		title: event.title,
		start: event.startAt,
		end: event.endAt,
		backgroundColor: colors.background,
		borderColor: colors.border,
		textColor: colors.text,
		// Solo las rentas son arrastrables/redimensionables
		editable: isRental,
		// Accesible en callbacks de FullCalendar vía eventInfo.event.extendedProps.venueEvent
		extendedProps: { venueEvent: event },
	};
}
