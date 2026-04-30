import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// .env.local tiene prioridad sobre .env (override: false = no sobreescribir si ya existe)
config({ path: ".env.local" });
config({ path: ".env" });

// ── Guard de seguridad ────────────────────────────────────────────────────────
// Impide correr migraciones o introspección contra la BD de producción
// desde una máquina de desarrollo.

const DATABASE_URL = String(process.env.DATABASE_URL!).trim();
const NODE_ENV = process.env.NODE_ENV ?? "development";

if (!DATABASE_URL) {
	throw new Error(
		"\n🚨 DATABASE_URL no está definida.\n" +
			"Crea un archivo .env.local con la connection string de tu BD local.\n",
	);
}

// Supabase usa dos dominios: *.supabase.co (directo) y *.supabase.com (pooler)
const PROD_PATTERNS = [/supabase\.co\b/, /supabase\.com\b/, /supabase\.io\b/];
const looksLikeProd = PROD_PATTERNS.some((p) => p.test(DATABASE_URL));

if (NODE_ENV !== "production" && looksLikeProd) {
	throw new Error(
		"\n\n" +
			"╔══════════════════════════════════════════════════════════╗\n" +
			"║  🚨  PELIGRO: MIGRACIONES CONTRA BD DE PRODUCCIÓN        ║\n" +
			"╚══════════════════════════════════════════════════════════╝\n\n" +
			"DATABASE_URL apunta a Supabase (producción).\n\n" +
			"Configurar .env.local con una BD local antes de correr migraciones:\n\n" +
			"  DATABASE_URL=postgresql://postgres:password@localhost:5432/talachastats_dev\n\n" +
			"Si realmente necesitas migrar producción, exporta NODE_ENV=production\n" +
			"explícitamente antes de correr el comando.\n",
	);
}

export default {
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: DATABASE_URL,
	},
} satisfies Config;
