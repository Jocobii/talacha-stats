import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type IconC = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
	icon?: IconC;
	title?: ReactNode;
	action?: ReactNode;
};

/** Slot de encabezado de `Card`: icono + título a la izquierda, acción a la derecha.
 *  Si se pasan `children`, se renderizan tal cual en vez del layout icon/title/action. */
export function CardHeader({
	icon: Icon,
	title,
	action,
	className,
	children,
	...rest
}: CardHeaderProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-2 border-b border-line px-4 py-3",
				className,
			)}
			{...rest}
		>
			{children ?? (
				<>
					<div className="flex min-w-0 items-center gap-2">
						{Icon && <Icon size={16} strokeWidth={2} className="shrink-0 text-ink-2" />}
						{title && <span className="truncate text-sm font-semibold text-ink">{title}</span>}
					</div>
					{action && <div className="shrink-0">{action}</div>}
				</>
			)}
		</div>
	);
}
