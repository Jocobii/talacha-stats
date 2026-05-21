"use client";
/**
 * shared/ui/ToastContainer.tsx
 *
 * Renderiza el stack de toasts en la esquina superior-derecha.
 * Agrégalo una vez al layout raíz o de admin — no lo pongas en cada página.
 *
 * Animaciones:
 *  - Entrada: desliza desde la derecha con spring (toastIn)
 *  - Salida:  desliza de vuelta hacia la derecha colapsando altura (toastOut)
 */
import { useState, useEffect } from "react";
import { useToastStore } from "@/shared/store/toast-store";
import type { Toast, ToastType } from "@/shared/store/toast-store";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const CONFIG: Record<
	ToastType,
	{ icon: React.ReactNode; bar: string; bg: string; border: string; text: string }
> = {
	success: {
		icon: <CheckCircle size={16} strokeWidth={2} />,
		bar: "bg-green-500",
		bg: "bg-[#0f2418]",
		border: "border-green-700/50",
		text: "text-green-300",
	},
	error: {
		icon: <AlertCircle size={16} strokeWidth={2} />,
		bar: "bg-rose-500",
		bg: "bg-[#2a0f0f]",
		border: "border-rose-700/50",
		text: "text-rose-300",
	},
	warning: {
		icon: <AlertTriangle size={16} strokeWidth={2} />,
		bar: "bg-amber-500",
		bg: "bg-[#211a08]",
		border: "border-amber-700/50",
		text: "text-amber-300",
	},
	info: {
		icon: <Info size={16} strokeWidth={2} />,
		bar: "bg-blue-500",
		bg: "bg-[#0c1a2e]",
		border: "border-blue-700/50",
		text: "text-blue-300",
	},
};

// Duration of the exit animation (must match CSS toastOut duration)
const EXIT_DURATION_MS = 450;

function ToastItem({ toast }: { toast: Toast }) {
	const dismiss = useToastStore((s) => s.dismiss);
	const [exiting, setExiting] = useState(false);

	const c = CONFIG[toast.type];

	function handleDismiss() {
		setExiting(true);
		setTimeout(() => dismiss(toast.id), EXIT_DURATION_MS);
	}

	// When the store removes the toast (auto-dismiss), play exit animation first
	// by watching the store directly isn't feasible here; instead we hook into
	// the auto-dismiss timing by running the exit animation slightly earlier.
	useEffect(() => {
		if (toast.duration <= 0) return;
		const timer = setTimeout(() => setExiting(true), toast.duration - EXIT_DURATION_MS);
		return () => clearTimeout(timer);
	}, [toast.duration]);

	return (
		<div
			role="alert"
			className={`${exiting ? "toast-exit" : "toast-enter"} relative flex items-start gap-3 w-80 rounded-lg border px-4 py-3 shadow-2xl overflow-hidden ${c.bg} ${c.border}`}
		>
			{/* Color bar */}
			<span className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />

			{/* Icon */}
			<span className={`shrink-0 mt-0.5 ${c.text}`}>{c.icon}</span>

			{/* Message */}
			<p className="flex-1 text-sm text-ink leading-snug">{toast.message}</p>

			{/* Dismiss */}
			<button
				onClick={handleDismiss}
				className="shrink-0 text-ink-3 hover:text-ink transition-colors mt-0.5"
				aria-label="Cerrar"
			>
				<X size={14} />
			</button>
		</div>
	);
}

export function ToastContainer() {
	const toasts = useToastStore((s) => s.toasts);

	if (toasts.length === 0) return null;

	return (
		<div
			aria-live="polite"
			className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
		>
			{toasts.map((t) => (
				<div key={t.id} className="pointer-events-auto">
					<ToastItem toast={t} />
				</div>
			))}
		</div>
	);
}
