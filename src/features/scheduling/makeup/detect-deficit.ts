/**
 * features/scheduling/makeup/detect-deficit.ts
 *
 * S2 — Detecta equipos con menos partidos de los esperados en la fase regular.
 * Un equipo tiene déficit si su conteo de partidos jugados (no cancelados) es
 * menor que el target (regularMatchdays de la config).
 *
 * También calcula qué rivales específicos le faltan a cada equipo.
 */

import { db } from "@/db";
import { teams, matches, matchdays, leagueSchedulingConfig } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import type { TeamDeficit } from "../types";

export type DetectDeficitResult =
	| { ok: true; deficits: TeamDeficit[]; target: number }
	| { ok: false; error: string };

export async function detectDeficit(leagueId: string): Promise<DetectDeficitResult> {
	const [config, teamRows, regularMatchdays, matchRows] = await Promise.all([
		db.query.leagueSchedulingConfig.findFirst({
			where: eq(leagueSchedulingConfig.leagueId, leagueId),
			columns: { regularMatchdays: true },
		}),
		db.select({ id: teams.id }).from(teams).where(eq(teams.leagueId, leagueId)),
		db.query.matchdays.findMany({
			where: and(eq(matchdays.leagueId, leagueId), eq(matchdays.phase, "regular")),
			columns: { id: true },
		}),
		db.query.matches.findMany({
			where: and(eq(matches.leagueId, leagueId), ne(matches.status, "cancelled")),
			columns: { homeTeamId: true, awayTeamId: true, matchdayId: true },
		}),
	]);

	if (!config) return { ok: false, error: "La liga no tiene configuración de sorteo" };
	if (teamRows.length === 0) return { ok: true, deficits: [], target: config.regularMatchdays };

	const regularMatchdayIds = new Set(regularMatchdays.map((md) => md.id));

	// Solo contar partidos que pertenecen a jornadas regulares
	const regularMatches = matchRows.filter(
		(m) => m.matchdayId !== null && regularMatchdayIds.has(m.matchdayId),
	);

	const allTeamIds = teamRows.map((t) => t.id);
	const target = config.regularMatchdays;

	const deficits: TeamDeficit[] = [];

	for (const teamId of allTeamIds) {
		const played = countMatchesForTeam(regularMatches, teamId);
		if (played >= target) continue;

		const opponents = getPlayedOpponents(regularMatches, teamId);
		const missingOpponents = allTeamIds.filter((id) => id !== teamId && !opponents.has(id));

		deficits.push({ teamId, played, target, missingOpponents });
	}

	return { ok: true, deficits, target };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type MatchRow = { homeTeamId: string; awayTeamId: string; matchdayId: string | null };

function countMatchesForTeam(matchRows: MatchRow[], teamId: string): number {
	return matchRows.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId).length;
}

function getPlayedOpponents(matchRows: MatchRow[], teamId: string): Set<string> {
	const opponents = new Set<string>();
	for (const m of matchRows) {
		if (m.homeTeamId === teamId) opponents.add(m.awayTeamId);
		else if (m.awayTeamId === teamId) opponents.add(m.homeTeamId);
	}
	return opponents;
}
