// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
	it("aplica variant primary y size md por default", () => {
		render(<Button>Guardar</Button>);
		const btn = screen.getByRole("button", { name: "Guardar" });
		expect(btn.className).toContain("bg-brand");
		expect(btn.className).toContain("h-9");
	});

	it("aplica la variante y el tamaño pedidos", () => {
		render(
			<Button variant="danger" size="lg">
				Eliminar
			</Button>,
		);
		const btn = screen.getByRole("button", { name: "Eliminar" });
		expect(btn.className).toContain("bg-red-500/10");
		expect(btn.className).toContain("h-11");
	});

	it("className externo sobreescribe una clase del variant (tailwind-merge)", () => {
		render(
			<Button variant="primary" className="h-12">
				Crear
			</Button>,
		);
		const btn = screen.getByRole("button", { name: "Crear" });
		expect(btn.className).toContain("h-12");
		expect(btn.className).not.toContain("h-9");
	});

	it("loading muestra spinner, deshabilita y marca aria-busy", () => {
		render(<Button loading>Guardar</Button>);
		const btn = screen.getByRole("button");
		expect(btn).toBeDisabled();
		expect(btn).toHaveAttribute("aria-busy", "true");
	});

	it("dispara onClick al hacer click cuando no está loading/disabled", () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Guardar</Button>);
		fireEvent.click(screen.getByRole("button"));
		expect(onClick).toHaveBeenCalledOnce();
	});
});
