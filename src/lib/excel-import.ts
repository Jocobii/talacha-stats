import * as XLSX from "xlsx";
import { db, players, teams, matches, matchEvents, playerRegistrations } from "@/db";
import { ilike, or, eq, and } from "drizzle-orm";
import type { EventType } from "@/db/schema";

// ---------------------------------------------------------------------------
// Tipos internos del importador
// ---------------------------------------------------------------------------

export type ImportRow = {
  jugador: string;
  equipo: string;
  jornada: number;
  equipoLocal: string;
  equipoVisitante: string;
  tipo: string; // gol | asistencia | amarilla | roja
  minuto?: number;
  fecha?: string;
};

export type ResultRow = {
  jornada: number;
  equipoLocal: string;
  golesLocal: number;
  equipoVisitante: string;
  golesVisitante: number;
  fecha?: string;
};

export type ParsedImport = {
  events: ImportRow[];
  results: ResultRow[];
};

export type PlayerMatch = {
  name: string;
  found: boolean;
  playerId?: string;
  candidates: { id: string; fullName: string; alias: string | null }[];
};

export type ImportPreview = {
  events: ImportRow[];
  results: ResultRow[];
  playerMatches: PlayerMatch[];
  warnings: string[];
};

export type ImportConfirmPayload = {
  leagueId: string;
  events: ImportRow[];
  results: ResultRow[];
  playerResolutions: Record<string, string>; // nombre → playerId (puede ser existente o "NEW")
};

export type ImportResult = {
  matchesCreated: number;
  eventsInserted: number;
  playersCreated: number;
  errors: string[];
};

// ---------------------------------------------------------------------------
// Parseo del archivo Excel
// ---------------------------------------------------------------------------

/**
 * Parsea un archivo .xlsx en buffer y retorna los eventos y resultados.
 * Acepta dos formatos de hoja:
 *   - "Eventos": columnas Jugador, Equipo, Equipo Local, Equipo Visitante, Jornada, Tipo, Minuto (opt), Fecha (opt)
 *   - "Resultados": columnas Jornada, Equipo Local, Goles Local, Equipo Visitante, Goles Visitante, Fecha (opt)
 */
export function parseExcelBuffer(buffer: Buffer): ParsedImport {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const events: ImportRow[] = [];
  const results: ResultRow[] = [];

  // Intentar leer hoja "Eventos" o la primera hoja
  const eventsSheet =
    workbook.Sheets["Eventos"] ??
    workbook.Sheets["eventos"] ??
    workbook.Sheets[workbook.SheetNames[0]];

  if (eventsSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(eventsSheet, {
      defval: "",
    });

    for (const row of rows) {
      const jugador = str(row["Jugador"] ?? row["jugador"] ?? row["JUGADOR"]);
      const equipo = str(row["Equipo"] ?? row["equipo"] ?? row["EQUIPO"]);
      const jornada = num(row["Jornada"] ?? row["jornada"]);
      const equipoLocal = str(row["Equipo Local"] ?? row["equipo_local"] ?? row["Local"]);
      const equipoVisitante = str(row["Equipo Visitante"] ?? row["equipo_visitante"] ?? row["Visitante"]);
      const tipo = normalizeTipo(str(row["Tipo"] ?? row["tipo"] ?? row["Evento"]));
      const minuto = row["Minuto"] ? num(row["Minuto"]) : undefined;
      const fecha = row["Fecha"] ? str(row["Fecha"]) : undefined;

      if (!jugador || !tipo) continue;

      events.push({ jugador, equipo, jornada, equipoLocal, equipoVisitante, tipo, minuto, fecha });
    }
  }

  // Intentar leer hoja "Resultados"
  const resultsSheet =
    workbook.Sheets["Resultados"] ??
    workbook.Sheets["resultados"] ??
    workbook.Sheets[workbook.SheetNames[1]];

  if (resultsSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(resultsSheet, {
      defval: "",
    });

    for (const row of rows) {
      const jornada = num(row["Jornada"] ?? row["jornada"]);
      const equipoLocal = str(row["Equipo Local"] ?? row["equipo_local"] ?? row["Local"]);
      const golesLocal = num(row["Goles Local"] ?? row["goles_local"] ?? row["GL"]);
      const equipoVisitante = str(row["Equipo Visitante"] ?? row["equipo_visitante"] ?? row["Visitante"]);
      const golesVisitante = num(row["Goles Visitante"] ?? row["goles_visitante"] ?? row["GV"]);
      const fecha = row["Fecha"] ? str(row["Fecha"]) : undefined;

      if (!equipoLocal || !equipoVisitante) continue;

      results.push({ jornada, equipoLocal, golesLocal, equipoVisitante, golesVisitante, fecha });
    }
  }

  return { events, results };
}

