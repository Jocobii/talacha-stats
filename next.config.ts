import type { NextConfig } from "next";
import { config as loadDotenv } from "dotenv";
import { existsSync } from "fs";

// ── Cargar .env.local antes de validar ────────────────────────────────────────
// Next.js ya hace esto internamente, pero next.config.ts corre ANTES que ese
// mecanismo, así que necesitamos cargarlo a mano aquí.
if (existsSync(".env.local")) loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

// ── Guard de entorno ──────────────────────────────────────────────────────────
// Este bloque corre ANTES de que Next.js haga cualquier cosa.
// Si lanza un error, el proceso muere aquí — no hay forma de que el servidor arranque.

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV ?? "development";

// Supabase usa dos dominios:
//   *.supabase.co  → conexión directa (puerto 5432)
//   *.supabase.com → pooler de Vercel (puerto 6543)
const PROD_DB_PATTERNS = [/supabase\.co\b/, /supabase\.com\b/, /supabase\.io\b/];

function guardFail(msg: string): never {
	// process.exit no puede ser capturado por nadie — más seguro que throw.
	console.error(msg);
	process.exit(1);
}

if (!DATABASE_URL) {
	guardFail(
		"\n\n" +
			"╔══════════════════════════════════════════════════════════╗\n" +
			"║  🚨  DATABASE_URL no está definida                       ║\n" +
			"╚══════════════════════════════════════════════════════════╝\n\n" +
			"Crea un archivo .env.local con tu base de datos local:\n\n" +
			"  DATABASE_URL=postgresql://postgres:password@localhost:5432/talachastats_dev\n\n" +
			"Revisa .env.local.example para más opciones.\n",
	);
}

if (NODE_ENV !== "production" && PROD_DB_PATTERNS.some((p) => p.test(DATABASE_URL))) {
	guardFail(
		"\n\n" +
			"╔══════════════════════════════════════════════════════════╗\n" +
			"║  🚨  PELIGRO: BASE DE DATOS DE PRODUCCIÓN EN DEV         ║\n" +
			"╚══════════════════════════════════════════════════════════╝\n\n" +
			"DATABASE_URL apunta a Supabase (producción).\n" +
			"Usar la BD de producción en desarrollo puede corromper datos reales.\n\n" +
			"✅  Crea .env.local con una BD local:\n\n" +
			"  DATABASE_URL=postgresql://postgres:password@localhost:5432/talachastats_dev\n\n" +
			"Si necesitas conectarte a producción, usa TablePlus/psql directamente.\n\n" +
			"El servidor NO arrancará hasta que esto esté corregido.\n",
	);
}

// ── Cabeceras HTTP de seguridad ───────────────────────────────────────────────
// Ver SECURITY_RULES.md §6 — no eliminar ni debilitar estos valores.

const SECURITY_HEADERS = [
	{
		// Desactiva el prefetch de DNS para evitar filtración de recursos internos.
		key: "X-DNS-Prefetch-Control",
		value: "off",
	},
	{
		// Fuerza HTTPS por 2 años en el dominio y subdominios.
		// Solo efectivo en producción (los navegadores ignoran HSTS en HTTP).
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{
		// Bloquea que la app sea embebida en un <iframe> — previene clickjacking.
		key: "X-Frame-Options",
		value: "DENY",
	},
	{
		// Bloquea el "MIME sniffing": el navegador respeta el Content-Type declarado.
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		// En cross-origin solo envía el origen (sin path ni query string).
		// En same-origin envía la URL completa.
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
];

// ── Configuración de Next.js ──────────────────────────────────────────────────

const nextConfig: NextConfig = {
	serverExternalPackages: ["pdfkit"],

	async headers() {
		return [
			{
				// Aplica a todas las rutas del proyecto.
				source: "/(.*)",
				headers: SECURITY_HEADERS,
			},
		];
	},
};

export default nextConfig;
