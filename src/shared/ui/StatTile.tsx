import type { ComponentType } from "react";
import { Card } from "./Card";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/shared/lib/cn";

type IconC = ComponentType<{ size?: number; strokeWidth?: number }>;

export function StatTile({
	label,
	value,
	hint,
	icon: Icon,
	trend,
}: {
	label: string;
	value: string | number;
	hint?: string;
	icon?: IconC;
	trend?: { dir: "up" | "down"; value: string };
}) {
	return (
		<Card className="p-5 hover:border-ink-3 transition">
			<div className="flex items-start justify-between">
				<SectionLabel>{label}</SectionLabel>
				{Icon && (
					<span className="text-ink-3">
						<Icon size={14} strokeWidth={1.75} />
					</span>
				)}
			</div>
			<div className="mt-3 flex items-baseline gap-2">
				<span className="font-display text-4xl font-black tracking-tight text-ink leading-none">
					{value}
				</span>
				{trend && (
					<span
						className={cn(
							"text-[11px] font-semibold",
							trend.dir === "up" ? "text-emerald-400" : "text-red-400",
						)}
					>
						{trend.dir === "up" ? "↑" : "↓"} {trend.value}
					</span>
				)}
			</div>
			{hint && <p className="mt-1.5 text-[12px] text-ink-3">{hint}</p>}
		</Card>
	);
}
