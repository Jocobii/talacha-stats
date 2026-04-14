import { db, matches } from "@/db";
import { eq } from "drizzle-orm";
import { UpdateMatchSchema, apiSuccess, apiError } from "@/types";

// GET /api/matches/:id
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, id),
    with: {
      homeTeam: true,
      awayTeam: true,
      league: true,
      events: {
        with: { player: true, team: true },
        orderBy: (e, { asc }) => [asc(e.minute), asc(e.createdAt)],
      },
    },
  });

  if (!match) return apiError("Partido no encontrado", 404);
  return apiSuccess(match);
}

// PATCH /api/matches/:id
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateMatchSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [updated] = await db
    .update(matches)
    .set({
      ...(parsed.data.homeScore !== undefined && { homeScore: parsed.data.homeScore }),
      ...(parsed.data.awayScore !== undefined && { awayScore: parsed.data.awayScore }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.matchDate !== undefined && { matchDate: parsed.data.matchDate }),
      ...(parsed.data.matchday !== undefined && { matchday: parsed.data.matchday }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    })
    .where(eq(matches.id, id))
    .returning();

  if (!updated) return apiError("Partido no encontrado", 404);
  return apiSuccess(updated);
}
