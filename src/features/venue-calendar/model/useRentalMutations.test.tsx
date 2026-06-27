// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as api from "../lib/venue-calendar-api";
import { useRentalMutations } from "./useRentalMutations";

vi.mock("../lib/venue-calendar-api");
const mockedCreate = vi.mocked(api.createRental);
const mockedUpdate = vi.mocked(api.updateRental);

const basePayload = { title: "Renta", startAt: "s", endAt: "e", status: "confirmed" } as const;

describe("useRentalMutations", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("al crear con éxito llama el onSuccess inyectado (refetch de FC)", async () => {
		mockedCreate.mockResolvedValue(undefined);
		const onSuccess = vi.fn();

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useRentalMutations("V1", { onSuccess }), { wrapper });

		result.current.createRental({ ...basePayload });

		await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
		expect(mockedCreate).toHaveBeenCalledWith("V1", { ...basePayload });
	});

	it("expone el error y NO dispara refetch cuando la mutación falla", async () => {
		mockedCreate.mockRejectedValue(new Error("Solapamiento de horario"));
		const onSuccess = vi.fn();

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useRentalMutations("V1", { onSuccess }), { wrapper });

		result.current.createRental({ ...basePayload });

		await waitFor(() => expect(result.current.error).toBe("Solapamiento de horario"));
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("propaga el onError por llamada (revert del drag/resize) en fallo de update", async () => {
		mockedUpdate.mockRejectedValue(new Error("no se pudo"));
		const onError = vi.fn();

		const { wrapper } = createQueryWrapper();
		const { result } = renderHook(() => useRentalMutations("V1", { onSuccess: vi.fn() }), {
			wrapper,
		});

		result.current.updateRental({ id: "r1", payload: { startAt: "x" } }, { onError });

		await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
	});
});
