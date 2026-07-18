// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Trophy } from "lucide-react";
import { Card } from "./Card";

describe("Card compound", () => {
	it("compone Header/Body/Footer en orden dentro de Card", () => {
		render(
			<Card interactive>
				<Card.Header icon={Trophy} title="Nueva jornada" />
				<Card.Body>
					<p>Cuerpo</p>
				</Card.Body>
				<Card.Footer>
					<button>Crear</button>
				</Card.Footer>
			</Card>,
		);
		expect(screen.getByText("Nueva jornada")).toBeInTheDocument();
		expect(screen.getByText("Cuerpo")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
	});

	it("Card sigue siendo usable en su forma plana (retrocompatible)", () => {
		render(<Card>solo contenido</Card>);
		expect(screen.getByText("solo contenido")).toBeInTheDocument();
	});

	it("slots ausentes no rompen la composición", () => {
		render(
			<Card>
				<Card.Body>solo body</Card.Body>
			</Card>,
		);
		expect(screen.getByText("solo body")).toBeInTheDocument();
	});
});
