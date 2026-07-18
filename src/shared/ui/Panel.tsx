import type { HTMLAttributes, ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type PanelProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	title?: ReactNode;
	actions?: ReactNode;
};

/** Contenedor con superficie/borde + título+acciones opcionales — shorthand para el
 *  patrón "Card con header simple" usado en tabs del cockpit y drawers. Para casos que
 *  necesiten slots más ricos (icono, header custom), usar `Card.Header/Body/Footer`. */
export function Panel({
	as: As = "div",
	title,
	actions,
	className,
	children,
	...rest
}: PanelProps) {
	return (
		<As
			className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)}
			{...rest}
		>
			{(title || actions) && (
				<div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
					{title && <h3 className="truncate text-sm font-semibold text-ink">{title}</h3>}
					{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
				</div>
			)}
			<div className="p-4">{children}</div>
		</As>
	);
}
