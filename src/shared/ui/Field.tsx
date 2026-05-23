import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Field({
	label,
	required,
	hint,
	error,
	children,
	className,
}: {
	label?: string;
	required?: boolean;
	hint?: string;
	error?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label className={cn("flex flex-col gap-1.5", className)}>
			{label && (
				<span className="text-[13px] font-medium text-ink">
					{label}
					{required && <span className="text-brand-ink ml-0.5">*</span>}
				</span>
			)}
			{children}
			{hint && !error && <span className="text-xs text-ink-3">{hint}</span>}
			{error && (
				<span className="text-xs text-red-400 flex items-center gap-1">
					<AlertCircle size={12} strokeWidth={2.25} />
					{error}
				</span>
			)}
		</label>
	);
}
