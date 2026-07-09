// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useArranqueWizard } from "./useArranqueWizard";
import type { CreatedLeagueView, CreatedVenueView } from "../types";

const VENUE: CreatedVenueView = { id: "v1", name: "Gamorin", color: "#60A5FA" };
const LEAGUE: CreatedLeagueView = {
	id: "l1",
	name: "Liga Brillante",
	dayOfWeek: "martes",
	season: "Apertura 2026",
};

describe("useArranqueWizard", () => {
	it("arranca en el paso 0 sin canchas por default", () => {
		const { result } = renderHook(() => useArranqueWizard());
		expect(result.current.step).toBe(0);
		expect(result.current.createdVenues).toEqual([]);
		expect(result.current.createdLeague).toBeNull();
	});

	it("acepta canchas y paso inicial para reanudación", () => {
		const { result } = renderHook(() => useArranqueWizard([VENUE], 1));
		expect(result.current.step).toBe(1);
		expect(result.current.createdVenues).toEqual([VENUE]);
	});

	it("addVenue agrega sin mutar el arreglo anterior", () => {
		const { result } = renderHook(() => useArranqueWizard());
		act(() => result.current.addVenue(VENUE));
		expect(result.current.createdVenues).toEqual([VENUE]);
	});

	it("goToLeague avanza al paso 1", () => {
		const { result } = renderHook(() => useArranqueWizard([VENUE]));
		act(() => result.current.goToLeague());
		expect(result.current.step).toBe(1);
	});

	it("handleLeagueReady guarda la liga y avanza al paso 2", () => {
		const { result } = renderHook(() => useArranqueWizard());
		act(() => result.current.handleLeagueReady(LEAGUE));
		expect(result.current.createdLeague).toEqual(LEAGUE);
		expect(result.current.step).toBe(2);
	});

	it("handleScheduleReady avanza al paso 3 (Listo)", () => {
		const { result } = renderHook(() => useArranqueWizard());
		act(() => result.current.handleLeagueReady(LEAGUE));
		act(() => result.current.handleScheduleReady());
		expect(result.current.step).toBe(3);
	});

	it("goBackTo regresa a un paso arbitrario", () => {
		const { result } = renderHook(() => useArranqueWizard());
		act(() => result.current.handleLeagueReady(LEAGUE));
		act(() => result.current.goBackTo(0));
		expect(result.current.step).toBe(0);
	});
});
