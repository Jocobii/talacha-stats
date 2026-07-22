# Plan de eliminación completa de V1 (Excel / solo-lectura)

> Estado de origen: el **flujo de importación** de Excel ya fue eliminado (AGENTS.md §1.6).
> Lo que queda vivo son las **tablas V1**, la **vista SQL** que las agrega y un puñado de
> **lecturas de producción** que todavía dependen de ellas. Este documento inventaría dónde
> se usa V1, propone un orden de eliminación seguro y enumera los riesgos.
>
> Regla dura del proyecto (AGENTS.md §15): las migraciones son **append-only**. Todo lo de
> abajo se hace con **migraciones nuevas forward-only**, nunca editando historial. El DROP de
> tablas es destructivo → requiere backup y sign-off explícito del dev.

---

## 1. Qué es "V1" en el código (superficie a eliminar)

### 1.1 Tablas (Drizzle — `src/db/schema.ts`)

| Objeto | Línea aprox. | Notas |
| --- | --- | --- |
| `players` | 145 | Anchor de identidad legacy. Referenciada por muchas FKs. |
| `player_registrations` | 373 | FK `legacy_player_id → players`. |
| `player_season_stats` | 968 | FK `legacy_player_id → players`; tiene `global_player_id` (nullable). **Contiene el dato histórico de Excel.** |
| `player_season_stats_snapshot` | 1128 | FK `player_id → players`. Snapshots por jornada (deltas de contenido). |
| `team_standings_snapshot` | 1016 | Snapshots de tabla por jornada. |
| Vista `player_global_stats` (`pgView`) | 2072 | Agrega `players` + `player_registrations` + `player_season_stats`. |

Además, la vista existe también como SQL crudo en `src/db/views.sql` (`player_league_stats`,
`player_global_stats`, `league_top_scorers` — todas leen `players`/`player_registrations`/`match_events`).

### 1.2 Columnas puente (FKs que hay que soltar antes de dropear `players`)

- `player_registrations.legacy_player_id → players.id`
- `player_season_stats.legacy_player_id → players.id`
- `player_season_stats_snapshot.player_id → players.id`
- `match_events.legacy_player_id → players.id`
- `player_profiles.claimed_player_id → players.id` (schema.ts ~242)

No se puede `DROP TABLE players` mientras cualquiera de estas FKs exista.

### 1.3 Zona gris — `match_events`

`match_events` es tabla V2 (su FK principal ya migró a `global_players`), pero en producción
**nadie la escribe** salvo el simulador/seed (AGENTS.md §1.7), y varias lecturas legacy la usan
vía `legacy_player_id`. No es "V1 Excel" pero está acoplada al mismo bloque legacy. **Decidir si
entra en este alcance o se trata aparte** (ver §5, decisión D3).

---

## 2. Consumidores en producción que TODAVÍA leen V1

Estos hay que **migrar o retirar antes** de tocar el schema. Si se dropean las tablas primero,
rompe compilación y runtime.

