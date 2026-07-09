/**
 * features/arranque-onboarding/lib/map-venue-to-chip.ts
 * Mapper puro DTO (Venue) → ViewModel (CreatedVenueView) para la lista de
 * canchas ya creadas en el Paso 1 del wizard (§19).
 */

import { titleCase } from "@/shared/lib/normalize";
import type { Venue } from "@/entities/venue";
import type { CreatedVenueView } from "../types";

export function mapVenueToChip(venue: Venue): CreatedVenueView {
	return {
		id: venue.id,
		name: titleCase(venue.name),
		color: venue.color,
	};
}
