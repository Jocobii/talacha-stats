/**
 * features/post-import-content/pills.ts
 *
 * Genera píldoras narrativas después de una importación de jornada.
 * Una píldora = un dato curioso / highlight listo para copiar y pegar
 * en WhatsApp, o para renderizar en la imagen de jornada.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P6/D2): antes leía
 * `player_season_stats_snapshot`/`team_standings_snapshot` (V1, snapshots por
 * jornada del import de Excel — nunca escritos por ninguna liga 100% en-app).
 * Ahora todo se calcula en memoria a partir de `matches` + `match_player_stats`
 * (V2): se trae una sola vez todos los partidos contados de la liga
 * (`matchdayNumber` vía `matches.matchdayId → matchdays.number`) y sus stats de
 * jugador, y se recalculan los totales "hasta la jornada N" y "hasta N-1" —
 * el mismo patrón que ya usa `db/simulator/contributors/aggregates.ts` para
 * poblar los snapshots V1 (aquí solo se lee, nunca se escribe).
 *
 * Sin backfill (D1): una liga cuyo único historial vive en Excel no tiene
 * partidos en `matches`/`match_player_stats` y simplemente no genera píldoras
 * (mismo resultado que antes si esa liga nunca tuvo snapshot).
 *
 * Fuentes de datos:
 *   - matches + matchdays        → partidos contados por jornada
 *   - match_player_stats         → goles/asistencias por jugador y partido
 *   - league_playoff_zones       → zonas de clasificación (reemplaza el enum
 *                                  fijo `zone` de team_standings_snapshot)
 *
 * Reglas de diseño:
 *   - Función pura con respecto a efectos secundarios (solo lee de DB)
 *   - Sin dependencias de features/ hermanas
 *   - Devuelve datos, nunca JSX
 */

import { and, eq, inArray } from "drizzle-orm";
import {
	db,
	matches,
	matchdays,
	matchPlayerStats,
	inscriptions,
	leagueMembers,
	globalPlayers,
	teams,
	leaguePlayoffZones,
} from "@/db";
import { COUNTED_MATCH_STATUSES } from "@/entities/player/live-stats";
import { titleCase } from "@/shared/lib/normalize";
import { findZone, type ZoneInfo } from "@/shared/lib/zone-colors";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type PillType =
	| "hat_trick" // jugador anotó 3+ goles en la jornada
	| "scoring_streak" // jugador lleva N jornadas consecutivas anotando
	| "top_scorer" // líder de goleo al corte de esta jornada
	| "first_scorer" // jugador que abrió su cuenta goleadora
	| "comeback_scorer" // jugador que no había anotado en 2+ jornadas y volvió
	| "unbeaten_streak" // equipo lleva N jornadas sin perder
	| "leader" // equipo líder de tabla
	| "zone_change" // equipo entró o salió de una zona (liguilla/copa)
	| "top_assist"; // líder de asistencias

export type JornadaPill = {
	type: PillType;
	headline: string; // texto principal — máx ~60 chars
	detail: string; // dato de soporte — máx ~80 chars
	priority: number; // 1 = más importante, mayor número = menor prioridad
};

// ---------------------------------------------------------------------------
// Datos crudos de la liga (una sola carga, compartida por ambos bloques)
// ---------------------------------------------------------------------------

type LeagueMatchRow = {
	id: string;
	homeTeamId: string;
	awayTeamId: string;
	homeScore: number | null;
	awayScore: number | null;
	matchdayNumber: number | null;
};

type PlayerMatchStatRow = {
	matchId: string;
	globalPlayerId: string;
	fullName: string;
	teamName: string | null;
	goals: number;
	assists: number;
};

async function fetchLeagueMatches(leagueId: string): Promise<LeagueMatchRow[]> {
	return db
		.select({
			id: matches.id,
			homeTeamId: matches.homeTeamId,
			awayTeamId: matches.awayTeamId,
			homeScore: matches.homeScore,
			awayScore: matches.awayScore,
			matchdayNumber: matchdays.number,
		})
		.from(matches)
		.leftJoin(matchdays, eq(matches.matchdayId, matchdays.id))
		.where(and(eq(matches.leagueId, leagueId), inArray(matches.status, COUNTED_MATCH_STATUSES)));
}

