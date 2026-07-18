import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";
import { ALIGN, GAP, JUSTIFY, type AlignToken, type GapToken, type JustifyToken } from "./scales";

export type InlineProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	gap?: GapToken;
	align?: AlignToken;
	justify?: JustifyToken;
	wrap?: boolean;
};

/** Fila flex con wrap opcional. Reemplaza `<div style={{display:"flex",gap}}>`. */
export function Inline({
	as: As = "div",
	gap = "md",
	align,
	justify,
	wrap = false,
	className,
	...rest
}: InlineProps) {
	return (
		<As
			className={cn(
				"flex",
				wrap && "flex-wrap",
				GAP[gap],
				align && ALIGN[align],
				justify && JUSTIFY[justify],
				className,
			)}
			{...rest}
		/>
	);
}
