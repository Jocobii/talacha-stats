/**
 * narrator.ts — Análisis pre-partido para el narrador del Facebook Live.
 * A diferencia de preview.ts (ligado a un match_id), este módulo funciona
 * con cualquier par de equipos que el narrador elija libremente.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P4/D3):
 *  - Roster + stats de jugador: antes `player_registrations` +
 *    `player_season_stats`/`match_events` (V1) — ahora
 *    `getTeamMatchStatsRoster` (entities/player/live-stats.ts), que agrega
 *    `match_player_stats` sobre el subconjunto de partidos que le pasa este
 *    módulo (todos los completados de la liga).
 *  - Tabla de posiciones / récord de equipo: antes `team_standings_snapshot`
 *    con fallback a cálculo manual — ahora `getLeagueStandings`
 *    (lib/standings.ts), que ya resuelve snapshot-Excel-si-existe vs. cálculo
 *    en vivo y aplica los tiebreakers configurados de la liga. Este módulo ya
 *    no lee `team_standings_snapshot` directamente.
 *  - Partidos "completados": antes filtraba `matches.status = 'completed'`
 *    (solo el status legacy de import Excel — nunca marcaba partidos
 *    capturados vía cédula). Ahora usa `COUNTED_MATCH_STATUSES`
 *    (`played`/`walkover_home`/`walkover_away`), igual que
 *    `live-stats.ts`/`standings.ts`.
 *  - `match_events` (D3 del plan) sale por completo: no hay reemplazo de
 *    "eventos finos" (quién asistió en qué minuto, MVP) — `match_player_stats`
 *    solo tiene totales agregados por partido. Se acepta la pérdida (D3).
 *  - Sin backfill de Excel (D1): una liga cuyo único historial vive en
 *    `player_season_stats`/`player_registrations` deja de aportar roster —
 *    `getLeagueStandings` sí conserva snapshot-Excel para la tabla de
 *    posiciones (no es parte de este alcance, ver P7 del plan).
 */

import { db, matches, matchdays, teams, leagues } from "@/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getLeagueStandings } from "@/lib/standings";
import { getTeamMatchStatsRoster, COUNTED_MATCH_STATUSES } from "@/entities/player/live-stats";
import type { TeamStanding } from "@/types";

// ────────────────────────────────────────────────────────────────────────────
// Tipos públicos del módulo
//
// La fuente de verdad de estos tipos es `entities/narrator` (§7.4). Aquí se
// re-exportan para no romper a los consumidores legacy (export-pdf/png) mientras
// este archivo migra a `features/narrator-analysis/analysis.ts` (§10).
// ────────────────────────────────────────────────────────────────────────────

import type {
	DangerRating,
	RosterPlayer,
	TeamStreak,
	TeamAnalysis,
	H2HRecord,
	WinProbability,
	PositionScenario,
	PositionSimulator,
	MatchPrediction,
	NarratorAnalysis,
} from "@/entities/narrator";

export type {
	DangerRating,
	RosterPlayer,
	TeamStreak,
	TeamAnalysis,
	H2HRecord,
	WinProbability,
	PositionScenario,
	PositionSimulator,
	MatchPrediction,
	NarratorAnalysis,
};

type CompletedMatchRow = {
	id: string;
	homeTeamId: string;
	awayTeamId: string;
	homeScore: number | null;
	awayScore: number | null;
	matchDate: string;
	jornada: number | null;
};

// ────────────────────────────────────────────────────────────────────────────
// Función principal
// ────────────────────────────────────────────────────────────────────────────

