// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useAddAdHocPlayer } from "./useAddAdHocPlayer";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("useAddAdHocPlayer", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("hace POST al endpoint del partido y devuelve el AdHocPlayerResult", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: { registrationId: "r1", playerProfileId: "p1" },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useAddAdHocPlayer("M1"), { wrapper });

		result.current.mutate({ teamSide: "home", fullName: "  Juan  ", shirtNumber: 7 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ registrationId: "r1", playerProfileId: "p1" });
		// El nombre se recorta antes de mandarse.
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/matches/M1/players", {
			method: "POST",
			body: { teamSide: "home", fullName: "Juan", shirtNumber: 7 },
		});
	});

	it("propaga el error de la API (p. ej. duplicado 409)", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: false,
			error: "Ya existe un jugador con nombre similar",
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useAddAdHocPlayer("M1"), { wrapper });

		result.current.mutate({ teamSide: "away", fullName: "Repetido", shirtNumber: 5 });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("Ya existe un jugador con nombre similar"));
	});
});
