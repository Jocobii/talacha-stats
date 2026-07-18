/**
 * features/scheduling/overrides/swap-teams.ts
 *
 * Override S6 — sustituir un equipo en un partido por otro.
 * oldTeamId → newTeamId en la posición (home o away) que ocupe en ese partido.
 *
 * Restricciones:
 *   - El partido debe existir y pertenecer a la liga
 *   - El partido no puede estar "completed" ni "cancelled"
 *   - oldTeamId debe ser home o away del partido
 *   - newTeamId debe pertenecer a la liga
 *   - Si allowDuplicateMatchups=false: el nuevo par no puede ya existir
 *     en otra jornada regular de la liga (restricción S4)
 */

import { db } from "@/db";
import {
	matches,
	matchScheduleOverrides,
	teams,
	matchdays,
	leagueSchedulingConfig,
} from "@/db/schema";
import { eq, and, or, ne } from "drizzle-orm";
export type SwapTeamsArgs = {
	matchId: string;
	leagueId: string;
	changedBy: string | null;
	oldTeamId: string;
	newTeamId: string;
	reason?: string;
};

export type SwapTeamsResult =
	| { ok: true; matchId: string; position: "home" | "away" }
	| { ok: false; error: string };

export async function swapTeams(args: SwapTeamsArgs): Promise<SwapTeamsResult> {
	const [match, newTeamRow, config] = await Promise.all([
		db.query.matches.findFirst({
			where: eq(matches.id, args.matchId),
			columns: {
				id: true,
				leagueId: true,
				status: true,
				homeTeamId: true,
				awayTeamId: true,
				matchdayId: true,
			},
		}),
		// El equipo entrante debe estar 'active' — no se puede meter un equipo
		// de la banca ('pending') o disuelto en un partido ya calendarizado
		// (NUEVA-TEMPORADA-V2.md §3.2).
		db.query.teams.findFirst({
			where: and(
				eq(teams.id, args.newTeamId),
				eq(teams.leagueId, args.leagueId),
				eq(teams.status, "active"),
			),
			columns: { id: true },
		}),
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, args.leagueId),
			columns: { allowDuplicateMatchups: true },
		}),
	]);

	if (!match) return { ok: false, error: "Partido no encontrado" };
	if (match.leagueId !== args.leagueId)
		return { ok: false, error: "El partido no pertenece a esta liga" };
	if (match.status === "completed")
		return { ok: false, error: "No se puede modificar un partido ya completado" };
	if (match.status === "cancelled")
		return { ok: false, error: "No se puede modificar un partido cancelado" };
	if (!newTeamRow)
		return { ok: false, error: "El equipo nuevo no pertenece a esta liga o no está activo" };

	const position = resolvePosition(match.homeTeamId, match.awayTeamId, args.oldTeamId);
	if (!position) return { ok: false, error: "El equipo indicado no participa en este partido" };

	const opponent = position === "home" ? match.awayTeamId : match.homeTeamId;

	// S4: si no se permiten duplicados, verificar que el nuevo par no exista
	const allowDuplicates = config?.allowDuplicateMatchups ?? false;
	if (!allowDuplicates) {
		const duplicate = await findDuplicatePair(
			args.leagueId,
			args.matchId,
			args.newTeamId,
			opponent,
		);
		if (duplicate) {
			return {
				ok: false,
				error: `El par ${args.newTeamId} vs ${opponent} ya existe en otra jornada regular`,
			};
		}
	}

	const update =
		position === "home" ? { homeTeamId: args.newTeamId } : { awayTeamId: args.newTeamId };

	await db.transaction(async (tx) => {
		await tx.update(matches).set(update).where(eq(matches.id, args.matchId));

		await tx.insert(matchScheduleOverrides).values({
			matchId: args.matchId,
			changedBy: args.changedBy,
			changeType: "team_swap",
			previousValue: { oldTeamId: args.oldTeamId, position },
			newValue: { newTeamId: args.newTeamId, position },
			reason: args.reason ?? null,
		});
	});

	return { ok: true, matchId: args.matchId, position };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolvePosition(
	homeTeamId: string,
	awayTeamId: string,
	teamId: string,
): "home" | "away" | null {
	if (homeTeamId === teamId) return "home";
	if (awayTeamId === teamId) return "away";
	return null;
}

/**
 * Busca si el par (newTeamId, opponent) ya existe en algún partido regular
 * de la liga, excluyendo el partido actual.
 */
async function findDuplicatePair(
	leagueId: string,
	excludeMatchId: string,
	teamA: string,
	teamB: string,
): Promise<boolean> {
	// Traer todos los partidos regulares de la liga excepto el actual
	const regularMatchdays = await db.query.matchdays.findMany({
		where: and(eq(matchdays.leagueId, leagueId), eq(matchdays.phase, "regular")),
		columns: { id: true },
	});
	if (regularMatchdays.length === 0) return false;

	// Buscar en los partidos de esas jornadas si ya existe el par
	const existing = await db.query.matches.findFirst({
		where: and(
			eq(matches.leagueId, leagueId),
			ne(matches.id, excludeMatchId),
			or(
				and(eq(matches.homeTeamId, teamA), eq(matches.awayTeamId, teamB)),
				and(eq(matches.homeTeamId, teamB), eq(matches.awayTeamId, teamA)),
			),
		),
		columns: { id: true },
	});

	return existing !== undefined;
}