| # | Archivo / función | Tabla V1 que usa | Ruta(s) que lo exponen |
| --- | --- | --- | --- |
| P1 | ~~`src/lib/stats.ts` — `getPlayerLeagueStats`, `getPlayerGlobalStats`, `getLeagueTopScorers`, `getLeagueTopAssists`~~ **RETIRADO 2026-07-20** | `match_events`, `players`, `player_registrations`, `player_season_stats` | `/api/players/[id]/stats`, `/api/leagues/[id]/top-scorers`, `/api/leagues/[id]/top-assists` — **sin caller real en el frontend** (confirmado por grep exhaustivo), se retiraron en vez de migrarse |
| P2 | ~~`src/entities/player/queries.ts` — `getPlayerGlobalStats` (vista), `listTopScorers`~~ **RETIRADO 2026-07-20** | vista `player_global_stats` (100% V1) | `/api/players/[id]`, `/api/players/[id]/global-stats` — **sin caller real**; `listTopScorers` no tenía ningún caller. El perfil público real (`/player/[id]`) ya usaba `getPlayerProfile`, no estas rutas |
| P3 | `src/entities/player/ranking.ts` — `getJornadaHonor` | `player_season_stats` (100% V1, sin migrar — AGENTS.md §1.7) | `/matchday`, homepage (héroe de jornada) |
| P4 | `src/lib/narrator.ts` | `team_standings_snapshot`, `player_registrations`, `player_season_stats`, `match_events` | `/admin/analisis`, `/api/narrator`, imágenes de contenido |
| P5 | `src/lib/preview.ts` | `player_registrations`, `match_events` | preview de partido (narrador) |
| P6 | `src/features/post-import-content/pills.ts` — `generateJornadaPills` | `player_season_stats_snapshot`, `team_standings_snapshot` | `/api/content/jornada-pills`, `/api/content/jornada-image` |
| P7 | `src/lib/standings.ts` | `team_standings_snapshot` (fallback Prioridad 2) | `getLeagueStandings` → standings + `/api/content/standings-image` |
| P8 | ~~`src/entities/player/ranking.ts` — `searchPlayersForDisambiguation`~~ **RESUELTO 2026-07-20** | `player_season_stats` | Desambiguación de jugadores por nombre (búsqueda del ranking público). Encontrado 2026-07-20 al migrar P3; no estaba en el inventario original. |
| P9 | ~~`src/entities/player/ranking.ts` — `getPrevGoalsByLeague`~~ **RESUELTO 2026-07-20** | `player_season_stats_snapshot` | `positionDelta` en `getCityRanking`/`getLeagueRanking`/`getGlobalRanking`. Encontrado 2026-07-20 al migrar P3; comparte tabla con P6 pero es un consumidor propio. |
| P10 | `src/entities/organization/queries.ts` — `getLatestStandings` | `team_standings_snapshot` (+ fallback propio a `matches`, duplica `lib/standings.ts` pre-P7) | Tabla pública de una liga. Encontrado 2026-07-20 al migrar P7. |
| P11 | `src/entities/organization/queries.ts` — `getStandingsHistory` | `team_standings_snapshot` | Gráfico de evolución de posiciones por jornada, página de liga. 100% V1, sin equivalente V2 construido aún. Encontrado 2026-07-20 al migrar P7. |
| P12 | `src/entities/organization/queries.ts` — `getLeagueSnapshot` | `team_standings_snapshot`, `player_season_stats` | Cards del hub de organización (líder/goleador/última jornada). Encontrado 2026-07-20 al migrar P7. |
| P13 | `src/entities/organization/queries.ts` — función ~línea 830 (agregación multi-liga) | `player_season_stats`, `team_standings_snapshot` | Suma goles + última jornada across varias ligas — probable dashboard cross-liga. Encontrado 2026-07-20 al migrar P7. |
| P14 | `src/entities/organization/queries.ts` — `searchTopScorers` | `player_season_stats` | Tabla de goleadores paginada/buscable de una liga, página pública `/org/[slug]/[leagueSlug]`. Encontrado 2026-07-20 al migrar P10-P13, no estaba en el inventario original. |
| P15 | `src/entities/organization/queries.ts` — `getLeaguesShowcase` | `player_season_stats` | Vitrina de ligas en la homepage (playerCount + topScorer). Encontrado 2026-07-20 al migrar P10-P13, no estaba en el inventario original. |
| P16 | ~~`src/entities/player-profile/*` (queries.ts, model.ts, index.ts)~~ **RETIRADO 2026-07-22** | `player_profiles.claimed_player_id` (FK a `players`) | Sin caller real en `src/`. Encontrado 2026-07-22 al soltar FKs puente (Fase 3). |
| P17 | ~~`src/app/api/teams/[id]/roster/route.ts` (POST), `src/app/api/matches/[id]/events/route.ts` (POST)~~ **RETIRADO 2026-07-22** | `player_registrations.legacy_player_id`, `match_events.legacy_player_id` | Dos rutas API sin caller real que ESCRIBÍAN en las FKs puente (V1 no era 100% solo-lectura). Encontrado 2026-07-22 al soltar FKs puente (Fase 3). |

**Ya migrados (leen de la fuente combinada / en vivo — no bloquean):**
`ranking.ts` (`getCityRanking`, `getLeagueRanking`, `getGlobalRanking`, `getPlayerPositions`),
`queries.ts` (`getPlayerProfile`, `getPlayerEgoStats`) vía `entities/player/live-stats.ts`
(`getMergedLeagueStatsRows` / `getLivePlayerMatchGoals`), y el directorio `/api/players`.

> Ojo con `getMergedLeagueStatsRows`: **usa `player_season_stats` cuando la liga tiene import de
> Excel**. Aunque ya está "migrado" a fuente combinada, sigue LEYENDO V1 para esas ligas. Al
> dropear la tabla, esas ligas caen al cálculo en vivo (`match_player_stats`) — que puede estar
> vacío si nunca se capturó cédula. Ver riesgo R1.

