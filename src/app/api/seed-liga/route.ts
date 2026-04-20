import { z } from "zod";
import { db, leagues, teams, players, playerRegistrations, playerSeasonStats, teamStandingsSnapshot } from "@/db";
import { apiSuccess, apiError } from "@/types";
import { DAYS_OF_WEEK } from "@/db/schema";

const SeedSchema = z.object({
  city:               z.string().min(2).max(100),
  name:               z.string().min(2).max(100),
  dayOfWeek:          z.enum(DAYS_OF_WEEK),
  season:             z.string().min(2).max(50),
  numTeams:           z.number().int().min(6).max(16),
  numPlayersPerTeam:  z.number().int().min(7).max(14),
  jornada:            z.number().int().min(13).max(20),
});

// ---------------------------------------------------------------------------
// DATA POOLS
// ---------------------------------------------------------------------------

const TEAM_NAMES_POOL = [
  "Real Aztecas", "Deportivo Norte", "Los Carnales", "La Máquina FC",
  "Tigres del Valle", "Chivas Raza", "Los Guerreros", "Águilas FC",
  "Deportivo Coyotes", "Los Toros FC", "El Gallito FC", "Dinamita FC",
  "Los Compadres", "Santos del Norte", "Atlético Frontera",
  "Deportivo Raza", "Los Bravos FC", "Tecos Barrio", "Los Yaquis FC",
  "Club Independiente", "Los Charros FC", "El Toro Rojo FC",
  "Deportivo Azteca", "Los Valientes", "Real Frontera",
];

const FIRST_NAMES = [
  "Carlos", "Miguel", "José", "Juan", "Luis", "Roberto", "Fernando",
  "Eduardo", "Ricardo", "Antonio", "Alejandro", "Manuel", "Jorge",
  "Héctor", "Sergio", "Rafael", "Adrián", "Daniel", "Oscar", "Armando",
  "Gerardo", "Christian", "Ivan", "Diego", "Ernesto", "Mario", "Salvador",
  "Jesús", "Francisco", "Pedro", "David", "Arturo", "Raúl", "Alan",
  "Víctor", "René", "Ramón", "Gabriel", "Erick", "Abraham", "Rubén",
];

const LAST_NAMES = [
  "García", "Hernández", "López", "Martínez", "González", "Rodríguez",
  "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
  "Díaz", "Reyes", "Cruz", "Morales", "Ramos", "Romero", "Jiménez",
  "Álvarez", "Ruiz", "Castillo", "Vargas", "Mendoza", "Ortiz", "Castro",
  "Herrera", "Guerrero", "Medina", "Vásquez", "Núñez", "Rojas",
  "Gutiérrez", "Aguilar", "Navarro", "Salinas", "Campos", "Estrada",
];

