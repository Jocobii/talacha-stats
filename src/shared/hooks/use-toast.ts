/**
 * shared/hooks/use-toast.ts
 *
 * Shim de compatibilidad. La API real vive en `@/shared/lib/notify`, que se
 * puede importar desde CUALQUIER lugar (no necesita ser un hook). Este wrapper
 * existe solo para los call sites que ya usaban `const toast = useToast()`.
 *
 * Para código nuevo, prefiere:
 *   import { notify } from "@/shared/lib/notify";
 *   notify.success("Guardado");
 */
import { notify } from "@/shared/lib/notify";

export function useToast() {
	return notify;
}
