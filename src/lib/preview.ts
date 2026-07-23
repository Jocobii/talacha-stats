import { db, matches, matchdays } from "@/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { getTeamMatchStatsRoster, COUNTED_MATCH_STATUSES } from "@/entities/player/live-stats";
import type {
	MatchPreview,
	TeamFormStats,
	TopThreat,
	CardRiskPlayer,
	HeadToHead,
	DangerRating,
} from "@/types";

/**
 * Genera el informe pre-partido para el narrador del live.
 * Calcula forma de los equipos, jugadores clave, riesgo de tarjetas
 * y probabilidad de victoria — sin AI, solo matemática sobre datos históricos.
 *
 * Migrado a V2 (jul 2026, docs/V1-REMOVAL-PLAN.md Fase 1, P5/D3):
 *  - Jugadores clave / riesgo de tarjetas: antes `player_registrations` +
 *    `match_events` (V1, por evento) — ahora `getTeamMatchStatsRoster`
 *    (entities/player/live-stats.ts), que agrega `match_player_stats` (totales
 *    por partido) sobre el subconjunto de partidos relevante.
 *  - Partidos "completados": antes filtraba `matches.status = 'completed'`
 *    (solo el status legacy de import Excel). Ahora usa
 *    `COUNTED_MATCH_STATUSES` (`played`/`walkover_home`/`walkover_away`).
 *  - `match_events` (D3 del plan) sale por completo: no hay "goles último
 *    partido" a nivel evento — se acepta la pérdida de granularidad fina
 *    (minuto exacto, MVP); los totales por partido sí se conservan.
 */
export async function generateMatchPreview(matchId: string): Promise<MatchPreview | null> {
	const match = await db.query.matches.findFirst({
		where: eq(matches.id, matchId),
		with: {
			homeTeam: true,
			awayTeam: true,
			league: true,
		},
	});

	if (!match) return null;

	const leagueId = match.leagueId;
	const homeTeamId = match.homeTeamId;
	const awayTeamId = match.awayTeamId;

	// Jornada (matchday.number) del partido — el campo legacy `matches.matchday`
	// (integer) solo lo escribía el import de Excel; los partidos capturados
	// vía cédula solo tienen `matchdayId` (FK a `matchdays`).
	const matchdayRow = match.matchdayId
		? await db.query.matchdays.findFirst({ where: eq(matchdays.id, match.matchdayId) })
		: null;

	// Partidos completados de la liga (excluyendo el partido actual)
	const completedMatches = await db
		.select({
			id: matches.id,
			homeTeamId: matches.homeTeamId,
			awayTeamId: matches.awayTeamId,
			homeScore: matches.homeScore,
			awayScore: matches.awayScore,
			matchDate: matches.matchDate,
		})
		.from(matches)
		.where(and(eq(matches.leagueId, leagueId), inArray(matches.status, COUNTED_MATCH_STATUSES)))
		.orderBy(desc(matches.matchDate));

	const [homeForm, awayForm] = await Promise.all([
		getTeamForm(homeTeamId, completedMatches),
		getTeamForm(awayTeamId, completedMatches),
	]);

	const winProb = calculateWinProbability(homeForm, awayForm);

	const matchIds = completedMatches.map((m) => m.id);

	const [homeThreats, awayThreats] = await Promise.all([
		getTopThreats(homeTeamId, matchIds, completedMatches),
		getTopThreats(awayTeamId, matchIds, completedMatches),
	]);

	const [homeCardRisk, awayCardRisk] = await Promise.all([
		getCardRisk(homeTeamId, matchIds),
		getCardRisk(awayTeamId, matchIds),
	]);

	const h2h = getHeadToHead(homeTeamId, awayTeamId, completedMatches);

	const bullets = buildNarratorBullets({
		homeTeamName: match.homeTeam.name,
		awayTeamName: match.awayTeam.name,
		homeForm,
		awayForm,
		winProb,
		homeThreats,
		awayThreats,
		homeCardRisk,
		awayCardRisk,
		h2h,
	});

	return {
		match: {
			id: match.id,
			homeTeam: match.homeTeam.name,
			awayTeam: match.awayTeam.name,
			league: match.league.name,
			matchday: matchdayRow?.number ?? null,
			date: match.matchDate,
		},
		teamForm: { home: homeForm, away: awayForm },
		winProbability: winProb,
		topThreats: { home: homeThreats, away: awayThreats },
		cardRisk: { home: homeCardRisk, away: awayCardRisk },
		headToHead: h2h,
		narratorBullets: bullets,
	};
}

