import { z } from "zod";

/**
 * Convierte URLSearchParams a un objeto plano y lo valida con el schema Zod dado.
 *
 * Retorna el resultado de safeParse (inferido por TypeScript) para que la ruta
 * decida como manejar el error (apiError, fallback a defaults, etc.).
 *
 * Uso en una route:
 *
 *   const FiltersSchema = z.object({
 *     status: z.enum(["active", "finished"]).default("active"),
 *     limit:  z.coerce.number().min(1).max(50).default(10),
 *   });
 *
 *   const parsed = parseQueryParams(searchParams, FiltersSchema);
 *   if (!parsed.success) return apiError("Parametros invalidos", 400);
 *   const { status, limit } = parsed.data;
 *
 * Nota: los valores de URLSearchParams son siempre strings. Usa z.coerce.*
 * para numeros y booleanos.
 */
export function parseQueryParams<T extends z.ZodTypeAny>(searchParams: URLSearchParams, schema: T) {
	const raw = Object.fromEntries(searchParams.entries());
	return schema.safeParse(raw);
}
