// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Box } from "./Box";

describe("Box", () => {
	it("no aplica clases por default (pad/bg/radius/border en 'none'/false)", () => {
		const { container } = render(<Box>contenido</Box>);
		const el = container.firstElementChild as HTMLElement;
		expect(el.className).not.toContain("bg-");
		expect(el.className).not.toContain("border");
	});

	it("aplica padding, superficie, radio y borde por token", () => {
		const { container } = render(
			<Box pad="md" bg="surface-2" radius="lg" border>
				contenido
			</Box>,
		);
		const el = container.firstElementChild as HTMLElement;
		expect(el.className).toContain("p-4");
		expect(el.className).toContain("bg-surface-2");
		expect(el.className).toContain("rounded-xl");
		expect(el.className).toContain("border-line");
	});

	it("no emite style inline", () => {
		const { container } = render(<Box>contenido</Box>);
		expect((container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
	});
});
