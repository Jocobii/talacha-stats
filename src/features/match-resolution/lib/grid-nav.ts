/**
 * features/match-resolution/lib/grid-nav.ts
 * Navegación de teclado estilo Excel para la grilla de stats por jugador.
 * ↑↓←→ mueven entre celdas, Enter baja una fila en la misma columna.
 * La grilla de cada equipo tiene 6 columnas: 5 stats (0-4) + presente (5).
 */
import type { KeyboardEvent } from "react";
import type { TeamSide } from "../types";

const LAST_COL = 5;

type NavKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Enter";

const NAV_KEYS = new Set<string>(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"]);

function nextPosition(key: NavKey, row: number, col: number): [number, number] {
	switch (key) {
		case "ArrowUp":
			return [row - 1, col];
		case "ArrowDown":
		case "Enter":
			return [row + 1, col];
		case "ArrowLeft":
			return [row, col - 1];
		case "ArrowRight":
			return [row, col + 1];
	}
}

/** Enfoca la celda de la grilla ubicada en (side, row, col), si existe. */
export function focusGridCell(side: TeamSide, row: number, col: number): void {
	const el = document.querySelector<HTMLInputElement>(
		`[data-side="${side}"][data-row="${row}"][data-col="${col}"]`,
	);
	if (!el) return;
	el.focus();
	if (el.type === "number") el.select();
}

/**
 * Handler de keydown para una celda de la grilla. Debe registrarse en cada
 * input/checkbox con data-side/data-row/data-col.
 */
export function moveGridFocus(
	e: KeyboardEvent<HTMLInputElement>,
	side: TeamSide,
	row: number,
	col: number,
	rowCount: number,
): void {
	if (!NAV_KEYS.has(e.key)) return;
	e.preventDefault();

	let [r, c] = nextPosition(e.key as NavKey, row, col);
	if (c < 0) {
		r -= 1;
		c = LAST_COL;
	} else if (c > LAST_COL) {
		r += 1;
		c = 0;
	}
	if (r < 0 || r >= rowCount) return;
	focusGridCell(side, r, c);
}
