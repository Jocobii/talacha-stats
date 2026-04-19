import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { config } from "dotenv";
import path from "path";

config({ path: ".env.local" });
config({ path: ".env" });

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url) {
	console.error("DATABASE_URL no definida");
	process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

console.log("Corriendo migraciones…");
migrate(db, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") })
	.then(() => {
		console.log("✅ Migraciones aplicadas");
		pool.end();
	})
	.catch((e) => {
		console.error("❌ Error:", e.message);
		pool.end();
		process.exit(1);
	});
