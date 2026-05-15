import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	interactive?: boolean;
};

export function Card({ as: As = "div", className, interactive, children, ...rest }: CardProps) {
	return (
		<As
			className={cn(
				"bg-surface border border-line rounded-lg",
				interactive && "transition hover:border-ink-3 cursor-pointer",
				className,
			)}
			{...rest}
		>
			{children}
		</As>
	);
}