/**
 * Genera un preview de la importación:
 * - Busca jugadores por nombre (fuzzy)
 * - Identifica coincidencias, ambigüedades y nuevos jugadores
 * - Retorna advertencias
 */
export async function generateImportPreview(
  parsed: ParsedImport
): Promise<ImportPreview> {
  const playerNames = [...new Set(parsed.events.map((e) => e.jugador))];
  const playerMatches: PlayerMatch[] = [];
  const warnings: string[] = [];

  for (const name of playerNames) {
    const normalized = `%${name.toLowerCase().trim()}%`;

    const found = await db.query.players.findMany({
      where: or(
        ilike(players.fullName, normalized),
        ilike(players.alias, normalized)
      ),
      limit: 5,
    });

    if (found.length === 1) {
      playerMatches.push({
        name,
        found: true,
        playerId: found[0].id,
        candidates: found.map((p) => ({ id: p.id, fullName: p.fullName, alias: p.alias })),
      });
    } else if (found.length > 1) {
      playerMatches.push({
        name,
        found: false,
        candidates: found.map((p) => ({ id: p.id, fullName: p.fullName, alias: p.alias })),
      });
      warnings.push(`"${name}" tiene ${found.length} candidatos — seleccionar manualmente.`);
    } else {
      playerMatches.push({ name, found: false, candidates: [] });
      warnings.push(`"${name}" no existe en el sistema — se creará como jugador nuevo.`);
    }
  }

  return { events: parsed.events, results: parsed.results, playerMatches, warnings };
}

/**
 * Confirma e inserta los datos de importación en la base de datos.
 * Crea jugadores nuevos, equipos si no existen, partidos y eventos.
 */
