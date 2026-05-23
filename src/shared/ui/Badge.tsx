import type { ReactNode, ComponentType } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "brand" | "solid" | "warn" | "danger";

export function Badge({
	tone = "neutral",
	children,
	icon: Icon,
	className,
}: {
	tone?: Tone;
	children: ReactNode;
	icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
	className?: string;
}) {
	const tones: Record<Tone, string> = {
		neutral: "bg-surface-2 text-ink-2 border-line",
		brand: "bg-brand/10 text-brand-ink border-brand/20",
		solid: "bg-brand text-pitch border-transparent",
		warn: "bg-amber-500/10 text-amber-300 border-amber-500/20",
		danger: "bg-red-500/10 text-red-400 border-red-500/20",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium border",
				tones[tone],
				className,
			)}
		>
			{Icon && <Icon size={11} strokeWidth={2.5} />}
			{children}
		</span>
	);
}