**Infra / no-producción (seed, simulador, migraciones one-off):**
`src/db/seed.ts`, `src/db/simulator/*`, `src/db/migrate-to-global-players.ts`,
`src/db/migrate-to-league-members.ts`, `src/db/dedupe-player-season-stats.ts`. Se limpian al final
o se dejan como scripts históricos; no afectan runtime de producción.

---

## 3. Pregunta que decide todo (hacer ANTES de escribir código)

**¿Existe alguna liga cuyo único historial de stats viva en las tablas V1 (import de Excel) y que
NO haya sido recapturado en V2 (`match_player_stats`)?**

- **Si NO** (todo lo importante ya está en V2, o el dato de Excel es descartable):
  → eliminación limpia, se puede dropear todo.
- **Si SÍ** (hay ligas con historia sólo en Excel que se quiere conservar):
  → **no es una eliminación, es una migración de datos**. Hay que backfillear
  `player_season_stats` → `match_player_stats`/`global_players` primero, o aceptar la pérdida
  de ese histórico de forma explícita.

Consulta de diagnóstico sugerida (correr en una réplica/producción, solo lectura):

```sql
-- Ligas con dato en V1 pero sin captura en vivo V2
SELECT pss.league_id,
       COUNT(*)                              AS filas_v1,
       COUNT(*) FILTER (WHERE mps.id IS NULL) AS sin_equivalente_v2
FROM player_season_stats pss
LEFT JOIN inscriptions i     ON i.id = pss... -- ajustar join según el puente real
LEFT JOIN match_player_stats mps ON mps.player_registration_id = i.id
GROUP BY pss.league_id
ORDER BY sin_equivalente_v2 DESC;
```

(El join exacto depende de cómo `player_season_stats.global_player_id` mapea a `inscriptions`;
validar contra `live-stats.ts` antes de correr.)

---

## 4. Orden de eliminación (forward-only, por fases)

No dropear nada hasta terminar la Fase 1. El orden respeta las dependencias FK y de código.

### Fase 0 — Preparación
1. Backup completo de las tablas V1 (dump a `.sql`/parquet) — **irreversible sin esto**.
2. Correr el diagnóstico de §3 y anexar el resultado al PR.
3. Congelar cualquier feature nueva sobre `src/lib/*` legacy (ya está prohibido crear ahí, §10).

### Fase 1 — Migrar / retirar lecturas de producción (código, sin tocar DB)
Por cada consumidor de §2, o se reescribe contra la fuente V2/combinada, o se retira la ruta:

- **P1/P2 — RESUELTO 2026-07-20 (retiro, no migración).** Antes de escribir ninguna migración
  se auditó quién llama de verdad a `/api/players/[id]`, `/api/players/[id]/stats`,
  `/api/players/[id]/global-stats`, `/api/leagues/[id]/top-scorers` y `/api/leagues/[id]/top-assists`
  (grep exhaustivo de fetch/hooks/tests). Las cinco rutas tenían **cero callers reales**: el perfil
  público (`/player/[id]`) y el admin (`/admin/players/[id]`) ya llaman a `getPlayerProfile`
  (V2, `entities/player/queries.ts`) directamente, sin pasar por estas APIs; el top-scorers real
  (`jornada-image`, `scorers-image`) ya usa `getLeagueTopScorersV2`. Se retiraron por completo en
  vez de reescribirse:
  - `src/lib/stats.ts` (`getPlayerLeagueStats`, `getPlayerGlobalStats`, `getLeagueTopScorers`,
    `getLeagueTopAssists`) — vaciado, pendiente `git rm`.
  - `src/entities/player/queries.ts` — se quitaron `getPlayerGlobalStats` (la variante basada en
    la vista `player_global_stats`) y `listTopScorers` (cero callers); se quitaron sus tipos
    (`PlayerGlobalStats` en `entities/player/model.ts` y en `src/types/index.ts`, `PlayerStats`)
    y sus exports del barrel `entities/player/index.ts`.
  - Las 5 rutas de API (`players/[id]/route.ts`, `players/[id]/stats/route.ts`,
    `players/[id]/global-stats/route.ts`, `leagues/[id]/top-scorers/route.ts`,
    `leagues/[id]/top-assists/route.ts`) quedaron vacías (`export {}`), pendiente `git rm`.
  - Nota: la vista `player_global_stats` (schema.ts) y su tabla base `players` NO se tocaron
    aquí — eso es Fase 2/4. Este paso solo quitó lectores de código; sigue pendiente el resto
    de P1-alcance real (top-scorers/top-assists si algún día se necesitan, se reconstruyen sobre
    V2 desde cero, no había lógica reusable que migrar).
