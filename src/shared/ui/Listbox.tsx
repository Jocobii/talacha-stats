"use client";

/**
 * shared/ui/Listbox.tsx
 *
 * Select de opción única totalmente custom (botón trigger + panel absoluto).
 * Reemplaza al <select> nativo para tener control total del estilo del
 * panel de opciones (bordes, hover, colores) en todos los navegadores —
 * el <select> nativo solo permite estilar color/background de <option> en
 * Chromium/Firefox y no soporta hover ni radios de borde en el panel.
 *
 * Semántica accesible: role="listbox"/"option", aria-activedescendant,
 * navegación con teclado (ver useListboxNav).
 */

import { useId } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useListboxNav } from "./useListboxNav";
import type { FilterOption } from "./filters/MultiSelectControl";

export type { FilterOption };

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
	const { open, toggle, activeIndex, setActiveIndex, ref, select, onKeyDown } = useListboxNav(
		allOptions,
		value,
		onChange,
	);

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
			{open && (
				<ul
					id={listId}
					role="listbox"
					aria-activedescendant={`${listId}-${activeIndex}`}
					className="absolute z-30 top-[calc(100%+6px)] left-0 min-w-full w-max max-w-[280px] max-h-64 overflow-auto bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-1.5"
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
				</ul>
			)}
		</div>
	);
}
