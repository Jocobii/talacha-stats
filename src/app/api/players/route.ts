import { db, players } from "@/db";
import { ilike, or, desc } from "drizzle-orm";
import { CreatePlayerSchema, apiSuccess, apiError } from "@/types";

// GET /api/players?q=nombre
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const rows = await db.query.players.findMany({
    orderBy: [desc(players.createdAt)],
    where: q
      ? or(
          ilike(players.fullName, `%${q}%`),
          ilike(players.alias, `%${q}%`)
        )
      : undefined,
    limit: 100,
  });

  return apiSuccess(rows);
}

// POST /api/players
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreatePlayerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [player] = await db
    .insert(players)
    .values({
      fullName: parsed.data.fullName,
      alias: parsed.data.alias ?? null,
      phone: parsed.data.phone ?? null,
      photoUrl: parsed.data.photoUrl ?? null,
    })
    .returning();

  return apiSuccess(player, 201);
}
