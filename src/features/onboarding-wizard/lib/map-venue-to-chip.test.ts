import { describe, it, expect } from "vitest";
import { mapVenueToChip } from "./map-venue-to-chip";
import type { Venue } from "@/entities/venue";

function buildVenue(overrides: Partial<Venue> = {}): Venue {
	return {
		id: "v1",
		name: "cancha gamorin",
		nameCanonical: "cancha gamorin",
		organizationId: "org1",
		city: null,
		address: null,
		capacity: 1,
		color: "#60A5FA",
		notes: null,
		createdAt: new Date(),
		...overrides,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe("mapVenueToChip", () => {
	it("aplica titleCase al nombre", () => {
		const chip = mapVenueToChip(buildVenue({ name: "cancha gamorin" }));
		expect(chip.name).toBe("Cancha Gamorin");
	});

	it("expone id y color sin transformar", () => {
		const chip = mapVenueToChip(buildVenue({ id: "v2", color: "#F87171" }));
		expect(chip).toEqual({ id: "v2", name: "Cancha Gamorin", color: "#F87171" });
	});
});