export async function confirmImport(payload: ImportConfirmPayload): Promise<ImportResult> {
  const { leagueId, events, results, playerResolutions } = payload;
  const errors: string[] = [];
  let matchesCreated = 0;
  let eventsInserted = 0;
  let playersCreated = 0;

  // 1. Resolver/crear jugadores
  const playerIdMap: Record<string, string> = {};

  for (const [name, resolution] of Object.entries(playerResolutions)) {
    if (resolution === "NEW") {
      const [newPlayer] = await db
        .insert(players)
        .values({ fullName: name })
        .returning();
      playerIdMap[name] = newPlayer.id;
      playersCreated++;
    } else {
      playerIdMap[name] = resolution;
    }
  }

  // 2. Resolver equipos (crear si no existen en la liga)
  const teamNameMap: Record<string, string> = {};

  const allTeamNames = [
    ...new Set([
      ...events.map((e) => e.equipo),
      ...results.map((r) => r.equipoLocal),
      ...results.map((r) => r.equipoVisitante),
    ].filter(Boolean)),
  ];

  for (const teamName of allTeamNames) {
    const existing = await db.query.teams.findFirst({
      where: and(
        ilike(teams.name, teamName),
        eq(teams.leagueId, leagueId)
      ),
    });

    if (existing) {
      teamNameMap[teamName.toLowerCase()] = existing.id;
    } else {
      const [newTeam] = await db.insert(teams).values({ name: teamName, leagueId }).returning();
      teamNameMap[teamName.toLowerCase()] = newTeam.id;
    }
  }

  // 3. Crear partidos (por jornada + equipos)
  const matchKeyMap: Record<string, string> = {};

  for (const result of results) {
    const homeTeamId = teamNameMap[result.equipoLocal.toLowerCase()];
    const awayTeamId = teamNameMap[result.equipoVisitante.toLowerCase()];

    if (!homeTeamId || !awayTeamId) {
      errors.push(`No se encontró equipo para: ${result.equipoLocal} vs ${result.equipoVisitante}`);
      continue;
    }

    const matchKey = `${result.jornada}-${homeTeamId}-${awayTeamId}`;

    // Verificar si ya existe
    const existing = await db.query.matches.findFirst({
      where: and(
        eq(matches.leagueId, leagueId),
        eq(matches.homeTeamId, homeTeamId),
        eq(matches.awayTeamId, awayTeamId),
        eq(matches.matchday, result.jornada)
      ),
    });

    if (existing) {
      matchKeyMap[matchKey] = existing.id;
      // Actualizar marcador si es diferente
      await db
        .update(matches)
        .set({
          homeScore: result.golesLocal,
          awayScore: result.golesVisitante,
          status: "completed",
        })
        .where(eq(matches.id, existing.id));
    } else {
      const [newMatch] = await db
        .insert(matches)
        .values({
          leagueId,
          homeTeamId,
          awayTeamId,
          matchDate: result.fecha ?? new Date().toISOString().split("T")[0],
          matchday: result.jornada,
          homeScore: result.golesLocal,
          awayScore: result.golesVisitante,
          status: "completed",
        })
        .returning();
      matchKeyMap[matchKey] = newMatch.id;
      matchesCreated++;
    }
  }

  // 4. Insertar eventos
  for (const event of events) {
    const playerId = playerIdMap[event.jugador];
    const teamId = teamNameMap[event.equipo?.toLowerCase()];

    if (!playerId) {
      errors.push(`Jugador sin resolver: ${event.jugador}`);
      continue;
    }

    // Buscar el partido correspondiente
    const homeTeamId = teamNameMap[event.equipoLocal?.toLowerCase()];
    const awayTeamId = teamNameMap[event.equipoVisitante?.toLowerCase()];
    const matchKey = `${event.jornada}-${homeTeamId}-${awayTeamId}`;
    const matchId = matchKeyMap[matchKey];

    if (!matchId) {
      errors.push(`No se encontró partido para el evento de ${event.jugador} (jornada ${event.jornada})`);
      continue;
    }

    // Registrar al jugador en el equipo si no está
    if (teamId) {
      try {
        await db
          .insert(playerRegistrations)
          .values({ playerId, teamId, leagueId })
          .onConflictDoNothing();
      } catch {
        // ignorar conflictos de unicidad
      }
    }

    await db.insert(matchEvents).values({
      matchId,
      playerId,
      teamId: teamId ?? (homeTeamId || awayTeamId),
      eventType: event.tipo as EventType,
      minute: event.minuto ?? null,
    });

    eventsInserted++;
  }

  return { matchesCreated, eventsInserted, playersCreated, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function num(v: unknown): number {
  const n = parseInt(String(v ?? "0"));
  return isNaN(n) ? 0 : n;
}

function normalizeTipo(tipo: string): EventType | string {
  const map: Record<string, EventType> = {
    gol: "goal",
    goal: "goal",
    "gol propio": "own_goal",
    "autogol": "own_goal",
    own_goal: "own_goal",
    asistencia: "assist",
    assist: "assist",
    amarilla: "yellow_card",
    yellow: "yellow_card",
    yellow_card: "yellow_card",
    roja: "red_card",
    red: "red_card",
    red_card: "red_card",
    mvp: "mvp",
  };
  return map[tipo.toLowerCase().trim()] ?? tipo.toLowerCase();
}
