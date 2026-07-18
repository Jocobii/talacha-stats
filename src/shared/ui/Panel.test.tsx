// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "./Panel";

describe("Panel", () => {
	it("renderiza título y acciones en el header cuando se pasan", () => {
		render(
			<Panel title="Canchas" actions={<button>Editar</button>}>
				contenido
			</Panel>,
		);
		expect(screen.getByText("Canchas")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
	});

	it("sin título ni acciones no renderiza la fila de header", () => {
		const { container } = render(<Panel>solo contenido</Panel>);
		expect(container.querySelector("h3")).not.toBeInTheDocument();
	});

	it("aplica superficie y borde", () => {
		const { container } = render(<Panel>contenido</Panel>);
		expect((container.firstElementChild as HTMLElement).className).toContain("bg-surface");
	});
});
