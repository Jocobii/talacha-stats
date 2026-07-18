import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

/** Slot de pie de `Card`: separado por borde superior, fondo ligeramente distinto. */
export function CardFooter({ className, ...rest }: CardFooterProps) {
	return (
		<div className={cn("border-t border-line bg-surface-2/40 px-4 py-3", className)} {...rest} />
	);
}
