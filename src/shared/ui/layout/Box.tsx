import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";
import { PAD, type PadToken } from "./scales";

const BG = {
	none: "",
	surface: "bg-surface",
	"surface-2": "bg-surface-2",
	"surface-3": "bg-surface-3",
} as const;

const RADIUS = {
	none: "rounded-none",
	sm: "rounded-md",
	md: "rounded-lg",
	lg: "rounded-xl",
} as const;

export type BoxBg = keyof typeof BG;
export type BoxRadius = keyof typeof RADIUS;

export type BoxProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	pad?: PadToken;
	bg?: BoxBg;
	radius?: BoxRadius;
	border?: boolean;
};

/** Contenedor genérico con tokens de superficie/borde. Reemplaza `<div style={{padding,background}}>`. */
export function Box({
	as: As = "div",
	pad = "none",
	bg = "none",
	radius = "none",
	border = false,
	className,
	...rest
}: BoxProps) {
	return (
		<As
			className={cn(PAD[pad], BG[bg], RADIUS[radius], border && "border border-line", className)}
			{...rest}
		/>
	);
}