- **P3 `getJornadaHonor` — RESUELTO 2026-07-20.** Reimplementado sobre V2: nueva
  `getLiveJornadaHonor(leagueId)` en `entities/player/live-stats.ts` calcula, por liga, la última
  `matchday` con algún gol en `match_player_stats` y sus hasta 3 goleadores de ESA jornada
  (no acumulado de temporada). `entities/player/ranking.ts::getJornadaHonor` ahora solo orquesta
  por ciudad → liga y arma `JornadaLeague[]`; ya no toca `player_season_stats`. Contrato sin
  cambios (`getJornadaHonor(city): Promise<JornadaLeague[]>`), único caller
  `app/[locale]/(public)/matchday/page.tsx` sigue igual. Sin backfill (D1): ligas cuyo único
  historial vive en Excel dejan de aparecer aquí — pendiente de smoke manual (§6) antes de cerrar
  la fase.
  - **Gap encontrado, no estaba en la tabla de §2:** `searchPlayersForDisambiguation` (mismo
    archivo, `ranking.ts`) todavía lee `playerSeasonStats` directo para la búsqueda de
    desambiguación de jugadores — no se tocó en este paso, queda como **P8** pendiente.
  - **Gap encontrado, no estaba en la tabla de §2:** `getPrevGoalsByLeague` (mismo archivo) sigue
    leyendo `playerSeasonStatsSnapshot` para calcular `positionDelta` en `getCityRanking`/
    `getLeagueRanking`/`getGlobalRanking` — comparte tabla con P6 (pills.ts) pero es un
    consumidor propio, no se tocó. Queda como **P9** pendiente.
- **P4 `narrator.ts` / P5 `preview.ts` — RESUELTO 2026-07-20.** Nueva `getTeamMatchStatsRoster(teamId,
  matchIds)` en `entities/player/live-stats.ts`: agrega `match_player_stats` (goles/asistencias/
  tarjetas/partidos) sobre el subconjunto de partidos que decide el caller — reemplaza el roster V1
  (`player_registrations` + `player_season_stats`/`match_events`) en ambos archivos.
  - `narrator.ts`: el récord/posición/tabla de equipo ya no lee `team_standings_snapshot`
    directamente — delega a `getLeagueStandings` (`lib/standings.ts`, P7), que ya resuelve
    snapshot-Excel-si-existe vs. cálculo en vivo con los tiebreakers configurados de la liga. Bug
    encontrado de paso: el filtro de "partidos completados" usaba `matches.status = 'completed'`
    (solo el status legacy de Excel) — nunca incluía partidos capturados vía cédula (`status =
    'played'`). Se corrigió a `COUNTED_MATCH_STATUSES` (`played`/`walkover_home`/`walkover_away`,
    mismo criterio que `live-stats.ts`) — esto es una mejora real para ligas 100% en-app, no solo
    limpieza de V1.
  - `preview.ts`: mismo fix de status; `getTopThreats`/`getCardRisk` migrados a
    `getTeamMatchStatsRoster`. El campo `match.matchday` de la respuesta (antes la columna legacy
    `matches.matchday`, nunca poblada por el flujo V2) ahora sale de `matchdays.number` vía
    `matches.matchdayId`.
  - `match_events` (D3) sale por completo de ambos archivos: no hay eventos finos (minuto exacto,
    MVP) en `match_player_stats` — pérdida aceptada, ya documentada en D3.
  - Sin backfill de Excel (D1): el roster de una liga cuyo único historial vive en
    `player_registrations`/`player_season_stats` sale vacío en `narrator.ts`/`preview.ts` (la tabla
    de posiciones sí conserva el snapshot vía `getLeagueStandings`, que es alcance de P7, no de
    este paso).
