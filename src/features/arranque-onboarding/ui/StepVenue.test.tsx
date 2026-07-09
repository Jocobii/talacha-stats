// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { createQueryWrapper } from "@/shared/test/react-query";
import * as apiClient from "@/shared/api/client";
import { StepVenue } from "./StepVenue";
import type { CreatedVenueView } from "../types";

vi.mock("@/shared/api/client");
const mockedApiFetch = vi.mocked(apiClient.apiFetch);

const VENUE: CreatedVenueView = { id: "v1", name: "Gamorin", color: "#60A5FA" };

function setup(createdVenues: CreatedVenueView[] = []) {
	const { wrapper: Wrapper } = createQueryWrapper();
	const onVenueCreated = vi.fn();
	const onContinue = vi.fn();
	render(
		<Wrapper>
			<StepVenue
				organizationId="11111111-1111-1111-1111-111111111111"
				createdVenues={createdVenues}
				onVenueCreated={onVenueCreated}
				onContinue={onContinue}
			/>
		</Wrapper>,
	);
	return { onVenueCreated, onContinue };
}

describe("StepVenue", () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => cleanup());

	it("deshabilita Continuar sin canchas creadas (gate del paso 1)", () => {
		setup([]);
		expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
	});

	it("habilita Continuar con al menos una cancha y dispara onContinue", () => {
		const { onContinue } = setup([VENUE]);
		const button = screen.getByRole("button", { name: /continuar/i });
		expect(button).toBeEnabled();
		fireEvent.click(button);
		expect(onContinue).toHaveBeenCalledTimes(1);
	});

	it("crea una cancha y llama onVenueCreated con el ViewModel mapeado", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: true,
			data: { id: "v2", name: "cancha nueva", color: "#60A5FA" },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		const { onVenueCreated } = setup([]);

		fireEvent.change(screen.getByPlaceholderText("Ej. Gamorin"), {
			target: { value: "cancha nueva" },
		});
		fireEvent.click(screen.getByRole("button", { name: /agregar cancha/i }));

		await waitFor(() => expect(onVenueCreated).toHaveBeenCalledTimes(1));
		expect(onVenueCreated).toHaveBeenCalledWith({
			id: "v2",
			name: "Cancha Nueva",
			color: "#60A5FA",
		});
	});

	it("muestra el error del server cuando la cancha ya existe (409)", async () => {
		mockedApiFetch.mockResolvedValue({
			ok: false,
			error: 'Ya existe una cancha con ese nombre ("Gamorin") en esta organización',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		setup([]);

		fireEvent.change(screen.getByPlaceholderText("Ej. Gamorin"), { target: { value: "Gamorin" } });
		fireEvent.click(screen.getByRole("button", { name: /agregar cancha/i }));

		expect(await screen.findByText(/ya existe una cancha/i)).toBeInTheDocument();
	});
});
