/**
 * POST /api/leagues/[id]/playoffs/start
 *
 * Genera todos los brackets de eliminación para una liga de golpe:
 *  1. Crea un matchday de "Fase Final" (number=0, phase=playoff).
 *  2. Por cada zona con ≥ 2 equipos clasificados: crea bracket + slots.
 *  3. Para los slots de R1 no-bye (donde ambos equipos son conocidos) crea
 *     un match record real vinculado al playoff matchday.
 *  4. Es idempotente — devuelve 409 si ya existe un bracket para esta liga.
 */

import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/types";
import { getSessionUserFromRequest, canManageLeague } from "@/shared/lib/auth";
import { db } from "@/db";
import {
	leagues,
	leaguePlayoffZones,
	playoffBrackets,
	playoffSlots,
	matchdays,
	matches,
} from "@/db/schema";
import { getLatestStandings } from "@/entities/organization";
import { generateBracket } from "@/features/playoffs/lib/bracket-generator";
import type { BracketTeam } from "@/features/playoffs/lib/bracket-generator";

type Params = { params: Promise<{ id: string }> };

// Sentinel number for the playoff matchday — regular jornadas start at 1
const PLAYOFF_MATCHDAY_NUMBER = 0;

export async function POST(_request: Request, { params }: Params) {
	const session = await getSessionUserFromRequest(_request);
	if (!session) return apiError("No autenticado", 401);

	const { id: leagueId } = await params;

	// Auth check
	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, leagueId),
		with: { organization: { columns: { id: true } } },
		columns: { id: true },
	});
	if (!league) return apiError("Liga no encontrada", 404);
	if (!canManageLeague(session, league.organization?.id ?? null)) {
		return apiError("Sin permiso", 403);
	}

	// Idempotency check
	const existing = await db.query.playoffBrackets.findFirst({
		where: eq(playoffBrackets.leagueId, leagueId),
		columns: { id: true },
	});
	if (existing) return apiError("La fase final ya fue iniciada para esta liga.", 409);

	// Load zones
	const zones = await db.query.leaguePlayoffZones.findMany({
		where: eq(leaguePlayoffZones.leagueId, leagueId),
		orderBy: (z, { asc: a }) => [a(z.fromPosition)],
	});
	if (zones.length === 0) return apiError("No hay zonas de clasificación configuradas.", 400);

	// Load current standings
	const { standings } = await getLatestStandings(leagueId);
	if (standings.length === 0) return apiError("No hay posiciones disponibles.", 400);

	// Build seeded teams per zone
	type ZoneTeams = { zone: (typeof zones)[number]; teams: BracketTeam[] };
	const zoneTeams: ZoneTeams[] = zones.map((zone) => {
		const teams: BracketTeam[] = [];
		for (let pos = zone.fromPosition; pos <= zone.toPosition; pos++) {
			const row = standings[pos - 1];
			if (!row) break;
			teams.push({ id: row.team.id, name: row.team.name, seed: pos - zone.fromPosition + 1 });
		}
		return { zone, teams };
	});

	const activeZones = zoneTeams.filter((zt) => zt.teams.length >= 2);
	if (activeZones.length === 0) {
		return apiError("Ninguna zona tiene suficientes equipos para iniciar la fase final.", 400);
	}

	// Today's date in YYYY-MM-DD
	const today = new Date().toISOString().slice(0, 10);

	const playoffMatchdayId = await db.transaction(async (tx) => {
		// ── 1. Playoff matchday (one per league) ───────────────────────────────
		const [matchday] = await tx
			.insert(matchdays)
			.values({
				leagueId,
				number: PLAYOFF_MATCHDAY_NUMBER,
				phase: "playoff",
				scheduledDate: today,
				status: "published",
			})
			.returning({ id: matchdays.id });

		// ── 2. Brackets + slots + R1 matches ──────────────────────────────────
		for (const { zone, teams } of activeZones) {
			const [bracket] = await tx
				.insert(playoffBrackets)
				.values({
					leagueId,
					zoneId: zone.id,
					zoneName: zone.name,
					zoneColor: zone.color,
					status: "active",
				})
				.returning({ id: playoffBrackets.id });

			const bracketId = bracket.id;
			const specs = generateBracket(teams);

			// Insert slots, track key→id for self-ref wiring
			type InsertedSlot = {
				id: string;
				key: string;
				round: number;
				homeTeamId: string | null;
				awayTeamId: string | null;
				isBye: boolean;
			};
			const inserted: InsertedSlot[] = [];

			for (const spec of specs) {
				const [slot] = await tx
					.insert(playoffSlots)
					.values({
						bracketId,
						round: spec.round,
						slotIndex: spec.slotIndex,
						isThirdPlace: spec.isThirdPlace,
						isBye: spec.isBye,
						homeTeamId: spec.homeTeamId,
						awayTeamId: spec.awayTeamId,
						homeFromSlotId: null,
						homeFromType: spec.homeFromType,
						awayFromSlotId: null,
						awayFromType: spec.awayFromType,
					})
					.returning({ id: playoffSlots.id });

				inserted.push({
					id: slot.id,
					key: `R${spec.round}S${spec.slotIndex}`,
					round: spec.round,
					homeTeamId: spec.homeTeamId,
					awayTeamId: spec.awayTeamId,
					isBye: spec.isBye,
				});
			}

			// Wire self-referential FKs
			const keyToId = new Map(inserted.map((s) => [s.key, s.id]));
			for (let i = 0; i < specs.length; i++) {
				const spec = specs[i];
				const slotId = inserted[i].id;
				const homeFromSlotId = spec.homeFromSlotKey
					? (keyToId.get(spec.homeFromSlotKey) ?? null)
					: null;
				const awayFromSlotId = spec.awayFromSlotKey
					? (keyToId.get(spec.awayFromSlotKey) ?? null)
					: null;
				if (homeFromSlotId !== null || awayFromSlotId !== null) {
					await tx
						.update(playoffSlots)
						.set({ homeFromSlotId, awayFromSlotId })
						.where(eq(playoffSlots.id, slotId));
				}
			}

			// Create match records for R1 non-bye slots (both teams known)
			for (const s of inserted) {
				if (s.round === 1 && !s.isBye && s.homeTeamId && s.awayTeamId) {
					const [match] = await tx
						.insert(matches)
						.values({
							leagueId,
							matchdayId: matchday.id,
							homeTeamId: s.homeTeamId,
							awayTeamId: s.awayTeamId,
							matchDate: today,
							status: "scheduled",
						})
						.returning({ id: matches.id });

					await tx.update(playoffSlots).set({ matchId: match.id }).where(eq(playoffSlots.id, s.id));
				}
			}
		}

		return matchday.id;
	});

	return apiSuccess({ started: activeZones.length, matchdayId: playoffMatchdayId }, 201);
}
