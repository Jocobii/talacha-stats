// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Center } from "./Center";

describe("Center", () => {
	it("centra en ambos ejes por default", () => {
		const { container } = render(<Center>contenido</Center>);
		const el = container.firstElementChild as HTMLElement;
		expect(el.className).toContain("place-items-center");
		expect(el.className).not.toContain("h-full");
	});

	it("agrega h-full cuando fullHeight es true", () => {
		const { container } = render(<Center fullHeight>contenido</Center>);
		expect((container.firstElementChild as HTMLElement).className).toContain("h-full");
	});

	it("no emite style inline", () => {
		const { container } = render(<Center>contenido</Center>);
		expect((container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
	});
});
