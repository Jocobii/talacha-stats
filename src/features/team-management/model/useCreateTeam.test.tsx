// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import * as apiClient from "@/shared/api/client";
import { useCreateTeam } from "./useCreateTeam";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

describe("useCreateTeam", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("crea el equipo, devuelve el ViewModel mapeado e invalida teams.list de la liga", async () => {
		// La API responde la fila cruda (name como se guardó); el hook la mapea.
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: { id: "t9", name: "deportivo guadalupe", color: "#38a169" },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper, client } = createQueryWrapper();
		const invalidateSpy = vi.spyOn(client, "invalidateQueries");
		const { result } = renderHook(() => useCreateTeam("L1"), { wrapper });

		result.current.mutate({ name: "Deportivo Guadalupe", color: "#38a169" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// El hook expone el XView (titleCase aplicado), nunca la fila cruda.
		expect(result.current.data).toEqual({
			id: "t9",
			displayName: "Deportivo Guadalupe",
			color: "#38a169",
		});

		// El transporte recibe el body con leagueId inyectado por el hook.
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/teams", {
			method: "POST",
			body: { name: "Deportivo Guadalupe", leagueId: "L1", color: "#38a169" },
		});
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.list("L1") });
	});

	it("omite el color cuando viene vacío (no manda string vacío)", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: { id: "t1", name: "alfa", color: null },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCreateTeam("L1"), { wrapper });

		result.current.mutate({ name: "Alfa", color: "" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockedApiFetch).toHaveBeenCalledWith("/api/teams", {
			method: "POST",
			body: { name: "Alfa", leagueId: "L1", color: undefined },
		});
	});

	it("propaga el error cuando la API responde !ok", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockedApiFetch.mockResolvedValue({ ok: false, error: "Ya existe un equipo" } as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useCreateTeam("L1"), { wrapper });

		result.current.mutate({ name: "Repetido" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("Ya existe un equipo"));
	});
});
