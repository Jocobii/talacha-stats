// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { useNarratorMatchup } from "./useNarratorMatchup";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
	useSearchParams: () => mockSearchParams,
}));
vi.mock("@/shared/i18n/navigation", () => ({
	useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("@/shared/api/client");

const mockedApiFetch = vi.mocked(apiClient.apiFetch);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSearchParams: any = new URLSearchParams();

function buildTeamRow(id: string, name: string) {
	return { id, name, color: null, leagueId: "L1", nameCanonical: name.toLowerCase() };
}

describe("useNarratorMatchup", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockSearchParams = new URLSearchParams();
	});
	afterEach(() => cleanup());

	it("empieza sin selección cuando no hay enlace en la URL", () => {
		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useNarratorMatchup("Tijuana"), { wrapper });

		expect(result.current.leagueId).toBe("");
		expect(result.current.confirmed).toBeNull();
	});

	it("reconcilia un enlace válido y confirma el matchup automáticamente", async () => {
		mockSearchParams = new URLSearchParams({ leagueId: "L1", teamA: "t1", teamB: "t2" });
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: [buildTeamRow("t1", "Alfa"), buildTeamRow("t2", "Beta")],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useNarratorMatchup("Tijuana"), { wrapper });

		expect(result.current.leagueId).toBe("L1");

		await waitFor(() =>
			expect(result.current.confirmed).toEqual({ leagueId: "L1", teamA: "t1", teamB: "t2" }),
		);
		expect(result.current.teamA).toBe("t1");
		expect(result.current.teamB).toBe("t2");
		expect(result.current.errorCode).toBeNull();
	});

	it("reporta bothLinkTeams cuando ningún equipo del enlace existe en la liga", async () => {
		mockSearchParams = new URLSearchParams({ leagueId: "L1", teamA: "tX", teamB: "tY" });
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: [buildTeamRow("t1", "Alfa"), buildTeamRow("t2", "Beta")],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useNarratorMatchup("Tijuana"), { wrapper });

		await waitFor(() => expect(result.current.errorCode).toEqual({ code: "bothLinkTeams" }));
		expect(result.current.confirmed).toBeNull();
	});

	it("handleAnalyze exige los dos equipos y reporta bothTeams si faltan", () => {
		mockedApiFetch.mockResolvedValue({ ok: true, data: [] } as unknown as Awaited<
			ReturnType<typeof apiClient.apiFetch>
		>);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useNarratorMatchup("Tijuana"), { wrapper });

		act(() => result.current.handleAnalyze());

		expect(result.current.errorCode).toEqual({ code: "bothTeams" });
		expect(replaceMock).not.toHaveBeenCalled();
	});

	it("handleAnalyze confirma el matchup y actualiza la URL cuando hay equipos", () => {
		mockedApiFetch.mockResolvedValue({ ok: true, data: [] } as unknown as Awaited<
			ReturnType<typeof apiClient.apiFetch>
		>);

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useNarratorMatchup("Tijuana"), { wrapper });

		act(() => result.current.setLeagueId("L1"));
		act(() => result.current.setTeamA("t1"));
		act(() => result.current.setTeamB("t2"));
		act(() => result.current.handleAnalyze());

		expect(result.current.confirmed).toEqual({ leagueId: "L1", teamA: "t1", teamB: "t2" });
		expect(replaceMock).toHaveBeenCalledWith("?leagueId=L1&teamA=t1&teamB=t2", { scroll: false });
	});

	it("limpia la selección al cambiar de ciudad", () => {
		mockedApiFetch.mockResolvedValue({ ok: true, data: [] } as unknown as Awaited<
			ReturnType<typeof apiClient.apiFetch>
		>);

		const { wrapper } = createQueryWrapper();
		const { result, rerender } = renderHook(({ city }) => useNarratorMatchup(city), {
			wrapper,
			initialProps: { city: "Tijuana" },
		});

		act(() => result.current.setLeagueId("L1"));
		rerender({ city: "Mexicali" });

		expect(result.current.leagueId).toBe("");
		expect(result.current.confirmed).toBeNull();
	});
});
