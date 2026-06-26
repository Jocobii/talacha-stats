/**
 * features/narrator-analysis/analysis.ts
 *
 * Motor de análisis pre-partido — PURO y AGNÓSTICO a la fuente de datos.
 * No importa `@/db`. Recibe un `NarratorInput` (que produce cualquier adapter:
 * BD o Excel) y devuelve el `NarratorAnalysis` que consume la UI y el export.
 *
 * Toda la lógica que antes vivía mezclada con queries en `lib/narrator.ts`
 * (probabilidad, simulador, ranks, predicción, bullets, fun facts) vive aquí,
 * descompuesta en helpers pequeños y testeables (§3.5, §18).
 */

import type {
	H2HRecord,
	LeagueStandingRow,
	MatchPrediction,
	NarratorAnalysis,
	NarratorInput,
	NarratorMatch,
	PositionScenario,
	PositionSimulator,
	RosterPlayer,
	TeamAnalysis,
	TeamInputData,
	WinProbability,
} from "@/entities/narrator/model";

// ════════════════════════════════════════════════════════════════════════════
// Punto de entrada
// ════════════════════════════════════════════════════════════════════════════

export function computeNarratorAnalysis(input: NarratorInput): NarratorAnalysis {
	const { teamA, teamB, standings, matches, league, lastMatchday } = input;
	const totalTeams = standings.length;

	const analysisA = buildTeamAnalysis(teamA, standings, totalTeams);
	const analysisB = buildTeamAnalysis(teamB, standings, totalTeams);

	const winProbability = calcWinProbability(analysisA, analysisB);
	const headToHead = buildH2H(teamA.team.id, teamB.team.id, matches);
	const positionSimulator = buildPositionSimulator(teamA.team.id, teamB.team.id, standings);
	const matchPrediction = buildMatchPrediction(analysisA, analysisB);

	const aName = teamA.team.name;
	const bName = teamB.team.name;

	return {
		league,
		lastMatchday,
		teamA: analysisA,
		teamB: analysisB,
		winProbability,
		headToHead,
		positionSimulator,
		matchPrediction,
		narratorBullets: buildBullets(aName, bName, analysisA, analysisB, winProbability, headToHead),
		funFacts: buildFunFacts(aName, bName, analysisA, analysisB, headToHead),
	};
}

// ════════════════════════════════════════════════════════════════════════════
// Análisis por equipo
// ════════════════════════════════════════════════════════════════════════════

function buildTeamAnalysis(
	data: TeamInputData,
	standings: LeagueStandingRow[],
	totalTeams: number,
): TeamAnalysis {
	const { record, points, goalsFor, goalsAgainst, roster } = data;
	const ranks = computeLeagueRanks(data.team.id, standings);

	return {
		team: data.team,
		position: data.position,
		record,
		points,
		goalsFor,
		goalsAgainst,
		goalDiff: goalsFor - goalsAgainst,
		avgGoalsFor: perMatch(goalsFor, record.played),
		avgGoalsAgainst: perMatch(goalsAgainst, record.played),
		last5: data.last5,
		currentStreak: data.currentStreak,
		roster,
		topScorer: roster.find((p) => p.goals > 0) ?? null,
		topAssist: pickTopAssist(roster),
		topContributor: roster[0] ?? null, // el adapter entrega el roster ya ordenado
		topScoringThreats: roster.filter((p) => p.goals > 0).slice(0, 3),
		cardRisk: buildCardRisk(roster),
		attackRank: ranks.attackRank,
		defenseRank: ranks.defenseRank,
		totalTeams,
	};
}

function pickTopAssist(roster: RosterPlayer[]): RosterPlayer | null {
	return [...roster].sort((a, b) => b.assists - a.assists).find((p) => p.assists > 0) ?? null;
}

function buildCardRisk(roster: RosterPlayer[]): TeamAnalysis["cardRisk"] {
	return roster
		.filter((p) => p.yellowCards >= 2 || p.redCards > 0)
		.sort((a, b) => cardWeight(b) - cardWeight(a))
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
}

