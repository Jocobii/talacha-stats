// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useNarratorAnalysisQuery } from "./useNarratorAnalysisQuery";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("useNarratorAnalysisQuery", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("no dispara la query cuando el matchup es null", () => {
		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useNarratorAnalysisQuery(null), { wrapper });

		expect(mockedApiFetch).not.toHaveBeenCalled();
		expect(result.current.fetchStatus).toBe("idle");
	});

	it("pide el análisis con los tres params cuando hay matchup", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: { league: { id: "L1" } } } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(
			() => useNarratorAnalysisQuery({ leagueId: "L1", teamA: "t1", teamB: "t2" }),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/narrator?leagueId=L1&teamA=t1&teamB=t2");
	});

	it("propaga el error cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "boom" } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(
			() => useNarratorAnalysisQuery({ leagueId: "L1", teamA: "t1", teamB: "t2" }),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("boom"));
	});
});
