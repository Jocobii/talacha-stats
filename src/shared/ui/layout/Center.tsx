import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";

export type CenterProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	/** `true` centra también en el eje vertical con altura completa del padre. */
	fullHeight?: boolean;
};

/** Centra el contenido en ambos ejes. Reemplaza `<div style={{display:"grid",placeItems:"center"}}>`. */
export function Center({ as: As = "div", fullHeight = false, className, ...rest }: CenterProps) {
	return (
		<As className={cn("grid place-items-center", fullHeight && "h-full", className)} {...rest} />
	);
}
