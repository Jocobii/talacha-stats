import { cn } from "@/shared/lib/cn";

export type SpacerProps = {
	/** Eje en el que crece: `x` (ancho flexible) u `y` (alto flexible, default). */
	axis?: "x" | "y";
	className?: string;
};

/** Separador flexible dentro de un `Stack`/`Inline` — empuja hermanos a los extremos. */
export function Spacer({ axis = "y", className }: SpacerProps) {
	return (
		<div aria-hidden className={cn("flex-1", axis === "x" ? "min-w-0" : "min-h-0", className)} />
	);
}
