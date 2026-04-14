import { db, leagues } from "@/db";
import { eq } from "drizzle-orm";
import { UpdateLeagueSchema, apiSuccess, apiError } from "@/types";

// GET /api/leagues/:id
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const league = await db.query.leagues.findFirst({
    where: eq(leagues.id, id),
    with: {
      teams: true,
      matches: {
        orderBy: (m, { desc }) => [desc(m.matchDate)],
        limit: 20,
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
  });

  if (!league) return apiError("Liga no encontrada", 404);
  return apiSuccess(league);
}

// PATCH /api/leagues/:id
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateLeagueSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [updated] = await db
    .update(leagues)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.dayOfWeek !== undefined && { dayOfWeek: parsed.data.dayOfWeek }),
      ...(parsed.data.season !== undefined && { season: parsed.data.season }),
    })
    .where(eq(leagues.id, id))
    .returning();

  if (!updated) return apiError("Liga no encontrada", 404);
  return apiSuccess(updated);
}
