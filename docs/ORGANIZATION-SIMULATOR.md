# Organization Simulator — laboratorio de datos a escala

> **Estado:** propuesta de trabajo (jul 2026). Fuente de verdad de posicionamiento sigue siendo `AGENTS.md` §1.5. Este doc traduce el norte a un plan concreto para un **laboratorio de datos** que llene todos los módulos con datos coherentes, a volumen, para probar flujos reales y medir rendimiento.

## 0. Qué es y qué NO es

El Organization Simulator es **herramienta de desarrollo**, no producto. Su fin es:

1. Poblar una organización con datos **coherentes en cascada** (partidos → eventos → stats → tabla → suspensiones → liguilla), no filas sueltas.
2. Hacerlo a **volumen** (temporadas de datos) para detectar a tiempo bugs, cuellos de botella de query y momentos donde la UX/UI se rompe por cantidad.
3. Ser **incremental y extensible**: avanzar la liga 1–5 jornadas por corrida sin duplicar información, y que cada feature nueva agregue su propio "contribuidor" de seed sin tocar el orquestador central.

No es: motor de importación (eliminado, ver memoria `import-excel-removed`), ni fixtures de test unitario (eso sigue en `seed.ts`).

---

## 1. Punto de partida verificado (contra el código)

| Pieza                   | Qué hace hoy                                                                           | Límite para un laboratorio                                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/seed.ts`        | Seed determinista (`det()` / `detShuffle`) de escala MVP (~60 jugadores, ~30 partidos) | Fijo y chico. Bueno para e2e, inservible para stress a escala.                                                                                                                                                                                                                          |
| `POST /api/seed-liga`   | Genera 1 liga parametrizable, simula marcadores con Poisson                            | **Solo escribe tablas V1** (`players`, `playerRegistrations`, `playerSeasonStats`, `teamStandingsSnapshot`). Usa `Math.random` (no reproducible). Tira lo individual: no escribe `matches`, `matchEvents`, `matchPlayerStats`, `matchdays`, `venues`, `suspensions`, `playoffBrackets`. |
| `/admin/seed-liga` (UI) | Formulario que llama a la ruta anterior                                                | Base a evolucionar hacia "Organization Simulator".                                                                                                                                                                                                                                      |

**Hueco central:** para probar "todos los flujos de forma real", el laboratorio debe escribir la **cadena V2 completa** y todos los módulos de gestión, con reproducibilidad y unicidad de identidad.

---

## 2. Principios de diseño (filtran todo lo de abajo)

1. **Consistencia en cascada.** Nada se randomiza de forma independiente. La tabla, el goleo y las suspensiones se **derivan** de filas reales de `matches` / `matchEvents` / `matchPlayerStats`. Si un partido dice 5-3, la suma de eventos de gol debe dar 5-3.
2. **PRNG con semilla, no `Math.random`.** Toda aleatoriedad pasa por un generador sembrado (p. ej. mulberry32). Misma semilla ⇒ mismo dataset XL ⇒ un bug de rendimiento se reproduce las veces que quieras.
3. **Identidad irrepetible.** La unicidad de jugador la garantiza `global_players.curp_hash` (UNIQUE). El motor genera CURPs y nombres canónicos únicos; **reutiliza** la misma identidad global entre ligas (que es el punto del CURP) pero **nunca la duplica**.
4. **Incremental.** Cada corrida avanza el estado (1–5 jornadas), computando la próxima jornada desde el `max` existente. Reejecutar acumula temporadas sin duplicar lo ya generado.
5. **Extensible por registro.** Cada módulo es un "contribuidor" `contribute(ctx)`. Feature nueva = archivo nuevo + un commit. El orquestador nunca se reescribe.

---

## 3. Arquitectura propuesta

Motor de **simulación temporal incremental** en tres capas:

```
                 ┌─────────────────────────────────────────┐
                 │  Orquestador  (orden topológico + ctx)   │
                 └─────────────────────────────────────────┘
                    │            │            │          │
             ┌──────▼──┐  ┌──────▼───┐  ┌─────▼────┐  ┌──▼────────┐
             │ identidad│  │ estructura│  │  tiempo  │  │  derivados │
             │(orgs,     │  │(ligas,    │  │(jornadas,│  │(tabla,    │
             │ users,    │  │ equipos,  │  │ partidos,│  │ goleo,    │
             │ jugadores,│  │ inscrip., │  │ eventos, │  │ suspens., │
             │ venues)   │  │ miembros) │  │ cédulas) │  │ liguilla) │
             └──────────┘  └──────────┘  └──────────┘  └───────────┘
