"use client";

/**
 * shared/ui/useListboxNav.ts
 *
 * Encapsula el estado y las interacciones de teclado/click-afuera de
 * Listbox.tsx: abrir/cerrar, índice activo, navegación con flechas,
 * selección con Enter/Espacio, cierre con Escape o click fuera.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { FilterOption } from "./filters/MultiSelectControl";

export function useListboxNav(
	allOptions: FilterOption[],
	value: string,
	onChange: (value: string) => void,
) {
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	// Al abrir, el índice activo debe arrancar en la opción seleccionada. Se
	// calcula en el momento de abrir (no en un efecto reaccionando a `open`)
	// para no disparar un setState extra de commit tras el render.
	function openMenu() {
		const idx = allOptions.findIndex((o) => o.value === value);
		setActiveIndex(idx >= 0 ? idx : 0);
		setOpen(true);
	}

	function toggle() {
		if (open) setOpen(false);
		else openMenu();
	}

	function select(v: string) {
		onChange(v);
		setOpen(false);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openMenu();
			}
			return;
		}
		if (e.key === "Escape") {
			e.preventDefault();
			setOpen(false);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, allOptions.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Home") {
			e.preventDefault();
			setActiveIndex(0);
		} else if (e.key === "End") {
			e.preventDefault();
			setActiveIndex(allOptions.length - 1);
		} else if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			const opt = allOptions[activeIndex];
			if (opt) select(opt.value);
		}
	}

	return { open, toggle, activeIndex, setActiveIndex, ref, select, onKeyDown };
}