type CompletedMatchRow = {
	id: string;
	homeTeamId: string;
	awayTeamId: string;
	homeScore: number | null;
	awayScore: number | null;
	matchDate: string;
};

// ---------------------------------------------------------------------------
// Forma del equipo: historial de partidos completados en la liga
// ---------------------------------------------------------------------------
function getTeamForm(teamId: string, completedMatches: CompletedMatchRow[]): TeamFormStats {
	const teamMatches = completedMatches.filter(
		(m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
	);

	let wins = 0,
		draws = 0,
		losses = 0,
		goalsFor = 0,
		goalsAgainst = 0;
	const results: ("W" | "D" | "L")[] = [];

	// Los partidos ya vienen ordenados por fecha desc — los últimos 5 son los primeros
	for (const m of teamMatches) {
		const isHome = m.homeTeamId === teamId;
		const myGoals = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
		const theirGoals = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);

		goalsFor += myGoals;
		goalsAgainst += theirGoals;

		if (myGoals > theirGoals) {
			wins++;
			results.push("W");
		} else if (myGoals === theirGoals) {
			draws++;
			results.push("D");
		} else {
			losses++;
			results.push("L");
		}
	}

	const played = wins + draws + losses;
	const points = wins * 3 + draws;

	return {
		record: { wins, draws, losses },
		points,
		goalsScored: goalsFor,
		goalsConceded: goalsAgainst,
		avgGoalsPerMatch: played > 0 ? Math.round((goalsFor / played) * 10) / 10 : 0,
		last5: results.slice(0, 5) as ("W" | "D" | "L")[],
	};
}

// ---------------------------------------------------------------------------
// Probabilidad de victoria (sin AI — fórmula ponderada)
// ---------------------------------------------------------------------------
function calculateWinProbability(
	homeForm: TeamFormStats,
	awayForm: TeamFormStats,
): MatchPreview["winProbability"] {
	const homePlayed = homeForm.record.wins + homeForm.record.draws + homeForm.record.losses;
	const awayPlayed = awayForm.record.wins + awayForm.record.draws + awayForm.record.losses;

	// Si no hay partidos jugados, retornar 50/50
	if (homePlayed === 0 && awayPlayed === 0) {
		return { homeWinPct: 50, drawPct: 15, awayWinPct: 35, method: "sin_datos" };
	}

	const homePpg = homePlayed > 0 ? homeForm.points / homePlayed : 0;
	const awayPpg = awayPlayed > 0 ? awayForm.points / awayPlayed : 0;

	// Fuerza: 60% puntos por partido + 40% promedio de goles
	const homeStrength = homePpg * 0.6 + homeForm.avgGoalsPerMatch * 0.4;
	const awayStrength = awayPpg * 0.6 + awayForm.avgGoalsPerMatch * 0.4;
	const total = homeStrength + awayStrength;

	let homeWinPct: number;
	let awayWinPct: number;
	let drawPct: number;

	if (total === 0) {
		homeWinPct = 40;
		awayWinPct = 30;
		drawPct = 30;
	} else {
		// El local tiene ventaja de cancha (+5%)
		homeWinPct = Math.min(75, Math.round((homeStrength / total) * 75) + 5);
		// Más empates cuando los equipos están equilibrados
		const balance = Math.abs(homeWinPct - 40);
		drawPct = Math.max(10, 25 - Math.floor(balance / 3));
		awayWinPct = 100 - homeWinPct - drawPct;
		if (awayWinPct < 5) {
			awayWinPct = 5;
			homeWinPct = 100 - drawPct - awayWinPct;
		}
	}

	return {
		homeWinPct,
		drawPct,
		awayWinPct,
		method: "weighted_record_home_advantage",
	};
}

