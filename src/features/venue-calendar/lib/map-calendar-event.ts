/**
 * features/venue-calendar/lib/map-calendar-event.ts
 *
 * Mapper DTO → ViewModel (§19): VenueEvent (forma del API) → EventInput (forma
 * que consume FullCalendar). Función pura: la decisión de qué título mostrar y
 * qué colores usar vive aquí, no en el componente ni en el hook.
 */

import type { EventInput } from "@fullcalendar/core";
import type { VenueEvent } from "../types";
import { EVENT_COLORS } from "../constants";

export function mapVenueEventToCalendarEvent(event: VenueEvent): EventInput {
	const colors = EVENT_COLORS[event.type];
	return {
		id: event.id,
		title: event.clientName ?? event.leagueName ?? event.title,
		start: event.startAt,
		end: event.endAt,
		backgroundColor: colors.background,
		borderColor: colors.border,
		textColor: colors.text,
		extendedProps: { venueEvent: event },
	};
}
