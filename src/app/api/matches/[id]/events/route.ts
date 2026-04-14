import { db, matchEvents, matches } from "@/db";
import { eq } from "drizzle-orm";
import { CreateMatchEventSchema, apiSuccess, apiError } from "@/types";

// GET /api/matches/:id/events
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const events = await db.query.matchEvents.findMany({
    where: eq(matchEvents.matchId, id),
    with: { player: true, team: true },
    orderBy: (e, { asc }) => [asc(e.minute), asc(e.createdAt)],
  });

  return apiSuccess(events);
}

// POST /api/matches/:id/events
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = CreateMatchEventSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const match = await db.query.matches.findFirst({ where: eq(matches.id, id) });
  if (!match) return apiError("Partido no encontrado", 404);
  if (match.status === "cancelled") return apiError("No se pueden agregar eventos a un partido cancelado", 400);

  const [event] = await db
    .insert(matchEvents)
    .values({
      matchId: id,
      playerId: parsed.data.playerId,
      teamId: parsed.data.teamId,
      eventType: parsed.data.eventType,
      minute: parsed.data.minute ?? null,
    })
    .returning();

  return apiSuccess(event, 201);
}
