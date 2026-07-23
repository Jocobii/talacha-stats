import { z } from "zod";

// ── Patrones que identifican una URL de base de datos de producción ────────────
// Si DATABASE_URL contiene alguno de estos, es una BD real y no debe usarse en dev.
// Supabase usa dos dominios distintos:
//   *.supabase.co  → conexión directa (puerto 5432)
//   *.supabase.com → pooler (puerto 6543)
const PROD_DB_PATTERNS: RegExp[] = [/supabase\.co\b/, /supabase\.com\b/, /supabase\.io\b/];

function looksLikeProdDatabase(url: string): boolean {
	return PROD_DB_PATTERNS.some((pattern) => pattern.test(url));
}

/** Oculta la contraseña de una connection string para logs seguros. */
function redactUrl(url: string): string {
	try {
		const parsed = new URL(url);
		parsed.password = "***";
		return parsed.toString();
	} catch {
		return url.replace(/:[^:@]+@/, ":***@");
	}
}

// ── Schema de variables de entorno críticas ───────────────────────────────────

const EnvSchema = z.object({
	DATABASE_URL: z
		.string({ error: "DATABASE_URL es requerida" })
		.min(1, "DATABASE_URL no puede estar vacía")
		.refine((v) => v.startsWith("postgres"), {
			message:
				"DATABASE_URL debe ser una connection string de PostgreSQL (empieza con postgres://)",
		}),

	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

	NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL debe ser una URL válida").optional(),

	ADMIN_PASSWORD: z
		.string({ error: "ADMIN_PASSWORD es requerida" })
		.min(8, "ADMIN_PASSWORD debe tener al menos 8 caracteres"),

	ADMIN_SESSION_TOKEN: z
		.string({ error: "ADMIN_SESSION_TOKEN es requerida" })
		.min(16, "ADMIN_SESSION_TOKEN debe tener al menos 16 caracteres"),

	SETUP_SECRET: z.string().optional(),

	SESSION_SECRET: z
		.string()
		.min(32, "SESSION_SECRET debe tener al menos 32 caracteres")
		.optional(), // sin ella, session.ts usa un valor de desarrollo (inseguro en prod)

	// Email transaccional via Resend
	RESEND_API_KEY: z.string().optional(), // requerida en produccion
	EMAIL_DOMAIN: z.string().optional(), // ej: "talachastats.com" — deriva support@, hello@, etc.
	EMAIL_FROM: z.string().optional(), // legacy: remitente unico "TalachaStats <noreply@...>"

	// Multi-tenant / subdominios
	NEXT_PUBLIC_ROOT_DOMAIN: z.string().optional(), // fallback: "talachastats.com" — ver shared/tenant/host.ts

	// Feature flags
	FEATURE_CROSS_ORG_SUGGESTIONS: z.string().optional(), // "true" activa L4 cross-org — ver shared/config/flags.ts
});

export type Env = z.infer<typeof EnvSchema>;

// ── Validación y guard ────────────────────────────────────────────────────────

function fail(msg: string): never {
	// process.exit en lugar de throw: evita que Next.js envuelva el mensaje
	// con su propio stack trace y lo haga ilegible.
	console.error(msg);
	process.exit(1);
}

function validateEnv(): Env {
	const parsed = EnvSchema.safeParse(process.env);
	console.log("🔍 Validando configuración de entorno...");
	// 1. Fallar si faltan variables o tienen formato incorrecto
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((i) => `  • ${i.path.join(".") || "(raíz)"}: ${i.message}`)
			.join("\n");

		fail(
			`\n\n` +
				`╔══════════════════════════════════════════════════════════╗\n` +
				`║  🚨  CONFIGURACIÓN DE ENTORNO INVÁLIDA                   ║\n` +
				`╚══════════════════════════════════════════════════════════╝\n\n` +
				`Variables faltantes o incorrectas:\n${issues}\n\n` +
				`Crea un archivo .env.local con los valores correctos.\n` +
				`Revisa .env.local.example para ver qué se necesita.\n`,
		);
	}

	const { DATABASE_URL, NODE_ENV } = parsed.data;

	// 2. BLOQUEO DURO: No permitir BD de producción en desarrollo
	if (NODE_ENV === "development" && looksLikeProdDatabase(DATABASE_URL)) {
		fail(
			`\n\n` +
				`╔══════════════════════════════════════════════════════════╗\n` +
				`║  🚨  PELIGRO: BASE DE DATOS DE PRODUCCIÓN EN DEV         ║\n` +
				`╚══════════════════════════════════════════════════════════╝\n\n` +
				`DATABASE_URL apunta a: ${redactUrl(DATABASE_URL)}\n\n` +
				`Esta URL parece ser la base de datos de PRODUCCIÓN (Supabase).\n` +
				`Usar la BD de producción en desarrollo puede corromper datos reales.\n\n` +
				`✅  Solución: crea .env.local con una BD local:\n\n` +
				`    DATABASE_URL=postgresql://postgres:password@localhost:5432/talachastats_dev\n\n` +
				`El servidor NO arrancará hasta que esto esté corregido.\n`,
		);
	}

	return parsed.data;
}

// Se ejecuta una sola vez al importar el modulo.
export const env = validateEnv();