// ---------------------------------------------------------------------------
// Jugadores más peligrosos de un equipo en la liga (V2 — match_player_stats)
// ---------------------------------------------------------------------------
async function getTopThreats(
	teamId: string,
	matchIds: string[],
	completedMatches: CompletedMatchRow[],
): Promise<TopThreat[]> {
	if (matchIds.length === 0) return [];

	const last3MatchIds = completedMatches
		.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
		.slice(0, 3)
		.map((m) => m.id);

	const [seasonStats, last3Stats] = await Promise.all([
		getTeamMatchStatsRoster(teamId, matchIds),
		last3MatchIds.length > 0 ? getTeamMatchStatsRoster(teamId, last3MatchIds) : Promise.resolve([]),
	]);

	const last3ByPlayer = new Map(last3Stats.map((s) => [s.playerId, s.goals]));

	const threats: TopThreat[] = [];
	for (const s of seasonStats) {
		const goalsThisSeason = s.goals;
		const assists = s.assists;
		// Solo incluir jugadores con al menos 1 gol o asistencia
		if (goalsThisSeason === 0 && assists === 0) continue;

		const goalsLast3 = last3ByPlayer.get(s.playerId) ?? 0;
		const goalsPerMatch =
			s.matchesPlayed > 0 ? Math.round((goalsThisSeason / s.matchesPlayed) * 100) / 100 : 0;

		threats.push({
			playerId: s.playerId,
			player: s.fullName,
			// global_players no tiene alias (apodo) — solo existía en la tabla V1 `players`.
			alias: null,
			goalsThisSeason,
			goalsLast3Matches: goalsLast3,
			assists,
			goalsPerMatch,
			dangerRating: calcDangerRating(goalsPerMatch, goalsLast3),
		});
	}

	// Ordenar por: goles últimos 3 → goles por partido → goles totales
	return threats
		.sort((a, b) => {
			if (b.goalsLast3Matches !== a.goalsLast3Matches)
				return b.goalsLast3Matches - a.goalsLast3Matches;
			if (b.goalsPerMatch !== a.goalsPerMatch) return b.goalsPerMatch - a.goalsPerMatch;
			return b.goalsThisSeason - a.goalsThisSeason;
		})
		.slice(0, 3);
}

function calcDangerRating(goalsPerMatch: number, goalsLast3: number): DangerRating {
	if (goalsPerMatch > 1 || goalsLast3 >= 3) return "ALTO";
	if (goalsPerMatch >= 0.5) return "MEDIO";
	return "BAJO";
}

// ---------------------------------------------------------------------------
// Jugadores en riesgo de tarjeta/suspensión (V2 — match_player_stats)
// ---------------------------------------------------------------------------
async function getCardRisk(teamId: string, matchIds: string[]): Promise<CardRiskPlayer[]> {
	if (matchIds.length === 0) return [];

	const stats = await getTeamMatchStatsRoster(teamId, matchIds);

	const risks: CardRiskPlayer[] = [];
	for (const s of stats) {
		// Incluir solo jugadores con riesgo real: 2+ amarillas o alguna roja
		if (s.yellowCards < 2 && s.redCards === 0) continue;

		let note = "";
		if (s.yellowCards >= 2) note = `${s.yellowCards} amarillas — 1 más = suspensión`;
		if (s.redCards > 0) note = `${s.redCards} tarjeta(s) roja — revisar suspensión vigente`;

		risks.push({
			playerId: s.playerId,
			player: s.fullName,
			yellowCards: s.yellowCards,
			redCards: s.redCards,
			note,
		});
	}

	return risks.sort((a, b) => b.yellowCards + b.redCards * 3 - (a.yellowCards + a.redCards * 3));
}

// ---------------------------------------------------------------------------
// Historial cara a cara entre los dos equipos en la misma liga
// ---------------------------------------------------------------------------
function getHeadToHead(
	homeTeamId: string,
	awayTeamId: string,
	completedMatches: CompletedMatchRow[],
): HeadToHead {
	const h2hMatches = completedMatches.filter(
		(m) =>
			(m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId) ||
			(m.homeTeamId === awayTeamId && m.awayTeamId === homeTeamId),
	);

	let homeWins = 0,
		draws = 0,
		awayWins = 0;

	for (const m of h2hMatches) {
		const isHomeFirst = m.homeTeamId === homeTeamId;
		const team1Goals = isHomeFirst ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
		const team2Goals = isHomeFirst ? (m.awayScore ?? 0) : (m.homeScore ?? 0);

		if (team1Goals > team2Goals) homeWins++;
		else if (team1Goals === team2Goals) draws++;
		else awayWins++;
	}

	const last = h2hMatches[0]; // Ya vienen ordenados por fecha desc
	let lastMatch: HeadToHead["lastMatch"] = null;

	if (last) {
		const isHomeFirst = last.homeTeamId === homeTeamId;
		const homeGoals = isHomeFirst ? (last.homeScore ?? 0) : (last.awayScore ?? 0);
		const awayGoals = isHomeFirst ? (last.awayScore ?? 0) : (last.homeScore ?? 0);
		const winner =
			homeGoals > awayGoals ? "local ganó" : homeGoals === awayGoals ? "empate" : "visitante ganó";
		lastMatch = {
			date: last.matchDate,
			result: `${homeGoals}-${awayGoals} (${winner})`,
		};
	}

	return {
		totalMatches: h2hMatches.length,
		homeWins,
		draws,
		awayWins,
		lastMatch,
	};
}

