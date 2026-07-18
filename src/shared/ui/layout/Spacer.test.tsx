// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spacer } from "./Spacer";

describe("Spacer", () => {
	it("es flex-1 y aria-hidden por default (eje y)", () => {
		const { container } = render(<Spacer />);
		const el = container.firstElementChild as HTMLElement;
		expect(el.className).toContain("flex-1");
		expect(el.className).toContain("min-h-0");
		expect(el.getAttribute("aria-hidden")).toBe("true");
	});

	it("usa min-w-0 en eje x", () => {
		const { container } = render(<Spacer axis="x" />);
		expect((container.firstElementChild as HTMLElement).className).toContain("min-w-0");
	});

	it("no emite style inline", () => {
		const { container } = render(<Spacer />);
		expect((container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
	});
});
