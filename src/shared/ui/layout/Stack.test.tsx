// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stack } from "./Stack";

describe("Stack", () => {
	it("renderiza como div en columna con gap md por default", () => {
		const { container } = render(<Stack>contenido</Stack>);
		const el = container.firstElementChild as HTMLElement;
		expect(el.className).toContain("flex-col");
		expect(el.className).toContain("gap-4");
	});

	it("aplica el gap correcto según el token", () => {
		const { container } = render(<Stack gap="lg">contenido</Stack>);
		expect((container.firstElementChild as HTMLElement).className).toContain("gap-6");
	});

	it("aplica align cuando se pasa", () => {
		const { container } = render(<Stack align="center">contenido</Stack>);
		expect((container.firstElementChild as HTMLElement).className).toContain("items-center");
	});

	it("respeta el prop as para cambiar el tag", () => {
		const { container } = render(<Stack as="section">contenido</Stack>);
		expect(container.firstElementChild?.tagName).toBe("SECTION");
	});

	it("no emite style inline", () => {
		const { container } = render(<Stack>contenido</Stack>);
		expect((container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
	});

	it("permite que className externo sobreescriba el gap", () => {
		const { container } = render(<Stack className="gap-0">contenido</Stack>);
		expect((container.firstElementChild as HTMLElement).className).toBe("flex flex-col gap-0");
	});
});