- **P6 `pills.ts` — RESUELTO 2026-07-20.** Reimplementado sobre V2: una sola carga de `matches`
  (con `matchdayNumber` vía `matchdayId → matchdays.number`) + `match_player_stats` por liga: todos
  los totales "hasta la jornada N" y "hasta N-1" (jugador y equipo) se recalculan en memoria filtrando
  esa carga por `matchdayNumber <= X` — mismo patrón que `db/simulator/contributors/aggregates.ts`
  (que hace lo mismo para poblar los snapshots V1; aquí solo se lee). Ya no toca
  `player_season_stats_snapshot` ni `team_standings_snapshot`.
  - Rachas goleadoras y racha invicta: recalculadas desde los mismos datos ya cargados (sin queries
    extra), con la misma ventana de lookback (5 y 6 jornadas respectivamente) y semántica de streak
    que la versión V1.
  - Cambios de zona: `team_standings_snapshot.zone` (enum fijo LIGUILLA/COPA/RECOPA) se reemplaza
    por `league_playoff_zones` (config real de la liga, nombre libre) + `findZone`
    (`shared/lib/zone-colors.ts`) — mismo criterio de "entrada" (no tenía zona antes, tiene zona
    ahora), ya no hay mapeo hardcodeado de nombres de zona.
  - Ninguna píldora se pierde: los 9 tipos (`hat_trick`, `top_scorer`, `top_assist`,
    `first_scorer`, `scoring_streak`, `leader`, `zone_change`, `unbeaten_streak`) siguen presentes.
  - Sin backfill (D1): una liga cuyo único historial vive en Excel no tiene partidos en
    `matches`/`match_player_stats` → cero píldoras (antes también salía vacío si nunca hubo
    snapshot para esa liga).
- **P7 `lib/standings.ts` — RESUELTO 2026-07-20.** Se retiró la prioridad de `team_standings_snapshot`
  (V1): `getLeagueStandings` ahora SIEMPRE calcula en vivo desde `matches` (`played`/`walkover_home`/
  `walkover_away`/`completed` — este último es status legacy pero sobre filas reales de `matches`,
  no infra V1, se conserva). Campo `zone` (`TeamStanding`, solo poblado por el snapshot) retirado del
  tipo — la zona real V2 vive en `league_playoff_zones`. Sin backfill (D1): una liga cuyo único
  historial vive en el snapshot pierde su tabla de posiciones (mismo caso que ligas que nunca
  corrieron el import).
  - **Gap grande encontrado, no estaba en el inventario original — `entities/organization/queries.ts`
    tiene SU PROPIA copia casi idéntica de la lógica snapshot-primero, sin pasar por
    `lib/standings.ts`:**
    - `getLatestStandings(leagueId)` — tabla pública de una liga (duplica exactamente el patrón
      Prioridad 1/2 que tenía `lib/standings.ts` antes de este paso, pero con su propia
      implementación). **P10, pendiente.**
    - `getStandingsHistory(leagueId)` — historial de posiciones por jornada para el gráfico de
      evolución de una liga. 100% `team_standings_snapshot`, sin ningún equivalente V2 (no existe un
      "snapshot en vivo" por jornada para standings — habría que construirlo como se hizo en P6 con
      `computeTeamStandingsUpTo` sobre todas las jornadas, no solo la última). **P11, pendiente.**
    - `getLeagueSnapshot(leagueId)` — líder de tabla + top goleador + última jornada, para las cards
      del hub de organización. Lee `team_standings_snapshot` Y `player_season_stats` directo. **P12,
      pendiente.**
    - Función sin nombre propio (~línea 830, agregación multi-liga) que suma `player_season_stats.goals`
      y el máximo de `team_standings_snapshot.jornada` a través de varias ligas — probablemente
      alimenta un dashboard cross-liga. **P13, pendiente.**
    - Ninguna de estas cuatro estaba en el inventario original de §2 (P1–P7). Se agregan a la tabla
      de consumidores como P10–P13.

### P10–P15 — RESUELTO 2026-07-20 (`entities/organization/queries.ts`)

Al abrir el archivo para resolver P10–P13 aparecieron dos consumidores V1 más, no listados antes:
`searchTopScorers` (P14, tabla de goleadores de `/org/[slug]/[leagueSlug]`) y `getLeaguesShowcase`
(P15, vitrina de ligas de la homepage). Los seis se resolvieron en el mismo paso:

- **Helpers locales nuevos** (auto-contenidos, no importan `entities/player/live-stats.ts` — FSD
  §3.1 prohíbe imports laterales entre entities): `getMergedLeagueScorers(leagueIds)` (goleo
  combinado Excel-si-existe/en-vivo, mismo criterio que `live-stats.ts` pero implementación propia)
  y `getLastJornadaForLeagues(leagueIds)` (última jornada con partido contado, vía `matchdays`).
