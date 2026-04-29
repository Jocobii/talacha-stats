import { db, leagues }                from "@/db";
import { eq }                        from "drizzle-orm";
import { UpdateLeagueSchema, apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";

// GET /api/leagues/:id
// Cualquier usuario autenticado puede leer una liga.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  const { id } = await params;

  const league = await db.query.leagues.findFirst({
    where: eq(leagues.id, id),
    with: {
      organization: {
        columns: { id: true, name: true, slug: true, logoUrl: true },
        with: {
          members: { columns: { id: true, name: true, email: true } },
        },
      },
      teams: true,
      matches: {
        orderBy: (m, { desc }) => [desc(m.matchDate)],
        limit: 20,
        with: { homeTeam: true, awayTeam: true },
      },
    },
  });

  if (!league) return apiError("Liga no encontrada", 404);

  // Organizer solo puede ver ligas de su organización
  if (!canManageLeague(session, league.organizationId ?? null)) {
    return apiError("Sin permiso para ver esta liga", 403);
  }

  return apiSuccess(league);
}

// PATCH /api/leagues/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  const { id } = await params;

  const existing = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
  if (!existing) return apiError("Liga no encontrada", 404);
  if (!canManageLeague(session, existing.organizationId ?? null)) {
    return apiError("Sin permiso para editar esta liga", 403);
  }

  const body   = await request.json().catch(() => null);
  const parsed = UpdateLeagueSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const [updated] = await db
    .update(leagues)
    .set({
      ...(parsed.data.name      !== undefined && { name:      parsed.data.name }),
      ...(parsed.data.dayOfWeek !== undefined && { dayOfWeek: parsed.data.dayOfWeek }),
      ...(parsed.data.season    !== undefined && { season:    parsed.data.season }),
      ...(parsed.data.status    !== undefined && { status:    parsed.data.status }),
      // Solo el owner puede reasignar la organización de una liga
      ...(parsed.data.organizationId !== undefined && session.role === "owner" && {
        organizationId: parsed.data.organizationId,
      }),
    })
    .where(eq(leagues.id, id))
    .returning();

  return apiSuccess(updated);
}

// DELETE /api/leagues/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  const { id } = await params;

  const existing = await db.query.leagues.findFirst({ where: eq(leagues.id, id) });
  if (!existing) return apiError("Liga no encontrada", 404);
  if (!canManageLeague(session, existing.organizationId ?? null)) {
    return apiError("Sin permiso para eliminar esta liga", 403);
  }

  await db.delete(leagues).where(eq(leagues.id, id));
  return apiSuccess({ message: "Liga eliminada" });
}