```

- **`ctx` compartido:** `{ rng, tier, org, users, venues, globalPlayers, leagues, teams, members, inscriptions, matchdaysByLeague, ... }`. Los contribuidores leen lo que necesitan y escriben lo suyo.
- **Registro de contribuidores:** array ordenado por dependencia. Cada uno declara `dependsOn` para validar el orden en dev.
- **Tiers de volumen** (parámetros, no lógica distinta):

  | Tier | Orgs | Ligas/org | Equipos/liga | Jugadores/equipo | Jornadas/corrida |
  | ---- | ---- | --------- | ------------ | ---------------- | ---------------- |
  | S    | 1    | 1         | 8            | 8                | 1–5              |
  | M    | 1    | 3         | 10           | 10               | 1–5              |
  | L    | 1    | 6         | 12           | 12               | 1–5              |
  | XL   | 3    | 6         | 14           | 14               | 1–5              |

- **Modelo de temporada (decidido):** se piensa en **temporadas**, no en años.
  - 1 temporada = **20 jornadas**. 1 jornada = **1 semana** (las fechas de `matches` avanzan +7 días por jornada).
  - Cada corrida avanza **1–5 jornadas** dentro de la temporada activa, computando la próxima desde el `max` existente.
  - Al llegar a la jornada 20: **cierre de temporada** (tabla final + liguilla/`playoffs`), y arranque de una **nueva temporada** con los **mismos `global_players`** re-inscritos (nuevas `leagues`/`league_members`, identidad intacta).
  - Multiplicador `temporadas: N` para generar varias de un tirón (1 año = 2 temporadas).

- **Snapshot / restore:** una vez generado el XL, `pg_dump` (ya tienes `db:backup` vía db-tools) para restaurar en segundos sin repagar la generación. Ideal para CI y para volver a un estado pesado conocido.

---

## 4. Orden topológico de generación (grafo verificado del esquema)

```
organizations
 ├─ organizationConfig, organizationThemes
 ├─ users
 ├─ venues ─ venueRentals
 └─ global_players            (pool de identidad, CURP único)
      │
      leagues (org)
       ├─ leaguePlayoffZones, leagueConfig, leagueSchedulingConfig
       ├─ leagueVenues, venueTimeWindows
       ├─ teams
       ├─ league_members (global_player + league, UNIQUE) ─ inscriptions (member+team, UNIQUE)
       ├─ matchdays
       │    └─ matches (league, teams, matchday, venue)
       │         ├─ matchEvents (globalPlayer / leagueMember / team)
       │         └─ matchPlayerStats (inscription)
       ├─ [derivados] playerSeasonStats · teamStandingsSnapshot · playerSeasonStatsSnapshot
       ├─ suspensions (globalPlayer, league, sourceMatch)
       ├─ [scheduling] teamRestRequests · teamPurchasedTimeslots · makeupMatches · matchScheduleOverrides
       └─ playoffBrackets ─ playoffSlots   (cuando la liga termina)
 └─ [telemetría opcional] narratorAnalysisEvents · pageViews
