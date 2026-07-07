// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HomeViews from "./HomeViews";
import homeMessages from "@/shared/i18n/messages/es/home.json";

function renderHomeViews(initialView: "jugador" | "organizador" = "jugador") {
	return render(
		<NextIntlClientProvider locale="es" messages={{ home: homeMessages }}>
			<HomeViews
				initialView={initialView}
				jugador={<p>contenido jugador</p>}
				organizador={<p>contenido organizador</p>}
			/>
		</NextIntlClientProvider>,
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
