// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HeroPlayerSearch from "./HeroPlayerSearch";
import homeMessages from "@/shared/i18n/messages/es/home.json";

const pushMock = vi.fn();

// Mockeamos el wrapper locale-aware directamente (no next/navigation crudo) —
// aísla la unidad sin depender de cómo next-intl resuelve el locale internamente.
vi.mock("@/shared/i18n/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

function renderWithIntl() {
	return render(
		<NextIntlClientProvider locale="es" messages={{ home: homeMessages }}>
			<HeroPlayerSearch />
		</NextIntlClientProvider>,
	);
}

describe("HeroPlayerSearch", () => {
	beforeEach(() => {
		pushMock.mockClear();
	});

	function submitWith(name: string) {
		renderWithIntl();
		fireEvent.change(screen.getByLabelText("Tu nombre"), { target: { value: name } });
		fireEvent.submit(screen.getByRole("search"));
	}

	it("navega a /players con el nombre como query", () => {
		submitWith("juan de la cruz");
		expect(pushMock).toHaveBeenCalledWith("/players?q=juan%20de%20la%20cruz");
	});
});
