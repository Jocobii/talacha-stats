import { db, matches, matchEvents, playerRegistrations } from "@/db";
import { eq, and, inArray, or, desc } from "drizzle-orm";
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

  // Partidos completados de la liga (excluyendo el partido actual)
  const completedMatches = await db.query.matches.findMany({
    where: and(
      eq(matches.leagueId, leagueId),
      eq(matches.status, "completed")
    ),
    orderBy: [desc(matches.matchDate)],
  });

  const [homeForm, awayForm] = await Promise.all([
    getTeamForm(homeTeamId, completedMatches),
    getTeamForm(awayTeamId, completedMatches),
  ]);

  const winProb = calculateWinProbability(homeForm, awayForm);

  const [homeThreats, awayThreats] = await Promise.all([
    getTopThreats(homeTeamId, leagueId, completedMatches),
    getTopThreats(awayTeamId, leagueId, completedMatches),
  ]);

  const [homeCardRisk, awayCardRisk] = await Promise.all([
    getCardRisk(homeTeamId, leagueId, completedMatches),
    getCardRisk(awayTeamId, leagueId, completedMatches),
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
      matchday: match.matchday,
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

// ---------------------------------------------------------------------------
// Forma del equipo: historial de partidos completados en la liga
// ---------------------------------------------------------------------------
function getTeamForm(
  teamId: string,
  completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>
): TeamFormStats {
  const teamMatches = completedMatches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  const results: ("W" | "D" | "L")[] = [];

  // Los partidos ya vienen ordenados por fecha desc — los últimos 5 son los primeros
  for (const m of teamMatches) {
    const isHome = m.homeTeamId === teamId;
    const myGoals = isHome ? m.homeScore : m.awayScore;
    const theirGoals = isHome ? m.awayScore : m.homeScore;

    goalsFor += myGoals;
    goalsAgainst += theirGoals;

    if (myGoals > theirGoals) { wins++; results.push("W"); }
    else if (myGoals === theirGoals) { draws++; results.push("D"); }
    else { losses++; results.push("L"); }
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
  awayForm: TeamFormStats
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
// Jugadores más peligrosos de un equipo en la liga
// ---------------------------------------------------------------------------
async function getTopThreats(
  teamId: string,
  leagueId: string,
  completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>
): Promise<TopThreat[]> {
  const matchIds = completedMatches.map((m) => m.id);
  if (matchIds.length === 0) return [];

  // Jugadores del equipo en esta liga
  const roster = await db.query.playerRegistrations.findMany({
    where: and(
      eq(playerRegistrations.teamId, teamId),
      eq(playerRegistrations.leagueId, leagueId)
    ),
    with: { player: true },
  });

  if (roster.length === 0) return [];

  const playerIds = roster.map((r) => r.playerId);

  const threats: TopThreat[] = [];

  for (const reg of roster) {
    const pid = reg.playerId;

    // Todos los goles de la temporada
    const seasonGoalEvents = await db.query.matchEvents.findMany({
      where: and(
        eq(matchEvents.playerId, pid),
        eq(matchEvents.eventType, "goal"),
        inArray(matchEvents.matchId, matchIds)
      ),
    });

    // Goles en los últimos 3 partidos del equipo
    const last3MatchIds = completedMatches
      .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
      .slice(0, 3)
      .map((m) => m.id);

    const last3Goals = last3MatchIds.length > 0
      ? await db.query.matchEvents.findMany({
          where: and(
            eq(matchEvents.playerId, pid),
            eq(matchEvents.eventType, "goal"),
            inArray(matchEvents.matchId, last3MatchIds)
          ),
        })
      : [];

    // Asistencias en la temporada
    const assistEvents = await db.query.matchEvents.findMany({
      where: and(
        eq(matchEvents.playerId, pid),
        eq(matchEvents.eventType, "assist"),
        inArray(matchEvents.matchId, matchIds)
      ),
    });

    // Partidos jugados
    const matchesPlayedIds = new Set(
      (await db.query.matchEvents.findMany({
        where: and(
          eq(matchEvents.playerId, pid),
          inArray(matchEvents.matchId, matchIds)
        ),
        columns: { matchId: true },
      })).map((e) => e.matchId)
    );

    const goalsThisSeason = seasonGoalEvents.length;
    const goalsLast3 = last3Goals.length;
    const assists = assistEvents.length;
    const matchesPlayed = matchesPlayedIds.size;
    const goalsPerMatch = matchesPlayed > 0
      ? Math.round((goalsThisSeason / matchesPlayed) * 100) / 100
      : 0;

    // Solo incluir jugadores con al menos 1 gol o asistencia
    if (goalsThisSeason === 0 && assists === 0) continue;

    threats.push({
      playerId: pid,
      player: reg.player.fullName,
      alias: reg.player.alias,
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
      if (b.goalsLast3Matches !== a.goalsLast3Matches) return b.goalsLast3Matches - a.goalsLast3Matches;
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
// Jugadores en riesgo de tarjeta/suspensión
// ---------------------------------------------------------------------------
async function getCardRisk(
  teamId: string,
  leagueId: string,
  completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>
): Promise<CardRiskPlayer[]> {
  const matchIds = completedMatches.map((m) => m.id);
  if (matchIds.length === 0) return [];

  const roster = await db.query.playerRegistrations.findMany({
    where: and(
      eq(playerRegistrations.teamId, teamId),
      eq(playerRegistrations.leagueId, leagueId)
    ),
    with: { player: true },
  });

  const risks: CardRiskPlayer[] = [];

  for (const reg of roster) {
    const pid = reg.playerId;

    const [yellows, reds] = await Promise.all([
      db.query.matchEvents.findMany({
        where: and(
          eq(matchEvents.playerId, pid),
          eq(matchEvents.eventType, "yellow_card"),
          inArray(matchEvents.matchId, matchIds)
        ),
      }),
      db.query.matchEvents.findMany({
        where: and(
          eq(matchEvents.playerId, pid),
          eq(matchEvents.eventType, "red_card"),
          inArray(matchEvents.matchId, matchIds)
        ),
      }),
    ]);

    const yellowCount = yellows.length;
    const redCount = reds.length;

    // Incluir solo jugadores con riesgo real: 2+ amarillas o alguna roja
    if (yellowCount < 2 && redCount === 0) continue;

    let note = "";
    if (yellowCount >= 2) note = `${yellowCount} amarillas — 1 más = suspensión`;
    if (redCount > 0) note = `${redCount} tarjeta(s) roja — revisar suspensión vigente`;

    risks.push({
      playerId: pid,
      player: reg.player.fullName,
      yellowCards: yellowCount,
      redCards: redCount,
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
  completedMatches: Awaited<ReturnType<typeof db.query.matches.findMany>>
): HeadToHead {
  const h2hMatches = completedMatches.filter(
    (m) =>
      (m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId) ||
      (m.homeTeamId === awayTeamId && m.awayTeamId === homeTeamId)
  );

  let homeWins = 0, draws = 0, awayWins = 0;

  for (const m of h2hMatches) {
    const isHomeFirst = m.homeTeamId === homeTeamId;
    const team1Goals = isHomeFirst ? m.homeScore : m.awayScore;
    const team2Goals = isHomeFirst ? m.awayScore : m.homeScore;

    if (team1Goals > team2Goals) homeWins++;
    else if (team1Goals === team2Goals) draws++;
    else awayWins++;
  }

  const last = h2hMatches[0]; // Ya vienen ordenados por fecha desc
  let lastMatch: HeadToHead["lastMatch"] = null;

  if (last) {
    const isHomeFirst = last.homeTeamId === homeTeamId;
    const homeGoals = isHomeFirst ? last.homeScore : last.awayScore;
    const awayGoals = isHomeFirst ? last.awayScore : last.homeScore;
    const winner = homeGoals > awayGoals
      ? "local ganó"
      : homeGoals === awayGoals
        ? "empate"
        : "visitante ganó";
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
  const { homeTeamName, awayTeamName, homeForm, awayForm, winProb, homeThreats, awayThreats, homeCardRisk, awayCardRisk, h2h } = ctx;

  // Favorito
  if (winProb.method !== "sin_datos") {
    const favTeam = winProb.homeWinPct > winProb.awayWinPct ? homeTeamName : awayTeamName;
    const favPct = Math.max(winProb.homeWinPct, winProb.awayWinPct);
    bullets.push(`${favTeam} llega como favorito con ${favPct}% de probabilidad de victoria.`);
  }

  // Forma reciente del local
  if (homeForm.record.wins + homeForm.record.draws + homeForm.record.losses > 0) {
    const last5Str = homeForm.last5.join("-");
    bullets.push(
      `${homeTeamName}: ${homeForm.record.wins}V ${homeForm.record.draws}E ${homeForm.record.losses}D — ` +
      `${homeForm.points} pts — promedio ${homeForm.avgGoalsPerMatch} goles/partido.`
    );
  }

  // Forma reciente del visitante
  if (awayForm.record.wins + awayForm.record.draws + awayForm.record.losses > 0) {
    bullets.push(
      `${awayTeamName}: ${awayForm.record.wins}V ${awayForm.record.draws}E ${awayForm.record.losses}D — ` +
      `${awayForm.points} pts — promedio ${awayForm.avgGoalsPerMatch} goles/partido.`
    );
  }

  // Amenaza principal del local
  for (const t of homeThreats.filter((t) => t.dangerRating === "ALTO").slice(0, 1)) {
    const name = t.alias ? `"${t.alias}"` : t.player;
    bullets.push(
      `${name} (${homeTeamName}) viene en racha: ${t.goalsLast3Matches} goles en los últimos 3 partidos — ` +
      `${t.goalsThisSeason} en la temporada.`
    );
  }

  // Amenaza principal del visitante
  for (const t of awayThreats.filter((t) => t.dangerRating === "ALTO").slice(0, 1)) {
    const name = t.alias ? `"${t.alias}"` : t.player;
    bullets.push(
      `${name} (${awayTeamName}): ${t.goalsThisSeason} goles esta temporada con ${t.goalsPerMatch} por partido.`
    );
  }

  // Riesgo de tarjetas
  for (const p of [...homeCardRisk, ...awayCardRisk].slice(0, 2)) {
    bullets.push(`${p.player}: ${p.note}.`);
  }

  // Historial cara a cara
  if (h2h.totalMatches > 0) {
    const leader = h2h.homeWins > h2h.awayWins
      ? `${homeTeamName} domina con ${h2h.homeWins} victorias`
      : h2h.awayWins > h2h.homeWins
        ? `${awayTeamName} domina con ${h2h.awayWins} victorias`
        : `Historial igualado entre ambos equipos`;
    bullets.push(`En ${h2h.totalMatches} enfrentamientos previos: ${leader}. ${
      h2h.lastMatch ? `Último resultado: ${h2h.lastMatch.result}.` : ""
    }`);
  }

  // Goles si hay buen promedio combinado
  const avgGols = (homeForm.avgGoalsPerMatch + awayForm.avgGoalsPerMatch);
  if (avgGols >= 5) {
    bullets.push(`Partido de alto voltaje esperado: ambos equipos promedian ${avgGols.toFixed(1)} goles combinados por partido.`);
  }

  return bullets;
}
