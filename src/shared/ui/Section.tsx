import type { HTMLAttributes, ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type SectionProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	title?: ReactNode;
	actions?: ReactNode;
};

/** Agrupa un bloque de contenido con título+acciones opcionales, sin superficie propia
 *  (a diferencia de `Panel`). Útil para separar secciones dentro de un tab o una página. */
export function Section({
	as: As = "section",
	title,
	actions,
	className,
	children,
	...rest
}: SectionProps) {
	return (
		<As className={cn("flex flex-col gap-3", className)} {...rest}>
			{(title || actions) && (
				<div className="flex items-center justify-between gap-2">
					{title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
					{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
				</div>
			)}
			{children}
		</As>
	);
}
