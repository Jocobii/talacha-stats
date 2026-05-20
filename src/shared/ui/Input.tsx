import { forwardRef, type InputHTMLAttributes, type ComponentType } from "react";
import { cn } from "@/shared/lib/cn";

type IconC = ComponentType<{ size?: number; strokeWidth?: number }>;

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	mono?: boolean;
	icon?: IconC;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ className, mono, icon: Icon, ...rest },
	ref,
) {
	return (
		<div className="relative">
			{Icon && (
				<span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none">
					<Icon size={16} strokeWidth={1.75} />
				</span>
			)}
			<input
				ref={ref}
				className={cn(
					"w-full h-9 rounded-md bg-surface-2 border border-line px-3 text-sm text-ink placeholder:text-ink-3",
					"focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition",
					Icon && "pl-9",
					mono && "font-mono tracking-wider",
					className,
				)}
				{...rest}
			/>
		</div>
	);
});
