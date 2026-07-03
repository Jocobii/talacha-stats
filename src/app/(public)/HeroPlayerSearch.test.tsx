// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroPlayerSearch from "./HeroPlayerSearch";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

describe("HeroPlayerSearch", () => {
	beforeEach(() => {
		pushMock.mockClear();
	});

	function submitWith(name: string) {
		render(<HeroPlayerSearch />);
		fireEvent.change(screen.getByLabelText("Tu nombre"), { target: { value: name } });
		fireEvent.submit(screen.getByRole("search"));
	}

	it("navega a /players con el nombre como query", () => {
		submitWith("juan de la cruz");
		expect(pushMock).toHaveBeenCalledWith("/players?q=juan%20de%20la%20cruz");
	});
});
