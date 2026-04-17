import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * En serverless (Vercel) cada función puede instanciar su propio pool.
 * Usamos max:1 para no agotar las conexiones del pooler de Supabase.
 * En desarrollo conservamos el singleton para sobrevivir hot reloads.
 */
const globalForDb = global as unknown as { pool: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Serverless: una conexión por invocación es suficiente
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    // Evitar que conexiones idle bloqueen el shutdown de la función
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });

export * from "./schema";
