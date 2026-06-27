// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useCities } from "./useCities";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("useCities", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("devuelve la lista de ciudades en éxito", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: ["Tijuana", "Mexicali"] } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCities(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(["Tijuana", "Mexicali"]);
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/cities");
	});

	it("devuelve lista vacía sin romper cuando no hay ciudades", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: [] } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCities(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([]);
	});

	it("propaga el error cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "boom" } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCities(), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("boom"));
	});
});