const ALIASES_POOL = [
  "El Chino", "El Toro", "El Chucky", "Patas", "El Loco", "Mago",
  "Tigre", "El Rápido", "Chapo", "El Güero", "Palomita", "La Cobra",
  "El Tanque", "El Artista", "Diablo", "El Bomba", "La Fiera", "Pichón",
  "El Zurdo", "Cañonero", "La Sombra", "Pingüino", "El Ratón", "El Viento",
  "Chilaquil", "El Negro", "El Pelón", "Patotas", "Chori", "El Maestro",
  "El Flaco", "Canelo", "El Gato", "Chino Lindo", "El Profe",
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// Poisson sampling — realistic goal distribution for amateur football
function poissonSample(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Simulate a match score given team strengths (0-100 scale)
// lambda ≈ 1.5 for avg-strength teams → realistic 0-4 goals per side
function simulateMatchScore(homeStrength: number, awayStrength: number): [number, number] {
  const homeAdv = 5; // home field advantage in strength points
  const homeExp = 1.3 + (homeStrength + homeAdv - awayStrength) / 65;
  const awayExp = 1.3 + (awayStrength - homeStrength - homeAdv) / 65;
  return [
    poissonSample(Math.max(0.4, homeExp)),
    poissonSample(Math.max(0.4, awayExp)),
  ];
}

// Distribute totalGoals among numPlayers using weighted multinomial sampling.
// Ensures sum(result) === totalGoals with a realistic power-law distribution.
function distributeGoals(totalGoals: number, numPlayers: number): number[] {
  if (totalGoals === 0) return new Array(numPlayers).fill(0);

  // Weights: first player is the "crack", descending from there
  const weights = Array.from({ length: numPlayers }, (_, i) => {
    if (i === 0) return rnd(7, 14);
    if (i === 1) return rnd(4, 8);
    if (i === 2) return rnd(3, 6);
    if (i <= 4) return rnd(2, 4);
    return rnd(1, 3);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const goals = new Array(numPlayers).fill(0);

  for (let g = 0; g < totalGoals; g++) {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < numPlayers; i++) {
      r -= weights[i];
      if (r <= 0 || i === numPlayers - 1) {
        goals[i]++;
        break;
      }
    }
  }

  return goals;
}

function zoneForRank(rank: number): string | null {
  if (rank <= 4) return "LIGUILLA";
  if (rank <= 6) return "COPA";
  if (rank <= 8) return "RECOPA";
  return null;
}

// ---------------------------------------------------------------------------
// POST /api/seed-liga
// ---------------------------------------------------------------------------

type StandingAcc = {
  played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; points: number;
};

export async function POST(request: Request) {
  const body   = await request.json().catch(() => null);
  const parsed = SeedSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const { city, name, dayOfWeek, season, numTeams, numPlayersPerTeam, jornada } = parsed.data;

  const result = await db.transaction(async (tx) => {
    // 1. Liga
    const [league] = await tx.insert(leagues).values({ name, dayOfWeek, season, city }).returning();

    // 2. Equipos
    const teamNames = pickN(TEAM_NAMES_POOL, numTeams);
    const teamRows  = await tx.insert(teams).values(
      teamNames.map((teamName) => ({ name: teamName, leagueId: league.id }))
    ).returning();

    // 3. Jugadores + registrations
    const usedAliases = new Set<string>();
    const teamPlayerMap: { teamId: string; playerIds: string[] }[] = [];

    for (const team of teamRows) {
      const playerData = Array.from({ length: numPlayersPerTeam }, (_, i) => {
        const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
        const alias = (Math.random() < 0.4)
          ? (ALIASES_POOL.filter((a) => !usedAliases.has(a)).length > 0
            ? pick(ALIASES_POOL.filter((a) => !usedAliases.has(a)))
            : null)
          : null;
        if (alias) usedAliases.add(alias);
        return { fullName, alias, jerseyNumber: i + 1 };
      });

      const inserted = await tx.insert(players).values(
        playerData.map(({ fullName, alias }) => ({ fullName, alias }))
      ).returning();

      await tx.insert(playerRegistrations).values(
        inserted.map((p, i) => ({
          playerId:     p.id,
          teamId:       team.id,
          leagueId:     league.id,
          jerseyNumber: playerData[i].jerseyNumber,
        }))
      );

      teamPlayerMap.push({ teamId: team.id, playerIds: inserted.map((p) => p.id) });
    }

    // 4. Simular partidos jornada a jornada
    const strengths: Record<string, number> = Object.fromEntries(
      teamRows.map((t) => [t.id, rnd(56, 86)])
    );

    const standings: Record<string, StandingAcc> = Object.fromEntries(
      teamRows.map((t) => [t.id, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }])
    );

    for (let j = 0; j < jornada; j++) {
      const shuffled = [...teamRows].sort(() => Math.random() - 0.5);
      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const home = shuffled[i];
        const away = shuffled[i + 1];
        const [hg, ag] = simulateMatchScore(strengths[home.id], strengths[away.id]);

        standings[home.id].played++;
        standings[home.id].goalsFor     += hg;
        standings[home.id].goalsAgainst += ag;
        standings[away.id].played++;
        standings[away.id].goalsFor     += ag;
        standings[away.id].goalsAgainst += hg;

        if (hg > ag) {
          standings[home.id].wins++;   standings[home.id].points += 3;
          standings[away.id].losses++;
        } else if (hg < ag) {
          standings[away.id].wins++;   standings[away.id].points += 3;
          standings[home.id].losses++;
        } else {
          standings[home.id].draws++;  standings[home.id].points++;
          standings[away.id].draws++;  standings[away.id].points++;
        }
      }
    }

    // 5. Ordenar y asignar zonas
    const sorted = [...teamRows].sort((a, b) => {
      const sa = standings[a.id], sb = standings[b.id];
      if (sb.points !== sa.points) return sb.points - sa.points;
      const gdA = sa.goalsFor - sa.goalsAgainst;
      const gdB = sb.goalsFor - sb.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return sb.goalsFor - sa.goalsFor;
    });

    // 6. Tabla de posiciones snapshot
    await tx.insert(teamStandingsSnapshot).values(
      sorted.map((team, i) => ({
        teamId:   team.id,
        leagueId: league.id,
        jornada,
        zone:     zoneForRank(i + 1),
        ...standings[team.id],
      }))
    );

    // 7. Stats de goleadores — distribuir goles del equipo entre sus jugadores
    const allStats: {
      playerId: string; leagueId: string; teamId: string;
      matchesPlayed: number; goals: number; assists: number;
      yellowCards: number; redCards: number; jornada: number;
    }[] = [];

    for (const { teamId, playerIds } of teamPlayerMap) {
      const gf      = standings[teamId].goalsFor;
      const played  = standings[teamId].played;
      const dist    = distributeGoals(gf, playerIds.length);

      // Shuffle so el "crack" (índice 0 del distribuidor) sea aleatorio
      const shuffledIds = [...playerIds].sort(() => Math.random() - 0.5);

      shuffledIds.forEach((playerId, i) => {
        allStats.push({
          playerId,
          leagueId:     league.id,
          teamId,
          matchesPlayed: Math.max(1, played - rnd(0, Math.floor(played * 0.2))),
          goals:         dist[i],
          assists:       0,
          yellowCards:   Math.random() < 0.55 ? rnd(0, 3) : 0,
          redCards:      Math.random() < 0.07 ? 1 : 0,
          jornada,
        });
      });
    }

    await tx.insert(playerSeasonStats).values(allStats);

    // 8. Resumen para respuesta
    const leader       = sorted[0];
    const leaderStats  = standings[leader.id];
    const topGoals     = Math.max(...allStats.map((s) => s.goals));
    const topScorer    = allStats.find((s) => s.goals === topGoals);

    return {
      leagueId:      league.id,
      leagueName:    league.name,
      city,
      season,
      jornada,
      teamsCreated:  numTeams,
      playersCreated: numTeams * numPlayersPerTeam,
      leader: {
        name:         leader.name,
        points:       leaderStats.points,
        played:       leaderStats.played,
        wins:         leaderStats.wins,
        draws:        leaderStats.draws,
        losses:       leaderStats.losses,
        goalsFor:     leaderStats.goalsFor,
        goalsAgainst: leaderStats.goalsAgainst,
      },
      standings: sorted.map((team, i) => ({
        position: i + 1,
        name:     team.name,
        zone:     zoneForRank(i + 1),
        ...standings[team.id],
      })),
      topScorerGoals:  topGoals,
      topScorerId:     topScorer?.playerId ?? null,
      totalGoalsLeague: allStats.reduce((s, p) => s + p.goals, 0),
    };
  });

  return apiSuccess(result, 201);
}
