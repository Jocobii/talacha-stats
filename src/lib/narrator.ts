/**
 * narrator.ts — Análisis pre-partido para el narrador del Facebook Live.
 * A diferencia de preview.ts (ligado a un match_id), este módulo funciona
 * con cualquier par de equipos que el narrador elija libremente.
 *
 * Fuentes de datos, en orden de prioridad:
 *  1. player_season_stats  → stats acumuladas importadas desde Excel
 *  2. match_events         → fallback si no hay import
 *  3. team_standings_snapshot → forma/récord del equipo (desde Excel)
 *  4. matches              → fallback + últimos 5 resultados + H2H
 */

import {
	db,
	matches,
	matchEvents,
	playerRegistrations,
	playerSeasonStats,
	teamStandingsSnapshot,
	teams,
	leagues,
} from "@/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

// ────────────────────────────────────────────────────────────────────────────
// Tipos públicos del módulo
// ────────────────────────────────────────────────────────────────────────────

export type DangerRating = "ALTO" | "MEDIO" | "BAJO";

export type RosterPlayer = {
	playerId: string;
	fullName: string;
	alias: string | null;
	goals: number;
	assists: number;
	contributions: number; // goals + assists — métrica combinada
	yellowCards: number;
	redCards: number;
	matchesPlayed: number;
	goalsPerMatch: number;
	dangerRating: DangerRating;
};

export type TeamStreak = { type: "W" | "D" | "L"; count: number };

export type TeamAnalysis = {
	team: { id: string; name: string };
	position: number | null;
	record: { wins: number; draws: number; losses: number; played: number };
	points: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDiff: number;
	avgGoalsFor: number;
	avgGoalsAgainst: number;
	last5: ("W" | "D" | "L")[];
	currentStreak: TeamStreak | null;
	roster: RosterPlayer[]; // plantel completo ordenado por contribuciones
	topScorer: RosterPlayer | null;
	topAssist: RosterPlayer | null;
	topContributor: RosterPlayer | null;
	cardRisk: {
		player: string;
		alias: string | null;
		yellowCards: number;
		redCards: number;
		note: string;
	}[];
};

export type H2HRecord = {
	total: number;
	aWins: number;
	draws: number;
	bWins: number;
	lastMatch: {
		date: string;
		aGoals: number;
		bGoals: number;
		result: string;
	} | null;
};

export type WinProbability = {
	aWinPct: number;
	drawPct: number;
	bWinPct: number;
	method: string;
};

