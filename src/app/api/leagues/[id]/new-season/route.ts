/**
 * POST /api/leagues/[id]/new-season
 *
 * Crea una nueva temporada de la liga clonando su configuración:
 *  ✓ Equipos (nombre, color) — sin jugadores ni registros
 *  ✓ Zonas de playoffs (Liguilla, Copa, etc.)
 *  ✓ Configuración de sorteo (jornadas, duración, buffer…)
 *  ✓ Canchas asignadas (leagueVenues + venueTimeWindows)
 *  ✗ Jornadas, partidos, estadísticas — tabla limpia
 *  ✗ Brackets de playoffs
 *
 * Al finalizar marca la liga actual como "finished".
 */
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
	leagues,
	teams,
	leaguePlayoffZones,
	leagueSchedulingConfig,
	leagueVenues,
	venueTimeWindows,
} from "@/db/schema";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { generateSlug } from "@/entities/organization";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import {
	generateLeagueCode,
	resolveUniqueCode,
} from "@/features/league-management/lib/generate-league-code";

const NewSeasonSchema = z.object({
	season: z.string().min(1, "La temporada no puede estar vacía").max(50),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(request);
	if (!session) return apiError("No autenticado", 401);

	const { id: sourceId } = await params;

	// ── Cargar liga origen ────────────────────────────────────────────────────
	const source = await db.query.leagues.findFirst({
		where: eq(leagues.id, sourceId),
		columns: {
			id: true,
			name: true,
			nameCanonical: true,
			category: true,
			dayOfWeek: true,
			city: true,
			organizationId: true,
			schedulingEnabled: true,
			code: true,
		},
	});
	if (!source) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, source.organizationId ?? null)) {
		return apiError("Sin permiso", 403);
	}

	// ── Validar input ─────────────────────────────────────────────────────────
	const body = await request.json().catch(() => null);
	const parsed = NewSeasonSchema.safeParse(body);
	if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

	const { season } = parsed.data;

	// ── Verificar slug único (proactivo) ──────────────────────────────────────
	const newSlug = generateSlug(`${source.name} ${source.dayOfWeek} ${season}`);
	if (source.organizationId) {
		const conflict = await db.query.leagues.findFirst({
			where: and(eq(leagues.organizationId, source.organizationId), eq(leagues.slug, newSlug)),
			columns: { id: true, season: true },
		});
		if (conflict) {
			return apiError(
				`Ya existe una temporada "${conflict.season}" de esta liga. Elige otro nombre.`,
				409,
			);
		}
	}

	// ── Generar código único para la nueva liga ───────────────────────────────
	const baseCode = generateLeagueCode(source.name);
	const existingCodes = source.organizationId
		? await db.query.leagues
				.findMany({
					where: eq(leagues.organizationId, source.organizationId),
					columns: { code: true },
				})
				.then((rows) => new Set(rows.map((r) => r.code).filter(Boolean) as string[]))
		: new Set<string>();
	const newCode = resolveUniqueCode(baseCode, existingCodes);

	// ── Cargar datos a copiar ─────────────────────────────────────────────────
	const [sourceTeams, sourceZones, sourceConfig, sourceVenues, sourceWindows] = await Promise.all([
		db.query.teams.findMany({
			where: eq(teams.leagueId, sourceId),
			columns: { name: true, nameCanonical: true, color: true },
		}),
		db.query.leaguePlayoffZones.findMany({
			where: eq(leaguePlayoffZones.leagueId, sourceId),
			columns: { name: true, fromPosition: true, toPosition: true, color: true, order: true },
		}),
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, sourceId),
			columns: {
				regularMatchdays: true,
				regularFormat: true,
				matchDurationMinutes: true,
				bufferMinutes: true,
				allowDuplicateMatchups: true,
				noRepeatWithin: true,
			},
		}),
		db.query.leagueVenues.findMany({
			where: eq(leagueVenues.leagueId, sourceId),
			columns: { venueId: true, priority: true },
		}),
		db.query.venueTimeWindows.findMany({
			where: eq(venueTimeWindows.leagueId, sourceId),
			columns: { venueId: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
		}),
	]);

	// ── Transacción: crear todo o nada ────────────────────────────────────────
	const newLeague = await db.transaction(async (tx) => {
		// 1. Nueva liga
		const [created] = await tx
			.insert(leagues)
			.values({
				name: source.name,
				nameCanonical: source.nameCanonical ?? sanitizeToCanonical(source.name),
				slug: newSlug,
				category: source.category ?? null,
				dayOfWeek: source.dayOfWeek,
				season,
				city: source.city,
				organizationId: source.organizationId ?? null,
				schedulingEnabled: source.schedulingEnabled,
				code: newCode,
			})
			.returning();

		const newId = created.id;

		// 2. Equipos
		if (sourceTeams.length > 0) {
			await tx.insert(teams).values(
				sourceTeams.map((t) => ({
					name: t.name,
					nameCanonical: t.nameCanonical,
					color: t.color,
					leagueId: newId,
				})),
			);
		}

		// 3. Zonas de playoffs (si no hay, crear la zona por defecto)
		if (sourceZones.length > 0) {
			await tx.insert(leaguePlayoffZones).values(
				sourceZones.map((z) => ({
					leagueId: newId,
					name: z.name,
					fromPosition: z.fromPosition,
					toPosition: z.toPosition,
					color: z.color,
					order: z.order,
				})),
			);
		} else {
			await tx.insert(leaguePlayoffZones).values({
				leagueId: newId,
				name: "Liguilla",
				fromPosition: 1,
				toPosition: 8,
				color: "green",
				order: 0,
			});
		}

		// 4. Configuración de sorteo
		if (sourceConfig) {
			await tx.insert(leagueSchedulingConfig).values({
				leagueId: newId,
				regularMatchdays: sourceConfig.regularMatchdays,
				regularFormat: sourceConfig.regularFormat,
				matchDurationMinutes: sourceConfig.matchDurationMinutes,
				bufferMinutes: sourceConfig.bufferMinutes,
				allowDuplicateMatchups: sourceConfig.allowDuplicateMatchups,
				noRepeatWithin: sourceConfig.noRepeatWithin,
			});
		}

		// 5. Canchas asignadas
		if (sourceVenues.length > 0) {
			await tx.insert(leagueVenues).values(
				sourceVenues.map((v) => ({
					leagueId: newId,
					venueId: v.venueId,
					priority: v.priority,
				})),
			);
		}

		// 6. Ventanas horarias de canchas
		if (sourceWindows.length > 0) {
			await tx.insert(venueTimeWindows).values(
				sourceWindows.map((w) => ({
					leagueId: newId,
					venueId: w.venueId,
					dayOfWeek: w.dayOfWeek,
					startTime: w.startTime,
					endTime: w.endTime,
					isActive: w.isActive,
				})),
			);
		}

		// 7. Marcar liga origen como terminada
		await tx.update(leagues).set({ status: "finished" }).where(eq(leagues.id, sourceId));

		return created;
	});

	return apiSuccess(
		{
			id: newLeague.id,
			name: newLeague.name,
			season: newLeague.season,
			copied: {
				teams: sourceTeams.length,
				zones: sourceZones.length,
				venues: sourceVenues.length,
				hasSchedulingConfig: !!sourceConfig,
			},
		},
		201,
	);
}
