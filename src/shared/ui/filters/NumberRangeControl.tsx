"use client";

/**
 * shared/ui/filters/NumberRangeControl.tsx
 *
 * Rango numérico (min/max) para FilterBar — popover con botón "Aplicar"
 * (evita disparar un fetch por cada dígito tecleado, a diferencia de la
 * búsqueda de texto que sí usa debounce).
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

export function NumberRangeControl({
	label,
	min,
	max,
	onApply,
	className,
}: {
	label: string;
	min: string;
	max: string;
	onApply: (min: string, max: string) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [lo, setLo] = useState(min);
	const [hi, setHi] = useState(max);
	// Sincroniza el borrador local con las props cuando cambian desde afuera
	// (ej. "Limpiar todos los filtros"). Se ajusta durante el render — no en
	// un efecto — para evitar el commit extra de un setState post-render.
	const [prevMin, setPrevMin] = useState(min);
	const [prevMax, setPrevMax] = useState(max);
	if (min !== prevMin || max !== prevMax) {
		setPrevMin(min);
		setPrevMax(max);
		setLo(min);
		setHi(max);
	}
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const hasValue = min !== "" || max !== "";

	return (
		<div className={cn("relative", className)} ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border pl-3 pr-3 text-sm text-left transition",
					open ? "border-brand/60 ring-1 ring-brand/30" : "border-line hover:border-ink-3",
					hasValue ? "text-ink" : "text-ink-3",
				)}
			>
				{hasValue ? `${label}: ${min || "0"}–${max || "∞"}` : label}
			</button>
			{open && (
				<div className="absolute z-30 top-[calc(100%+6px)] left-0 w-[220px] bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-3 flex flex-col gap-3">
					<div className="grid grid-cols-2 gap-2">
						<label className="flex flex-col gap-1">
							<span className="text-[10.5px] uppercase tracking-wide text-ink-3">Mín</span>
							<input
								type="number"
								value={lo}
								onChange={(e) => setLo(e.target.value)}
								className="h-8 rounded bg-pitch border border-line px-2 text-[13px] text-ink focus:outline-none focus:border-brand/60"
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-[10.5px] uppercase tracking-wide text-ink-3">Máx</span>
							<input
								type="number"
								value={hi}
								onChange={(e) => setHi(e.target.value)}
								className="h-8 rounded bg-pitch border border-line px-2 text-[13px] text-ink focus:outline-none focus:border-brand/60"
							/>
						</label>
					</div>
					<div className="flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={() => {
								setLo("");
								setHi("");
								onApply("", "");
								setOpen(false);
							}}
							className="text-[12px] text-ink-3 hover:text-ink px-2"
						>
							Limpiar
						</button>
						<Button
							size="sm"
							variant="primary"
							onClick={() => {
								onApply(lo, hi);
								setOpen(false);
							}}
						>
							Aplicar
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
