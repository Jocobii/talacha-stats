import { cn } from "@/shared/lib/cn";

type Tone = "active" | "paused" | "inactive" | "danger";

export function StatusDot({ tone = "active", label }: { tone?: Tone; label: string }) {
	const tones: Record<Tone, string> = {
		active: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.5)]",
		paused: "bg-amber-400",
		inactive: "bg-ink-3",
		danger: "bg-red-400",
	};

	return (
		<span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
			<span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tones[tone])} />
			{label}
		</span>
	);
}