function cardWeight(p: RosterPlayer): number {
	return p.yellowCards + p.redCards * 3;
}

// ════════════════════════════════════════════════════════════════════════════
// Probabilidad de victoria
// ════════════════════════════════════════════════════════════════════════════

function calcWinProbability(a: TeamAnalysis, b: TeamAnalysis): WinProbability {
	const aPlayed = a.record.played;
	const bPlayed = b.record.played;

	if (aPlayed === 0 && bPlayed === 0) {
		return { aWinPct: 40, drawPct: 20, bWinPct: 40, method: "sin_datos" };
	}

	// Fuerza = 60% puntos/partido + 40% promedio goles
	const aStr = (aPlayed > 0 ? a.points / aPlayed : 0) * 0.6 + a.avgGoalsFor * 0.4;
	const bStr = (bPlayed > 0 ? b.points / bPlayed : 0) * 0.6 + b.avgGoalsFor * 0.4;
	const total = aStr + bStr;

	if (total === 0) return { aWinPct: 38, drawPct: 24, bWinPct: 38, method: "sin_datos" };

	let aWinPct = Math.min(72, Math.round((aStr / total) * 72));
	const drawPct = Math.max(10, 28 - Math.floor(Math.abs(aWinPct - 36) / 3));
	let bWinPct = 100 - aWinPct - drawPct;

	if (bWinPct < 5) {
		bWinPct = 5;
		aWinPct = 100 - drawPct - bWinPct;
	}

	return { aWinPct, drawPct, bWinPct, method: "weighted_record" };
}

// ════════════════════════════════════════════════════════════════════════════
// Head to head (desde los partidos del input; vacío → registro en cero)
// ════════════════════════════════════════════════════════════════════════════

function buildH2H(aId: string, bId: string, matches: NarratorMatch[]): H2HRecord {
	const h2h = matches.filter(
		(m) =>
			(m.homeTeamId === aId && m.awayTeamId === bId) ||
			(m.homeTeamId === bId && m.awayTeamId === aId),
	);

	let aWins = 0;
	let draws = 0;
	let bWins = 0;

	for (const m of h2h) {
		const { aGoals, bGoals } = goalsFromPerspective(m, aId);
		if (aGoals > bGoals) aWins++;
		else if (aGoals === bGoals) draws++;
		else bWins++;
	}

	return { total: h2h.length, aWins, draws, bWins, lastMatch: buildLastMatch(h2h[0], aId) };
}

function buildLastMatch(match: NarratorMatch | undefined, aId: string): H2HRecord["lastMatch"] {
	if (!match) return null;
	const { aGoals, bGoals } = goalsFromPerspective(match, aId);
	const result = aGoals > bGoals ? "A ganó" : aGoals === bGoals ? "Empate" : "B ganó";
	return { date: match.matchDate, aGoals, bGoals, result };
}

function goalsFromPerspective(m: NarratorMatch, aId: string): { aGoals: number; bGoals: number } {
	const aIsHome = m.homeTeamId === aId;
	return {
		aGoals: (aIsHome ? m.homeScore : m.awayScore) ?? 0,
		bGoals: (aIsHome ? m.awayScore : m.homeScore) ?? 0,
	};
}

// ════════════════════════════════════════════════════════════════════════════
// Simulador de posición y ranks de liga
// ════════════════════════════════════════════════════════════════════════════

function rankByStandings(rows: LeagueStandingRow[]): Map<string, number> {
	const sorted = [...rows].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const diff = b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
		if (diff !== 0) return diff;
		return b.goalsFor - a.goalsFor;
	});
	return new Map(sorted.map((r, i) => [r.teamId, i + 1]));
}

