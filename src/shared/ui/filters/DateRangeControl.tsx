"use client";

/**
 * shared/ui/filters/DateRangeControl.tsx
 *
 * Rango de fechas (desde/hasta) para FilterBar — popover con botón "Aplicar",
 * mismo patrón que NumberRangeControl (evita disparar un fetch por cada
 * cambio de fecha).
 */

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

export function DateRangeControl({
	label,
	from,
	to,
	onApply,
	className,
}: {
	label: string;
	from: string;
	to: string;
	onApply: (from: string, to: string) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [f, setF] = useState(from);
	const [t, setT] = useState(to);
	// Sincroniza el borrador local con las props cuando cambian desde afuera
	// (ej. "Limpiar todos los filtros"). Se ajusta durante el render — no en
	// un efecto — para evitar el commit extra de un setState post-render.
	const [prevFrom, setPrevFrom] = useState(from);
	const [prevTo, setPrevTo] = useState(to);
	if (from !== prevFrom || to !== prevTo) {
		setPrevFrom(from);
		setPrevTo(to);
		setF(from);
		setT(to);
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

	const hasValue = from !== "" || to !== "";

	return (
		<div className={cn("relative", className)} ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border pl-3 pr-8 text-sm text-left flex items-center gap-2 transition",
					open ? "border-brand/60 ring-1 ring-brand/30" : "border-line hover:border-ink-3",
					hasValue ? "text-ink" : "text-ink-3",
				)}
			>
				<Calendar size={14} strokeWidth={1.75} className="shrink-0 text-ink-3" />
				<span className="truncate">{hasValue ? `${from || "…"} → ${to || "…"}` : label}</span>
			</button>
			{open && (
				<div className="absolute z-30 top-[calc(100%+6px)] left-0 w-[260px] bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-3 flex flex-col gap-3">
					<div className="grid grid-cols-2 gap-2">
						<label className="flex flex-col gap-1">
							<span className="text-[10.5px] uppercase tracking-wide text-ink-3">Desde</span>
							<input
								type="date"
								value={f}
								onChange={(e) => setF(e.target.value)}
								className="h-8 rounded bg-pitch border border-line px-2 text-[12.5px] text-ink focus:outline-none focus:border-brand/60"
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-[10.5px] uppercase tracking-wide text-ink-3">Hasta</span>
							<input
								type="date"
								value={t}
								onChange={(e) => setT(e.target.value)}
								className="h-8 rounded bg-pitch border border-line px-2 text-[12.5px] text-ink focus:outline-none focus:border-brand/60"
							/>
						</label>
					</div>
					<div className="flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={() => {
								setF("");
								setT("");
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
								onApply(f, t);
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
