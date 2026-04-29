import { db, leagues }                        from "@/db";
import { eq, desc, and }                      from "drizzle-orm";
import { CreateLeagueSchema, apiSuccess, apiError } from "@/types";
import { getActiveCity, getRequestCity }      from "@/shared/lib/active-city";
import { getSessionUserFromRequest }          from "@/shared/lib/auth";

// GET /api/leagues?city=Tijuana
// Sin sesión (público) → solo ligas activas de la ciudad
// owner              → todas las ligas de la ciudad
// organizer          → solo las ligas de su organización
export async function GET(request: Request) {
  const session = await getSessionUserFromRequest(request);
  const city    = await getRequestCity(request);

  if (!session) {
    // Acceso público: devolver solo ligas activas de la ciudad
    const rows = await db.query.leagues.findMany({
      where: and(eq(leagues.city, city), eq(leagues.status, "active")),
      orderBy: [desc(leagues.createdAt)],
      with: { teams: true },
    });
    return apiSuccess(rows);
  }

  const rows = await db.query.leagues.findMany({
    where: session.role === "owner"
      ? eq(leagues.city, city)
      : session.organizationId
        ? eq(leagues.organizationId, session.organizationId)
        : and(eq(leagues.city, city), eq(leagues.status, "active")), // sin org → vacío
    orderBy: [desc(leagues.createdAt)],
    with: {
      teams: true,
      organization: { columns: { id: true, name: true, slug: true } },
    },
  });

  return apiSuccess(rows);
}

// POST /api/leagues
export async function POST(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return apiError("No autenticado", 401);

  const body   = await request.json().catch(() => null);
  const parsed = CreateLeagueSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message);

  const city = await getActiveCity();

  // owner puede especificar cualquier org; organizer usa la suya automáticamente
  const organizationId =
    session.role === "owner" && parsed.data.organizationId
      ? parsed.data.organizationId
      : session.organizationId ?? null;

  const [league] = await db
    .insert(leagues)
    .values({
      name:           parsed.data.name,
      dayOfWeek:      parsed.data.dayOfWeek,
      season:         parsed.data.season,
      city,
      organizationId,
    })
    .returning();

  return apiSuccess(league, 201);
}
