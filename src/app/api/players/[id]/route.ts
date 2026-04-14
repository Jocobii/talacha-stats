import { db, players } from "@/db";
import { eq } from "drizzle-orm";
import { UpdatePlayerSchema, apiSuccess, apiError } from "@/types";
import { getPlayerGlobalStats } from "@/lib/stats";

// GET /api/players/:id
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await db.query.players.findFirst({
    where: eq(players.id, id),
    with: {
      registrations: {
        with: { league: true, team: true },
      },
    },
  });

  if (!player) return apiError("Jugador no encontrado", 404);

  const globalStats = await getPlayerGlobalStats(id);

  return apiSuccess({ ...player, globalStats });
}

// PATCH /api/players/:id
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdatePlayerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [updated] = await db
    .update(players)
    .set({
      ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
      ...(parsed.data.alias !== undefined && { alias: parsed.data.alias }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.photoUrl !== undefined && { photoUrl: parsed.data.photoUrl }),
    })
    .where(eq(players.id, id))
    .returning();

  if (!updated) return apiError("Jugador no encontrado", 404);
  return apiSuccess(updated);
}

// DELETE /api/players/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(players).where(eq(players.id, id)).returning();
  if (!deleted) return apiError("Jugador no encontrado", 404);
  return apiSuccess({ deleted: true });
}
