// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRosterModals } from "./useRosterModals";
import type { RosterEntry } from "../types";

function buildMember(): RosterEntry {
	return {
		inscriptionId: "i1",
		memberId: "m1",
		globalPlayerId: "g1",
		fullName: "Juan Pérez",
		birthDate: "1995-01-01",
		avatarUrl: null,
		dorsal: 10,
		status: "active",
		inscriptionDate: "2026-01-01",
	};
}

describe("useRosterModals", () => {
	it("arranca cerrado", () => {
		const { result } = renderHook(() => useRosterModals());
		expect(result.current.activeModal).toBeNull();
		expect(result.current.selectedMember).toBeNull();
	});

	it("abre un modal con el miembro seleccionado y lo cierra", () => {
		const member = buildMember();
		const { result } = renderHook(() => useRosterModals());

		act(() => result.current.openModal("edit", member));
		expect(result.current.activeModal).toBe("edit");
		expect(result.current.selectedMember).toBe(member);

		act(() => result.current.closeModal());
		expect(result.current.activeModal).toBeNull();
		expect(result.current.selectedMember).toBeNull();
	});

	it("abre un modal sin miembro (ej. alta)", () => {
		const { result } = renderHook(() => useRosterModals());
		act(() => result.current.openModal("add"));
		expect(result.current.activeModal).toBe("add");
		expect(result.current.selectedMember).toBeNull();
	});
});
