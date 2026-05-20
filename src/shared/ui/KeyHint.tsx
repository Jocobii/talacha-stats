import type { ReactNode } from "react";

export function KeyHint({ children }: { children: ReactNode }) {
	return (
		<kbd className="inline-flex items-center h-5 px-1.5 rounded border border-line bg-surface-2 text-[10.5px] text-ink-3 font-mono">
			{children}
		</kbd>
	);
}