export type NarratorAnalysis = {
	league: { id: string; name: string; season: string };
	teamA: TeamAnalysis;
	teamB: TeamAnalysis;
	winProbability: WinProbability;
	headToHead: H2HRecord;
	narratorBullets: string[];
	funFacts: string[];
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

	// Partidos completados de la liga (para H2H, last5, fallback de stats)
	const completedMatches = await db.query.matches.findMany({
		where: and(eq(matches.leagueId, leagueId), eq(matches.status, "completed")),
		orderBy: [desc(matches.matchDate)],
	});

	// Análisis paralelo de ambos equipos
	const [analysisA, analysisB] = await Promise.all([
		buildTeamAnalysis(teamA, leagueId, completedMatches),
		buildTeamAnalysis(teamB, leagueId, completedMatches),
	]);

	const winProb = calcWinProbability(analysisA, analysisB);
	const h2h = buildH2H(teamAId, teamBId, completedMatches);

	const bullets = buildBullets(
		teamA.name,
		teamB.name,
		analysisA,
		analysisB,
		winProb,
		h2h,
	);
	const funFacts = buildFunFacts(
		teamA.name,
		teamB.name,
		analysisA,
		analysisB,
		h2h,
	);

	return {
		league: { id: league.id, name: league.name, season: league.season },
		teamA: analysisA,
		teamB: analysisB,
		winProbability: winProb,
		headToHead: h2h,
		narratorBullets: bullets,
		funFacts,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Construcción del análisis por equipo
// ────────────────────────────────────────────────────────────────────────────

async function buildTeamAnalysis(
	team: { id: string; name: string },
	leagueId: string,
	completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>,
): Promise<TeamAnalysis> {
	const [record, roster] = await Promise.all([
		getTeamRecord(team.id, leagueId, completedMatches),
		getTeamRoster(team.id, leagueId, completedMatches),
	]);

	const last5 = getLast5(team.id, completedMatches);
	const currentStreak = calcStreak(team.id, completedMatches);

	// Posición en tabla
	const position = await getTeamPosition(team.id, leagueId);

	const topScorer = roster.find((p) => p.goals > 0) ?? null;
	const topAssist =
		[...roster]
			.sort((a, b) => b.assists - a.assists)
			.find((p) => p.assists > 0) ?? null;
	const topContributor = roster[0] ?? null; // ya ordenado por contribuciones

	const cardRisk = roster
		.filter((p) => p.yellowCards >= 2 || p.redCards > 0)
		.sort(
			(a, b) =>
				b.yellowCards + b.redCards * 3 - (a.yellowCards + a.redCards * 3),
		)
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

	return {
		team,
		position,
		record: record.record,
		points: record.points,
		goalsFor: record.goalsFor,
		goalsAgainst: record.goalsAgainst,
		goalDiff: record.goalsFor - record.goalsAgainst,
		avgGoalsFor:
			record.record.played > 0
				? Math.round((record.goalsFor / record.record.played) * 10) / 10
				: 0,
		avgGoalsAgainst:
			record.record.played > 0
				? Math.round((record.goalsAgainst / record.record.played) * 10) / 10
				: 0,
		last5,
		currentStreak,
		roster,
		topScorer,
		topAssist,
		topContributor,
		cardRisk,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Récord del equipo: snapshot primero, luego matches
// ────────────────────────────────────────────────────────────────────────────

async function getTeamRecord(
	teamId: string,
	leagueId: string,
	completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>,
) {
	// Intento 1: snapshot importado desde Excel (jornada más reciente)
	const snapshot = await db.query.teamStandingsSnapshot.findFirst({
		where: and(
			eq(teamStandingsSnapshot.teamId, teamId),
			eq(teamStandingsSnapshot.leagueId, leagueId),
		),
		orderBy: [desc(teamStandingsSnapshot.jornada)],
	});

	if (snapshot) {
		return {
			record: {
				wins: snapshot.wins,
				draws: snapshot.draws,
				losses: snapshot.losses,
				played: snapshot.played,
			},
			points: snapshot.points,
			goalsFor: snapshot.goalsFor,
			goalsAgainst: snapshot.goalsAgainst,
		};
	}

	// Intento 2: calcular desde partidos completados
	const teamMatches = completedMatches.filter(
		(m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
	);

	let wins = 0,
		draws = 0,
		losses = 0,
		goalsFor = 0,
		goalsAgainst = 0;
	for (const m of teamMatches) {
		const isHome = m.homeTeamId === teamId;
		const gf = isHome ? m.homeScore : m.awayScore;
		const ga = isHome ? m.awayScore : m.homeScore;
		goalsFor += gf;
		goalsAgainst += ga;
		if (gf > ga) wins++;
		else if (gf === ga) draws++;
		else losses++;
	}

	return {
		record: { wins, draws, losses, played: wins + draws + losses },
		points: wins * 3 + draws,
		goalsFor,
		goalsAgainst,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Plantel con estadísticas
// ────────────────────────────────────────────────────────────────────────────

async function getTeamRoster(
	teamId: string,
	leagueId: string,
	completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>,
): Promise<RosterPlayer[]> {
	const regs = await db.query.playerRegistrations.findMany({
		where: and(
			eq(playerRegistrations.teamId, teamId),
			eq(playerRegistrations.leagueId, leagueId),
		),
		with: { player: true },
	});

	if (regs.length === 0) return [];

	const playerIds = regs.map((r) => r.playerId);

	// Traer todos los season_stats de una sola query
	const allStats = await db.query.playerSeasonStats.findMany({
		where: and(
			eq(playerSeasonStats.leagueId, leagueId),
			inArray(playerSeasonStats.playerId, playerIds),
		),
	});

	const statsMap = new Map(allStats.map((s) => [s.playerId, s]));

	// Si hay season_stats para al menos la mitad del plantel, usar ese método
	const useSeasonStats = allStats.length > 0;

	const roster: RosterPlayer[] = [];

	for (const reg of regs) {
		const pid = reg.playerId;
		const player = reg.player;

		let goals = 0,
			assists = 0,
			yellowCards = 0,
			redCards = 0,
			matchesPlayed = 0;

		if (useSeasonStats && statsMap.has(pid)) {
			const s = statsMap.get(pid)!;
			goals = s.goals;
			assists = s.assists;
			yellowCards = s.yellowCards;
			redCards = s.redCards;
			matchesPlayed = s.matchesPlayed;
		} else {
			// Fallback desde match_events
			const matchIds = completedMatches.map((m) => m.id);
			if (matchIds.length > 0) {
				const events = await db
					.select({
						eventType: matchEvents.eventType,
						count: sql<number>`count(*)::int`,
					})
					.from(matchEvents)
					.where(
						and(
							eq(matchEvents.playerId, pid),
							inArray(matchEvents.matchId, matchIds),
						),
					)
					.groupBy(matchEvents.eventType);

				const counts = Object.fromEntries(
					events.map((e) => [e.eventType, e.count]),
				);
				goals = counts["goal"] ?? 0;
				assists = counts["assist"] ?? 0;
				yellowCards = counts["yellow_card"] ?? 0;
				redCards = counts["red_card"] ?? 0;

				const played = await db
					.selectDistinct({ matchId: matchEvents.matchId })
					.from(matchEvents)
					.where(
						and(
							eq(matchEvents.playerId, pid),
							inArray(matchEvents.matchId, matchIds),
						),
					);
				matchesPlayed = played.length;
			}
		}

		const gpm =
			matchesPlayed > 0 ? Math.round((goals / matchesPlayed) * 100) / 100 : 0;

		roster.push({
			playerId: pid,
			fullName: player.fullName,
			alias: player.alias,
			goals,
			assists,
			contributions: goals + assists,
			yellowCards,
			redCards,
			matchesPlayed,
			goalsPerMatch: gpm,
			dangerRating: calcDangerRating(gpm, goals),
		});
	}

	// Ordenar: más contribuciones → más goles → nombre
	return roster.sort((a, b) => {
		if (b.contributions !== a.contributions)
			return b.contributions - a.contributions;
		if (b.goals !== a.goals) return b.goals - a.goals;
		return a.fullName.localeCompare(b.fullName);
	});
}

// ────────────────────────────────────────────────────────────────────────────
// Últimos 5 resultados y racha actual
// ────────────────────────────────────────────────────────────────────────────

function getLast5(
	teamId: string,
	completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>,
): ("W" | "D" | "L")[] {
	return completedMatches
		.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
		.slice(0, 5)
		.map((m) => {
			const isHome = m.homeTeamId === teamId;
			const gf = isHome ? m.homeScore : m.awayScore;
			const ga = isHome ? m.awayScore : m.homeScore;
			return gf > ga ? "W" : gf === ga ? "D" : "L";
		});
}

function calcStreak(
	teamId: string,
	completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>,
): TeamStreak | null {
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

async function getTeamPosition(
	teamId: string,
	leagueId: string,
): Promise<number | null> {
	// Traer todos los snapshots de la liga en la jornada más reciente
	const latestJornada = await db
		.select({ maxJornada: sql<number>`max(jornada)::int` })
		.from(teamStandingsSnapshot)
		.where(eq(teamStandingsSnapshot.leagueId, leagueId));

	const jornada = latestJornada[0]?.maxJornada;
	if (!jornada) return null;

	const standings = await db.query.teamStandingsSnapshot.findMany({
		where: and(
			eq(teamStandingsSnapshot.leagueId, leagueId),
			eq(teamStandingsSnapshot.jornada, jornada),
		),
		orderBy: [desc(teamStandingsSnapshot.points)],
	});

	const idx = standings.findIndex((s) => s.teamId === teamId);
	return idx >= 0 ? idx + 1 : null;
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

	if (total === 0)
		return { aWinPct: 38, drawPct: 24, bWinPct: 38, method: "sin_datos" };

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

function buildH2H(
	aId: string,
	bId: string,
	completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>,
): H2HRecord {
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
		const aGoals = aIsHome ? m.homeScore : m.awayScore;
		const bGoals = aIsHome ? m.awayScore : m.homeScore;
		if (aGoals > bGoals) aWins++;
		else if (aGoals === bGoals) draws++;
		else bWins++;
	}

	const last = h2hMatches[0] ?? null;
	let lastMatch: H2HRecord["lastMatch"] = null;

	if (last) {
		const aIsHome = last.homeTeamId === aId;
		const aGoals = aIsHome ? last.homeScore : last.awayScore;
		const bGoals = aIsHome ? last.awayScore : last.homeScore;
		const result =
			aGoals > bGoals ? "A ganó" : aGoals === bGoals ? "Empate" : "B ganó";
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
		const aPos =
			a.position !== null ? `${aName} va ${ordinal(a.position)}` : null;
		const bPos =
			b.position !== null ? `${bName} va ${ordinal(b.position)}` : null;
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
		const word = { W: "victorias", D: "empates", L: "derrotas" }[
			a.currentStreak.type
		];
		bullets.push(
			`🔥 ${aName} lleva ${a.currentStreak.count} ${word} consecutivas.`,
		);
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
		const word = { W: "victorias", D: "empates", L: "derrotas" }[
			b.currentStreak.type
		];
		bullets.push(
			`🔥 ${bName} lleva ${b.currentStreak.count} ${word} consecutivas.`,
		);
	}

	// Goleador de A
	if (a.topScorer) {
		const name = displayName(a.topScorer);
		bullets.push(
			`⚡ Amenaza principal de ${aName}: ${name} con ${a.topScorer.goals} goles` +
				(a.topScorer.goalsPerMatch > 0
					? ` (${a.topScorer.goalsPerMatch} por partido)`
					: "") +
				".",
		);
	}

	// Goleador de B
	if (b.topScorer) {
		const name = displayName(b.topScorer);
		bullets.push(
			`⚡ Amenaza principal de ${bName}: ${name} con ${b.topScorer.goals} goles` +
				(b.topScorer.goalsPerMatch > 0
					? ` (${b.topScorer.goalsPerMatch} por partido)`
					: "") +
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
				(h2h.lastMatch
					? ` Último: ${h2h.lastMatch.aGoals}-${h2h.lastMatch.bGoals}.`
					: ""),
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

	// Mejor ataque
	if (a.record.played > 0 && b.record.played > 0) {
		if (a.avgGoalsFor > b.avgGoalsFor) {
			facts.push(
				`${aName} tiene el mejor ataque: ${a.avgGoalsFor} goles promedio vs ${b.avgGoalsFor} de ${bName}.`,
			);
		} else if (b.avgGoalsFor > a.avgGoalsFor) {
			facts.push(
				`${bName} tiene el mejor ataque: ${b.avgGoalsFor} goles promedio vs ${a.avgGoalsFor} de ${aName}.`,
			);
		}
	}

	// Mejor defensa
	if (a.record.played > 0 && b.record.played > 0) {
		if (a.avgGoalsAgainst < b.avgGoalsAgainst) {
			facts.push(
				`${aName} es más sólido en defensa: solo ${a.avgGoalsAgainst} goles en contra por partido.`,
			);
		} else if (b.avgGoalsAgainst < a.avgGoalsAgainst) {
			facts.push(
				`${bName} es más sólido en defensa: solo ${b.avgGoalsAgainst} goles en contra por partido.`,
			);
		}
	}

	// Diferencia de goles
	const aDiff = a.goalDiff;
	const bDiff = b.goalDiff;
	if (aDiff > 0)
		facts.push(`${aName} tiene diferencia de goles positiva: +${aDiff}.`);
	if (bDiff > 0)
		facts.push(`${bName} tiene diferencia de goles positiva: +${bDiff}.`);

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
		const moreGoals =
			a.topScorer.goals > b.topScorer.goals ? a.topScorer : b.topScorer;
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
// Helpers internos
// ────────────────────────────────────────────────────────────────────────────

function calcDangerRating(
	goalsPerMatch: number,
	totalGoals: number,
): DangerRating {
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
