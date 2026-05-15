import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
	return (
		<ol className="flex items-center gap-0">
			{steps.map((s, i) => {
				const state: "done" | "current" | "next" =
					i < current ? "done" : i === current ? "current" : "next";
				return (
					<li key={i} className="flex items-center flex-1 last:flex-none">
						<div className="flex items-center gap-2.5 min-w-0">
							<span
								className={cn(
									"shrink-0 grid place-items-center w-6 h-6 rounded-full text-[11px] font-bold transition",
									state === "done" && "bg-brand text-pitch",
									state === "current" && "bg-brand/15 text-brand ring-1 ring-brand/40",
									state === "next" && "bg-surface-2 text-ink-3 border border-line",
								)}
							>
								{state === "done" ? <Check size={12} strokeWidth={3} /> : i + 1}
							</span>
							<div className="min-w-0">
								<div
									className={cn(
										"text-[10.5px] font-semibold tracking-[0.14em] uppercase",
										state === "current"
											? "text-brand"
											: state === "done"
												? "text-ink-2"
												: "text-ink-3",
									)}
								>
									Paso {i + 1}
								</div>
								<div
									className={cn(
										"text-[13px] font-medium truncate",
										state === "next" ? "text-ink-3" : "text-ink",
									)}
								>
									{s}
								</div>
							</div>
						</div>
						{i < steps.length - 1 && <div className="flex-1 h-px bg-line mx-4 min-w-[24px]" />}
					</li>
				);
			})}
		</ol>
	);
}
