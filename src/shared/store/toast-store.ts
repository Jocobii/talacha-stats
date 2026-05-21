/**
 * shared/store/toast-store.ts
 *
 * Zustand store para el sistema de notificaciones (toasts).
 * Usar a través del hook useToast en shared/hooks/use-toast.ts.
 */
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
	id: string;
	type: ToastType;
	message: string;
	duration: number; // ms; 0 = permanente hasta dismiss manual
};

type ToastStore = {
	toasts: Toast[];
	add: (toast: Omit<Toast, "id">) => void;
	dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],

	add: (toast) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));

		if (toast.duration > 0) {
			setTimeout(() => {
				set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
			}, toast.duration);
		}
	},

	dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
