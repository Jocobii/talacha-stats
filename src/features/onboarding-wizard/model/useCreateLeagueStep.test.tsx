// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useCreateLeagueStep } from "./useCreateLeagueStep";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("useCreateLeagueStep", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("mapea la liga creada a CreatedLeagueView", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: {
				league: {
					id: "l1",
					name: "liga brillante",
					slug: "liga-brillante",
					season: "Apertura 2026",
					dayOfWeek: "martes",
				},
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCreateLeagueStep(), { wrapper });

		result.current.mutate({ name: "liga brillante", dayOfWeek: "martes", season: "Apertura 2026" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({
			id: "l1",
			name: "Liga Brillante",
			dayOfWeek: "martes",
			season: "Apertura 2026",
		});
	});

	it("propaga el error LEAGUE_EXISTS del server", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: false,
			error:
				'Ya existe una liga "Liga Brillante" (Apertura 2026) con ese nombre y día en tu organización.',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCreateLeagueStep(), { wrapper });

		result.current.mutate({ name: "Liga Brillante", dayOfWeek: "martes", season: "Apertura 2026" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toMatch(/ya existe una liga/i);
	});
});
