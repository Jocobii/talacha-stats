// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Inline } from "./Inline";

describe("Inline", () => {
	it("renderiza como fila flex con gap md por default", () => {
		const { container } = render(<Inline>contenido</Inline>);
		const el = container.firstElementChild as HTMLElement;
		expect(el.className).toContain("flex");
		expect(el.className).toContain("gap-4");
		expect(el.className).not.toContain("flex-wrap");
	});

	it("agrega flex-wrap cuando wrap es true", () => {
		const { container } = render(<Inline wrap>contenido</Inline>);
		expect((container.firstElementChild as HTMLElement).className).toContain("flex-wrap");
	});

	it("aplica justify cuando se pasa", () => {
		const { container } = render(<Inline justify="between">contenido</Inline>);
		expect((container.firstElementChild as HTMLElement).className).toContain("justify-between");
	});

	it("no emite style inline", () => {
		const { container } = render(<Inline>contenido</Inline>);
		expect((container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
	});
});
