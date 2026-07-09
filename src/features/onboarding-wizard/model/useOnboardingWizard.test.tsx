// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardingWizard } from "./useOnboardingWizard";
import type { CreatedLeagueView, CreatedVenueView, OrgIdentityView } from "../types";

const ORG: OrgIdentityView = { id: "o1", name: "Liga Jardines", slug: "liga-jardines" };
const VENUE: CreatedVenueView = { id: "v1", name: "Gamorin", color: "#60A5FA" };
const LEAGUE: CreatedLeagueView = {
	id: "l1",
	name: "Liga Brillante",
	dayOfWeek: "martes",
	season: "Apertura 2026",
};

function setup(overrides: Partial<Parameters<typeof useOnboardingWizard>[0]> = {}) {
	return renderHook(() =>
		useOnboardingWizard({
			initialOrg: null,
			initialVenue: null,
			initialLeague: null,
			initialStep: 0,
			...overrides,
		}),
	);
}

describe("useOnboardingWizard", () => {
	it("arranca en el paso 0 sin org/cancha/liga por default", () => {
		const { result } = setup();
		expect(result.current.step).toBe(0);
		expect(result.current.org).toBeNull();
		expect(result.current.venue).toBeNull();
		expect(result.current.league).toBeNull();
		expect(result.current.isComplete).toBe(false);
	});

	it("acepta datos y paso inicial para reanudación", () => {
		const { result } = setup({ initialOrg: ORG, initialVenue: VENUE, initialStep: 1 });
		expect(result.current.step).toBe(1);
		expect(result.current.org).toEqual(ORG);
		expect(result.current.venue).toEqual(VENUE);
	});

	it("handleIdentityReady guarda la org y avanza al paso 1", () => {
		const { result } = setup();
		act(() => result.current.handleIdentityReady(ORG));
		expect(result.current.org).toEqual(ORG);
		expect(result.current.step).toBe(1);
	});

	it("handleOperationReady guarda cancha+liga y avanza al paso 2", () => {
		const { result } = setup({ initialOrg: ORG, initialStep: 1 });
		act(() => result.current.handleOperationReady(VENUE, LEAGUE));
		expect(result.current.venue).toEqual(VENUE);
		expect(result.current.league).toEqual(LEAGUE);
		expect(result.current.step).toBe(2);
	});

	it("handleScheduleReady guarda el horario y marca el wizard como completo", () => {
		const { result } = setup({
			initialOrg: ORG,
			initialVenue: VENUE,
			initialLeague: LEAGUE,
			initialStep: 2,
		});
		act(() => result.current.handleScheduleReady({ startTime: "19:00", endTime: "21:00" }));
		expect(result.current.isComplete).toBe(true);
		expect(result.current.schedule).toEqual({ startTime: "19:00", endTime: "21:00" });
	});

	it("goBackTo regresa a un paso arbitrario", () => {
		const { result } = setup();
		act(() => result.current.handleIdentityReady(ORG));
		act(() => result.current.goBackTo(0));
		expect(result.current.step).toBe(0);
	});
});
