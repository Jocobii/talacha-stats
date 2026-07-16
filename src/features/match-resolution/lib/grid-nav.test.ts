// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { focusGridCell, moveGridFocus } from "./grid-nav";

/** Crea una grilla 6 columnas x rowCount filas para un side, con data-attrs. */
function mountGrid(side: "home" | "away", rowCount: number): void {
	document.body.innerHTML = "";
	for (let row = 0; row < rowCount; row++) {
		for (let col = 0; col <= 5; col++) {
			const el = document.createElement("input");
			el.type = col === 5 ? "checkbox" : "number";
			el.dataset.side = side;
			el.dataset.row = String(row);
			el.dataset.col = String(col);
			document.body.appendChild(el);
		}
	}
}

function keyEvent(key: string) {
	return {
		key,
		preventDefault: vi.fn(),
		currentTarget: {} as HTMLInputElement,
	} as unknown as React.KeyboardEvent<HTMLInputElement>;
}

describe("focusGridCell", () => {
	beforeEach(() => mountGrid("home", 3));

	it("enfoca la celda existente", () => {
		focusGridCell("home", 1, 2);
		const active = document.activeElement as HTMLInputElement;
		expect(active.dataset.row).toBe("1");
		expect(active.dataset.col).toBe("2");
	});

	it("no lanza error si la celda no existe", () => {
		expect(() => focusGridCell("home", 99, 0)).not.toThrow();
	});
});

describe("moveGridFocus", () => {
	beforeEach(() => mountGrid("home", 3));

	it("ArrowDown mueve a la misma columna, fila siguiente", () => {
		moveGridFocus(keyEvent("ArrowDown"), "home", 0, 2, 3);
		const active = document.activeElement as HTMLInputElement;
		expect(active.dataset.row).toBe("1");
		expect(active.dataset.col).toBe("2");
	});

	it("Enter se comporta igual que ArrowDown (baja una fila, misma columna)", () => {
		moveGridFocus(keyEvent("Enter"), "home", 0, 3, 3);
		const active = document.activeElement as HTMLInputElement;
		expect(active.dataset.row).toBe("1");
		expect(active.dataset.col).toBe("3");
	});

	it("ArrowRight en la última columna pasa a la primera columna de la fila siguiente", () => {
		moveGridFocus(keyEvent("ArrowRight"), "home", 0, 5, 3);
		const active = document.activeElement as HTMLInputElement;
		expect(active.dataset.row).toBe("1");
		expect(active.dataset.col).toBe("0");
	});

	it("ArrowLeft en la primera columna pasa a la última columna de la fila anterior", () => {
		moveGridFocus(keyEvent("ArrowLeft"), "home", 1, 0, 3);
		const active = document.activeElement as HTMLInputElement;
		expect(active.dataset.row).toBe("0");
		expect(active.dataset.col).toBe("5");
	});

	it("no mueve el foco fuera de los límites de la grilla (fila -1)", () => {
		const before = document.activeElement;
		moveGridFocus(keyEvent("ArrowUp"), "home", 0, 0, 3);
		expect(document.activeElement).toBe(before);
	});

	it("no mueve el foco fuera de los límites de la grilla (última fila)", () => {
		const before = document.activeElement;
		moveGridFocus(keyEvent("ArrowDown"), "home", 2, 0, 3);
		expect(document.activeElement).toBe(before);
	});

	it("ignora teclas que no son de navegación", () => {
		const e = keyEvent("a");
		moveGridFocus(e, "home", 0, 0, 3);
		expect(e.preventDefault).not.toHaveBeenCalled();
	});

	it("llama preventDefault para teclas de navegación válidas", () => {
		const e = keyEvent("ArrowDown");
		moveGridFocus(e, "home", 0, 0, 3);
		expect(e.preventDefault).toHaveBeenCalled();
	});
});
