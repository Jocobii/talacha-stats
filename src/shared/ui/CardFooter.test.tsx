// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardFooter } from "./CardFooter";

describe("CardFooter", () => {
	it("aplica borde superior y fondo distinto", () => {
		render(<CardFooter>contenido</CardFooter>);
		const el = screen.getByText("contenido");
		expect(el.className).toContain("border-t");
		expect(el.className).toContain("bg-surface-2/40");
	});

	it("className externo se combina", () => {
		render(<CardFooter className="justify-end">contenido</CardFooter>);
		expect(screen.getByText("contenido").className).toContain("justify-end");
	});
});