export async function generateNarratorAnalysis(
	teamAId: string,
	teamBId: string,
	leagueId: string,
): Promise<NarratorAnalysis | null> {
	// Verificar que la liga y ambos equipos existen
	const [league, teamA, teamB] = await Promise.all([
		db.query.leagues.findFirst({ where: eq(leagues.id, leagueId) }),
		db.query.teams.findFirst({ where: eq(teams.id, teamAId) }),
		db.query.teams.findFirst({ where: eq(teams.id, teamBId) }),
	]);

	if (!league || !teamA || !teamB) return null;

	// Partidos contados de la liga (para H2H, last5, jornada, roster).
	const completedMatches = await db
		.select({
			id: matches.id,
			homeTeamId: matches.homeTeamId,
			awayTeamId: matches.awayTeamId,
			homeScore: matches.homeScore,
			awayScore: matches.awayScore,
			matchDate: matches.matchDate,
			jornada: matchdays.number,
		})
		.from(matches)
		.leftJoin(matchdays, eq(matches.matchdayId, matchdays.id))
		.where(and(eq(matches.leagueId, leagueId), inArray(matches.status, COUNTED_MATCH_STATUSES)))
		.orderBy(desc(matches.matchDate));

	const matchIds = completedMatches.map((m) => m.id);
	const allStandings = await getLeagueStandings(leagueId);

	// Análisis paralelo de ambos equipos
	const [analysisA, analysisB] = await Promise.all([
		buildTeamAnalysis(teamA, matchIds, completedMatches, allStandings),
		buildTeamAnalysis(teamB, matchIds, completedMatches, allStandings),
	]);

	const lastMatchday = completedMatches.reduce<number | null>((max, m) => {
		if (m.jornada == null) return max;
		return max === null ? m.jornada : Math.max(max, m.jornada);
	}, null);

	const positionSimulator = buildPositionSimulator(teamAId, teamBId, allStandings);
	const rankA = computeLeagueRanks(teamAId, allStandings);
	const rankB = computeLeagueRanks(teamBId, allStandings);

	const teamAFinal: TeamAnalysis = {
		...analysisA,
		attackRank: rankA.attackRank,
		defenseRank: rankA.defenseRank,
		totalTeams: allStandings.length,
		topScoringThreats: analysisA.roster.filter((p) => p.goals > 0).slice(0, 3),
	};

	const teamBFinal: TeamAnalysis = {
		...analysisB,
		attackRank: rankB.attackRank,
		defenseRank: rankB.defenseRank,
		totalTeams: allStandings.length,
		topScoringThreats: analysisB.roster.filter((p) => p.goals > 0).slice(0, 3),
	};

	const winProb = calcWinProbability(teamAFinal, teamBFinal);
	const h2h = buildH2H(teamAId, teamBId, completedMatches);

	const bullets = buildBullets(teamA.name, teamB.name, teamAFinal, teamBFinal, winProb, h2h);
	const funFacts = buildFunFacts(teamA.name, teamB.name, teamAFinal, teamBFinal, h2h);

	const matchPrediction = buildMatchPrediction(teamAFinal, teamBFinal);

	return {
		league: { id: league.id, name: league.name, season: league.season },
		lastMatchday,
		teamA: teamAFinal,
		teamB: teamBFinal,
		winProbability: winProb,
		headToHead: h2h,
		positionSimulator,
		matchPrediction,
		narratorBullets: bullets,
		funFacts,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Construcción del análisis por equipo
// ────────────────────────────────────────────────────────────────────────────

async function buildTeamAnalysis(
	team: { id: string; name: string },
	matchIds: string[],
	completedMatches: CompletedMatchRow[],
	allStandings: TeamStanding[],
): Promise<TeamAnalysis> {
	const standingIdx = allStandings.findIndex((s) => s.teamId === team.id);
	const standing = standingIdx >= 0 ? allStandings[standingIdx] : null;
	const position = standingIdx >= 0 ? standingIdx + 1 : null;

	const roster = await getTeamRoster(team.id, matchIds);

	const last5 = getLast5(team.id, completedMatches);
	const currentStreak = calcStreak(team.id, completedMatches);

	const topScorer = roster.find((p) => p.goals > 0) ?? null;
	const topAssist =
		[...roster].sort((a, b) => b.assists - a.assists).find((p) => p.assists > 0) ?? null;
	const topContributor = roster[0] ?? null; // ya ordenado por contribuciones

	const cardRisk = roster
		.filter((p) => p.yellowCards >= 2 || p.redCards > 0)
		.sort((a, b) => b.yellowCards + b.redCards * 3 - (a.yellowCards + a.redCards * 3))
		.map((p) => ({
			player: p.fullName,
			alias: p.alias,
			yellowCards: p.yellowCards,
			redCards: p.redCards,
			note:
				p.redCards > 0
					? `${p.redCards} roja(s) — revisar suspensión`
					: `${p.yellowCards} amarillas — 1 más = suspensión`,
		}));

	const played = standing?.played ?? 0;
	const goalsFor = standing?.goalsFor ?? 0;
	const goalsAgainst = standing?.goalsAgainst ?? 0;

	return {
		team,
		position,
		record: standing
			? {
					wins: standing.wins,
					draws: standing.draws,
					losses: standing.losses,
					played: standing.played,
				}
			: { wins: 0, draws: 0, losses: 0, played: 0 },
		points: standing?.points ?? 0,
		goalsFor,
		goalsAgainst,
		goalDiff: goalsFor - goalsAgainst,
		avgGoalsFor: played > 0 ? Math.round((goalsFor / played) * 10) / 10 : 0,
		avgGoalsAgainst: played > 0 ? Math.round((goalsAgainst / played) * 10) / 10 : 0,
		last5,
		currentStreak,
		roster,
		topScorer,
		topAssist,
		topContributor,
		topScoringThreats: [],
		cardRisk,
		attackRank: null,
		defenseRank: null,
		totalTeams: 0,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Plantel con estadísticas (V2 — match_player_stats)
// ────────────────────────────────────────────────────────────────────────────

async function getTeamRoster(teamId: string, matchIds: string[]): Promise<RosterPlayer[]> {
	const stats = await getTeamMatchStatsRoster(teamId, matchIds);

	const roster: RosterPlayer[] = stats.map((s) => {
		const gpm = s.matchesPlayed > 0 ? Math.round((s.goals / s.matchesPlayed) * 100) / 100 : 0;
		return {
			playerId: s.playerId,
			fullName: s.fullName,
			// global_players no tiene alias (apodo) — solo existía en la tabla V1
			// `players`. Se mantiene el campo por contrato de tipo (RosterPlayer).
			alias: null,
			goals: s.goals,
			assists: s.assists,
			contributions: s.goals + s.assists,
			yellowCards: s.yellowCards,
			redCards: s.redCards,
			matchesPlayed: s.matchesPlayed,
			goalsPerMatch: gpm,
			dangerRating: calcDangerRating(gpm, s.goals),
		};
	});

	// Ordenar: más contribuciones → más goles → nombre
	return roster.sort((a, b) => {
		if (b.contributions !== a.contributions) return b.contributions - a.contributions;
		if (b.goals !== a.goals) return b.goals - a.goals;
		return a.fullName.localeCompare(b.fullName);
	});
}

// ────────────────────────────────────────────────────────────────────────────
// Últimos 5 resultados y racha actual
// ────────────────────────────────────────────────────────────────────────────

function getLast5(teamId: string, completedMatches: CompletedMatchRow[]): ("W" | "D" | "L")[] {
	return completedMatches
		.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
		.slice(0, 5)
		.map((m) => {
			const isHome = m.homeTeamId === teamId;
			const gf = (isHome ? m.homeScore : m.awayScore) ?? 0;
			const ga = (isHome ? m.awayScore : m.homeScore) ?? 0;
			return gf > ga ? "W" : gf === ga ? "D" : "L";
		});
}

function calcStreak(teamId: string, completedMatches: CompletedMatchRow[]): TeamStreak | null {
	const results = getLast5(teamId, completedMatches);
	if (results.length === 0) return null;

	const current = results[0];
	let count = 1;
	for (let i = 1; i < results.length; i++) {
		if (results[i] === current) count++;
		else break;
	}

	return count >= 2 ? { type: current, count } : null;
}

// ────────────────────────────────────────────────────────────────────────────
// Probabilidad de victoria
// ────────────────────────────────────────────────────────────────────────────

function calcWinProbability(a: TeamAnalysis, b: TeamAnalysis): WinProbability {
	const aPlayed = a.record.played;
	const bPlayed = b.record.played;

	if (aPlayed === 0 && bPlayed === 0) {
		return { aWinPct: 40, drawPct: 20, bWinPct: 40, method: "sin_datos" };
	}

	const aPpg = aPlayed > 0 ? a.points / aPlayed : 0;
	const bPpg = bPlayed > 0 ? b.points / bPlayed : 0;

	// Fuerza = 60% puntos/partido + 40% promedio goles
	const aStr = aPpg * 0.6 + a.avgGoalsFor * 0.4;
	const bStr = bPpg * 0.6 + b.avgGoalsFor * 0.4;
	const total = aStr + bStr;

	if (total === 0) return { aWinPct: 38, drawPct: 24, bWinPct: 38, method: "sin_datos" };

	let aWinPct = Math.min(72, Math.round((aStr / total) * 72));
	const balance = Math.abs(aWinPct - 36);
	const drawPct = Math.max(10, 28 - Math.floor(balance / 3));
	let bWinPct = 100 - aWinPct - drawPct;

	if (bWinPct < 5) {
		bWinPct = 5;
		aWinPct = 100 - drawPct - bWinPct;
	}

	return { aWinPct, drawPct, bWinPct, method: "weighted_record" };
}

// ────────────────────────────────────────────────────────────────────────────
// Head to Head
// ────────────────────────────────────────────────────────────────────────────

function buildH2H(aId: string, bId: string, completedMatches: CompletedMatchRow[]): H2HRecord {
	const h2hMatches = completedMatches.filter(
		(m) =>
			(m.homeTeamId === aId && m.awayTeamId === bId) ||
			(m.homeTeamId === bId && m.awayTeamId === aId),
	);

	let aWins = 0,
		draws = 0,
		bWins = 0;

	for (const m of h2hMatches) {
		const aIsHome = m.homeTeamId === aId;
		const aGoals = (aIsHome ? m.homeScore : m.awayScore) ?? 0;
		const bGoals = (aIsHome ? m.awayScore : m.homeScore) ?? 0;
		if (aGoals > bGoals) aWins++;
		else if (aGoals === bGoals) draws++;
		else bWins++;
	}

	const last = h2hMatches[0] ?? null;
	let lastMatch: H2HRecord["lastMatch"] = null;

	if (last) {
		const aIsHome = last.homeTeamId === aId;
		const aGoals = (aIsHome ? last.homeScore : last.awayScore) ?? 0;
		const bGoals = (aIsHome ? last.awayScore : last.homeScore) ?? 0;
		const result = aGoals > bGoals ? "A ganó" : aGoals === bGoals ? "Empate" : "B ganó";
		lastMatch = { date: last.matchDate, aGoals, bGoals, result };
	}

	return { total: h2hMatches.length, aWins, draws, bWins, lastMatch };
}

// ────────────────────────────────────────────────────────────────────────────
// Bullets del narrador
// ────────────────────────────────────────────────────────────────────────────

function buildBullets(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
	prob: WinProbability,
	h2h: H2HRecord,
): string[] {
	const bullets: string[] = [];

	// Favorito
	if (prob.method !== "sin_datos") {
		if (prob.aWinPct > prob.bWinPct + 10) {
			bullets.push(
				`📊 ${aName} llega como favorito con ${prob.aWinPct}% de probabilidad de victoria.`,
			);
		} else if (prob.bWinPct > prob.aWinPct + 10) {
			bullets.push(
				`📊 ${bName} llega como favorito con ${prob.bWinPct}% de probabilidad de victoria.`,
			);
		} else {
			bullets.push(
				`📊 Partido muy parejo: ${aName} ${prob.aWinPct}% — Empate ${prob.drawPct}% — ${bName} ${prob.bWinPct}%.`,
			);
		}
	}

	// Posición en tabla
	if (a.position !== null || b.position !== null) {
		const aPos = a.position !== null ? `${aName} va ${ordinal(a.position)}` : null;
		const bPos = b.position !== null ? `${bName} va ${ordinal(b.position)}` : null;
		const posStr = [aPos, bPos].filter(Boolean).join(", ");
		if (posStr) bullets.push(`🏆 En la tabla: ${posStr}.`);
	}

	// Forma de A
	if (a.record.played > 0) {
		bullets.push(
			`⚽ ${aName}: ${a.record.wins}G ${a.record.draws}E ${a.record.losses}P — ` +
				`${a.points} pts — promedio ${a.avgGoalsFor} goles por partido.`,
		);
	}

	// Racha A
	if (a.currentStreak && a.currentStreak.count >= 2) {
		const word = { W: "victorias", D: "empates", L: "derrotas" }[a.currentStreak.type];
		bullets.push(`🔥 ${aName} lleva ${a.currentStreak.count} ${word} consecutivas.`);
	}

	// Forma de B
	if (b.record.played > 0) {
		bullets.push(
			`⚽ ${bName}: ${b.record.wins}G ${b.record.draws}E ${b.record.losses}P — ` +
				`${b.points} pts — promedio ${b.avgGoalsFor} goles por partido.`,
		);
	}

	// Racha B
	if (b.currentStreak && b.currentStreak.count >= 2) {
		const word = { W: "victorias", D: "empates", L: "derrotas" }[b.currentStreak.type];
		bullets.push(`🔥 ${bName} lleva ${b.currentStreak.count} ${word} consecutivas.`);
	}

	// Goleador de A
	if (a.topScorer) {
		const name = displayName(a.topScorer);
		bullets.push(
			`⚡ Amenaza principal de ${aName}: ${name} con ${a.topScorer.goals} goles` +
				(a.topScorer.goalsPerMatch > 0 ? ` (${a.topScorer.goalsPerMatch} por partido)` : "") +
				".",
		);
	}

	// Goleador de B
	if (b.topScorer) {
		const name = displayName(b.topScorer);
		bullets.push(
			`⚡ Amenaza principal de ${bName}: ${name} con ${b.topScorer.goals} goles` +
				(b.topScorer.goalsPerMatch > 0 ? ` (${b.topScorer.goalsPerMatch} por partido)` : "") +
				".",
		);
	}

	// Riesgo de tarjetas
	for (const p of [...a.cardRisk.slice(0, 1), ...b.cardRisk.slice(0, 1)]) {
		bullets.push(`🟨 ${p.player}: ${p.note}.`);
	}

	// Head to head
	if (h2h.total > 0) {
		const leader =
			h2h.aWins > h2h.bWins
				? `${aName} domina`
				: h2h.bWins > h2h.aWins
					? `${bName} domina`
					: "Historial igualado";
		bullets.push(
			`📋 En ${h2h.total} enfrentamiento${h2h.total !== 1 ? "s" : ""} previos: ${leader} ` +
				`(${h2h.aWins}-${h2h.draws}-${h2h.bWins}).` +
				(h2h.lastMatch ? ` Último: ${h2h.lastMatch.aGoals}-${h2h.lastMatch.bGoals}.` : ""),
		);
	}

	return bullets;
}

// ────────────────────────────────────────────────────────────────────────────
// Datos curiosos / fun facts
// ────────────────────────────────────────────────────────────────────────────

function buildFunFacts(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
	h2h: H2HRecord,
): string[] {
	const facts: string[] = [];

	// Contexto de ataque en la liga
	if (a.attackRank !== null && a.totalTeams > 2) {
		const label =
			a.attackRank === 1
				? `el equipo más goleador de la liga`
				: `${ordinal(a.attackRank)} mejor ataque de ${a.totalTeams} equipos`;
		facts.push(`${aName} tiene ${label} con ${a.goalsFor} goles anotados.`);
	}
	if (b.attackRank !== null && b.totalTeams > 2) {
		const label =
			b.attackRank === 1
				? `el equipo más goleador de la liga`
				: `${ordinal(b.attackRank)} mejor ataque de ${b.totalTeams} equipos`;
		facts.push(`${bName} tiene ${label} con ${b.goalsFor} goles anotados.`);
	}

	// Contexto de defensa en la liga
	if (a.defenseRank !== null && a.totalTeams > 2) {
		const label =
			a.defenseRank === 1
				? `la mejor defensa de la liga`
				: `${ordinal(a.defenseRank)} mejor defensa de ${a.totalTeams} equipos`;
		facts.push(`${aName} tiene ${label} con ${a.goalsAgainst} goles en contra.`);
	}
	if (b.defenseRank !== null && b.totalTeams > 2) {
		const label =
			b.defenseRank === 1
				? `la mejor defensa de la liga`
				: `${ordinal(b.defenseRank)} mejor defensa de ${b.totalTeams} equipos`;
		facts.push(`${bName} tiene ${label} con ${b.goalsAgainst} goles en contra.`);
	}

	// Diferencia de goles
	const aDiff = a.goalDiff;
	const bDiff = b.goalDiff;
	if (aDiff > 0) facts.push(`${aName} tiene diferencia de goles positiva: +${aDiff}.`);
	if (bDiff > 0) facts.push(`${bName} tiene diferencia de goles positiva: +${bDiff}.`);

	// Jugador más completo (más contribuciones)
	const allPlayers = [
		...a.roster.map((p) => ({ ...p, team: aName })),
		...b.roster.map((p) => ({ ...p, team: bName })),
	].sort((x, y) => y.contributions - x.contributions);

	if (allPlayers[0]?.contributions > 0) {
		const top = allPlayers[0];
		facts.push(
			`El jugador más completo del partido: ${displayName(top)} (${top.team}) — ` +
				`${top.goals} goles + ${top.assists} asistencias = ${top.contributions} contribuciones.`,
		);
	}

	// Máximo goleador de cada equipo si son diferentes personas
	if (a.topScorer && b.topScorer && a.topScorer.goals !== b.topScorer.goals) {
		const moreGoals = a.topScorer.goals > b.topScorer.goals ? a.topScorer : b.topScorer;
		const moreTeam = a.topScorer.goals > b.topScorer.goals ? aName : bName;
		facts.push(
			`El máximo goleador del partido podría ser ${displayName(moreGoals)} de ${moreTeam} con ${moreGoals.goals} goles esta temporada.`,
		);
	}

	// Asistidor clave
	if (a.topAssist && (a.topAssist.assists ?? 0) >= 3) {
		facts.push(
			`Ojo con el playmaker de ${aName}: ${displayName(a.topAssist)} lleva ${a.topAssist.assists} asistencias — clave para el juego colectivo.`,
		);
	}
	if (b.topAssist && (b.topAssist.assists ?? 0) >= 3) {
		facts.push(
			`Ojo con el playmaker de ${bName}: ${displayName(b.topAssist)} lleva ${b.topAssist.assists} asistencias — clave para el juego colectivo.`,
		);
	}

	// Promedio de goles esperados combinado
	const combined = a.avgGoalsFor + b.avgGoalsFor;
	if (combined >= 6) {
		facts.push(
			`Partido de alto voltaje ofensivo: ambos equipos promedian ${combined.toFixed(1)} goles combinados por partido.`,
		);
	} else if (combined <= 3 && a.record.played > 0 && b.record.played > 0) {
		facts.push(
			`Se espera un partido táctico y cerrado: ambos equipos promedian solo ${combined.toFixed(1)} goles combinados.`,
		);
	}

	// H2H dominancia clara
	if (h2h.total >= 3 && h2h.aWins >= h2h.total * 0.67) {
		facts.push(
			`${aName} ha ganado ${h2h.aWins} de ${h2h.total} enfrentamientos — historial muy favorable.`,
		);
	} else if (h2h.total >= 3 && h2h.bWins >= h2h.total * 0.67) {
		facts.push(
			`${bName} ha ganado ${h2h.bWins} de ${h2h.total} enfrentamientos — historial muy favorable.`,
		);
	}

	return facts.slice(0, 6); // máximo 6 datos curiosos
}

// ────────────────────────────────────────────────────────────────────────────
// Predicción del partido
// ────────────────────────────────────────────────────────────────────────────

function buildMatchPrediction(a: TeamAnalysis, b: TeamAnalysis): MatchPrediction {
	const hasData = a.record.played > 0 && b.record.played > 0;

	if (!hasData) {
		return {
			expectedGoalsA: 0,
			expectedGoalsB: 0,
			expectedTotal: 0,
			totalLabel: "cerrado",
			likelyScoreA: 0,
			likelyScoreB: 0,
			bothTeamsToScore: false,
			offensiveEdge: "equal",
			defensiveEdge: "equal",
			hasData: false,
		};
	}

	const xA = round1((a.avgGoalsFor + b.avgGoalsAgainst) / 2);
	const xB = round1((b.avgGoalsFor + a.avgGoalsAgainst) / 2);
	const total = round1(xA + xB);

	const totalLabel: MatchPrediction["totalLabel"] =
		total < 3.5 ? "cerrado" : total <= 5.5 ? "abierto" : "festival";

	const offensiveEdge: MatchPrediction["offensiveEdge"] =
		a.avgGoalsFor > b.avgGoalsAgainst + 0.5
			? "A"
			: b.avgGoalsFor > a.avgGoalsAgainst + 0.5
				? "B"
				: "equal";

	const defensiveEdge: MatchPrediction["defensiveEdge"] =
		a.avgGoalsAgainst < b.avgGoalsFor - 0.5
			? "A"
			: b.avgGoalsAgainst < a.avgGoalsFor - 0.5
				? "B"
				: "equal";

	return {
		expectedGoalsA: xA,
		expectedGoalsB: xB,
		expectedTotal: total,
		totalLabel,
		likelyScoreA: Math.round(xA),
		likelyScoreB: Math.round(xB),
		bothTeamsToScore: xA >= 0.8 && xB >= 0.8,
		offensiveEdge,
		defensiveEdge,
		hasData: true,
	};
}

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

// ────────────────────────────────────────────────────────────────────────────
// Simulador de posición y ranks de ataque/defensa
// ────────────────────────────────────────────────────────────────────────────

function rankByStandings(rows: TeamStanding[]): Map<string, number> {
	const sorted = [...rows].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
		return b.goalsFor - a.goalsFor;
	});
	return new Map(sorted.map((r, i) => [r.teamId, i + 1]));
}

function buildPositionSimulator(
	teamAId: string,
	teamBId: string,
	allStandings: TeamStanding[],
): PositionSimulator {
	const empty: PositionScenario = {
		currentPoints: 0,
		currentPosition: null,
		ifWin: null,
		ifDraw: null,
		ifLoss: null,
	};

	if (allStandings.length === 0) return { teamA: empty, teamB: empty };

	const currentRanks = rankByStandings(allStandings);
	const rowA = allStandings.find((r) => r.teamId === teamAId);
	const rowB = allStandings.find((r) => r.teamId === teamBId);

	function simulate(aDelta: number, bDelta: number) {
		const sim = allStandings.map((r) => {
			if (r.teamId === teamAId) return { ...r, points: r.points + aDelta };
			if (r.teamId === teamBId) return { ...r, points: r.points + bDelta };
			return r;
		});
		const ranks = rankByStandings(sim);
		return { posA: ranks.get(teamAId) ?? null, posB: ranks.get(teamBId) ?? null };
	}

	const win = simulate(3, 0);
	const draw = simulate(1, 1);
	const loss = simulate(0, 3);

	return {
		teamA: {
			currentPoints: rowA?.points ?? 0,
			currentPosition: currentRanks.get(teamAId) ?? null,
			ifWin: win.posA,
			ifDraw: draw.posA,
			ifLoss: loss.posA,
		},
		teamB: {
			currentPoints: rowB?.points ?? 0,
			currentPosition: currentRanks.get(teamBId) ?? null,
			ifWin: loss.posB,
			ifDraw: draw.posB,
			ifLoss: win.posB,
		},
	};
}

function computeLeagueRanks(
	teamId: string,
	allStandings: TeamStanding[],
): { attackRank: number | null; defenseRank: number | null } {
	if (allStandings.length === 0) return { attackRank: null, defenseRank: null };

	const byAttack = [...allStandings].sort((a, b) => b.goalsFor - a.goalsFor);
	const byDefense = [...allStandings].sort((a, b) => a.goalsAgainst - b.goalsAgainst);

	const ai = byAttack.findIndex((r) => r.teamId === teamId);
	const di = byDefense.findIndex((r) => r.teamId === teamId);

	return {
		attackRank: ai >= 0 ? ai + 1 : null,
		defenseRank: di >= 0 ? di + 1 : null,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ────────────────────────────────────────────────────────────────────────────

function calcDangerRating(goalsPerMatch: number, totalGoals: number): DangerRating {
	if (goalsPerMatch > 1 || totalGoals >= 8) return "ALTO";
	if (goalsPerMatch >= 0.5 || totalGoals >= 4) return "MEDIO";
	return "BAJO";
}

function displayName(p: { fullName: string; alias: string | null }): string {
	return p.alias ? `"${p.alias}"` : p.fullName;
}

function ordinal(n: number): string {
	return `${n}°`;
}
