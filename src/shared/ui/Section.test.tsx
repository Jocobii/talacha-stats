// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "./Section";

describe("Section", () => {
	it("renderiza el título y las acciones cuando se pasan", () => {
		render(
			<Section title="Programadas" actions={<button>Nueva</button>}>
				contenido
			</Section>,
		);
		expect(screen.getByText("Programadas")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Nueva" })).toBeInTheDocument();
		expect(screen.getByText("contenido")).toBeInTheDocument();
	});

	it("sin título ni acciones no renderiza la fila de header", () => {
		const { container } = render(<Section>solo contenido</Section>);
		expect(container.querySelector("h2")).not.toBeInTheDocument();
	});

	it("respeta el prop as", () => {
		const { container } = render(<Section as="div">contenido</Section>);
		expect(container.firstElementChild?.tagName).toBe("DIV");
	});
});
