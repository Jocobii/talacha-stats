import type { ComponentType, ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type IconC = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
	size?: Size;
	icon?: IconC;
	iconRight?: IconC;
};

export function Button({
	variant = "primary",
	size = "md",
	icon: Icon,
	iconRight: IconRight,
	className,
	type = "button",
	children,
	...rest
}: ButtonProps) {
	const base =
		"inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";

	const sizes: Record<Size, string> = {
		sm: "h-8 px-3 text-[13px]",
		md: "h-9 px-4 text-sm",
		lg: "h-11 px-5 text-[15px]",
	};

	const variants: Record<Variant, string> = {
		primary: "bg-brand text-pitch hover:bg-brand-dim",
		secondary: "bg-surface-2 text-ink border border-line hover:border-ink-3 hover:bg-surface",
		ghost: "text-ink-2 hover:text-ink hover:bg-surface",
		danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
		link: "text-brand-ink hover:text-brand-dim",
	};

	return (
		<button type={type} className={cn(base, sizes[size], variants[variant], className)} {...rest}>
			{Icon && <Icon size={16} strokeWidth={2} />}
			{children}
			{IconRight && <IconRight size={16} strokeWidth={2} />}
		</button>
	);
}
