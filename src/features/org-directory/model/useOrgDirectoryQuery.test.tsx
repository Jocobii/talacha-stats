// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useOrgDirectoryQuery } from "./useOrgDirectoryQuery";
import type { OrgDirectoryFiltersValue } from "../types";

vi.mock("@/shared/api/client", async () => {
	const actual = await vi.importActual<typeof apiClient>("@/shared/api/client");
	return { ...actual, apiFetchPaginated: vi.fn() };
});

const mockedFetchPaginated = vi.mocked(apiClient.apiFetchPaginated);

const baseFilters: OrgDirectoryFiltersValue = { city: "", q: "", sort: "name_asc" };

function buildOrgRow(id: string, name: string) {
	return {
		id,
		name,
		slug: name.toLowerCase(),
		logoUrl: null,
		city: "Tijuana",
		leagueCount: 1,
		teamCount: 8,
		playerCount: 90,
	};
}

describe("useOrgDirectoryQuery", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("mapea el DTO a ViewModel y expone meta para el contador/'cargar más'", async () => {
		mockedFetchPaginated.mockResolvedValue({
			ok: true,
			data: [buildOrgRow("o1", "novofut")],
			meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false },
		});

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useOrgDirectoryQuery(baseFilters, 20), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.items).toEqual([
			expect.objectContaining({ id: "o1", name: "Novofut", href: "/org/novofut" }),
		]);
		expect(result.current.data?.meta.hasNext).toBe(false);
	});

	it("propaga el error del backend cuando la respuesta no es ok", async () => {
		mockedFetchPaginated.mockResolvedValue({ ok: false, error: "Parámetros de filtro inválidos" });

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useOrgDirectoryQuery(baseFilters, 20), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("Parámetros de filtro inválidos"));
	});

	it("empieza en estado de carga antes de que resuelva la petición", () => {
		mockedFetchPaginated.mockReturnValue(new Promise(() => {}));

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useOrgDirectoryQuery(baseFilters, 20), { wrapper });

		expect(result.current.isLoading).toBe(true);
	});
});
