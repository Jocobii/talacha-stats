import type { ReactNode, ComponentType } from "react";

type IconC = ComponentType<{ size?: number; strokeWidth?: number }>;

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon?: IconC;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
}) {
	return (
		<div className="border border-dashed border-line rounded-lg bg-surface/40 px-6 py-12 text-center">
			{Icon && (
				<div className="w-10 h-10 rounded-md bg-surface-2 border border-line mx-auto mb-4 grid place-items-center text-ink-3">
					<Icon size={18} strokeWidth={1.75} />
				</div>
			)}
			<h3 className="font-display text-xl font-bold text-ink tracking-tight">{title}</h3>
			{description && <p className="mt-1.5 text-sm text-ink-2 max-w-sm mx-auto">{description}</p>}
			{action && <div className="mt-5 inline-flex">{action}</div>}
		</div>
	);
}
