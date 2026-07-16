// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as cockpitApi from "../lib/cockpit-api";
import { useSaveSchedulingConfig } from "./useSaveSchedulingConfig";

vi.mock("../lib/cockpit-api");
const mockedPut = vi.mocked(cockpitApi.putSchedulingConfig);

const config = {
	matchDurationMinutes: 60,
	bufferMinutes: 0,
	noRepeatWithin: 3,
	regularMatchdays: 14,
	allowDuplicateMatchups: false,
};

describe("useSaveSchedulingConfig", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("guarda la config y llama el onSuccess por llamada", async () => {
		mockedPut.mockResolvedValue(undefined);
		const onSuccess = vi.fn();

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useSaveSchedulingConfig("L1"), { wrapper });

		result.current.mutate(config, { onSuccess });

		await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
		expect(mockedPut).toHaveBeenCalledWith("L1", config);
	});

	it("expone el error y no llama onSuccess cuando el guardado falla", async () => {
		mockedPut.mockRejectedValue(new Error("config inválida"));
		const onSuccess = vi.fn();

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useSaveSchedulingConfig("L1"), { wrapper });

		result.current.mutate(config, { onSuccess });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("config inválida"));
		expect(onSuccess).not.toHaveBeenCalled();
	});
});
