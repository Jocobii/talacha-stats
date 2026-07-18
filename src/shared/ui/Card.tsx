import type { HTMLAttributes, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";
import { CardHeader } from "./CardHeader";
import { CardBody } from "./CardBody";
import { CardFooter } from "./CardFooter";

const cardVariants = cva("bg-surface border border-line rounded-lg", {
	variants: {
		interactive: {
			true: "transition hover:border-ink-3 cursor-pointer",
			false: "",
		},
	},
	defaultVariants: { interactive: false },
});

export type CardProps = HTMLAttributes<HTMLElement> &
	VariantProps<typeof cardVariants> & {
		as?: ElementType;
	};

function CardRoot({ as: As = "div", className, interactive, children, ...rest }: CardProps) {
	return (
		<As className={cn(cardVariants({ interactive }), className)} {...rest}>
			{children}
		</As>
	);
}

/** `Card` plano retrocompatible + slots opcionales `Card.Header/Body/Footer` (§ Fase 3). */
export const Card = Object.assign(CardRoot, {
	Header: CardHeader,
	Body: CardBody,
	Footer: CardFooter,
});
