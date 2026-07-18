import type { ReactNode, ComponentType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
	"inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium border",
	{
		variants: {
			tone: {
				neutral: "bg-surface-2 text-ink-2 border-line",
				brand: "bg-brand/10 text-brand-ink border-brand/20",
				solid: "bg-brand text-pitch border-transparent",
				warn: "bg-amber-500/10 text-amber-300 border-amber-500/20",
				danger: "bg-red-500/10 text-red-400 border-red-500/20",
			},
		},
		defaultVariants: { tone: "neutral" },
	},
);

export type BadgeProps = VariantProps<typeof badgeVariants> & {
	children: ReactNode;
	icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
	className?: string;
};

export function Badge({ tone, children, icon: Icon, className }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ tone }), className)}>
			{Icon && <Icon size={11} strokeWidth={2.5} />}
			{children}
		</span>
	);
}
