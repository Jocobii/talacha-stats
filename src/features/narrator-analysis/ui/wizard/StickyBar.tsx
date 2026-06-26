/**
 * StickyBar — barra de acción fija en la zona del pulgar (abajo, ancho completo).
 * El 75% de las interacciones móviles son con el pulgar y la zona cómoda es
 * abajo-centro (Hoober / Smashing). El CTA primario siempre vive aquí.
 */

import type { ReactNode } from "react";

export function StickyBar({ children }: { children: ReactNode }) {
	return (
		<div className="sticky bottom-0 inset-x-0 z-10 bg-surface/95 backdrop-blur border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
			<div className="max-w-2xl mx-auto">{children}</div>
		</div>
	);
}

export function PrimaryButton({
	onClick,
	disabled,
	loading,
	children,
}: {
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className="w-full min-h-[52px] bg-brand hover:bg-brand-dim disabled:opacity-40 text-pitch font-display font-black text-lg uppercase tracking-wide rounded-2xl transition active:scale-[0.99]"
		>
			{loading ? "…" : children}
		</button>
	);
}