function buildPositionSimulator(
	aId: string,
	bId: string,
	standings: LeagueStandingRow[],
): PositionSimulator {
	const empty: PositionScenario = {
		currentPoints: 0,
		currentPosition: null,
		ifWin: null,
		ifDraw: null,
		ifLoss: null,
	};
	if (standings.length === 0) return { teamA: empty, teamB: empty };

	const currentRanks = rankByStandings(standings);
	const simulate = (aDelta: number, bDelta: number) => {
		const sim = standings.map((r) => {
			if (r.teamId === aId) return { ...r, points: r.points + aDelta };
			if (r.teamId === bId) return { ...r, points: r.points + bDelta };
			return r;
		});
		const ranks = rankByStandings(sim);
		return { posA: ranks.get(aId) ?? null, posB: ranks.get(bId) ?? null };
	};

	const win = simulate(3, 0);
	const draw = simulate(1, 1);
	const loss = simulate(0, 3);

	return {
		teamA: {
			currentPoints: standings.find((r) => r.teamId === aId)?.points ?? 0,
			currentPosition: currentRanks.get(aId) ?? null,
			ifWin: win.posA,
			ifDraw: draw.posA,
			ifLoss: loss.posA,
		},
		teamB: {
			currentPoints: standings.find((r) => r.teamId === bId)?.points ?? 0,
			currentPosition: currentRanks.get(bId) ?? null,
			ifWin: loss.posB,
			ifDraw: draw.posB,
			ifLoss: win.posB,
		},
	};
}

function computeLeagueRanks(
	teamId: string,
	standings: LeagueStandingRow[],
): { attackRank: number | null; defenseRank: number | null } {
	if (standings.length === 0) return { attackRank: null, defenseRank: null };

	const ai = [...standings]
		.sort((a, b) => b.goalsFor - a.goalsFor)
		.findIndex((r) => r.teamId === teamId);
	const di = [...standings]
		.sort((a, b) => a.goalsAgainst - b.goalsAgainst)
		.findIndex((r) => r.teamId === teamId);

	return { attackRank: ai >= 0 ? ai + 1 : null, defenseRank: di >= 0 ? di + 1 : null };
}

// ════════════════════════════════════════════════════════════════════════════
// Predicción del partido
// ════════════════════════════════════════════════════════════════════════════

function buildMatchPrediction(a: TeamAnalysis, b: TeamAnalysis): MatchPrediction {
	const hasData = a.record.played > 0 && b.record.played > 0;
	if (!hasData) return emptyPrediction();

	const xA = round1((a.avgGoalsFor + b.avgGoalsAgainst) / 2);
	const xB = round1((b.avgGoalsFor + a.avgGoalsAgainst) / 2);
	const total = round1(xA + xB);

	return {
		expectedGoalsA: xA,
		expectedGoalsB: xB,
		expectedTotal: total,
		totalLabel: total < 3.5 ? "cerrado" : total <= 5.5 ? "abierto" : "festival",
		likelyScoreA: Math.round(xA),
		likelyScoreB: Math.round(xB),
		bothTeamsToScore: xA >= 0.8 && xB >= 0.8,
		offensiveEdge: edge(a.avgGoalsFor, b.avgGoalsAgainst, b.avgGoalsFor, a.avgGoalsAgainst),
		defensiveEdge: defensiveEdge(
			a.avgGoalsAgainst,
			b.avgGoalsFor,
			b.avgGoalsAgainst,
			a.avgGoalsFor,
		),
		hasData: true,
	};
}

function edge(
	aAtk: number,
	bDef: number,
	bAtk: number,
	aDef: number,
): MatchPrediction["offensiveEdge"] {
	if (aAtk > bDef + 0.5) return "A";
	if (bAtk > aDef + 0.5) return "B";
	return "equal";
}

function defensiveEdge(
	aDef: number,
	bAtk: number,
	bDef: number,
	aAtk: number,
): MatchPrediction["defensiveEdge"] {
	if (aDef < bAtk - 0.5) return "A";
	if (bDef < aAtk - 0.5) return "B";
	return "equal";
}

