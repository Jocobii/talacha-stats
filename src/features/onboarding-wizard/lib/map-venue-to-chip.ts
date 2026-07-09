/**
 * features/onboarding-wizard/lib/map-venue-to-chip.ts
 * Mapper puro DTO (Venue) → ViewModel (CreatedVenueView) para el contexto de
 * cancha mostrado en Operación/Horario (§19).
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
