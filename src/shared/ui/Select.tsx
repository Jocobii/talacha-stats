import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<div className="relative">
			<select
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border border-line pl-3 pr-8 text-sm text-ink",
					"focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition",
					"appearance-none cursor-pointer [color-scheme:dark]",
					className,
				)}
				{...rest}
			>
				{children}
			</select>
			<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none">
				<ChevronDown size={14} strokeWidth={2} />
			</span>
		</div>
	);
}
