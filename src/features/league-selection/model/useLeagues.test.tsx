// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useLeagues } from "./useLeagues";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

// Fila cruda de /api/leagues (más campos de los que usa el selector).
function buildLeagueRow(id: string, name: string, dayOfWeek: string) {
	return { id, name, dayOfWeek, status: "active", city: "Tijuana" };
}

describe("useLeagues", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("mapea las filas crudas a LeagueOption (titleCase aplicado)", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: [buildLeagueRow("L1", "liga brillante", "lunes")],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useLeagues(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ id: "L1", label: "Liga Brillante - Lunes" }]);
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/leagues");
	});

	it("incluye la ciudad en la URL cuando se pasa", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: [] } as any);

		const { wrapper } = createQueryWrapper();
		renderHook(() => useLeagues("Mexicali"), { wrapper });

		await waitFor(() => expect(mockedApiFetch).toHaveBeenCalledWith("/api/leagues?city=Mexicali"));
	});

	it("propaga el error cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "boom" } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useLeagues(), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("boom"));
	});
});
