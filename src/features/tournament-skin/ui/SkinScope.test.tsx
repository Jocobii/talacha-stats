// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SkinScope } from "./SkinScope";

describe("SkinScope", () => {
	afterEach(() => cleanup());

	it("pone data-skin cuando hay torneo activo", () => {
		render(
			<SkinScope skinId="mundial-2026">
				<span>contenido</span>
			</SkinScope>,
		);
		const scope = screen.getByText("contenido").parentElement;
		expect(scope?.getAttribute("data-skin")).toBe("mundial-2026");
	});

	it("NO emite el atributo con skinId null (paleta TalachaStats por default)", () => {
		render(
			<SkinScope skinId={null}>
				<span>contenido</span>
			</SkinScope>,
		);
		const scope = screen.getByText("contenido").parentElement;
		expect(scope?.hasAttribute("data-skin")).toBe(false);
	});

	it("respeta el className del callsite", () => {
		render(
			<SkinScope skinId={null} className="rounded-xl">
				<span>contenido</span>
			</SkinScope>,
		);
		expect(screen.getByText("contenido").parentElement?.className).toBe("rounded-xl");
	});
});
