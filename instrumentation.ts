/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Este archivo corre una sola vez al arrancar el servidor (dev y prod).
 * Lo usamos para validar el entorno antes de que cualquier request llegue.
 */
export async function register() {
  // Excluir solo el Edge runtime (Workers/Middleware) donde Node APIs no existen.
  // En next dev, NEXT_RUNTIME puede estar undefined durante este hook — eso está bien,
  // la condición correcta es descartar "edge", no requerir "nodejs".
  if (process.env.NEXT_RUNTIME !== "edge") {
    // Importar env dispara la validación Zod. Segunda capa de protección:
    // el guard primario está en next.config.ts (corre antes que todo).
    await import("./src/shared/env");
  }
}
