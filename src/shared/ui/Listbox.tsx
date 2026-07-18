"use client";

/**
 * shared/ui/Listbox.tsx
 *
 * Select de opción única totalmente custom (botón trigger + panel en portal).
 * Reemplaza al <select> nativo para tener control total del estilo del
 * panel de opciones (bordes, hover, colores) en todos los navegadores —
 * el <select> nativo solo permite estilar color/background de <option> en
 * Chromium/Firefox y no soporta hover ni radios de borde en el panel.
 *
 * El panel se renderiza vía createPortal a document.body con
 * position:fixed calculado desde el trigger, para no ser recortado por
 * ancestros con overflow:hidden (cards, drawers, modales).
 *
 * Semántica accesible: role="listbox"/"option", aria-activedescendant,
 * navegación con teclado (ver useListboxNav).
 */

import { useId, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useListboxNav } from "./useListboxNav";
import type { FilterOption } from "./filters/MultiSelectControl";

export type { FilterOption };

// minWidth se aplica como px inline (no como clase "min-w-full"): dentro
// del portal el panel es position:fixed, así que un % de ancho resolvería
// contra el viewport y no contra el trigger, disparando el panel de ancho.
type PanelRect = { top: number; left: number; minWidth: number };

export function Listbox({
	value,
	onChange,
	options,
	placeholder,
	"aria-label": ariaLabel,
	disabled,
	loading,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	options: FilterOption[];
	placeholder?: string;
	"aria-label"?: string;
	disabled?: boolean;
	loading?: boolean;
	className?: string;
}) {
	const listId = useId();
	const allOptions: FilterOption[] = placeholder
		? [{ value: "", label: placeholder }, ...options]
		: options;
	const selected = allOptions.find((o) => o.value === value);
	const { open, toggle, activeIndex, setActiveIndex, ref, panelRef, select, onKeyDown } =
		useListboxNav(allOptions, value, onChange);

	// Se recalcula al abrir y en cada scroll/resize mientras está abierto,
	// para que el panel siga anclado al trigger aunque esté dentro de un
	// contenedor con scroll propio (capture:true en "scroll" para enterarse
	// de scrolls en ancestros, que no burbujean).
	const [rect, setRect] = useState<PanelRect | null>(null);

	useLayoutEffect(() => {
		if (!open || !ref.current) return;
		function updateRect() {
			const r = ref.current!.getBoundingClientRect();
			setRect({ top: r.bottom + 6, left: r.left, minWidth: r.width });
		}
		updateRect();
		window.addEventListener("scroll", updateRect, true);
		window.addEventListener("resize", updateRect);
		return () => {
			window.removeEventListener("scroll", updateRect, true);
			window.removeEventListener("resize", updateRect);
		};
	}, [open, ref]);

	return (
		<div className={cn("relative", className)} ref={ref}>
			<button
				type="button"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				aria-label={ariaLabel}
				disabled={disabled || loading}
				onClick={toggle}
				onKeyDown={onKeyDown}
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border pl-3 pr-8 text-sm text-left transition",
					open ? "border-brand/60 ring-1 ring-brand/30" : "border-line hover:border-ink-3",
					value ? "text-ink" : "text-ink-3",
					(disabled || loading) && "opacity-50 cursor-not-allowed",
				)}
			>
				{selected?.label ?? placeholder ?? "—"}
			</button>
			{loading ? (
				<div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-ink-3 border-t-transparent animate-spin" />
			) : (
				<ChevronDown
					size={13}
					strokeWidth={2}
					className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
				/>
			)}
			{open &&
				rect &&
				createPortal(
					<ul
						id={listId}
						ref={panelRef}
						role="listbox"
						aria-activedescendant={`${listId}-${activeIndex}`}
						style={{ top: rect.top, left: rect.left, minWidth: rect.minWidth }}
						className="fixed z-[100] w-max max-w-[280px] max-h-64 overflow-auto bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-1.5"
					>
						{allOptions.map((o, i) => {
							const isSelected = o.value === value;
							const isActive = i === activeIndex;
							return (
								<li
									key={o.value || "__placeholder__"}
									id={`${listId}-${i}`}
									role="option"
									aria-selected={isSelected}
									onMouseEnter={() => setActiveIndex(i)}
									onClick={() => select(o.value)}
									className={cn(
										"flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] cursor-pointer transition",
										isActive && "bg-surface-2",
										isSelected ? "text-brand" : "text-ink",
									)}
								>
									<span className="w-4 h-4 grid place-items-center shrink-0">
										{isSelected && <Check size={13} strokeWidth={3} />}
									</span>
									{o.label}
								</li>
							);
						})}
					</ul>,
					document.body,
				)}
		</div>
	);
}
