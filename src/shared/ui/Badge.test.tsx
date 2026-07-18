// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";

describe("Badge", () => {
	it("aplica tone neutral por default", () => {
		render(<Badge>Pendiente</Badge>);
		expect(screen.getByText("Pendiente").className).toContain("bg-surface-2");
	});

	it("aplica el tone pedido", () => {
		render(<Badge tone="danger">Vencido</Badge>);
		expect(screen.getByText("Vencido").className).toContain("bg-red-500/10");
	});

	it("renderiza el icono cuando se pasa", () => {
		render(
			<Badge icon={CheckCircle2} tone="brand">
				Activo
			</Badge>,
		);
		expect(screen.getByText("Activo").querySelector("svg")).toBeInTheDocument();
	});

	it("className externo se combina con las clases del tone", () => {
		render(
			<Badge tone="neutral" className="uppercase">
				Info
			</Badge>,
		);
		expect(screen.getByText("Info").className).toContain("uppercase");
	});
});
