import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
	it("une clases simples separadas por espacio", () => {
		expect(cn("flex", "gap-2")).toBe("flex gap-2");
	});

	it("ignora valores falsy (false, null, undefined)", () => {
		expect(cn("flex", false, null, undefined, "gap-2")).toBe("flex gap-2");
	});

	it("resuelve conflictos de clases de Tailwind — la última gana", () => {
		expect(cn("p-2", "p-4")).toBe("p-4");
	});

	it("permite que un className externo sobreescriba una clase previa", () => {
		expect(cn("h-10 px-4", "h-12")).toBe("px-4 h-12");
	});

	it("devuelve string vacío si no hay clases", () => {
		expect(cn()).toBe("");
	});
});
