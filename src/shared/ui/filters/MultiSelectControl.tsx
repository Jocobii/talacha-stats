"use client";

/**
 * shared/ui/filters/MultiSelectControl.tsx
 *
 * Multiselect para FilterBar — se traduce a lista (coma) en la URL. Aplica
 * al elegir cada opción (sin botón "Aplicar", a diferencia de los rangos).
 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type FilterOption = { value: string; label: string };

export function MultiSelectControl({
	label,
	options,
	values,
	onChange,
	className,
}: {
	label: string;
	options: FilterOption[];
	values: string[];
	onChange: (values: string[]) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	function toggle(v: string) {
		onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
	}

	return (
		<div className={cn("relative", className)} ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border pl-3 pr-8 text-sm text-left relative transition",
					open ? "border-brand/60 ring-1 ring-brand/30" : "border-line hover:border-ink-3",
					values.length ? "text-ink" : "text-ink-3",
				)}
			>
				{values.length ? `${label} · ${values.length}` : label}
			</button>
			<ChevronDown
				size={13}
				strokeWidth={2}
				className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
			/>
			{open && (
				<div className="absolute z-30 top-[calc(100%+6px)] left-0 min-w-[200px] bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-1.5">
					{options.map((o) => {
						const checked = values.includes(o.value);
						return (
							<button
								type="button"
								key={o.value}
								onClick={() => toggle(o.value)}
								className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] text-ink hover:bg-surface-2 transition text-left"
							>
								<span
									className={cn(
										"w-4 h-4 rounded border grid place-items-center shrink-0 transition",
										checked ? "bg-brand border-brand" : "border-line-2",
									)}
								>
									{checked && <Check size={11} strokeWidth={3} className="text-pitch" />}
								</span>
								{o.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