- **P10 `getLatestStandings`** → se retira la Prioridad 1 (`team_standings_snapshot`), igual que
  P7 en `lib/standings.ts` (archivo distinto, misma duplicación preexistente). `jornada` ya no es
  siempre `null`: ahora sale de `getLastJornadaForLeagues`.
- **P14 `searchTopScorers`** → usa `getMergedLeagueScorers` + filtro/orden/paginado en memoria
  (aceptable: acotado a una sola liga, nunca miles de filas — no vale la pena reimplementar la
  lógica "Excel vs. en vivo" dos veces en SQL paginado).
- **P11 `getStandingsHistory`** → **retirada, no migrada.** Cero callers reales en `src/app` (el
  "gráfico de evolución" de su comentario nunca se construyó) — mismo patrón que P1/P2.
- **P15 `getLeaguesShowcase`** → `playerCount`/`topScorer` migrados a `getMergedLeagueScorers`.
- **P12 `getLeagueSnapshot`** → ya no duplica lectura de standings/goleo: delega a
  `getLatestStandings` (mismo archivo, ya migrado) + `getMergedLeagueScorers`.
- **P13 `getOrgHubStats`** → `totalGoals` desde `getMergedLeagueScorers` across las ligas de la org;
  `lastJornada` desde `getLastJornadaForLeagues`.
- Mejora real (no solo limpieza V1): en los 5 puntos migrados (P10, P12–P15), cualquier liga 100%
  en-app antes aportaba 0 a estos totales/vitrinas — ahora sí cuenta.

Salida de fase: **cero referencias a tablas/ vista V1 en `src/` fuera de `db/` infra.**
Verificar con grep (ver §6).

### Fase 1 — P8/P9 (RESUELTO 2026-07-20)

- **`searchPlayersForDisambiguation`** → reescrita: busca en `global_players` por nombre, resuelve
  sus `league_members` para saber en qué ligas participan, y usa `getMergedLeagueStatsRows`
  (fuente combinada, misma que el resto del módulo) para los goles por liga. Ya no lee
  `player_season_stats` directo. `season` (antes venía del join a `playerSeasonStats`/`leagues`)
  ahora sale de un lookup aparte a `leagues` (`getMergedLeagueStatsRows` no expone ese campo).
- **`getPrevGoalsByLeague`** → reemplazada por `getPrevJornadaGoalsByLeague` (nueva, en
  `entities/player/live-stats.ts`): en vez de leer `player_season_stats_snapshot`, calcula las dos
  jornadas más recientes de cada liga desde `matches`+`matchdays` y agrega goles acumulados hasta
  la penúltima directamente desde `match_player_stats`. Cubre TODAS las ligas con 2+ jornadas
  registradas (antes solo las que tenían snapshot V1) — una liga 100% en-app ya no sale siempre
  como "isNew" en `positionDelta`, mejora real de producto, no solo limpieza V1.

### Fase 2 — Retirar la vista SQL — RESUELTO 2026-07-22

4. `pgView("player_global_stats")` y su tipo `PlayerGlobalStatsRow` se quitaron de
   `schema.ts` (junto con el import ahora-huérfano de `pgView`). Cero referencias
   restantes a `playerGlobalStats`/`PlayerGlobalStatsRow` en `src/` (confirmado por
   grep). **Pendiente para ti:** correr `pnpm db:generate` para que Drizzle genere
   la migración `DROP VIEW player_global_stats` a partir de este diff, revisarla, y
   `pnpm db:migrate:run` para aplicarla.
5. `src/db/views.sql` reescrito: las 4 vistas (`player_league_stats`,
   `player_global_stats`, `league_standings`, `league_top_scorers`) no tenían NINGÚN
   lector en `src/` (se crearon a mano en Supabase, fuera del flujo de migraciones
   Drizzle — solo `player_global_stats` tenía su espejo en `schema.ts`, ya cubierto
   por el punto 4). El archivo ahora es solo un registro histórico con los `DROP
   VIEW` a correr manualmente en Supabase (no hay migración Drizzle para esto,
   porque nunca fueron parte del schema gestionado).

### Fase 3 — Soltar FKs puente — RESUELTO 2026-07-22

