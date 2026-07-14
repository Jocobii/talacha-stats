import { db, leagues, leaguePlayoffZones } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { CreateLeagueSchema, apiSuccess, apiError } from "@/types";
import { getActiveCity, getRequestCity } from "@/shared/lib/active-city";
import { getSessionUserFromRequest } from "@/shared/lib/auth";
import { generateSlug } from "@/entities/organization";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { parseQueryParams } from "@/shared/lib/query-filters";
import {
	generateLeagueCode,
	resolveUniqueCode,
} from "@/features/league-management/lib/generate-league-code";
import { seedLeagueConfig } from "@/features/tournament-rules/seed-league-config";

const LeagueFiltersSchema = z.object({
	status: z.enum(["active", "finished"]).optional(),
});

// GET /api/leagues?city=Tijuana[&status=active|finished]
// Sin sesion (publico) -> solo ligas activas de la ciudad
// owner/organizer     -> respeta el parametro ?status (sin el devuelve activas)
export async function GET(request: Request) {
	const session = await getSessionUserFromRequest(request);
	const city = await getRequestCity(request);
	const { searchParams } = new URL(request.url);

	// ?status solo se respeta en sesiones autenticadas; sin sesion siempre "active"
	const filters = parseQueryParams(searchParams, LeagueFiltersSchema);
	const statusFilter =
		session && filters.success && filters.data.status ? filters.data.status : "active";

	if (!session) {
		const rows = await db.query.leagues.findMany({
			where: and(eq(leagues.city, city), eq(leagues.status, "active")),
			orderBy: [desc(leagues.createdAt)],
			with: {
				teams: true,
				organization: { columns: { status: true } },
			},
		});
		// Excluir ligas de organizaciones en periodo de prueba
		const verified = rows.filter((l) => !l.organization || l.organization.status === "verified");
		return apiSuccess(verified);
	}

	const scopeCondition =
		session.role === "owner"
			? eq(leagues.city, city)
			: session.organizationId
				? eq(leagues.organizationId, session.organizationId)
				: eq(leagues.city, city);

	const rows = await db.query.leagues.findMany({
		where: and(scopeCondition, eq(leagues.status, statusFilter)),
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

	// Slug unico por temporada: "comics-domingo-2026"
	// Incluir la temporada evita colisiones al crear una nueva temporada de la misma liga.
	const slug =
		parsed.data.slug ??
		generateSlug(`${parsed.data.name} ${parsed.data.dayOfWeek} ${parsed.data.season}`);

	// Verificacion proactiva de slug duplicado (Regla CLAUDE.md: nunca confiar solo en el constraint)
	if (organizationId) {
		const existing = await db.query.leagues.findFirst({
			where: and(eq(leagues.organizationId, organizationId), eq(leagues.slug, slug)),
			columns: { id: true, name: true, season: true },
		});
		if (existing) {
			return apiError(
				`Ya existe una liga "${existing.name}" (${existing.season}) con ese nombre y dia en esta organizacion.`,
				409,
			);
		}
	}

	// Auto-generar codigo de liga para prefijo de cedula
	const baseCode = generateLeagueCode(parsed.data.name);
	const existingRows = organizationId
		? await db.query.leagues.findMany({
				where: eq(leagues.organizationId, organizationId),
				columns: { code: true },
			})
		: [];
	const existingCodes = new Set(existingRows.map((r) => r.code).filter(Boolean) as string[]);
	const code = resolveUniqueCode(baseCode, existingCodes);

	const league = await db.transaction(async (tx) => {
		const [created] = await tx
			.insert(leagues)
			.values({
				name: parsed.data.name,
				nameCanonical: sanitizeToCanonical(parsed.data.name),
				slug,
				category: parsed.data.category ?? null,
				dayOfWeek: parsed.data.dayOfWeek,
				season: parsed.data.season,
				city,
				organizationId,
				code,
			})
			.returning();

		// Zona por default: Liguilla del 1 al 8
		await tx.insert(leaguePlayoffZones).values({
			leagueId: created.id,
			name: "Liguilla",
			fromPosition: 1,
			toPosition: 8,
			color: "green",
			order: 0,
		});

		// Reglamento: copia el default de la organización si existe (§4.5
		// docs/MODULOS-GESTION-LIGA.md); no-op si no hay uno configurado.
		await seedLeagueConfig(tx, created.id, organizationId);

		return created;
	});

	return apiSuccess(league, 201);
}
