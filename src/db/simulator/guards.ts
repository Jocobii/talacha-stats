/**
 * src/db/simulator/guards.ts
 *
 * Guardas de seguridad del Organization Simulator — ver
 * docs/ORGANIZATION-SIMULATOR.md §9 (Épica A4).
 *
 * Mismo patrón que src/db/seed.ts: el simulador puede escribir volúmenes
 * grandes de datos sintéticos, así que aborta duro si detecta que
 * DATABASE_URL apunta a producción (Supabase). No es una guarda "sugerida":
 * lanza y detiene la ejecución antes de tocar la base.
 */

const PROD_HOST_PATTERNS: RegExp[] = [/supabase\.co\b/, /supabase\.com\b/, /supabase\.io\b/];

export class ProductionGuardError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ProductionGuardError";
	}
}

/** Enmascara la contraseña en una connection string para logs seguros. */
export function redactConnectionString(url: string): string {
	return url.replace(/:[^:@]+@/, ":***@");
}

/**
 * Lanza `ProductionGuardError` si `databaseUrl` está vacía o parece apuntar
 * a un host de producción (Supabase). Debe llamarse antes de abrir
 * cualquier conexión o transacción del simulador.
 */
export function assertNotProductionDatabase(databaseUrl: string): void {
	const url = (databaseUrl ?? "").trim();

	if (!url) {
		throw new ProductionGuardError(
			"DATABASE_URL no definida — el Organization Simulator no puede correr.",
		);
	}

	if (PROD_HOST_PATTERNS.some((pattern) => pattern.test(url))) {
		throw new ProductionGuardError(
			`DATABASE_URL parece producción (${redactConnectionString(url)}). ` +
				"El Organization Simulator solo corre contra Postgres local.",
		);
	}
}

/**
 * Guarda adicional: evita corridas del simulador con parámetros que
 * excedan lo razonable para dev (protección ante errores de tipeo en un
 * script/CLI, no una validación exhaustiva — esa vive en los schemas Zod
 * de la Épica E).
 */
export function assertReasonableVolume(params: { orgs: number; leaguesPerOrg: number }): void {
	const MAX_ORGS = 20;
	const MAX_LEAGUES_PER_ORG = 30;

	if (params.orgs > MAX_ORGS) {
		throw new ProductionGuardError(
			`Organization Simulator: ${params.orgs} orgs excede el máximo razonable de dev (${MAX_ORGS}).`,
		);
	}
	if (params.leaguesPerOrg > MAX_LEAGUES_PER_ORG) {
		throw new ProductionGuardError(
			`Organization Simulator: ${params.leaguesPerOrg} ligas/org excede el máximo razonable de dev (${MAX_LEAGUES_PER_ORG}).`,
		);
	}
}
