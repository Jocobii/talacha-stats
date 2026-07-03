// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeViews from "./HomeViews";

function renderHomeViews(initialView: "jugador" | "organizador" = "jugador") {
	return render(
		<HomeViews
			initialView={initialView}
			jugador={<p>contenido jugador</p>}
			organizador={<p>contenido organizador</p>}
		/>,
	);
}

function containerOf(text: string): HTMLElement | null {
	return screen.getByText(text).parentElement;
}

describe("HomeViews", () => {
	it("ambas vistas existen en el DOM (SEO), solo una es visible", () => {
		renderHomeViews("jugador");
		expect(containerOf("contenido jugador")?.className).not.toContain("hidden");
		expect(containerOf("contenido organizador")?.className).toContain("hidden");
	});

	it("respeta la vista inicial organizador", () => {
		renderHomeViews("organizador");
		expect(containerOf("contenido jugador")?.className).toContain("hidden");
		expect(containerOf("contenido organizador")?.className).not.toContain("hidden");
	});

	it("el toggle cambia de vista al hacer clic", () => {
		renderHomeViews("jugador");
		fireEvent.click(screen.getByRole("button", { name: "Organizo una liga" }));
		expect(containerOf("contenido organizador")?.className).not.toContain("hidden");
		expect(containerOf("contenido jugador")?.className).toContain("hidden");
	});

	it("marca aria-pressed en la opción activa", () => {
		renderHomeViews("organizador");
		const active = screen.getByRole("button", { name: "Organizo una liga" });
		const inactive = screen.getByRole("button", { name: "Soy jugador" });
		expect(active.getAttribute("aria-pressed")).toBe("true");
		expect(inactive.getAttribute("aria-pressed")).toBe("false");
	});
});
