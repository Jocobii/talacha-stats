"use client";

/**
 * shared/ui/filters/ToggleControl.tsx
 *
 * Filtro booleano tipo pastilla para FilterBar — aplica de inmediato al
 * hacer click (sin popover, a diferencia de los rangos), mismo patrón que
 * MultiSelectControl.
 */

import { cn } from "@/shared/lib/cn";

export function ToggleControl({
	label,
	checked,
	onApply,
	className,
}: {
	label: string;
	checked: boolean;
	onApply: (checked: boolean) => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={() => onApply(!checked)}
			aria-pressed={checked}
			className={cn(
				"h-9 flex items-center gap-2.5 px-3 rounded-md border transition",
				checked
					? "bg-brand/10 border-brand/30 text-brand-ink"
					: "bg-surface-2 border-line text-ink-2 hover:border-ink-3",
				className,
			)}
		>
			<span
				className={cn(
					"w-8 h-[18px] rounded-full relative transition",
					checked ? "bg-brand" : "bg-ink-3/40",
				)}
			>
				<span
					className={cn(
						"absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all",
						checked ? "left-[16px]" : "left-[2px]",
					)}
				/>
			</span>
			<span className="text-[13px] font-medium">{label}</span>
		</button>
	);
}
