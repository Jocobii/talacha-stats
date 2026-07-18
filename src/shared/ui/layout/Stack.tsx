import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";
import { ALIGN, GAP, type AlignToken, type GapToken } from "./scales";

export type StackProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	gap?: GapToken;
	align?: AlignToken;
};

/** Columna flex. Reemplaza `<div style={{display:"flex",flexDirection:"column",gap}}>`. */
export function Stack({ as: As = "div", gap = "md", align, className, ...rest }: StackProps) {
	return (
		<As className={cn("flex flex-col", GAP[gap], align && ALIGN[align], className)} {...rest} />
	);
}
