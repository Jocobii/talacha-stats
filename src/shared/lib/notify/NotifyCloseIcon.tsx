"use client";
/**
 * shared/lib/notify/NotifyCloseIcon.tsx
 *
 * Reemplaza el ícono de estado del badge (✓/✕/⚠/i) por una versión
 * clickeable que cierra la notificación — mismo glyph, mismo color (hereda
 * `currentColor`, que el CSS del badge ya pinta según `--sileo-tone` por
 * estado en globals.css), sin agregar un botón nuevo dentro del toast.
 *
 * `onPointerDown` con `stopPropagation` es necesario: el toast completo es
 * un `<button>` que captura el puntero en su propio `onPointerDown` para
 * detectar swipe-to-dismiss. Si no lo detenemos aquí, el gesto se adelanta
 * y el click en el ícono nunca llega a dispararse.
 */
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import type { NotifyIconState } from "./notify.types";

const ICON_BY_STATE: Record<NotifyIconState, typeof Check> = {
	success: Check,
	error: X,
	warning: AlertTriangle,
	info: Info,
};

type NotifyCloseIconProps = {
	state: NotifyIconState;
	onDismiss: () => void;
};

export function NotifyCloseIcon({ state, onDismiss }: NotifyCloseIconProps) {
	const Icon = ICON_BY_STATE[state];

	function stopSwipeGesture(e: PointerEvent) {
		e.stopPropagation();
	}

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		onDismiss();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		onDismiss();
	}

	return (
		<span
			role="button"
			tabIndex={0}
			aria-label="Cerrar notificación"
			onPointerDown={stopSwipeGesture}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				cursor: "pointer",
			}}
		>
			<Icon size={13} strokeWidth={2.5} />
		</span>
	);
}
