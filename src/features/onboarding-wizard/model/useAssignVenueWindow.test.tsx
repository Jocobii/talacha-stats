// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useAssignVenueWindow } from "./useAssignVenueWindow";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

const INPUT = {
	leagueId: "l1",
	venueId: "v1",
	dayOfWeek: "martes",
	startTime: "19:00",
	endTime: "21:00",
};

describe("useAssignVenueWindow", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("encadena assign → window cuando ambas llamadas tienen éxito", async () => {
		mockedApiFetch
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.mockResolvedValueOnce({ ok: true, data: { leagueId: "l1", venueId: "v1" } } as any)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.mockResolvedValueOnce({ ok: true, data: { id: "w1" } } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useAssignVenueWindow(), { wrapper });

		result.current.mutate(INPUT);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockedApiFetch).toHaveBeenNthCalledWith(
			1,
			"/api/leagues/l1/venues",
			expect.objectContaining({ method: "POST", body: { venueId: "v1" } }),
		);
		expect(mockedApiFetch).toHaveBeenNthCalledWith(
			2,
			"/api/leagues/l1/venues/v1/windows",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("propaga el error si (1) asignar la cancha falla — no llama a (2)", async () => {
		mockedApiFetch.mockResolvedValueOnce({
			ok: false,
			error: "Liga no encontrada",
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useAssignVenueWindow(), { wrapper });

		result.current.mutate(INPUT);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toBe("Liga no encontrada");
		expect(mockedApiFetch).toHaveBeenCalledTimes(1);
	});

	it("propaga el error 409 de solapamiento cuando (2) falla tras (1) exitoso — reintentable", async () => {
		mockedApiFetch
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.mockResolvedValueOnce({ ok: true, data: { leagueId: "l1", venueId: "v1" } } as any)
			.mockResolvedValueOnce({
				ok: false,
				error: "Se solapa con una ventana existente (18:00–20:00)",
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useAssignVenueWindow(), { wrapper });

		result.current.mutate(INPUT);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toMatch(/se solapa/i);
	});
});