7. Se quitaron de `schema.ts` las columnas `legacy_player_id` (`player_registrations`,
   `player_season_stats`, `match_events`) y `claimed_player_id` (`player_profiles`), junto
   con sus índices (`registrations_legacy_player_idx`, `pss_legacy_player_idx`,
   `events_legacy_player_idx`, `idx_player_profiles_claimed`) y sus relations Drizzle
   (`legacyPlayer`, `claimedPlayer`). **Pendiente para ti:** `pnpm db:generate` (genera el
   `ALTER TABLE ... DROP COLUMN` a partir del diff) + `pnpm db:migrate:run`.
   - **P16, descubierto al abrir el archivo:** el módulo completo `entities/player-profile`
     (`queries.ts`: `claimProfile`/`rejectClaim`/etc., `model.ts`, `index.ts`) no tenía NINGÚN
     caller real fuera de sí mismo — la identidad local hoy vive en `league_members`, no en
     `player_profiles` (que ya estaba marcada `@deprecated` en el comentario del schema). Se
     retiró completo (mismo patrón que P1/P2), no solo la función que usaba `claimedPlayerId`.
   - **P17, descubierto al abrir el archivo:** dos rutas API con cero callers reales seguían
     ESCRIBIENDO en las columnas puente: `POST /api/teams/[id]/roster` (`playerRegistrations.legacyPlayerId`)
     y `POST /api/matches/[id]/events` (`matchEvents.legacyPlayerId`) — contradice la premisa
     original del plan de que V1 era "solo lectura" en producción. El roster real V2 usa
     `/api/teams/[id]/members` y `/roster/[memberId]` (+ `/transfer`), rutas distintas que
     siguen vivas; `match_events` no tiene ningún flujo V2 (se dropea completa en Fase 4, D3).
     Ambas rutas se retiraron (vaciadas a `export {}`), no se migraron.
   - **Efecto en scripts de infra** (rompían compilación al quitar las columnas, se arreglaron
     en el mismo paso para no violar R4):
     - `db/migrate-to-league-members.ts` — script one-off ya corrido, dependía 100% de
       `claimed_player_id`/`legacy_player_id` para resolver `global_player_id`. Retirado
       (no puede volver a correr sin esas columnas, y no lo necesita — ya migró los datos).
     - `db/seed.ts` — seguía poblando `players`/`playerRegistrations`/`playerSeasonStats`
       (tablas V1, aún existen hasta Fase 4) usando `legacyPlayerId` como vínculo al jugador.
       Se reemplazó por un campo local `_playerId` (no persistido, se filtra antes del insert)
       para que el seed siga pudiendo construir snapshots/eventos deterministas sin la columna.
     - `db/simulator/contributors/aggregates.ts` — tenía un `legacyPlayerId: null` literal en
       la fila de `playerSeasonStats` que arma; se quitó (ya no es un campo válido).

### Fase 4 — Dropear tablas V1 + `match_events` (D3)
8. Migración nueva, en orden hijo→padre:
   `match_events` (D3), `player_season_stats_snapshot`, `team_standings_snapshot`,
   `player_season_stats`, `player_registrations`, y por último `players`.
9. Quitar de `schema.ts` las tablas, relaciones y tipos (`Player`, `NewPlayer`,
   `PlayerRegistration`, `PlayerSeasonStats`, snapshots, `MatchEvent`/`NewMatchEvent`…).

### Fase 5 — Limpieza de infra
10. Limpiar `seed.ts`, `simulator/*`, `dedupe-player-season-stats.ts` y los scripts
    `migrate-to-*.ts` (archivar o borrar; ya cumplieron su función).
11. Actualizar `AGENTS.md`: retirar §1.7 y las secciones que describen la coexistencia V1/V2,
    dejando sólo V2 como fuente única.

### Fase 6 — Verificación (ver §6)

---

## 5. Decisiones tomadas (2026-07-20)

- **D1 — Histórico de Excel: NO se preserva. Borrado limpio.** Todo lo relevante ya está en V2 o
  el dato de Excel es descartable. Aun así, el backup de Fase 0 se hace igual (red de seguridad),
  pero **no** hay backfill de datos. → R1 baja a "aceptada con backup".
- **D2 — Reimplementar sobre V2 antes de borrar.** `getJornadaHonor` (P3), las píldoras de delta
  (P6) y `positionDelta` se **reescriben** contra `match_player_stats` + `matchday` en la Fase 1.
  No se acepta regresión visible. → añade trabajo a Fase 1, cierra R3.
