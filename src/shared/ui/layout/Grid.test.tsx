// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Grid } from "./Grid";

describe("Grid", () => {
	it("renderiza grid-cols-1 por default", () => {
		const { container } = render(<Grid>contenido</Grid>);
		expect((container.firstElementChild as HTMLElement).className).toContain("grid-cols-1");
	});

	it("aplica el número de columnas correcto", () => {
		const { container } = render(<Grid cols={3}>contenido</Grid>);
		expect((container.firstElementChild as HTMLElement).className).toContain("grid-cols-3");
	});

	it("no emite style inline", () => {
		const { container } = render(<Grid>contenido</Grid>);
		expect((container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
	});
});
