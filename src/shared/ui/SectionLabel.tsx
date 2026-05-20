import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<p
			className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-3", className)}
		>
			{children}
		</p>
	);
}
