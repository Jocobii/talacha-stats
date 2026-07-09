import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
	return (
		<ol className="flex items-center gap-0">
			{steps.map((s, i) => {
				const state: "done" | "current" | "next" =
					i < current ? "done" : i === current ? "current" : "next";
				return (
					<li key={i} className="flex items-center flex-1">
						<div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
							<span
								className={cn(
									"shrink-0 grid place-items-center w-6 h-6 rounded-full text-[11px] font-bold transition",
									state === "done" && "bg-brand text-pitch",
									state === "current" && "bg-brand/15 text-brand-ink ring-1 ring-brand/40",
									state === "next" && "bg-surface-2 text-ink-3 border border-line",
								)}
							>
								{state === "done" ? <Check size={12} strokeWidth={3} /> : i + 1}
							</span>
							{/* En mobile solo se muestra el label del paso activo — evita que
							    los 3 labels en una sola fila empujen el ancho fuera de la
							    tarjeta (§ mismo patrón responsive del mock original). */}
							<div className={cn("min-w-0", state !== "current" && "hidden sm:block")}>
								<div
									className={cn(
										"text-[10.5px] font-semibold tracking-[0.14em] uppercase",
										state === "current"
											? "text-brand-ink"
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
						{i < steps.length - 1 && (
							<div className="relative flex-1 h-px mx-2 sm:mx-4 min-w-[10px] sm:min-w-[24px] bg-line overflow-hidden rounded-full">
								<div
									className={cn(
										"absolute inset-y-0 left-0 bg-brand transition-[width] duration-500 ease-out",
										i < current ? "w-full" : "w-0",
									)}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}
