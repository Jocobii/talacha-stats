/**
 * features/scheduling/makeup/build-makeup-matches.ts
 *
 * S2 — Genera partidos de recuperación para equipos con déficit.
 *
 * Estrategia MVP:
 *   1. Detectar pares mutuos (A falta B y B falta A) → se crea UNA jornada makeup.
 *   2. Si un equipo falta otro pero el rival ya completó su conteo → se crea el
 *      partido de todas formas (el rival jugará extra, es válido en S2).
 *   3. Los partidos se insertan con isMakeup=true.
 *   4. Se crea una jornada "makeup" numerada después de la última jornada regular.
 *   5. La fecha de la jornada makeup = última jornada regular + 7 días.
 *
 * Devuelve los IDs de los partidos creados y el ID de la jornada makeup.
 */

import { db } from "@/db";
import { matchdays, matches, makeupMatches } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { detectDeficit } from "./detect-deficit";
import type { TeamDeficit } from "../types";

export type BuildMakeupInput = {
	leagueId: string;
	teamIds?: string[]; // si se provee, solo genera makeups para estos equipos
};

export type MakeupMatchRecord = {
	matchId: string;
	homeTeamId: string;
	awayTeamId: string;
	matchdayId: string;
};

export type BuildMakeupResult =
	| { ok: true; matchdayId: string; matches: MakeupMatchRecord[]; skipped: number }
	| { ok: false; error: string };

export async function buildMakeupMatches(input: BuildMakeupInput): Promise<BuildMakeupResult> {
	const deficitResult = await detectDeficit(input.leagueId);
	if (!deficitResult.ok) return { ok: false, error: deficitResult.error };

	const { deficits } = deficitResult;
	if (deficits.length === 0) return { ok: false, error: "No hay equipos con déficit de partidos" };

	// Filtrar si se especificaron equipos concretos
	const relevant = input.teamIds?.length
		? deficits.filter((d) => input.teamIds!.includes(d.teamId))
		: deficits;

	if (relevant.length === 0) {
		return { ok: false, error: "Los equipos indicados no tienen déficit de partidos" };
	}

	// Construir pares únicos a jugar
	const pairs = buildUniquePairs(relevant);
	if (pairs.length === 0) {
		return { ok: false, error: "No se encontraron pares válidos para generar makeups" };
	}

	// Obtener la última jornada regular para numerar y fechar la nueva
	const lastMatchday = await db.query.matchdays.findFirst({
		where: and(eq(matchdays.leagueId, input.leagueId), eq(matchdays.phase, "regular")),
		columns: { number: true, scheduledDate: true },
		orderBy: [desc(matchdays.number)],
	});

	const nextNumber = (lastMatchday?.number ?? 0) + 1;
	const nextDate = computeNextDate(lastMatchday?.scheduledDate ?? null);

	// Persistir en una transacción
	const created: MakeupMatchRecord[] = [];

	await db.transaction(async (tx) => {
		// 1. Crear jornada makeup
		const [insertedMatchday] = await tx
			.insert(matchdays)
			.values({
				leagueId: input.leagueId,
				number: nextNumber,
				phase: "regular",
				scheduledDate: nextDate,
				status: "draft",
				notes: "Jornada de recuperación (S2)",
			})
			.returning({ id: matchdays.id });

		if (!insertedMatchday) return;

		const matchdayId = insertedMatchday.id;

		// 2. Crear partidos makeup
		for (const [homeTeamId, awayTeamId] of pairs) {
			const [inserted] = await tx
				.insert(matches)
				.values({
					leagueId: input.leagueId,
					homeTeamId,
					awayTeamId,
					matchDate: nextDate,
					matchdayId,
					isMakeup: true,
					status: "scheduled",
				})
				.returning({ id: matches.id });

			if (!inserted) continue;

			// 3. Registrar en makeup_matches para ambos equipos con déficit
			const makeupEntries = buildMakeupEntries(inserted.id, homeTeamId, awayTeamId, deficits);
			if (makeupEntries.length > 0) {
				await tx.insert(makeupMatches).values(makeupEntries);
			}

			created.push({ matchId: inserted.id, homeTeamId, awayTeamId, matchdayId });
		}
	});

	return {
		ok: true,
		matchdayId: created[0]?.matchdayId ?? "",
		matches: created,
		skipped: pairs.length - created.length,
	};
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye pares únicos (homeTeamId, awayTeamId) a partir de los déficits.
 * Evita duplicar el mismo par en ambos sentidos.
 */
function buildUniquePairs(deficits: TeamDeficit[]): [string, string][] {
	const seen = new Set<string>();
	const pairs: [string, string][] = [];
	const deficitMap = new Map(deficits.map((d) => [d.teamId, d]));

	for (const deficit of deficits) {
		for (const opponentId of deficit.missingOpponents) {
			const key = [deficit.teamId, opponentId].sort().join("::");
			if (seen.has(key)) continue;
			seen.add(key);
			// Solo crear el par si al menos uno de los dos tiene déficit
			if (deficitMap.has(deficit.teamId) || deficitMap.has(opponentId)) {
				pairs.push([deficit.teamId, opponentId]);
			}
		}
	}

	return pairs;
}

/** Registros para makeup_matches: solo para los equipos que tenían déficit. */
function buildMakeupEntries(
	matchId: string,
	homeTeamId: string,
	awayTeamId: string,
	deficits: TeamDeficit[],
): { matchId: string; teamId: string; reason: string }[] {
	const deficitTeams = new Set(deficits.map((d) => d.teamId));
	const entries: { matchId: string; teamId: string; reason: string }[] = [];
	const reason = "Partido de recuperación generado automáticamente (S2)";

	if (deficitTeams.has(homeTeamId)) entries.push({ matchId, teamId: homeTeamId, reason });
	if (deficitTeams.has(awayTeamId)) entries.push({ matchId, teamId: awayTeamId, reason });

	return entries;
}

/** Calcula la fecha de la jornada makeup: última jornada + 7 días, o hoy + 7 si no hay. */
function computeNextDate(lastDate: string | null): string {
	const base = lastDate ? new Date(`${lastDate}T00:00`) : new Date();
	base.setDate(base.getDate() + 7);
	return base.toISOString().slice(0, 10);
}
