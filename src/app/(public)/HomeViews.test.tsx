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
});
