"use client";

/**
 * shared/ui/filters/ComboboxControl.tsx
 *
 * Variante "autocomplete" de SelectControl/Listbox: en vez de un botón que
 * abre un panel con TODAS las opciones, muestra un input de texto que filtra
 * la lista mientras el usuario escribe. Pensada para selects con muchas
 * opciones (ligas de una organización grande) donde desplazarse por un panel
 * largo es más lento que escribir 2-3 letras.
 *
 * Misma API externa que SelectControl (value/onApply/options/placeholder) —
 * intercambiable en los FilterBar sin tocar el resto del componente.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import type { FilterOption } from "./MultiSelectControl";

export function ComboboxControl({
	value,
	onApply,
	options,
	placeholder = "Buscar…",
	disabled,
	loading,
	className,
}: {
	value: string;
	onApply: (value: string) => void;
	options: FilterOption[];
	placeholder?: string;
	disabled?: boolean;
	loading?: boolean;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const selected = options.find((o) => o.value === value);

	// Cierra al hacer click afuera — mismo patrón que useListboxNav.
	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
				setQuery("");
			}
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const filtered = useMemo(() => {
		if (!query.trim()) return options;
		const q = sanitizeToCanonical(query);
		return options.filter((o) => sanitizeToCanonical(o.label).includes(q));
	}, [options, query]);

	function openMenu() {
		setActiveIndex(0);
		setOpen(true);
		// Foco async: el input recién se monta/habilita en este mismo render.
		requestAnimationFrame(() => inputRef.current?.focus());
	}

	function select(v: string) {
		onApply(v);
		setOpen(false);
		setQuery("");
	}

	function clear() {
		onApply("");
		setQuery("");
		inputRef.current?.focus();
	}

	function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Escape") {
			e.preventDefault();
			setOpen(false);
			setQuery("");
			return;
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			const opt = filtered[activeIndex];
			if (opt) select(opt.value);
		}
	}

	const displayValue = open ? query : (selected?.label ?? "");

	return (
		<div className={cn("relative", className)} ref={ref}>
			<input
				ref={inputRef}
				type="text"
				role="combobox"
				aria-expanded={open}
				aria-haspopup="listbox"
				disabled={disabled || loading}
				value={displayValue}
				placeholder={placeholder}
				onFocus={openMenu}
				onChange={(e) => {
					setQuery(e.target.value);
					setActiveIndex(0);
					if (!open) setOpen(true);
				}}
				onKeyDown={onKeyDown}
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border pl-3 pr-8 text-sm transition",
					open ? "border-brand/60 ring-1 ring-brand/30" : "border-line hover:border-ink-3",
					value ? "text-ink" : "text-ink-3",
					(disabled || loading) && "opacity-50 cursor-not-allowed",
				)}
			/>
			{loading ? (
				<div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-ink-3 border-t-transparent animate-spin" />
			) : value && !open ? (
				<button
					type="button"
					onClick={clear}
					aria-label="Limpiar"
					className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink text-xs leading-none"
				>
					✕
				</button>
			) : (
				<ChevronDown
					size={13}
					strokeWidth={2}
					className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
				/>
			)}
			{open && (
				<ul
					role="listbox"
					className="absolute z-30 top-[calc(100%+6px)] left-0 min-w-full w-max max-w-[280px] max-h-64 overflow-auto bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-1.5"
				>
					{placeholder && (
						<li
							role="option"
							aria-selected={value === ""}
							onMouseEnter={() => setActiveIndex(-1)}
							onClick={() => select("")}
							className={cn(
								"flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] cursor-pointer transition",
								activeIndex === -1 && "bg-surface-2",
								value === "" ? "text-brand" : "text-ink-3",
							)}
						>
							<span className="w-4 h-4 grid place-items-center shrink-0">
								{value === "" && <Check size={13} strokeWidth={3} />}
							</span>
							{placeholder}
						</li>
					)}
					{filtered.length === 0 ? (
						<li className="px-2.5 py-2 text-[13px] text-ink-3">Sin resultados</li>
					) : (
						filtered.map((o, i) => {
							const isSelected = o.value === value;
							const isActive = i === activeIndex;
							return (
								<li
									key={o.value}
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
						})
					)}
				</ul>
			)}
		</div>
	);
}