```

> V1 (`players`, `playerRegistrations`) queda como opción de compatibilidad si algún read path aún lo usa; el motor escribe la cadena V2 (`globalPlayerId`).

---

## 5. Módulos → contribuidores

| Contribuidor        | Escribe                                                                                 | Depende de           |
| ------------------- | --------------------------------------------------------------------------------------- | -------------------- |
| `identity`          | `organizations`, `organizationConfig`, `users`, `global_players`                        | —                    |
| `venues`            | `venues`, `venueRentals`, `leagueVenues`, `venueTimeWindows`                            | identity, structure  |
| `structure`         | `leagues`, `leagueConfig`, `leagueSchedulingConfig`, `teams`, `leaguePlayoffZones`      | identity             |
| `enrollment`        | `league_members`, `inscriptions`                                                        | structure            |
| `calendar`          | `matchdays`                                                                             | structure, venues    |
| `matchplay` (motor) | `matches`, `matchEvents`, `matchPlayerStats`                                            | enrollment, calendar |
| `aggregates`        | `playerSeasonStats`, `teamStandingsSnapshot`, `playerSeasonStatsSnapshot`               | matchplay            |
| `discipline`        | `suspensions` (+ `leagueMembers.status`)                                                | matchplay            |
| `scheduling-extras` | `teamRestRequests`, `teamPurchasedTimeslots`, `makeupMatches`, `matchScheduleOverrides` | matchplay            |
| `playoffs`          | `playoffBrackets`, `playoffSlots`                                                       | aggregates           |
| `telemetry` (opc.)  | `narratorAnalysisEvents`, `pageViews`                                                   | matchplay            |

---

## 6. Unicidad de jugadores (el requisito explícito)

- Generar **CURP sintético con formato válido** (18 chars: 4 letras + fecha + sexo + estado + consonantes + homoclave) → `curpHash = sha256(CURP)`. UNIQUE en DB garantiza cero colisiones; el generador además lleva un `Set` de CURPs usados.
- **Nombre canónico único:** `sanitizeToCanonical()` (ya existe en `shared/lib/normalize.ts`). Si un nombre canónico ya salió, el motor cambia apellido/segundo apellido antes de insertar. Pool suficientemente grande + sufijos deterministas evitan repetición aun en XL.
- **`birth_date` dispersa** por jugador (rango 18–45 años) para que perfiles y filtros por edad no queden idénticos.
- **Reutilización cross-liga = misma identidad, distinto `league_member`.** Un porcentaje de `global_players` se inscribe en 2+ ligas: eso es dato realista y presumible (norte §1.5), no duplicación.

---

## 7. Consistencia en cascada (regla de oro)

1. `matchplay` simula el marcador (extiende el Poisson que ya usa `seed-liga`), luego **reparte esos goles** entre jugadores reales del roster como `matchEvents` (gol/asistencia/amarilla/azul/roja). Suma de eventos de gol == marcador.
2. `matchPlayerStats` se llena por partido desde esos eventos.
3. `aggregates` **suma** los `matchPlayerStats` para `playerSeasonStats` y recomputa la tabla desde resultados reales — no números independientes. Snapshots por jornada salen de cortes acumulados.
4. `discipline` lee las tarjetas reales: 2 amarillas acumuladas o roja directa ⇒ `suspensions`. Respeta el modelo `matches/time/permanent` (memoria `suspensions-duration-model`): mayoría automáticas por partidos; una fracción marcada como caso grave (texto libre, semanas/indefinido).

---

## 8. Medición de rendimiento (arnés)

- Postgres: `log_min_duration_statement` para cazar queries lentas durante la generación y navegación.
- `EXPLAIN ANALYZE` sobre las vistas pesadas (`views.sql`) y las lecturas clave: ranking, goleo histórico, tabla, perfil.
- Script de humo que golpea `/ranking`, `/player/[id]`, `/matchday`, narrador midiendo TTFB por tier (S→XL) para ver dónde escala mal.
- Registrar los hallazgos por tier: qué ruta necesitó paginación, índice o cambio de UX antes de que lo sufra un organizador real.

---

## 9. Épicas y pasos (un commit por paso)

### Épica A — Núcleo del motor (sin UI)

- A1. `rng.ts` sembrado (mulberry32) + helpers `pick/pickN/weighted` deterministas.
- A2. Generador de identidad única (CURP sintético + nombre canónico + birthDate).
- A3. Tipo `SimContext` + contrato `Contributor { name, dependsOn, contribute(ctx) }` + orquestador con validación de orden topológico.
- A4. Guardas de seguridad (aborta si `DATABASE_URL` es prod, igual que `seed.ts`).

### Épica B — Contribuidores de estructura e identidad

- B1. `identity` (orgs, config, users, global_players).
- B2. `structure` (leagues, config, teams, zones).
- B3. `venues` (+ leagueVenues, ventanas horarias).
- B4. `enrollment` (league_members + inscriptions, con reutilización cross-liga controlada).

### Épica C — Motor de tiempo y cascada

- C1. `calendar` (matchdays, 1–5 por corrida, incremental desde el max existente).
- C2. `matchplay` (matches + reparto de eventos + matchPlayerStats).
- C3. `aggregates` (season stats + standings + snapshots derivados).
- C4. `discipline` (suspensiones desde tarjetas reales).
- C5. `scheduling-extras` + `playoffs` (cuando la liga termina).

### Épica D — Volumen, snapshot y medición

- D1. Tiers S/M/L/XL parametrizados.
- D2. Integración `pg_dump`/restore para el XL.
- D3. Arnés de medición (log de queries + script TTFB) y reporte por tier.

### Épica E — UI "Organization Simulator" _(sin diseño nuevo: reusa layout de seed-liga)_

- E1. Renombrar `/admin/seed-liga` → `/admin/organization-simulator` (solo owner), **reusando el layout actual del formulario** (sin diseño nuevo).
- E2. Controles: tier, escenario, jornadas a avanzar (1–5), temporadas (N), semilla, org destino.
- E3. Resumen de corrida (qué módulos se llenaron, filas creadas, jugadores únicos, tabla resultante).

> **Gate resuelto (jul 2026):** no hay diseño; se reusa el layout de `seed-liga`. Épica E ya no está bloqueada, pero va **después** de A–D (backend/CLI primero).

---

## 10. Decisiones

1. **Diseño de la UI (E).** ✅ Sin diseño nuevo — se reusa el layout de `/admin/seed-liga`. UI va después de A–D.
2. **Unidad de volumen.** ✅ Modelo por **temporada**: 1 temporada = 20 jornadas, 1 jornada = 1 semana. Corrida = avanzar 1–5 jornadas; multiplicador `temporadas: N` para generar varias. Ver §3.
3. **V1 legacy** _(pendiente, lo verifico yo)._ ¿El motor escribe también tablas V1 por compatibilidad, o solo V2? Verificar si algún read path público aún depende de V1 antes de decidir.
