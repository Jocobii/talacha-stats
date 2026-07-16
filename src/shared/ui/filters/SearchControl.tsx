"use client";

/**
 * shared/ui/filters/SearchControl.tsx
 *
 * Búsqueda de texto para FilterBar — debounce de 350ms (sin botón "Buscar",
 * reduce fricción). Controlado desde afuera vía `value` + `onApply`; el
 * estado local solo existe para no perder tecleo mientras corre el debounce.
 */

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

export function SearchControl({
	value,
	onApply,
	placeholder = "Buscar…",
	className,
	debounceMs = 350,
}: {
	value: string;
	onApply: (value: string) => void;
	placeholder?: string;
	className?: string;
	debounceMs?: number;
}) {
	const [draft, setDraft] = useState(value);
	// Sincroniza el borrador local cuando `value` cambia desde afuera (ej.
	// "Limpiar todos los filtros"). Se ajusta durante el render — no en un
	// efecto — para evitar el commit extra de un setState post-render.
	const [prevValue, setPrevValue] = useState(value);
	if (value !== prevValue) {
		setPrevValue(value);
		setDraft(value);
	}
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	function handleChange(next: string) {
		setDraft(next);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onApply(next), debounceMs);
	}

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	return (
		<div className={cn("relative", className)}>
			<Search
				size={15}
				strokeWidth={1.75}
				className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
			/>
			<input
				value={draft}
				onChange={(e) => handleChange(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="w-full h-9 rounded-md bg-surface-2 border border-line pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition"
			/>
		</div>
	);
}
