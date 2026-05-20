/**
 * shared/store/toast-store.ts
 *
 * Zustand store global para notificaciones (snackbar/toast).
 * Uso: const { success, error, warning, info } = useToast()
 */
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
	id: string;
	type: ToastType;
	message: string;
	duration: number; // ms before auto-dismiss (0 = manual only)
};

type ToastStore = {
	toasts: Toast[];
	add: (toast: Omit<Toast, "id">) => void;
	dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],
	add: (toast) => {
		const id = Math.random().toString(36).slice(2);
		set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
		if (toast.duration > 0) {
			setTimeout(() => {
				set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
			}, toast.duration);
		}
	},
	dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
