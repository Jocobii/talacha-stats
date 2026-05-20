"use client";
/**
 * features/match-resolution/model/use-keyboard-nav.ts
 * Hook para atajos de teclado en la pantalla de captura.
 */
import { useEffect, useCallback } from "react";

type KeyboardNavCallbacks = {
	onSave: () => void;
	onSaveNext: () => void;
	onCancel: () => void;
	onAddPlayerHome: () => void;
	onAddPlayerAway: () => void;
};

/** Enfoca el primer input de goles en el panel local */
export function focusFirstStatInput(): void {
	const input = document.querySelector<HTMLInputElement>("[data-stat-input]:not([disabled])");
	input?.focus();
}

export function useKeyboardNav(callbacks: KeyboardNavCallbacks): void {
	const handler = useCallback(
		(e: KeyboardEvent) => {
			const isMod = e.ctrlKey || e.metaKey;
			if (!isMod) return;

			if (e.key === "s" && !e.shiftKey) {
				e.preventDefault();
				callbacks.onSave();
				return;
			}
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				callbacks.onSaveNext();
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				callbacks.onCancel();
				return;
			}
			if (e.key === "H" && e.shiftKey) {
				e.preventDefault();
				callbacks.onAddPlayerHome();
				return;
			}
			if (e.key === "A" && e.shiftKey) {
				e.preventDefault();
				callbacks.onAddPlayerAway();
				return;
			}
		},
		[callbacks],
	);

	useEffect(() => {
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handler]);
}
