// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useSkinActivations } from "./useSkinActivations";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

// Fila cruda tal como la devuelve /api/skin-activations.
function buildRow(id: string, overrides: Record<string, unknown> = {}) {
	return {
		id,
		skinId: "mundial-2026",
		name: "Mundial 2026",
		startsOn: "2026-06-11",
		endsOn: "2026-07-19",
		isEnabled: true,
		...overrides,
	};
}

describe("useSkinActivations", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("mapea los DTOs crudos a SkinActivationView", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: [buildRow("a1"), buildRow("a2", { skinId: "skin-borrado", isEnabled: false })],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useSkinActivations(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toHaveLength(2);
		expect(result.current.data?.[0].skinLabel).toBe("Mundial 2026");
		expect(result.current.data?.[1].isOrphan).toBe(true);
		expect(result.current.data?.[1].isLive).toBe(false);
	});

	it("devuelve lista vacía sin activaciones (estado empty de la tabla)", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: true, data: [] } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useSkinActivations(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([]);
	});

	it("propaga el error cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "Solo el owner" } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useSkinActivations(), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("Solo el owner"));
	});
});