// ---------------------------------------------------------------------------
// Genera los bullets de texto para el narrador
// ---------------------------------------------------------------------------
function buildNarratorBullets(ctx: {
	homeTeamName: string;
	awayTeamName: string;
	homeForm: TeamFormStats;
	awayForm: TeamFormStats;
	winProb: MatchPreview["winProbability"];
	homeThreats: TopThreat[];
	awayThreats: TopThreat[];
	homeCardRisk: CardRiskPlayer[];
	awayCardRisk: CardRiskPlayer[];
	h2h: HeadToHead;
}): string[] {
	const bullets: string[] = [];
	const {
		homeTeamName,
		awayTeamName,
		homeForm,
		awayForm,
		winProb,
		homeThreats,
		awayThreats,
		homeCardRisk,
		awayCardRisk,
		h2h,
	} = ctx;

	// Favorito
	if (winProb.method !== "sin_datos") {
		const favTeam = winProb.homeWinPct > winProb.awayWinPct ? homeTeamName : awayTeamName;
		const favPct = Math.max(winProb.homeWinPct, winProb.awayWinPct);
		bullets.push(`${favTeam} llega como favorito con ${favPct}% de probabilidad de victoria.`);
	}

	// Forma reciente del local
	if (homeForm.record.wins + homeForm.record.draws + homeForm.record.losses > 0) {
		bullets.push(
			`${homeTeamName}: ${homeForm.record.wins}V ${homeForm.record.draws}E ${homeForm.record.losses}D — ` +
				`${homeForm.points} pts — promedio ${homeForm.avgGoalsPerMatch} goles/partido.`,
		);
	}

	// Forma reciente del visitante
	if (awayForm.record.wins + awayForm.record.draws + awayForm.record.losses > 0) {
		bullets.push(
			`${awayTeamName}: ${awayForm.record.wins}V ${awayForm.record.draws}E ${awayForm.record.losses}D — ` +
				`${awayForm.points} pts — promedio ${awayForm.avgGoalsPerMatch} goles/partido.`,
		);
	}

	// Amenaza principal del local
	for (const t of homeThreats.filter((t) => t.dangerRating === "ALTO").slice(0, 1)) {
		const name = t.alias ? `"${t.alias}"` : t.player;
		bullets.push(
			`${name} (${homeTeamName}) viene en racha: ${t.goalsLast3Matches} goles en los últimos 3 partidos — ` +
				`${t.goalsThisSeason} en la temporada.`,
		);
	}

	// Amenaza principal del visitante
	for (const t of awayThreats.filter((t) => t.dangerRating === "ALTO").slice(0, 1)) {
		const name = t.alias ? `"${t.alias}"` : t.player;
		bullets.push(
			`${name} (${awayTeamName}): ${t.goalsThisSeason} goles esta temporada con ${t.goalsPerMatch} por partido.`,
		);
	}

	// Riesgo de tarjetas
	for (const p of [...homeCardRisk, ...awayCardRisk].slice(0, 2)) {
		bullets.push(`${p.player}: ${p.note}.`);
	}

	// Historial cara a cara
	if (h2h.totalMatches > 0) {
		const leader =
			h2h.homeWins > h2h.awayWins
				? `${homeTeamName} domina con ${h2h.homeWins} victorias`
				: h2h.awayWins > h2h.homeWins
					? `${awayTeamName} domina con ${h2h.awayWins} victorias`
					: `Historial igualado entre ambos equipos`;
		bullets.push(
			`En ${h2h.totalMatches} enfrentamientos previos: ${leader}. ${
				h2h.lastMatch ? `Último resultado: ${h2h.lastMatch.result}.` : ""
			}`,
		);
	}

	// Goles si hay buen promedio combinado
	const avgGols = homeForm.avgGoalsPerMatch + awayForm.avgGoalsPerMatch;
	if (avgGols >= 5) {
		bullets.push(
			`Partido de alto voltaje esperado: ambos equipos promedian ${avgGols.toFixed(1)} goles combinados por partido.`,
		);
	}

	return bullets;
}
