import { cn } from "@/shared/lib/cn";

type Size = "sm" | "md" | "lg" | "xl";
type Tone = "brand" | "neutral";

export function Avatar({
	initials,
	size = "md",
	tone = "brand",
}: {
	initials: string;
	size?: Size;
	tone?: Tone;
}) {
	const sizes: Record<Size, string> = {
		sm: "w-7 h-7 text-[11px]",
		md: "w-9 h-9 text-[13px]",
		lg: "w-12 h-12 text-base",
		xl: "w-16 h-16 text-xl",
	};

	return (
		<span
			className={cn(
				"rounded-md font-display font-bold grid place-items-center shrink-0 tracking-tight",
				tone === "brand" ? "bg-brand/15 text-brand" : "bg-surface-2 text-ink-2 border border-line",
				sizes[size],
			)}
		>
			{initials}
		</span>
	);
}