async function fetchLeaguePlayerMatchStats(matchIds: string[]): Promise<PlayerMatchStatRow[]> {
	if (matchIds.length === 0) return [];
	return db
		.select({
			matchId: matchPlayerStats.matchId,
			globalPlayerId: leagueMembers.globalPlayerId,
			fullName: globalPlayers.fullName,
			teamName: teams.name,
			goals: matchPlayerStats.goals,
			assists: matchPlayerStats.assists,
		})
		.from(matchPlayerStats)
		.innerJoin(inscriptions, eq(matchPlayerStats.playerRegistrationId, inscriptions.id))
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.leftJoin(teams, eq(inscriptions.teamId, teams.id))
		.where(inArray(matchPlayerStats.matchId, matchIds));
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Genera entre 3 y 8 píldoras para una jornada.
 * Si la jornada es la 1 (sin historial previo), solo genera píldoras
 * de liderato y goleadores del corte actual.
 */
export async function generateJornadaPills(
	leagueId: string,
	jornada: number,
): Promise<JornadaPill[]> {
	const leagueMatches = await fetchLeagueMatches(leagueId);
	if (leagueMatches.length === 0) return [];

	const matchIdsUpToJornada = leagueMatches
		.filter((m) => (m.matchdayNumber ?? Infinity) <= jornada)
		.map((m) => m.id);
	const playerStats = await fetchLeaguePlayerMatchStats(matchIdsUpToJornada);

	const [playerPills, teamPills] = await Promise.all([
		buildPlayerPills(leagueId, jornada, leagueMatches, playerStats),
		buildTeamPills(leagueId, jornada, leagueMatches),
	]);

	// Mezcla y ordena por prioridad, máximo 8 píldoras
	return [...playerPills, ...teamPills].sort((a, b) => a.priority - b.priority).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Píldoras de jugadores
// ---------------------------------------------------------------------------

type PlayerCumulative = { name: string; teamName: string; goals: number; assists: number };

/** Totales acumulados de cada jugador considerando solo partidos con jornada <= uptoJornada. */
function cumulativePlayerTotals(
	leagueMatches: LeagueMatchRow[],
	playerStats: PlayerMatchStatRow[],
	uptoJornada: number,
): Map<string, PlayerCumulative> {
	const matchIdsUpTo = new Set(
		leagueMatches.filter((m) => (m.matchdayNumber ?? Infinity) <= uptoJornada).map((m) => m.id),
	);

	const totals = new Map<string, PlayerCumulative>();
	for (const s of playerStats) {
		if (!matchIdsUpTo.has(s.matchId)) continue;
		const acc = totals.get(s.globalPlayerId) ?? {
			name: s.fullName,
			teamName: s.teamName ?? "",
			goals: 0,
			assists: 0,
		};
		acc.goals += s.goals;
		acc.assists += s.assists;
		if (s.teamName) acc.teamName = s.teamName;
		totals.set(s.globalPlayerId, acc);
	}
	return totals;
}

async function buildPlayerPills(
	_leagueId: string,
	jornada: number,
	leagueMatches: LeagueMatchRow[],
	playerStats: PlayerMatchStatRow[],
): Promise<JornadaPill[]> {
	const pills: JornadaPill[] = [];

	const hasMatchesAtJornada = leagueMatches.some((m) => m.matchdayNumber === jornada);
	if (!hasMatchesAtJornada) return pills;

	const totalsN = cumulativePlayerTotals(leagueMatches, playerStats, jornada);
	if (totalsN.size === 0) return pills;

	const totalsPrev =
		jornada > 1
			? cumulativePlayerTotals(leagueMatches, playerStats, jornada - 1)
			: new Map<string, PlayerCumulative>();

	type Delta = {
		playerKey: string;
		name: string;
		teamName: string;
		goalsTotal: number;
		assistsTotal: number;
		goalsThisJornada: number;
		assistsThisJornada: number;
	};

	const deltas: Delta[] = [...totalsN.entries()].map(([playerId, t]) => {
		const prev = totalsPrev.get(playerId);
		return {
			playerKey: playerId,
			name: titleCase(t.name),
			teamName: titleCase(t.teamName),
			goalsTotal: t.goals,
			assistsTotal: t.assists,
			goalsThisJornada: t.goals - (prev?.goals ?? 0),
			assistsThisJornada: t.assists - (prev?.assists ?? 0),
		};
	});

	// ── Hat-tricks (3+ goles en la jornada) ──────────────────────────────────
	const hatTricks = deltas
		.filter((d) => d.goalsThisJornada >= 3)
		.sort((a, b) => b.goalsThisJornada - a.goalsThisJornada);

	for (const h of hatTricks) {
		pills.push({
			type: "hat_trick",
			headline: `${h.name} se mandó ${h.goalsThisJornada === 3 ? "hat-trick" : `${h.goalsThisJornada} goles`}`,
			detail: `${h.teamName} · J${jornada} · ${h.goalsTotal} goles en el torneo`,
			priority: 1,
		});
	}

	// ── Goleador del torneo ───────────────────────────────────────────────────
	const topScorer = [...deltas].sort((a, b) => b.goalsTotal - a.goalsTotal)[0];
	if (topScorer && topScorer.goalsTotal > 0) {
		pills.push({
			type: "top_scorer",
			headline: `${topScorer.name} lidera el goleo`,
			detail: `${topScorer.goalsTotal} goles · ${topScorer.teamName} · J${jornada}`,
			priority: 2,
		});
	}

	// ── Líder de asistencias ──────────────────────────────────────────────────
	const topAssist = [...deltas].sort((a, b) => b.assistsTotal - a.assistsTotal)[0];
	if (topAssist && topAssist.assistsTotal >= 2) {
		pills.push({
			type: "top_assist",
			headline: `${topAssist.name} domina en asistencias`,
			detail: `${topAssist.assistsTotal} asistencias · ${topAssist.teamName}`,
			priority: 5,
		});
	}

	// ── Primer gol del torneo (solo aplica con historial) ────────────────────
	if (jornada > 1) {
		const firstTimers = deltas.filter(
			(d) => d.goalsThisJornada > 0 && d.goalsTotal === d.goalsThisJornada,
		);
		for (const p of firstTimers.slice(0, 2)) {
			pills.push({
				type: "first_scorer",
				headline: `${p.name} abrió su cuenta`,
				detail: `Primer gol del torneo · ${p.teamName} · J${jornada}`,
				priority: 6,
			});
		}
	}

	// ── Rachas goleadoras (anotó en 3+ jornadas consecutivas) ────────────────
	if (jornada >= 3) {
		const streaks = buildScoringStreaks(leagueMatches, playerStats, jornada);
		for (const [playerKey, count] of streaks) {
			const player = deltas.find((d) => d.playerKey === playerKey);
			if (!player) continue;
			pills.push({
				type: "scoring_streak",
				headline: `${player.name} lleva ${count} jornadas anotando`,
				detail: `${player.teamName} · ${player.goalsTotal} goles en el torneo`,
				priority: 3,
			});
		}
	}

	return pills;
}

/**
 * Para cada jugador, calcula cuántas jornadas consecutivas hasta `jornada`
 * tiene con al menos 1 gol (delta positivo respecto a la jornada anterior).
 * Recalcula los totales acumulados en memoria (ya tenemos leagueMatches/
 * playerStats cargados) — no hace falta ninguna query adicional.
 */
function buildScoringStreaks(
	leagueMatches: LeagueMatchRow[],
	playerStats: PlayerMatchStatRow[],
	currentJornada: number,
): Map<string, number> {
	if (currentJornada < 2) return new Map();

	const lookback = Math.min(currentJornada, 5);
	// series[0] = jornada actual (más reciente) ... series[last] = la más vieja del lookback
	const series = Array.from({ length: lookback }, (_, i) =>
		cumulativePlayerTotals(leagueMatches, playerStats, currentJornada - i),
	);

	const streaks = new Map<string, number>();
	for (const playerId of series[0].keys()) {
		let streak = 0;
		for (let i = 0; i < series.length - 1; i++) {
			const curr = series[i].get(playerId)?.goals ?? 0;
			const prev = series[i + 1].get(playerId)?.goals ?? 0;
			if (curr - prev <= 0) break;
			streak++;
		}
		if (streak > 0) streaks.set(playerId, streak + 1);
	}

	return streaks;
}

// ---------------------------------------------------------------------------
// Píldoras de equipos
// ---------------------------------------------------------------------------

type TeamStandingAcc = {
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
};

function emptyStanding(): TeamStandingAcc {
	return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

/** Tabla de posiciones acumulada considerando solo partidos con jornada <= uptoJornada. */
function computeTeamStandingsUpTo(
	leagueMatches: LeagueMatchRow[],
	uptoJornada: number,
): Map<string, TeamStandingAcc> {
	const acc = new Map<string, TeamStandingAcc>();
	const relevant = leagueMatches.filter((m) => (m.matchdayNumber ?? Infinity) <= uptoJornada);

	for (const m of relevant) {
		const hg = m.homeScore ?? 0;
		const ag = m.awayScore ?? 0;
		const home = acc.get(m.homeTeamId) ?? emptyStanding();
		const away = acc.get(m.awayTeamId) ?? emptyStanding();

		home.played++;
		away.played++;
		home.goalsFor += hg;
		home.goalsAgainst += ag;
		away.goalsFor += ag;
		away.goalsAgainst += hg;

		if (hg > ag) {
			home.wins++;
			home.points += 3;
			away.losses++;
		} else if (hg < ag) {
			away.wins++;
			away.points += 3;
			home.losses++;
		} else {
			home.draws++;
			home.points++;
			away.draws++;
			away.points++;
		}

		acc.set(m.homeTeamId, home);
		acc.set(m.awayTeamId, away);
	}

	return acc;
}

function sortTeamIdsByStanding(standings: Map<string, TeamStandingAcc>): string[] {
	return [...standings.entries()]
		.sort((a, b) => b[1].points - a[1].points || b[1].goalsFor - a[1].goalsFor)
		.map(([id]) => id);
}

/** Jornadas consecutivas (hasta `currentJornada`, hacia atrás) sin perder. Un bye no la corta. */
function computeUnbeatenStreak(
	leagueMatches: LeagueMatchRow[],
	teamId: string,
	currentJornada: number,
): number {
	const lookback = Math.min(currentJornada, 6);
	let streak = 0;

	for (let j = currentJornada; j > currentJornada - lookback; j--) {
		const teamMatches = leagueMatches.filter(
			(m) => m.matchdayNumber === j && (m.homeTeamId === teamId || m.awayTeamId === teamId),
		);
		if (teamMatches.length === 0) continue; // bye — no interrumpe la racha

		const lostThisJornada = teamMatches.some((m) => {
			const isHome = m.homeTeamId === teamId;
			const gf = (isHome ? m.homeScore : m.awayScore) ?? 0;
			const ga = (isHome ? m.awayScore : m.homeScore) ?? 0;
			return gf < ga;
		});
		if (lostThisJornada) break;
		streak++;
	}

	return streak;
}

async function buildTeamPills(
	leagueId: string,
	jornada: number,
	leagueMatches: LeagueMatchRow[],
): Promise<JornadaPill[]> {
	const pills: JornadaPill[] = [];

	const hasMatchesAtJornada = leagueMatches.some((m) => m.matchdayNumber === jornada);
	if (!hasMatchesAtJornada) return pills;

	const standingsN = computeTeamStandingsUpTo(leagueMatches, jornada);
	if (standingsN.size === 0) return pills;

	const leagueTeams = await db.query.teams.findMany({
		where: eq(teams.leagueId, leagueId),
		columns: { id: true, name: true },
	});
	const teamNameById = new Map(leagueTeams.map((t) => [t.id, t.name]));

	const sortedTeamIds = sortTeamIdsByStanding(standingsN);

	// ── Líder de tabla ────────────────────────────────────────────────────────
	const leaderId = sortedTeamIds[0];
	const leaderStanding = standingsN.get(leaderId)!;
	pills.push({
		type: "leader",
		headline: `${titleCase(teamNameById.get(leaderId) ?? "")} comanda la tabla`,
		detail: `${leaderStanding.points} pts · ${leaderStanding.wins}G ${leaderStanding.draws}E ${leaderStanding.losses}P · J${jornada}`,
		priority: 4,
	});

	// ── Cambios de zona (entró a liguilla / copa / etc.) ─────────────────────
	if (jornada > 1) {
		const zones: ZoneInfo[] = await db.query.leaguePlayoffZones.findMany({
			where: eq(leaguePlayoffZones.leagueId, leagueId),
			columns: { id: true, name: true, fromPosition: true, toPosition: true, color: true },
		});

		if (zones.length > 0) {
			const standingsPrev = computeTeamStandingsUpTo(leagueMatches, jornada - 1);
			const sortedPrevIds = sortTeamIdsByStanding(standingsPrev);

			sortedTeamIds.forEach((teamId, idx) => {
				const currZone = findZone(zones, idx + 1);
				if (!currZone) return;
				const prevIdx = sortedPrevIds.indexOf(teamId);
				const prevZone = prevIdx >= 0 ? findZone(zones, prevIdx + 1) : null;
				if (prevZone) return; // ya estaba en una zona — solo interesa la entrada

				pills.push({
					type: "zone_change",
					headline: `${titleCase(teamNameById.get(teamId) ?? "")} entró a ${currZone.name}`,
					detail: `${standingsN.get(teamId)!.points} pts · J${jornada}`,
					priority: 2,
				});
			});
		}
	}

	// ── Racha invicta ─────────────────────────────────────────────────────────
	// Equipo con más jornadas sin perder (solo se reporta la más larga).
	if (jornada >= 3) {
		let best: { teamId: string; count: number } | null = null;
		for (const teamId of sortedTeamIds) {
			const count = computeUnbeatenStreak(leagueMatches, teamId, jornada);
			if (count >= 3 && (!best || count > best.count)) best = { teamId, count };
		}
		if (best) {
			pills.push({
				type: "unbeaten_streak",
				headline: `${titleCase(teamNameById.get(best.teamId) ?? "")} lleva ${best.count} jornadas sin perder`,
				detail: `${standingsN.get(best.teamId)!.points} pts · J${jornada}`,
				priority: 3,
			});
		}
	}

	return pills;
}
