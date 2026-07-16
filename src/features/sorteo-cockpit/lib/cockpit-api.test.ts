import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiClient from "@/shared/api/client";
import { putSchedulingConfig } from "./cockpit-api";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

const config = {
	matchDurationMinutes: 60,
	bufferMinutes: 5,
	noRepeatWithin: 3,
	regularMatchdays: 14,
	allowDuplicateMatchups: false,
};

describe("putSchedulingConfig", () => {
	beforeEach(() => vi.resetAllMocks());

	it("hace PUT con la config + los valores fijos del cockpit", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: null } as any);

		await putSchedulingConfig("L1", config);

		expect(mockedApiFetch).toHaveBeenCalledWith("/api/leagues/L1/scheduling-config", {
			method: "PUT",
			body: { ...config, regularFormat: "single", allowDuplicateMatchups: false },
		});
	});

	it("lanza Error(res.error) cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "config inválida" } as any);

		await expect(putSchedulingConfig("L1", config)).rejects.toThrow("config inválida");
	});
});
