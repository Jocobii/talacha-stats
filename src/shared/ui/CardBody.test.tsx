// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardBody } from "./CardBody";

describe("CardBody", () => {
	it("aplica padding md por default", () => {
		render(<CardBody>contenido</CardBody>);
		expect(screen.getByText("contenido").className).toContain("p-4");
	});

	it("aplica el pad pedido", () => {
		render(<CardBody pad="lg">contenido</CardBody>);
		expect(screen.getByText("contenido").className).toContain("p-6");
	});

	it("className externo se combina", () => {
		render(<CardBody className="text-center">contenido</CardBody>);
		expect(screen.getByText("contenido").className).toContain("text-center");
	});
});
