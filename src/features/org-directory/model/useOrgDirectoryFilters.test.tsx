// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, cleanup } from "@testing-library/react";
import { useOrgDirectoryFilters } from "./useOrgDirectoryFilters";
import { ORG_DIRECTORY_PAGE_SIZE } from "../constants";

describe("useOrgDirectoryFilters", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it("empieza con filtros vacíos y la primera página", () => {
		const { result } = renderHook(() => useOrgDirectoryFilters());

		expect(result.current.filters).toEqual({ city: "", q: "", sort: "name_asc" });
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE);
	});

	it("debouncea la búsqueda: filters.q no cambia hasta que pasa el timeout", () => {
		const { result } = renderHook(() => useOrgDirectoryFilters());

		act(() => result.current.setQuery("novo"));
		expect(result.current.query).toBe("novo");
		expect(result.current.filters.q).toBe("");

		act(() => vi.advanceTimersByTime(300));
		expect(result.current.filters.q).toBe("novo");
	});

	it("cargar más suma una página al visibleCount", () => {
		const { result } = renderHook(() => useOrgDirectoryFilters());

		act(() => result.current.loadMore());
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE * 2);

		act(() => result.current.loadMore());
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE * 3);
	});

	it("resetea visibleCount a la primera página cuando cambia la ciudad", () => {
		const { result } = renderHook(() => useOrgDirectoryFilters());

		act(() => result.current.loadMore());
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE * 2);

		act(() => result.current.setCity("Tijuana"));
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE);
		expect(result.current.filters.city).toBe("Tijuana");
	});

	it("resetea visibleCount a la primera página cuando cambia el orden", () => {
		const { result } = renderHook(() => useOrgDirectoryFilters());

		act(() => result.current.loadMore());
		act(() => result.current.setSort("leagues_desc"));

		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE);
		expect(result.current.filters.sort).toBe("leagues_desc");
	});

	it("resetea visibleCount cuando la búsqueda debounceada cambia (no en cada tecla)", () => {
		const { result } = renderHook(() => useOrgDirectoryFilters());

		act(() => result.current.loadMore());
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE * 2);

		act(() => result.current.setQuery("n"));
		// Aún no se resetea: el debounce no ha resuelto.
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE * 2);

		act(() => vi.advanceTimersByTime(300));
		expect(result.current.visibleCount).toBe(ORG_DIRECTORY_PAGE_SIZE);
	});
});
