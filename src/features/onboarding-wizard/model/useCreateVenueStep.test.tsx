// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useCreateVenueStep } from "./useCreateVenueStep";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("useCreateVenueStep", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("mapea la cancha creada a CreatedVenueView (titleCase)", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: { id: "v1", name: "cancha gamorin", color: "#60A5FA" },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCreateVenueStep("org1"), { wrapper });

		result.current.mutate({
			name: "cancha gamorin",
			organizationId: "org1",
			capacity: 1,
			color: "#60A5FA",
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ id: "v1", name: "Cancha Gamorin", color: "#60A5FA" });
	});

	it("propaga el error cuando la API responde !ok (p. ej. 409 duplicada)", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: false,
			error: 'Ya existe una cancha con ese nombre ("Gamorin") en esta organización',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCreateVenueStep("org1"), { wrapper });

		result.current.mutate({
			name: "Gamorin",
			organizationId: "org1",
			capacity: 1,
			color: "#60A5FA",
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toMatch(/ya existe una cancha/i);
	});
});
