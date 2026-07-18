// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Trophy } from "lucide-react";
import { CardHeader } from "./CardHeader";

describe("CardHeader", () => {
	it("renderiza el título", () => {
		render(<CardHeader title="Nueva jornada" />);
		expect(screen.getByText("Nueva jornada")).toBeInTheDocument();
	});

	it("renderiza el icono cuando se pasa", () => {
		const { container } = render(<CardHeader icon={Trophy} title="Nueva jornada" />);
		expect(container.querySelector("svg")).toBeInTheDocument();
	});

	it("renderiza la acción cuando se pasa", () => {
		render(<CardHeader title="Nueva jornada" action={<button>Editar</button>} />);
		expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
	});

	it("sin título ni acción no rompe (slots ausentes)", () => {
		const { container } = render(<CardHeader />);
		expect(container.firstElementChild).toBeInTheDocument();
	});

	it("children reemplaza el layout default de icon/title/action", () => {
		render(
			<CardHeader title="ignorado">
				<span>custom</span>
			</CardHeader>,
		);
		expect(screen.getByText("custom")).toBeInTheDocument();
		expect(screen.queryByText("ignorado")).not.toBeInTheDocument();
	});
});
