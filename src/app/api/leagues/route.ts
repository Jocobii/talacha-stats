import { db, leagues } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateLeagueSchema, apiSuccess, apiError } from "@/types";
import { getActiveCity, getRequestCity } from "@/shared/lib/active-city";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { generateSlug } from "@/entities/organization";

// GET /api/leagues?city=Tijuana
// Sin sesión (público) → solo ligas activas de la ciudad
// owner              → todas las ligas de la ciudad
// organizer          → solo las ligas de su organización
export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	const city = await getRequestCity(request);

	if (!session) {
		const rows = await db.query.leagues.findMany({
			where: and(eq(leagues.city, city), eq(leagues.status, "active")),
			orderBy: [desc(leagues.createdAt)],
			with: {
				teams: true,
				organization: { columns: { status: true } },
			},
		});
		// Exclude leagues from trial organizations
		const verified = rows.filter(
			(l) => !l.organization || l.organization.status === "verified",
		);
		return apiSuccess(verified);
	}

	const rows = await db.query.leagues.findMany({
		where:
			session.role === "owner"
				? eq(leagues.city, city)
				: session.organizationId
					? eq(leagues.organizationId, session.organizationId)
					: and(eq(leagues.city, city), eq(leagues.status, "active")),
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

	const body = await request.json().catch(() => null);
	const parsed = CreateLeagueSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.message);

	const city = await getActiveCity();

	const organizationId =
		session.role === "owner" && parsed.data.organizationId
			? parsed.data.organizationId
			: (session.organizationId ?? null);

	// Auto-generar slug desde nombre + día si no viene explícito
	const slug = parsed.data.slug ?? generateSlug(`${parsed.data.name} ${parsed.data.dayOfWeek}`);

	const [league] = await db
		.insert(leagues)
		.values({
			name: parsed.data.name,
			slug,
			category: parsed.data.category ?? null,
			dayOfWeek: parsed.data.dayOfWeek,
			season: parsed.data.season,
			city,
			organizationId,
		})
		.returning();

	return apiSuccess(league, 201);
}
