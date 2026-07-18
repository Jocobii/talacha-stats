// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
	it("renderiza como div con superficie/borde por default, sin cursor-pointer", () => {
		render(<Card>contenido</Card>);
		const el = screen.getByText("contenido");
		expect(el.className).toContain("bg-surface");
		expect(el.className).toContain("border-line");
		expect(el.className).not.toContain("cursor-pointer");
	});

	it("agrega hover/cursor-pointer cuando interactive es true", () => {
		render(<Card interactive>contenido</Card>);
		expect(screen.getByText("contenido").className).toContain("cursor-pointer");
	});

	it("respeta el prop as para cambiar el tag", () => {
		render(<Card as="section">contenido</Card>);
		expect(screen.getByText("contenido").tagName).toBe("SECTION");
	});

	it("className externo se combina con las clases base", () => {
		render(<Card className="p-4">contenido</Card>);
		expect(screen.getByText("contenido").className).toContain("p-4");
	});
});