function emptyPrediction(): MatchPrediction {
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

// ════════════════════════════════════════════════════════════════════════════
// Bullets del narrador (cada helper devuelve string | null; al final se filtran)
// ════════════════════════════════════════════════════════════════════════════

function buildBullets(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
	prob: WinProbability,
	h2h: H2HRecord,
): string[] {
	const lines = [
		favoriteBullet(aName, bName, prob),
		positionBullet(aName, bName, a, b),
		formBullet(aName, a),
		streakBullet(aName, a),
		formBullet(bName, b),
		streakBullet(bName, b),
		scorerBullet(aName, a),
		scorerBullet(bName, b),
		...cardBullets(a, b),
		h2hBullet(aName, bName, h2h),
	];
	return lines.filter((l): l is string => l !== null);
}

function favoriteBullet(aName: string, bName: string, prob: WinProbability): string | null {
	if (prob.method === "sin_datos") return null;
	if (prob.aWinPct > prob.bWinPct + 10)
		return `📊 ${aName} llega como favorito con ${prob.aWinPct}% de probabilidad de victoria.`;
	if (prob.bWinPct > prob.aWinPct + 10)
		return `📊 ${bName} llega como favorito con ${prob.bWinPct}% de probabilidad de victoria.`;
	return `📊 Partido muy parejo: ${aName} ${prob.aWinPct}% — Empate ${prob.drawPct}% — ${bName} ${prob.bWinPct}%.`;
}

function positionBullet(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
): string | null {
	const parts = [
		a.position !== null ? `${aName} va ${ordinal(a.position)}` : null,
		b.position !== null ? `${bName} va ${ordinal(b.position)}` : null,
	].filter(Boolean);
	return parts.length > 0 ? `🏆 En la tabla: ${parts.join(", ")}.` : null;
}

function formBullet(name: string, t: TeamAnalysis): string | null {
	if (t.record.played === 0) return null;
	return (
		`⚽ ${name}: ${t.record.wins}G ${t.record.draws}E ${t.record.losses}P — ` +
		`${t.points} pts — promedio ${t.avgGoalsFor} goles por partido.`
	);
}

function streakBullet(name: string, t: TeamAnalysis): string | null {
	if (!t.currentStreak || t.currentStreak.count < 2) return null;
	const word = { W: "victorias", D: "empates", L: "derrotas" }[t.currentStreak.type];
	return `🔥 ${name} lleva ${t.currentStreak.count} ${word} consecutivas.`;
}

function scorerBullet(name: string, t: TeamAnalysis): string | null {
	if (!t.topScorer) return null;
	const perMatchStr =
		t.topScorer.goalsPerMatch > 0 ? ` (${t.topScorer.goalsPerMatch} por partido)` : "";
	return `⚡ Amenaza principal de ${name}: ${displayName(t.topScorer)} con ${t.topScorer.goals} goles${perMatchStr}.`;
}

function cardBullets(a: TeamAnalysis, b: TeamAnalysis): string[] {
	return [...a.cardRisk.slice(0, 1), ...b.cardRisk.slice(0, 1)].map(
		(p) => `🟨 ${p.player}: ${p.note}.`,
	);
}

function h2hBullet(aName: string, bName: string, h2h: H2HRecord): string | null {
	if (h2h.total === 0) return null;
	const leader =
		h2h.aWins > h2h.bWins
			? `${aName} domina`
			: h2h.bWins > h2h.aWins
				? `${bName} domina`
				: "Historial igualado";
	const last = h2h.lastMatch ? ` Último: ${h2h.lastMatch.aGoals}-${h2h.lastMatch.bGoals}.` : "";
	return (
		`📋 En ${h2h.total} enfrentamiento${h2h.total !== 1 ? "s" : ""} previos: ${leader} ` +
		`(${h2h.aWins}-${h2h.draws}-${h2h.bWins}).${last}`
	);
}

// ════════════════════════════════════════════════════════════════════════════
// Fun facts (máximo 6)
// ════════════════════════════════════════════════════════════════════════════

function buildFunFacts(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
	h2h: H2HRecord,
): string[] {
	const facts = [
		attackFact(aName, a),
		attackFact(bName, b),
		defenseFact(aName, a),
		defenseFact(bName, b),
		diffFact(aName, a.goalDiff),
		diffFact(bName, b.goalDiff),
		topContributorFact(aName, bName, a, b),
		topScorerFact(aName, bName, a, b),
		playmakerFact(aName, a),
		playmakerFact(bName, b),
		voltageFact(a, b),
		h2hDominanceFact(aName, bName, h2h),
	];
	return facts.filter((f): f is string => f !== null).slice(0, 6);
}

function attackFact(name: string, t: TeamAnalysis): string | null {
	if (t.attackRank === null || t.totalTeams <= 2) return null;
	const label =
		t.attackRank === 1
			? "el equipo más goleador de la liga"
			: `${ordinal(t.attackRank)} mejor ataque de ${t.totalTeams} equipos`;
	return `${name} tiene ${label} con ${t.goalsFor} goles anotados.`;
}

function defenseFact(name: string, t: TeamAnalysis): string | null {
	if (t.defenseRank === null || t.totalTeams <= 2) return null;
	const label =
		t.defenseRank === 1
			? "la mejor defensa de la liga"
			: `${ordinal(t.defenseRank)} mejor defensa de ${t.totalTeams} equipos`;
	return `${name} tiene ${label} con ${t.goalsAgainst} goles en contra.`;
}

function diffFact(name: string, diff: number): string | null {
	return diff > 0 ? `${name} tiene diferencia de goles positiva: +${diff}.` : null;
}

function topContributorFact(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
): string | null {
	const all = [
		...a.roster.map((p) => ({ ...p, team: aName })),
		...b.roster.map((p) => ({ ...p, team: bName })),
	].sort((x, y) => y.contributions - x.contributions);

	const top = all[0];
	if (!top || top.contributions <= 0) return null;
	return (
		`El jugador más completo del partido: ${displayName(top)} (${top.team}) — ` +
		`${top.goals} goles + ${top.assists} asistencias = ${top.contributions} contribuciones.`
	);
}

function topScorerFact(
	aName: string,
	bName: string,
	a: TeamAnalysis,
	b: TeamAnalysis,
): string | null {
	if (!a.topScorer || !b.topScorer || a.topScorer.goals === b.topScorer.goals) return null;
	const aMore = a.topScorer.goals > b.topScorer.goals;
	const top = aMore ? a.topScorer : b.topScorer;
	const team = aMore ? aName : bName;
	return `El máximo goleador del partido podría ser ${displayName(top)} de ${team} con ${top.goals} goles esta temporada.`;
}

function playmakerFact(name: string, t: TeamAnalysis): string | null {
	if (!t.topAssist || t.topAssist.assists < 3) return null;
	return `Ojo con el playmaker de ${name}: ${displayName(t.topAssist)} lleva ${t.topAssist.assists} asistencias — clave para el juego colectivo.`;
}

function voltageFact(a: TeamAnalysis, b: TeamAnalysis): string | null {
	const combined = a.avgGoalsFor + b.avgGoalsFor;
	if (combined >= 6)
		return `Partido de alto voltaje ofensivo: ambos equipos promedian ${combined.toFixed(1)} goles combinados por partido.`;
	if (combined <= 3 && a.record.played > 0 && b.record.played > 0)
		return `Se espera un partido táctico y cerrado: ambos equipos promedian solo ${combined.toFixed(1)} goles combinados.`;
	return null;
}

function h2hDominanceFact(aName: string, bName: string, h2h: H2HRecord): string | null {
	if (h2h.total < 3) return null;
	if (h2h.aWins >= h2h.total * 0.67)
		return `${aName} ha ganado ${h2h.aWins} de ${h2h.total} enfrentamientos — historial muy favorable.`;
	if (h2h.bWins >= h2h.total * 0.67)
		return `${bName} ha ganado ${h2h.bWins} de ${h2h.total} enfrentamientos — historial muy favorable.`;
	return null;
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers numéricos / de formato
// ════════════════════════════════════════════════════════════════════════════

function perMatch(total: number, played: number): number {
	return played > 0 ? Math.round((total / played) * 10) / 10 : 0;
}

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

function displayName(p: { fullName: string; alias: string | null }): string {
	return p.alias ? `"${p.alias}"` : p.fullName;
}

function ordinal(n: number): string {
	return `${n}°`;
}
