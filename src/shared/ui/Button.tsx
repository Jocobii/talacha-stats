import type { ComponentType, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

type IconC = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
	{
		variants: {
			variant: {
				primary: "bg-brand text-pitch hover:bg-brand-dim",
				secondary: "bg-surface-2 text-ink border border-line hover:border-ink-3 hover:bg-surface",
				ghost: "text-ink-2 hover:text-ink hover:bg-surface",
				danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
				link: "text-brand-ink hover:text-brand-dim",
			},
			size: {
				sm: "h-8 px-3 text-[13px]",
				md: "h-9 px-4 text-sm",
				lg: "h-11 px-5 text-[15px]",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		icon?: IconC;
		iconRight?: IconC;
		/** Muestra un spinner en vez del icono y deshabilita el botón — usar en
		 *  toda acción async (guardar, eliminar, etc.) en vez de deshabilitar a mano. */
		loading?: boolean;
	};

export function Button({
	variant,
	size,
	icon: Icon,
	iconRight: IconRight,
	loading = false,
	className,
	type = "button",
	children,
	disabled,
	...rest
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			aria-busy={loading}
			className={cn(buttonVariants({ variant, size }), className)}
			{...rest}
		>
			{loading ? (
				<Loader2 size={16} strokeWidth={2} className="animate-spin" />
			) : (
				Icon && <Icon size={16} strokeWidth={2} />
			)}
			{children}
			{!loading && IconRight && <IconRight size={16} strokeWidth={2} />}
		</button>
	);
}
