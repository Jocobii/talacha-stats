// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Typography } from "./Typography";

describe("Typography", () => {
	it("variant body (default) renderiza <p> con text-base y tone ink", () => {
		render(<Typography>Hola</Typography>);
		const el = screen.getByText("Hola");
		expect(el.tagName).toBe("P");
		expect(el.className).toContain("text-base");
		expect(el.className).toContain("text-ink");
	});

	it("variant display renderiza <h1> con font-display y font-black", () => {
		render(<Typography variant="display">Título</Typography>);
		const el = screen.getByText("Título");
		expect(el.tagName).toBe("H1");
		expect(el.className).toContain("font-display");
		expect(el.className).toContain("font-black");
	});

	it("variant h3 renderiza <h3> con font-bold", () => {
		render(<Typography variant="h3">Sub</Typography>);
		const el = screen.getByText("Sub");
		expect(el.tagName).toBe("H3");
		expect(el.className).toContain("font-bold");
	});

	it("variant caption renderiza <span> con text-xs", () => {
		render(<Typography variant="caption">Nota</Typography>);
		const el = screen.getByText("Nota");
		expect(el.tagName).toBe("SPAN");
		expect(el.className).toContain("text-xs");
	});

	it("weight explícito sobreescribe el default del variant", () => {
		render(
			<Typography variant="display" weight="bold">
				Título
			</Typography>,
		);
		expect(screen.getByText("Título").className).toContain("font-bold");
	});

	it("as sobreescribe el tag sin perder las clases del variant", () => {
		render(
			<Typography variant="h2" as="div">
				Título
			</Typography>,
		);
		const el = screen.getByText("Título");
		expect(el.tagName).toBe("DIV");
		expect(el.className).toContain("font-black");
	});

	it("aplica tone y truncate", () => {
		render(
			<Typography tone="danger" truncate>
				Error
			</Typography>,
		);
		const el = screen.getByText("Error");
		expect(el.className).toContain("text-red-400");
		expect(el.className).toContain("truncate");
	});

	it("no emite style inline", () => {
		render(<Typography>Hola</Typography>);
		expect(screen.getByText("Hola").getAttribute("style")).toBeNull();
	});
});
