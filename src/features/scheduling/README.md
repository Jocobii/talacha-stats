# Módulo de sorteo y calendarización

Genera, persiste y mantiene el calendario de partidos de una liga. Feature opt-in por liga (`leagues.scheduling_enabled`).

Para el contexto de producto ver `docs/PRODUCT-STRATEGY.md §11`. Para reglas de contribución ver `AGENTS.md §14`.

---

## Estructura de carpetas

```
features/scheduling/
├── constants.ts                  # SCHEDULING_PHASES, CHANGE_TYPES, etc.
├── types.ts                      # Tipos de dominio: Pairing, TimeSlot, AssignedMatch, …
├── README.md                     # Este archivo
│
├── lib/
│   ├── pair-key.ts               # Clave canónica para un par de equipos
│   └── time-overlap.ts           # toMinutes, addMinutes, slotsOverlap
│
├── pairing-generator/            # Capa 1 — sin imports de DB
│   ├── circle-method.ts          # Round-robin con PRNG seeded (mulberry32)
│   ├── apply-rest-requests.ts    # Aplica descansos (S3) intercambiando con BYE
│   ├── validate-no-duplicates.ts # Garantiza S4: sin pares repetidos en fase regular
│   ├── generate-pairings.ts      # Orquestador de Capa 1
│   └── __tests__/
│       └── circle-method.test.ts # Vitest: N par, N impar, reproducibilidad
│
├── slot-assigner/                # Capa 2 — sin imports de DB
│   ├── build-slots.ts            # Genera TimeSlot[] desde venue_time_windows
│   ├── conflict-detector.ts      # Detecta colisiones S7 (slots comprados)
│   ├── assign-greedy.ts          # Asigna slots con prioridad: comprado > libre
│   └── assign-slots.ts           # Orquestador de Capa 2
│
├── config/
│   └── upsert-config.ts          # CRUD de leagueSchedulingConfig
│
├── rest/
│   └── create-rest-request.ts    # Registra descanso solicitado por un equipo (S3)
│
├── purchased/
│   └── create-purchased-slot.ts  # Registra slot comprado por un equipo (S7)
│
├── overrides/                    # Override engine post-sorteo (S6)
│   ├── change-kickoff.ts         # Mueve la hora de un partido
│   ├── change-venue.ts           # Cambia la cancha (y opcionalmente la hora)
│   └── swap-teams.ts             # Sustituye un equipo en un partido
│
└── makeup/                       # Recuperación para equipos tardíos (S2)
    ├── detect-deficit.ts         # Detecta qué equipos tienen partidos faltantes
    └── build-makeup-matches.ts   # Genera y persiste jornadas de recuperación
```

---

## Flujo de datos

```
POST /schedule/preview  (idempotente, sin persistir)
POST /schedule/confirm  (transacción atómica)
          │
          ├─ generatePairings()        ← Capa 1
          │    ├─ generateRoundRobin() ← circle method + seed
          │    ├─ applyRestRequests()  ← descansos (S3)
          │    └─ validateNoDuplicates() ← S4
          │
          └─ assignSlots()             ← Capa 2
               ├─ buildSlotsForDay()   ← slots por venue + día
               ├─ detectPurchasedSlotConflicts() ← S7
               └─ assignGreedy()       ← asignación con prioridad
```

---

## Invariantes de dominio

| Invariante                                       | Dónde se garantiza                                             |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Mismo seed → mismo sorteo (S1)                   | `mulberry32` en `circle-method.ts` + `lastSeed` guardado en DB |
| Sin pares duplicados en fase regular (S4)        | `validate-no-duplicates.ts` + índice SQL `uq_regular_pair`     |
| BYE nunca se persiste en `matches`               | `confirm/route.ts` filtra `awayTeamId !== null`                |
| Override siempre registra snapshot               | `match_schedule_overrides` con `previousValue` / `newValue`    |
| Jornadas makeup numeradas tras la última regular | `build-makeup-matches.ts` → `lastMatchday.number + 1`          |

---

## Cómo correr los tests

```bash
pnpm vitest run src/features/scheduling/pairing-generator/__tests__/
```

Tests existentes en `circle-method.test.ts`:

- N=6 (par): 5 jornadas, 3 partidos/jornada, sin duplicados, cubre C(6,2)=15 pares
- N=5 (impar): 5 jornadas, 1 BYE/jornada, cada equipo descansa exactamente 1 vez
- Reproducibilidad: mismo seed → mismo resultado, seeds distintos → resultados distintos
- Edge case: N=2 → 1 jornada, 1 partido

---

## Endpoints expuestos

| Método              | Ruta                                     | Descripción                         |
| ------------------- | ---------------------------------------- | ----------------------------------- |
| POST                | `/api/leagues/[id]/scheduling-toggle`    | Activa/desactiva el módulo          |
| PUT                 | `/api/leagues/[id]/scheduling-config`    | Configura duración, buffer, formato |
| GET/POST            | `/api/venues`                            | CRUD de canchas                     |
| POST/DELETE         | `/api/leagues/[id]/venues`               | Asignar/desasignar venue a liga     |
| GET/POST/PUT/DELETE | `/api/venues/[id]/windows`               | Ventanas horarias                   |
| POST/DELETE         | `/api/leagues/[id]/rest-requests`        | Descansos solicitados               |
| POST/DELETE         | `/api/leagues/[id]/purchased-slots`      | Slots comprados                     |
| POST                | `/api/leagues/[id]/schedule/preview`     | Preview sin persistir               |
| POST                | `/api/leagues/[id]/schedule/confirm`     | Confirmar y persistir               |
| PATCH               | `/api/leagues/[id]/matches/[id]/kickoff` | Override: cambiar hora              |
| PATCH               | `/api/leagues/[id]/matches/[id]/venue`   | Override: cambiar cancha            |
| PATCH               | `/api/leagues/[id]/matches/[id]/swap`    | Override: sustituir equipo          |
| GET                 | `/api/leagues/[id]/makeup`               | Ver déficit actual                  |
| POST                | `/api/leagues/[id]/makeup`               | Generar jornadas de recuperación    |
