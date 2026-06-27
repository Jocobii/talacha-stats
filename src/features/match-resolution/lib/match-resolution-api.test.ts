import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiClient from "@/shared/api/client";
import { patchPlayerStat, patchMatchFields, resolveMatch } from "./match-resolution-api";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("match-resolution-api", () => {
	beforeEach(() => vi.resetAllMocks());

	it("patchPlayerStat hace PATCH al endpoint del stat con el patch", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: null } as any);
		await patchPlayerStat("M1", "r1", { goals: 2 });
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/matches/M1/stats/r1", {
			method: "PATCH",
			body: { goals: 2 },
		});
	});

	it("patchMatchFields hace PATCH al partido", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: null } as any);
		await patchMatchFields("M1", { homeScore: 3 });
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/matches/M1", {
			method: "PATCH",
			body: { homeScore: 3 },
		});
	});

	it("resolveMatch devuelve el nextMatchId en éxito", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: { nextMatchId: "M2" } } as any);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await resolveMatch("M1", {} as any);
		expect(result).toEqual({ nextMatchId: "M2" });
	});

	it("lanza Error(res.error) cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "boom" } as any);
		await expect(patchPlayerStat("M1", "r1", { goals: 1 })).rejects.toThrow("boom");
	});
});
