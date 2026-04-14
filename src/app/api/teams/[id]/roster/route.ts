import { db, playerRegistrations, teams } from "@/db";
import { eq } from "drizzle-orm";
import { RegisterPlayerSchema, apiSuccess, apiError } from "@/types";

// GET /api/teams/:id/roster
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const team = await db.query.teams.findFirst({ where: eq(teams.id, id) });
  if (!team) return apiError("Equipo no encontrado", 404);

  const roster = await db.query.playerRegistrations.findMany({
    where: eq(playerRegistrations.teamId, id),
    with: { player: true },
    orderBy: (r, { asc }) => [asc(r.jerseyNumber)],
  });

  return apiSuccess({ team, roster });
}

// POST /api/teams/:id/roster — registrar jugador en el equipo
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const parsed = RegisterPlayerSchema.safeParse({ ...body, teamId: id });
  if (!parsed.success) return apiError(parsed.error.message);

  // Verificar que el equipo pertenezca a la liga indicada
  const team = await db.query.teams.findFirst({ where: eq(teams.id, id) });
  if (!team) return apiError("Equipo no encontrado", 404);
  if (team.leagueId !== parsed.data.leagueId)
    return apiError("El equipo no pertenece a esa liga", 400);

  try {
    const [registration] = await db
      .insert(playerRegistrations)
      .values({
        playerId: parsed.data.playerId,
        teamId: id,
        leagueId: parsed.data.leagueId,
        jerseyNumber: parsed.data.jerseyNumber ?? null,
      })
      .returning();

    return apiSuccess(registration, 201);
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error?.code === "23505") {
      return apiError("El jugador ya está registrado en otro equipo de esta liga", 409);
    }
    throw err;
  }
}
