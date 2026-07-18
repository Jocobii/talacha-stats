import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";
import { ALIGN, GAP, type AlignToken, type GapToken } from "./scales";

const COLS = {
	1: "grid-cols-1",
	2: "grid-cols-2",
	3: "grid-cols-3",
	4: "grid-cols-4",
	5: "grid-cols-5",
	6: "grid-cols-6",
	12: "grid-cols-12",
} as const;

export type GridCols = keyof typeof COLS;

export type GridProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	cols?: GridCols;
	gap?: GapToken;
	align?: AlignToken;
};

/** Grid con columnas fijas. Reemplaza `<div style={{display:"grid",gridTemplateColumns}}>`. */
export function Grid({
	as: As = "div",
	cols = 1,
	gap = "md",
	align,
	className,
	...rest
}: GridProps) {
	return (
		<As className={cn("grid", COLS[cols], GAP[gap], align && ALIGN[align], className)} {...rest} />
	);
}
