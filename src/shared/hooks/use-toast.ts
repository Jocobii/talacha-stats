/**
 * shared/hooks/use-toast.ts
 *
 * Hook de conveniencia para disparar toasts desde cualquier Client Component.
 *
 * Uso:
 *   const toast = useToast();
 *   toast.success("Guardado correctamente");
 *   toast.error("Error al guardar");
 *   toast.warning("Revisa los datos");
 *   toast.info("Recuerda confirmar la jornada");
 */
import { useToastStore } from "@/shared/store/toast-store";

const DEFAULT_DURATION = 4000;

export function useToast() {
	const add = useToastStore((s) => s.add);

	return {
		success: (message: string, duration = DEFAULT_DURATION) =>
			add({ type: "success", message, duration }),
		error: (message: string, duration = DEFAULT_DURATION) =>
			add({ type: "error", message, duration }),
		warning: (message: string, duration = DEFAULT_DURATION) =>
			add({ type: "warning", message, duration }),
		info: (message: string, duration = DEFAULT_DURATION) =>
			add({ type: "info", message, duration }),
	};
}
