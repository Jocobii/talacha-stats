/**
 * shared/hooks/use-toast.ts
 *
 * Hook de conveniencia para disparar toasts sin tocar el store directamente.
 *
 * Uso:
 *   const toast = useToast();
 *   toast.success("Guardado correctamente");
 *   toast.error("Algo salió mal");
 */
import { useToastStore } from "@/shared/store/toast-store";

export function useToast() {
	const add = useToastStore((s) => s.add);

	return {
		success: (message: string, duration = 4000) => add({ type: "success", message, duration }),
		error: (message: string, duration = 5000) => add({ type: "error", message, duration }),
		warning: (message: string, duration = 4000) => add({ type: "warning", message, duration }),
		info: (message: string, duration = 4000) => add({ type: "info", message, duration }),
	};
}