- **D3 — `match_events` entra en este mismo PR.** Se elimina junto con el bloque V1. Se asume la
  pérdida de MVP y eventos finos que no existen en `match_player_stats` (documentarlo en el PR y
  en AGENTS.md). → su FK `legacy_player_id` cae en Fase 3 y la tabla en Fase 4.

---

## 6. Verificación (checklist de cierre)

- [ ] `grep -rE "\b(players|playerRegistrations|playerSeasonStats|playerSeasonStatsSnapshot|teamStandingsSnapshot|playerGlobalStats)\b" src` no arroja nada fuera de `src/db/` infra archivada.
- [ ] `grep -r "player_global_stats\|player_league_stats\|league_top_scorers" src` limpio.
- [ ] `pnpm typecheck` y `pnpm build` verdes (los tipos `$inferSelect` de tablas borradas fallarían si algo quedó colgando).
- [ ] `pnpm test` verde (mappers, hooks, ranking, perfil).
- [ ] Smoke manual en una liga 100% en-app: `/`, `/ranking`, `/player/[id]`, `/matchday`,
      `/admin/analisis`, top-scorers — nada vacío que antes tuviera dato.
- [ ] Smoke en una liga que era de Excel: confirmar el comportamiento esperado según D1/D2
      (dato migrado, o vacío aceptado).
- [ ] Migraciones nuevas son forward-only, con tag único, sin editar historial (§15).
- [ ] Backup de V1 archivado y referenciado en el PR.

---

## 7. Riesgos

| ID | Riesgo | Severidad | Mitigación |
| --- | --- | --- | --- |
| R1 | **Pérdida de histórico de Excel.** `player_season_stats` es la única fuente de stats para ligas importadas sin captura V2. Dropear = pérdida permanente. | Alta | Backup (Fase 0) + diagnóstico §3 + decisión D1 antes de dropear. |
| R2 | **Regresión visible en producto.** Ligas de Excel caen al cálculo en vivo (`match_player_stats`), potencialmente vacío → ranking/perfil/goleo en 0. | Alta | Backfill V2 o comunicar/aceptar el vacío (D1/D2). Smoke §6. |
| R3 | **Contenido roto.** `getJornadaHonor`, píldoras de delta y `positionDelta` dependen 100% de V1/snapshots. Sin reimplementar, quedan vacíos. | Media | D2: reimplementar sobre `match_player_stats`+`matchday`, o aceptar pérdida. |
| R4 | **Romper build/runtime por orden.** Dropear tablas antes de migrar lecturas rompe compilación (`$inferSelect`) y endpoints. | Alta | Respetar fases: código primero (Fase 1), DB después (2–4). |
| R5 | **FKs colgantes.** `DROP TABLE players` falla mientras existan las FKs `legacy_player_id` / `claimed_player_id`. | Media | Fase 3 antes de Fase 4. |
| R6 | **Violación de la regla de migraciones (§15).** Editar/regenerar historial o SQL destructivo sin sign-off. | Alta | Solo migraciones nuevas append-only; conexión directa (no pooler); confirmación del dev para lo destructivo. |
| R7 | **Dos `getPlayerGlobalStats` distintos** (uno en `lib/stats.ts`, otro en `entities/player/queries.ts`) con firmas y fuentes distintas. Migrar uno y no el otro deja inconsistencia. | Media | Consolidar en una sola función V2 durante Fase 1; actualizar todos los callsites. |
| R8 | **`match_events` acoplado.** Varias lecturas legacy lo usan; su MVP/eventos no existen en `match_player_stats`. | Media | D3: decidir alcance; si se conserva, documentar que MVP/eventos finos se pierden. |
| R9 | **Datos de simulador/seed** insertan en tablas V1; tras el drop, seed/simulador fallan. | Baja | Fase 5: limpiar seed/simulador en el mismo PR. |

---

## 8. Resumen ejecutivo

La importación ya no existe, pero **V1 sigue vivo como fuente de lectura** en ~7 puntos de
producción (P1–P7), una vista SQL y 5 tablas con FKs puente. No es un borrado de una línea:
el camino seguro es **(1) migrar cada lectura a V2/fuente combinada, (2) dropear la vista,
(3) soltar las FKs `legacy_player_id`, (4) dropear las tablas, (5) limpiar infra** — todo con
migraciones forward-only y un backup previo. El punto de decisión crítico es **si hay histórico
de Excel que preservar** (D1): eso determina si esto es una eliminación limpia o una migración de
datos con eliminación al final.
