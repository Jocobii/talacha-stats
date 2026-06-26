// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useLeagueTeams } from "./useLeagueTeams";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

// Fila cruda tal como la devuelve /api/teams (más campos de los que usa la UI).
function buildTeamRow(id: string, name: string, color: string | null) {
	return { id, name, color, leagueId: "L1", nameCanonical: name.toLowerCase() };
}

describe("useLeagueTeams", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("mapea las filas crudas a TeamOption y excluye el equipo actual", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: [buildTeamRow("t1", "Alfa", "#111111"), buildTeamRow("t2", "Beta", null)],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useLeagueTeams("L1", "t1"), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([{ id: "t2", name: "Beta", color: null }]);
	});

	it("propaga el error cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "boom" } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useLeagueTeams("L1"), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("boom"));
	});

	it("no dispara la query cuando leagueId está vacío", () => {
		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useLeagueTeams(""), { wrapper });

		expect(mockedApiFetch).not.toHaveBeenCalled();
		expect(result.current.fetchStatus).toBe("idle");
	});
});
