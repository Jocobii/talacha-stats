import { db, players } from "@/db";
import { ilike, or } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";

// GET /api/players/search?q=texto
// Búsqueda fuzzy para deduplicación en import de Excel
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) return apiError("Mínimo 2 caracteres", 400);

  // Normaliza el texto quitando acentos y convirtiendo a minúsculas
  const term = `%${q.toLowerCase()}%`;

  const rows = await db.query.players.findMany({
    where: or(
      ilike(players.fullName, term),
      ilike(players.alias, term)
    ),
    limit: 10,
  });

  return apiSuccess(rows);
}
