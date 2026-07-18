// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageShell } from "./PageShell";

describe("PageShell", () => {
	it("renderiza header, toolbar y content en orden", () => {
		render(
			<PageShell header={<div>header</div>} toolbar={<div>toolbar</div>}>
				<div>content</div>
			</PageShell>,
		);
		expect(screen.getByText("header")).toBeInTheDocument();
		expect(screen.getByText("toolbar")).toBeInTheDocument();
		expect(screen.getByText("content")).toBeInTheDocument();
	});

	it("sin header ni toolbar no rompe (slots ausentes)", () => {
		render(
			<PageShell>
				<div>solo content</div>
			</PageShell>,
		);
		expect(screen.getByText("solo content")).toBeInTheDocument();
	});

	it("sin aside, content ocupa el ancho completo sin columna aside", () => {
		const { container } = render(
			<PageShell>
				<div>content</div>
			</PageShell>,
		);
		expect(container.querySelector("aside")).not.toBeInTheDocument();
	});

	it("con aside, renderiza ambas columnas", () => {
		render(
			<PageShell aside={<div>aside</div>}>
				<div>content</div>
			</PageShell>,
		);
		expect(screen.getByText("content")).toBeInTheDocument();
		expect(screen.getByText("aside")).toBeInTheDocument();
	});
});
