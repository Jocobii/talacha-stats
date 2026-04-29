import { titleCase } from "@/shared/lib/normalize";
import type { LeagueSnapshot } from "@/entities/organization";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Story = {
  eyebrow: string;
  tag: string | null;
  headline: string;
  stat: string;
  context: string;
};

export type TickerItem = {
  id: string;
  label: string;
  value: string;
};

/** Subconjunto de datos de liga que esta feature necesita — sin acoplar al schema completo. */
export type LeagueInfo = {
  id: string;
  name: string;
  season: string;
  teams: unknown[];
};

// ── Story builder (Idea A) ────────────────────────────────────────────────────

/**
 * Genera entre 3 y 4 historias para el carrusel de una liga.
 * Orden: goleador → líder → ritmo goleador → progreso de temporada.
 * `totalGoals` es opcional; si se provee, se añade la historia de ritmo.
 */
export function buildLeagueStories(
  league: LeagueInfo,
  snapshot: LeagueSnapshot,
  totalGoals?: number,
): Story[] {
  const stories: Story[] = [];
  const teamCount = league.teams.length;
  const jLabel = snapshot.lastJornada ? `J${snapshot.lastJornada}` : league.season;

  // 1 — Goleador
  if (snapshot.topScorer) {
    const name = snapshot.topScorer.alias
      ? `"${titleCase(snapshot.topScorer.alias)}"`
      : titleCase(snapshot.topScorer.fullName);
    stories.push({
      eyebrow: `${titleCase(league.name)} · ${jLabel}`,
      tag: "GOLEADOR",
      headline: `${name} lidera el ataque`,
      stat: String(snapshot.topScorer.goals),
      context: "goles en lo que va de la temporada",
    });
  }

  // 2 — Líder de tabla
  if (snapshot.leader) {
    stories.push({
      eyebrow: `${titleCase(league.name)} · Tabla`,
      tag: null,
      headline: `${titleCase(snapshot.leader.teamName)} comanda la tabla`,
      stat: `${snapshot.leader.points} pts`,
      context: `Equipo líder al corte de ${jLabel}`,
    });
  }

  // 3 — Ritmo goleador (promedio de goles por partido)
  //     Estimación: totalGoals / (jornadas × equipos/2)
  if (totalGoals && totalGoals > 0 && snapshot.lastJornada && teamCount >= 2) {
    const gamesPlayed = snapshot.lastJornada * Math.floor(teamCount / 2);
    const avg = gamesPlayed > 0 ? (totalGoals / gamesPlayed).toFixed(1) : null;
    if (avg) {
      stories.push({
        eyebrow: `${titleCase(league.name)} · Ritmo`,
        tag: null,
        headline: "El promedio goleador de la liga",
        stat: avg,
        context: `goles por partido en ${snapshot.lastJornada} jornadas`,
      });
    }
  }

  // 4 — Progreso de temporada
  if (snapshot.lastJornada) {
    stories.push({
      eyebrow: `${titleCase(league.name)} · Temporada`,
      tag: null,
      headline: "La temporada avanza",
      stat: `J${snapshot.lastJornada}`,
      context: `${teamCount} equipos compitiendo en ${league.season}`,
    });
  }

  // Fallback si no hay ningún dato
  if (stories.length === 0) {
    stories.push({
      eyebrow: titleCase(league.name),
      tag: null,
      headline: "Temporada en curso",
      stat: `${teamCount}`,
      context: `equipos inscritos en ${league.season}`,
    });
  }

  return stories;
}

// ── Ticker builder (Idea B) ───────────────────────────────────────────────────

/**
 * Aplana snapshots de todas las ligas en una lista de items para el ticker.
 * Orden por liga: jornada → líder → goleador.
 */
export function buildTickerItems(
  leagues: LeagueInfo[],
  snapshots: LeagueSnapshot[],
): TickerItem[] {
  const items: TickerItem[] = [];

  leagues.forEach((league, i) => {
    const snap = snapshots[i];
    const name = titleCase(league.name);

    if (snap.lastJornada) {
      items.push({
        id: `${league.id}-jornada`,
        label: name,
        value: `J${snap.lastJornada}`,
      });
    }

    if (snap.leader) {
      items.push({
        id: `${league.id}-leader`,
        label: `Líder ${name}`,
        value: `${titleCase(snap.leader.teamName)} · ${snap.leader.points} pts`,
      });
    }

    if (snap.topScorer) {
      const scorerName = snap.topScorer.alias
        ? `"${titleCase(snap.topScorer.alias)}"`
        : titleCase(snap.topScorer.fullName);
      items.push({
        id: `${league.id}-scorer`,
        label: `Goleador ${name}`,
        value: `${scorerName} · ${snap.topScorer.goals} goles`,
      });
    }
  });

  return items;
}

// ── Narrative builder (Idea D) ────────────────────────────────────────────────

/**
 * Genera una o dos oraciones que narran lo que está pasando en la liga,
 * como lo haría un comentarista deportivo.
 * La lógica vive aquí — el componente solo renderiza el string resultante.
 */
export function buildNarrativeLine(
  league: LeagueInfo,
  snapshot: LeagueSnapshot,
): string {
  const parts: string[] = [];

  if (snapshot.leader) {
    const team = titleCase(snapshot.leader.teamName);
    parts.push(`${team} marcha primero con ${snapshot.leader.points} puntos.`);
  }

  if (snapshot.topScorer) {
    const name = snapshot.topScorer.alias
      ? `«${titleCase(snapshot.topScorer.alias)}»`
      : titleCase(snapshot.topScorer.fullName);
    parts.push(
      `${name} va por el título de goleo con ${snapshot.topScorer.goals} goles.`,
    );
  }

  if (parts.length === 0 && snapshot.lastJornada) {
    return `${titleCase(league.name)} lleva ${snapshot.lastJornada} jornadas disputadas en ${league.season}.`;
  }

  if (parts.length === 0) {
    return `${titleCase(league.name)} está en marcha. Datos disponibles próximamente.`;
  }

  return parts.join(" ");
}
