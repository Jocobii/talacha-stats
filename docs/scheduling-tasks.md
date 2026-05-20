# Plan de implementación — Sorteo y calendarización (tareas)

> **Estado:** Listo para implementación
> **Fecha:** 2026-05-15
> **Documento de diseño:** [`scheduling-plan.md`](./scheduling-plan.md)
> **Para:** IA codificadora (Claude/Copilot/Cursor) y devs humanos

Este documento descompone el plan de diseño en tareas accionables. **No es
opcional leer `scheduling-plan.md` antes de implementar** — esto contiene el
**qué** y el **cómo**, pero el **por qué** vive en el plan.

---

## Cómo usar este documento

Cada tarea tiene:

- **ID** estable (`T<fase>.<num>`) — úsalo en commits y PRs.
- **Objetivo**: una frase clara.
- **Archivos**: rutas exactas a crear/editar.
- **Acceptance criteria**: cómo verificas que está hecha.
- **Depende de**: IDs de tareas previas que deben completarse antes.

**Reglas universales** (no se repiten en cada tarea):

- TypeScript estricto, sin `any`. Tipos de retorno explícitos en
  `features/` y `entities/`.
- Schemas Zod son fuente de verdad; tipos se infieren con `z.infer<>`.
- Funciones ≤ 20 líneas, componentes ≤ 150 líneas. Si rebasa, extrae.
- Validación canónica con `sanitizeToCanonical()` desde `shared/lib/normalize`.
- Routes (`route.ts`) son delgados: parse Zod → llamar feature → `apiSuccess`/`apiError`.
- Respuestas con `apiSuccess()` / `apiError()` desde `@/types`.
- Transacciones (`db.transaction`) en `features/`, nunca en `route.ts`.
- Cada feature pública (no helpers internos) tiene tests unitarios con Vitest.
- Server Components por defecto; Client Components solo cuando hay estado.

**Antes de empezar cualquier fase, corre:**

```
pnpm typecheck
pnpm lint
pnpm test
```

Todo verde antes de tocar código.

---

## Decisiones que rigen este plan

(Resumen — detalle en `scheduling-plan.md` §12)

1. **Posicionamiento**: módulo opt-in por liga (`leagues.scheduling_enabled`).
2. **Sorteo aleatorio** con seed reproducible.
3. **Solo single round-robin** en MVP. Schema soporta `'double'`, no se
   implementa el generador.
4. **UI calendario visual semanal** para ventanas horarias.
5. **No reprogramar jornadas a otro día** — partidos pendientes ruedan a la
   siguiente semana.
6. **Sponsors fuera del MVP.**
7. **Organizers pueden CRUD venues** y windows.
8. **Horarios comprados (S7)**: hard constraint; conflicto entre dos
   compradores se reporta para resolución manual.

---

## Fase 0 — Setup y feature flag

### T0.1 — Agregar flag `scheduling_enabled` en `leagues`

- **Objetivo**: gate del módulo a nivel de liga.
- **Archivos**:
  - `src/db/schema.ts` — añadir `schedulingEnabled: boolean("scheduling_enabled").notNull().default(false)` a `leagues`.
  - Crear migración Drizzle con `pnpm drizzle-kit generate`.
- **Acceptance**:
  - Migración aplicada en DB local sin errores.
  - `pnpm typecheck` verde.
- **Depende de**: nada.

### T0.2 — Endpoint para flipear el flag (solo owners)

- **Objetivo**: que el owner pueda activar el módulo por liga desde la UI.
- **Archivos**:
  - `src/app/api/leagues/[id]/scheduling-toggle/route.ts` — `POST` con body `{ enabled: boolean }`.
  - Validar que el usuario es owner de la organización dueña de la liga.
- **Acceptance**:
  - Toggle persiste; usuarios no-owner reciben 403.
  - Test unitario del feature que toca DB.
- **Depende de**: T0.1.

### T0.3 — Estructura de carpetas FSD

- **Objetivo**: dejar lista la jerarquía vacía de `features/scheduling/`.
- **Archivos** (crear con `index.ts` vacío o con placeholder):
  - `src/features/scheduling/{constants,types,index}.ts`
  - `src/features/scheduling/pairing-generator/`
  - `src/features/scheduling/slot-assigner/`
  - `src/features/scheduling/overrides/`
  - `src/features/scheduling/makeup-builder/`
  - `src/features/scheduling/lib/`
  - `src/features/scheduling/model/`
  - `src/features/scheduling/ui/`
  - `src/entities/venue/{model,queries,index}.ts`
  - `src/entities/matchday/{model,queries,index}.ts`
  - `src/entities/match/{model,queries,index}.ts`
- **Acceptance**: `pnpm typecheck` verde con la estructura vacía.
- **Depende de**: nada.

---

## Fase 1 — Schema completo

Una sola migración Drizzle por la familia de tablas. Es más limpio para
revert si algo sale mal.

### T1.1 — Migración: tablas core

- **Objetivo**: crear todas las tablas nuevas en una migración atómica.
- **Archivos**:
  - `src/db/schema.ts` — añadir, **en este orden** (por dependencias FK):
    1. `venues`
    2. `leagueSchedulingConfig`
    3. `leagueVenues`
    4. `venueTimeWindows`
    5. `matchdays`
    6. `teamRestRequests`
    7. `teamPurchasedTimeslots`
    8. `makeupMatches`
    9. `matchScheduleOverrides`
  - Copiar las definiciones literal del bloque de schema en
    `scheduling-plan.md` §3.1. No improvisar nombres ni constraints.
  - Añadir relations correspondientes al bloque `RELATIONS`.
  - Exportar todos los tipos inferidos (`Venue`, `NewVenue`, `Matchday`, etc.).
- **Acceptance**:
  - Migración aplicada en DB local.
  - `db.query.venues.findMany()` ejecuta sin error.
  - Todos los `unique` y `check` están en la DB (verificar con `\d+ <tabla>` en psql).
- **Depende de**: T0.1, T0.3.

### T1.2 — Migración: ampliar `matches`

- **Objetivo**: añadir columnas `matchdayId`, `venueId`, `kickoffAt`, `isMakeup`.
- **Archivos**:
  - `src/db/schema.ts` — modificar `matches` para incluir:
    - `matchdayId: uuid("matchday_id").references(() => matchdays.id, { onDelete: "set null" })` — nullable durante transición.
    - `venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" })` — nullable.
    - `kickoffAt: timestamp("kickoff_at", { withTimezone: true })` — nullable.
    - `isMakeup: boolean("is_makeup").notNull().default(false)`.
  - Mantener `matchday: integer` legacy (marcar `@deprecated` en comentario).
- **Acceptance**:
  - Migración aplicada.
  - Partidos existentes leen normal (nulls toleradas).
- **Depende de**: T1.1.

### T1.3 — Índice único parcial para S4

- **Objetivo**: red de seguridad a nivel DB contra repetición de pares en
  fase regular.
- **Archivos**:
  - Migración SQL custom (Drizzle no genera índices parciales con expresiones
    complejas). Crear `drizzle/migrations/XXXX_uq_regular_pair.sql`:
    ```sql
    CREATE UNIQUE INDEX uq_regular_pair
      ON matches (
        league_id,
        LEAST(home_team_id, away_team_id),
        GREATEST(home_team_id, away_team_id)
      )
      WHERE is_makeup = false
        AND matchday_id IS NOT NULL
        AND matchday_id IN (
          SELECT id FROM matchdays WHERE phase = 'regular'
        );
    ```
- **Acceptance**:
  - Insert duplicado en fase regular falla con error 23505 de Postgres.
  - Insert válido (par nuevo) pasa sin problema.
- **Depende de**: T1.2.

### T1.4 — Entities: `venue`, `matchday`, `match`

- **Objetivo**: capa de lectura de las nuevas tablas.
- **Archivos**:
  - `src/entities/venue/model.ts` — tipos derivados de Drizzle + `VenueSchema` Zod.
  - `src/entities/venue/queries.ts` — `getVenue`, `listVenuesByOrganization`,
    `listVenuesByLeague(leagueId)` (con join a `league_venues`).
  - `src/entities/matchday/model.ts` — incluye enum `MATCHDAY_PHASES`, `MATCHDAY_STATUSES`.
  - `src/entities/matchday/queries.ts` — `getMatchday`, `listMatchdaysByLeague(leagueId, { phase? })`.
  - `src/entities/match/model.ts` — tipo `MatchWithRelations`.
  - `src/entities/match/queries.ts` — `getMatch`, `listMatchesByMatchday`, `listMatchesByTeamLeague(teamId, leagueId)`.
- **Acceptance**:
  - Cada query tiene tipo de retorno explícito.
  - Tests unitarios mínimos con DB de prueba.
- **Depende de**: T1.1, T1.2.

### T1.5 — Schemas Zod

- **Objetivo**: validación de input para todos los endpoints futuros.
- **Archivos**:
  - `src/types/index.ts` — añadir, copiar literal de
    `scheduling-plan.md` §7:
    - `SchedulingConfigSchema`
    - `CreateVenueSchema`
    - `UpdateVenueSchema` (partial)
    - `CreateVenueWindowSchema`
    - `RestRequestSchema`
    - `CreatePurchasedTimeslotSchema` (nuevo, ver abajo)
    - `GenerateScheduleSchema`
    - `ChangeKickoffSchema`
    - `ChangeVenueSchema`
    - `SwapTeamSchema`
    - `MakeupBuildSchema`
  - `CreatePurchasedTimeslotSchema`:
    ```ts
    export const CreatePurchasedTimeslotSchema = z.object({
    	teamId: z.string().uuid(),
    	leagueId: z.string().uuid(),
    	startTime: z.string().regex(/^\d{2}:\d{2}$/),
    	venueId: z.string().uuid().optional(),
    	activeFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    	endMatchdayNumber: z.number().int().min(1).optional(),
    	notes: z.string().max(500).optional(),
    });
    ```
- **Acceptance**: `pnpm typecheck` verde.
- **Depende de**: T1.4.

---

## Fase 2 — CRUD venues + ventanas horarias

### T2.1 — Feature: CRUD de venues

- **Objetivo**: crear/editar/eliminar canchas con sanitización canónica.
- **Archivos**:
  - `src/features/venue-management/create-venue.ts` — función pura: recibe
    payload validado, sanitiza con `sanitizeToCanonical`, verifica
    existencia previa por `(organizationId, nameCanonical)` (Regla 1 de
    CLAUDE.md), inserta o retorna error de duplicado.
  - `src/features/venue-management/update-venue.ts`.
  - `src/features/venue-management/delete-venue.ts`.
  - `src/features/venue-management/index.ts`.
  - `src/app/api/venues/route.ts` — `GET` (lista por org), `POST` (crear).
  - `src/app/api/venues/[id]/route.ts` — `GET`, `PATCH`, `DELETE`.
- **Acceptance**:
  - Permisos: solo organizers/owners de la org dueña.
  - Duplicado por canónico devuelve 409 con mensaje legible (no constraint catch).
  - Tests unitarios cubriendo: alta exitosa, duplicado, edición, no-encontrado.
- **Depende de**: T1.4, T1.5.

### T2.2 — Feature: asignación de venues a ligas

- **Objetivo**: liga elige qué canchas usa y con qué prioridad.
- **Archivos**:
  - `src/features/venue-management/assign-venue-to-league.ts`.
  - `src/features/venue-management/unassign-venue-from-league.ts`.
  - `src/app/api/leagues/[id]/venues/route.ts` — `GET` (con join a windows), `POST` (asignar).
  - `src/app/api/leagues/[id]/venues/[venueId]/route.ts` — `DELETE` (desasignar).
- **Acceptance**:
  - Si la liga tiene matches usando ese venue, desasignar arroja 409 con mensaje claro.
- **Depende de**: T2.1.

### T2.3 — Feature: ventanas horarias

- **Objetivo**: CRUD de `venue_time_windows`.
- **Archivos**:
  - `src/features/venue-management/create-window.ts` — valida que
    `startTime < endTime` y que no solape con otra ventana del mismo
    venue+día (para el mismo `leagueId`).
  - `src/features/venue-management/update-window.ts`.
  - `src/features/venue-management/delete-window.ts`.
  - `src/app/api/leagues/[id]/venues/[venueId]/windows/route.ts` — `GET`, `POST`.
  - `src/app/api/venue-windows/[id]/route.ts` — `PATCH`, `DELETE`.
- **Acceptance**:
  - Solapamiento de ventanas en mismo venue+día+liga rechazado con 409.
  - Tests cubriendo edge cases: misma hora exacta, ventana 24h, fin antes de inicio.
- **Depende de**: T2.2.

### T2.4 — UI: gestor de venues (página admin)

- **Objetivo**: pantalla para listar/crear/editar canchas.
- **Archivos**:
  - `src/app/admin/venues/page.tsx` — Server Component listando venues de la org activa.
  - `src/app/admin/venues/VenuesTable.tsx` — Client si tiene filtros.
  - `src/app/admin/venues/new/page.tsx` — formulario nuevo venue.
  - `src/app/admin/venues/[id]/page.tsx` — detalle + asignación a ligas + ventanas.
- **Acceptance**:
  - Sin sanitización en `onChange` (Regla 4 de CLAUDE.md).
  - Formularios usan `shared/ui/*` (no nuevos componentes ad hoc).
- **Depende de**: T2.1.

### T2.5 — UI: calendario visual semanal de ventanas

- **Objetivo**: componente tipo Google Calendar para definir disponibilidad.
- **Archivos**:
  - `src/features/venue-management/ui/VenueScheduleCalendar.tsx` — componente Client.
  - 7 columnas (lunes–domingo), eje Y con horas 00:00–23:00 en bloques de 30 min.
  - Click-and-drag para crear bloque; click en bloque existente para editar/eliminar.
  - Asociado a una `(leagueId, venueId)` específica.
  - Persiste vía endpoints de T2.3.
- **Acceptance**:
  - Crear, editar y eliminar ventanas funciona end-to-end.
  - Validación inline: bloques solapados se muestran en rojo y no permiten guardar.
  - Componente ≤ 150 líneas (extraer subcomponentes si crece).
- **Depende de**: T2.3.

---

## Fase 3 — Configuración, descansos y horarios comprados

### T3.1 — Feature: scheduling config CRUD

- **Objetivo**: la liga configura # jornadas, duración, buffer, etc.
- **Archivos**:
  - `src/features/scheduling/config/get-config.ts`.
  - `src/features/scheduling/config/upsert-config.ts`.
  - `src/app/api/leagues/[id]/scheduling-config/route.ts` — `GET`, `PUT`.
- **Acceptance**:
  - Default al crear: `regularMatchdays = teamsCount - 1` (o `teamsCount` si impar).
  - `PUT` valida que `regular_format = 'double'` arroje error en MVP (no soportado).
- **Depende de**: T1.5.

### T3.2 — Feature: rest requests

- **Objetivo**: equipos solicitan descanso en una jornada (S3).
- **Archivos**:
  - `src/features/scheduling/rest/create-rest-request.ts`.
  - `src/features/scheduling/rest/delete-rest-request.ts`.
  - `src/features/scheduling/rest/list-rest-requests.ts`.
  - `src/app/api/leagues/[id]/rest-requests/route.ts` — `GET`, `POST`.
  - `src/app/api/rest-requests/[id]/route.ts` — `DELETE`.
- **Acceptance**:
  - No permite crear si la jornada ya está `published`.
  - Tests cubriendo: alta, duplicado mismo equipo+jornada (409), borrado.
- **Depende de**: T1.4, T1.5.

### T3.3 — Feature: horarios comprados (S7)

- **Objetivo**: registrar que un equipo "compró" un horario fijo para la temporada.
- **Archivos**:
  - `src/features/scheduling/purchased/create-purchased-slot.ts`.
  - `src/features/scheduling/purchased/update-purchased-slot.ts`.
  - `src/features/scheduling/purchased/delete-purchased-slot.ts`.
  - `src/features/scheduling/purchased/list-purchased-slots.ts`.
  - `src/app/api/leagues/[id]/purchased-timeslots/route.ts` — `GET`, `POST`.
  - `src/app/api/purchased-timeslots/[id]/route.ts` — `PATCH`, `DELETE`.
- **Acceptance**:
  - Un equipo no puede tener dos horarios comprados activos en la misma liga (unique).
  - Si se asocia a un venue, valida que ese venue esté asignado a la liga.
  - Tests cubriendo: alta, duplicado, cambio de horario.
- **Depende de**: T1.4, T1.5, T2.2.

### T3.4 — UI: forma de scheduling config

- **Archivos**:
  - `src/app/admin/leagues/[id]/scheduling/page.tsx` — landing del módulo.
  - `src/features/scheduling/ui/SchedulingConfigForm.tsx`.
- **Acceptance**:
  - Solo aparece si `leagues.schedulingEnabled = true` (T0.1).
- **Depende de**: T3.1, T0.2.

### T3.5 — UI: descansos y horarios comprados

- **Archivos**:
  - `src/features/scheduling/ui/RestRequestsPanel.tsx`.
  - `src/features/scheduling/ui/PurchasedTimeslotsPanel.tsx`.
  - `src/app/admin/leagues/[id]/scheduling/page.tsx` los integra como tabs.
- **Acceptance**:
  - Listado, alta, borrado funcionan.
- **Depende de**: T3.2, T3.3.

---

## Fase 4 — Pairing generator (Capa 1)

Esta fase es **100% lógica pura sin DB**. Los algoritmos viven en
`features/scheduling/pairing-generator/` y los tests deben pasar sin
necesidad de Postgres.

### T4.1 — `circle-method.ts`

- **Objetivo**: implementar el algoritmo del círculo puro.
- **Archivos**:
  - `src/features/scheduling/pairing-generator/circle-method.ts` — exporta
    `generateRoundRobin(teamIds: string[], seed: number): Pairing[][]`.
  - Usar PRNG sembrable (ej. mulberry32 inline) para reproducibilidad.
  - Si N impar, agregar `null` como BYE.
  - Alternar local/visitante por jornada.
- **Acceptance**:
  - `pnpm test src/features/scheduling/pairing-generator/circle-method.test.ts` verde.
  - Tests: N par, N impar (verificar 1 BYE por jornada), N=2, mismo seed
    → mismo output.
  - Verificar matemáticamente: cada par aparece exactamente una vez en N-1 (par) o N (impar) jornadas.
- **Depende de**: T0.3.

### T4.2 — `apply-rest-requests.ts`

- **Objetivo**: insertar descansos solicitados modificando pairings base.
- **Archivos**:
  - `src/features/scheduling/pairing-generator/apply-rest-requests.ts` —
    exporta `applyRestRequests(rounds: Pairing[][], rests: RestRequest[]): Pairing[][]`.
  - Para cada `RestRequest`: encuentra al equipo en su jornada, intercambia
    su par con el BYE (o con otro equipo que pueda recibirlo sin romper S4).
- **Acceptance**:
  - Tests: equipo X descansa jornada 3 → no aparece en pairings de jornada 3.
  - Si no hay BYE disponible y reasignar rompe S4, arroja error con mensaje.
- **Depende de**: T4.1.

### T4.3 — `validate-no-duplicates.ts`

- **Objetivo**: garantizar que ningún par se repite en fase regular (S4).
- **Archivos**:
  - `src/features/scheduling/pairing-generator/validate-no-duplicates.ts` —
    exporta `validateNoDuplicates(rounds: Pairing[][]): { ok: true } | { ok: false, duplicates: [...] }`.
  - Usa `pairKey()` de `lib/pair-key.ts` (sort de UUIDs).
- **Acceptance**:
  - Test: cualquier output válido del circle method pasa la validación.
  - Test: array fabricado con duplicado falla con detalle de qué par y en qué jornadas.
- **Depende de**: T4.1.

### T4.4 — `lib/pair-key.ts` y `lib/time-overlap.ts`

- **Objetivo**: helpers puros reusables.
- **Archivos**:
  - `src/features/scheduling/lib/pair-key.ts` — `pairKey(a, b) → string` (ids sorted, joined).
  - `src/features/scheduling/lib/time-overlap.ts` — `overlaps(slotA, slotB): boolean`, considerando timezone.
- **Acceptance**: tests con casos borde (mismo inicio, mismo fin, adyacentes).
- **Depende de**: T0.3.

### T4.5 — `generate-pairings.ts` (orquestador)

- **Objetivo**: pegar circle method + rest requests + validación.
- **Archivos**:
  - `src/features/scheduling/pairing-generator/generate-pairings.ts` —
    función ≤ 20 líneas que orquesta.
- **Acceptance**:
  - Test E2E del orquestador: 10 equipos, 2 descansos, devuelve 9 jornadas válidas.
- **Depende de**: T4.1, T4.2, T4.3.

### T4.6 — Endpoint `POST /api/leagues/[id]/schedule/preview`

- **Objetivo**: corre Capa 1 + Capa 2 (la 2 se hace en T5.4) y devuelve preview.
- **Archivos**:
  - `src/app/api/leagues/[id]/schedule/preview/route.ts`.
  - Por ahora solo invoca Capa 1; agregar Capa 2 en T5.4.
  - Idempotente: no persiste.
- **Acceptance**:
  - 400 si la liga no tiene `schedulingEnabled`.
  - 400 si la liga no tiene `scheduling_config` configurado.
  - 400 si la liga tiene <2 equipos.
  - 200 con array de jornadas + pairings.
- **Depende de**: T4.5, T3.1.

### T4.7 — UI: preview de pares

- **Archivos**:
  - `src/features/scheduling/ui/SchedulePreview.tsx`.
  - Tabla por jornada con local vs visitante.
  - Botón "Generar preview" llama T4.6.
- **Acceptance**: el organizador ve qué partidos saldrían si confirma.
- **Depende de**: T4.6.

---

## Fase 5 — Slot assigner + horarios comprados (Capa 2)

### T5.1 — `slot-assigner/build-slots.ts`

- **Objetivo**: a partir de venue_time_windows y duración, generar lista de
  slots disponibles para una fecha.
- **Archivos**:
  - `src/features/scheduling/slot-assigner/build-slots.ts` — exporta
    `buildSlotsForDate(date: string, windows: VenueTimeWindow[], config: {durationMin, bufferMin}): Slot[]`.
- **Acceptance**:
  - Test: ventana 19:40–22:10 con duración 50 + buffer 0 = 3 slots
    (19:40, 20:30, 21:20). Último slot termina antes de 22:10.
  - Test: 2 ventanas en el mismo día se combinan.
- **Depende de**: T4.4.

### T5.2 — `slot-assigner/conflict-detector.ts`

- **Objetivo**: detectar pairings con conflicto de horarios comprados (S7).
- **Archivos**:
  - `src/features/scheduling/slot-assigner/conflict-detector.ts` — exporta
    `detectConflicts(pairings: Pairing[], purchased: TeamPurchasedTimeslot[]): Conflict[]`.
- **Acceptance**:
  - Test: dos equipos con horarios distintos jugando entre sí → 1 conflict.
  - Test: dos equipos con mismo horario jugando entre sí → 0 conflicts.
  - Test: solo uno tiene horario, el otro no → 0 conflicts (gana el comprador).
- **Depende de**: T1.4.

### T5.3 — `slot-assigner/assign-greedy.ts`

- **Objetivo**: asignar slots a pairings respetando hard constraints.
- **Archivos**:
  - `src/features/scheduling/slot-assigner/assign-greedy.ts` — exporta
    `assignGreedy(pairings, slots, purchased): { assigned: AssignedMatch[], unassigned: Pairing[] }`.
  - Prioridad: primero pairings con horario comprado (ya filtrados por
    conflict-detector). Luego el resto greedy.
  - Hard constraint: ningún equipo en dos slots solapados ese día.
- **Acceptance**:
  - Test: 4 pairings, 4 slots, sin compras → todos asignados.
  - Test: 4 pairings, 3 slots → 1 unassigned, reportado.
  - Test: 1 compra de slot 6:50 → ese pairing va a 6:50 (aunque haya otros slots libres).
- **Depende de**: T5.1, T5.2.

### T5.4 — `slot-assigner/assign-slots.ts` (orquestador) + ampliar preview

- **Archivos**:
  - `src/features/scheduling/slot-assigner/assign-slots.ts` orquestador ≤ 20 líneas.
  - Modificar `src/app/api/leagues/[id]/schedule/preview/route.ts` para
    invocar T5.4 después de T4.5.
  - El preview ahora devuelve `{ matchdays: [...], conflicts: [...], unassigned: [...] }`.
- **Acceptance**:
  - Preview completo end-to-end.
- **Depende de**: T5.3, T4.6.

### T5.5 — Endpoint `POST /api/leagues/[id]/schedule/confirm`

- **Objetivo**: persistir el preview generado.
- **Archivos**:
  - `src/app/api/leagues/[id]/schedule/confirm/route.ts`.
  - `src/features/scheduling/confirm-schedule.ts` — función transaccional:
    1. Crea `matchdays` (uno por jornada).
    2. Inserta `matches` con `matchdayId`, `venueId`, `kickoffAt`, `homeTeamId`, `awayTeamId`.
    3. Guarda `last_seed` en `scheduling_config` (o crea fila si no existe).
    4. Si falla cualquier insert, hace ROLLBACK y devuelve 500 con detalle.
- **Acceptance**:
  - 409 si la liga ya tiene matches publicados (no permitir doble confirm).
  - Test: confirmación crea N-1 matchdays + N\*(N-1)/2 matches correctos.
  - Test: si el preview tenía conflictos sin resolver, confirm falla con 400.
- **Depende de**: T5.4.

### T5.6 — UI: vista de jornada con conflictos

- **Archivos**:
  - `src/features/scheduling/ui/MatchdayBoard.tsx`.
  - Muestra slots ocupados y libres por venue.
  - Conflictos de horario comprado se muestran en banner amarillo arriba con
    botón "Resolver manualmente" → abre `MatchEditPanel` (Fase 6).
- **Acceptance**:
  - El organizador ve calendario semanal con sus partidos.
- **Depende de**: T5.5, T2.5.

---

## Fase 6 — Override engine (S6, cambios manuales)

### T6.1 — `overrides/change-kickoff.ts`

- **Archivos**:
  - `src/features/scheduling/overrides/change-kickoff.ts`.
  - Valida no-solapamiento de cada equipo del partido contra otros partidos del día.
  - Guarda fila en `match_schedule_overrides` con `previousValue` / `newValue`.
- **Acceptance**: tests cubriendo: cambio válido, cambio que solapa → error.
- **Depende de**: T1.1, T1.2.

### T6.2 — `overrides/change-venue.ts`

- **Archivos**:
  - `src/features/scheduling/overrides/change-venue.ts`.
  - Valida que el nuevo venue está asignado a la liga.
  - Valida no-solapamiento en el nuevo venue.
- **Acceptance**: tests análogos a T6.1.
- **Depende de**: T6.1.

### T6.3 — `overrides/swap-team.ts`

- **Archivos**:
  - `src/features/scheduling/overrides/swap-team.ts`.
  - Valida que `newTeamId` pertenece a la misma liga.
  - Si `allow_duplicate_matchups = false` y el swap crea un par ya jugado en
    fase regular → 409.
  - Si el match ya está `completed` (con resultado) → bloquea swap.
- **Acceptance**:
  - Tests: swap exitoso, swap que rompe S4, swap en match completado.
- **Depende de**: T6.2.

### T6.4 — Endpoints PATCH/POST de overrides

- **Archivos**:
  - `src/app/api/matches/[id]/kickoff/route.ts` (`PATCH`).
  - `src/app/api/matches/[id]/venue/route.ts` (`PATCH`).
  - `src/app/api/matches/[id]/swap-team/route.ts` (`POST`).
  - `src/app/api/matches/[id]/overrides/route.ts` (`GET` lista historial).
- **Acceptance**: 4 endpoints + tests E2E.
- **Depende de**: T6.1, T6.2, T6.3.

### T6.5 — UI: panel de edición de partido

- **Archivos**:
  - `src/features/scheduling/ui/MatchEditPanel.tsx` — modal o drawer.
  - 3 acciones: cambiar hora, cambiar cancha, swap equipo.
  - Muestra historial de cambios (`/api/matches/[id]/overrides`).
- **Acceptance**:
  - Componente ≤ 150 líneas (extraer subcomponentes por acción).
- **Depende de**: T6.4.

---

## Fase 7 — Recuperación (S2)

### T7.1 — `makeup-builder/detect-deficit.ts`

- **Archivos**:
  - `src/features/scheduling/makeup-builder/detect-deficit.ts` — exporta
    `detectDeficit(leagueId: string): TeamDeficit[]` con
    `{ teamId, played, target, missingOpponents }`.
- **Acceptance**: test contra DB de prueba con 4 equipos y 1 con déficit.
- **Depende de**: T1.4.

### T7.2 — `makeup-builder/build-makeup-matches.ts`

- **Archivos**:
  - `src/features/scheduling/makeup-builder/build-makeup-matches.ts` — usa
    capa 1 (con matriz de pares ya jugados pre-poblada) + capa 2 (slot
    assigner sobre jornadas futuras existentes con slots libres).
  - Marca cada match con `isMakeup = true` y crea fila en `makeup_matches`.
- **Acceptance**:
  - Tests: equipo entra en jornada 3 (no jugó 1 y 2), genera 2 makeups en
    jornadas siguientes con slots libres.
- **Depende de**: T7.1, T5.3, T4.5.

### T7.3 — Endpoints de recuperación

- **Archivos**:
  - `src/app/api/leagues/[id]/makeups/deficit/route.ts` (`GET`).
  - `src/app/api/leagues/[id]/makeups/preview/route.ts` (`POST`).
  - `src/app/api/leagues/[id]/makeups/confirm/route.ts` (`POST` transaccional).
- **Acceptance**: 3 endpoints + tests.
- **Depende de**: T7.2.

### T7.4 — UI: reporte y wizard de makeups

- **Archivos**:
  - `src/features/scheduling/ui/MakeupReport.tsx`.
  - `src/features/scheduling/ui/MakeupWizard.tsx`.
- **Acceptance**: organizador ve déficits y genera makeups en ≤ 3 clicks.
- **Depende de**: T7.3.

---

## Fase 8 — Actualizar estrategia y documentación

### T8.1 — Actualizar `docs/PRODUCT-STRATEGY.md`

- **Objetivo**: reflejar que el sorteo es un módulo opt-in premium.
- **Archivos**:
  - `docs/PRODUCT-STRATEGY.md` — sección "Lo que NO somos": agregar
    matiz: "Excepción: organizadores que activan el módulo opt-in de
    sorteo. Esto no es el core del producto pero existe."
  - Añadir nueva sección "Módulos opcionales (premium)" con descripción del
    sorteo.
- **Acceptance**: documento actualizado y consistente con el resto.
- **Depende de**: nada (puede hacerse en paralelo).

### T8.2 — Actualizar `AGENTS.md`

- **Archivos**:
  - `AGENTS.md` — sección 1.5: agregar nota sobre el módulo opt-in con link
    a `docs/scheduling-plan.md`.
- **Acceptance**: cualquier IA leyendo `AGENTS.md` entiende que el sorteo
  existe pero es opcional, no central.
- **Depende de**: nada.

### T8.3 — README del módulo

- **Archivos**:
  - `src/features/scheduling/README.md` — overview corto para devs nuevos:
    qué resuelve, las 7 situaciones, link al plan, link a este doc.
- **Acceptance**: archivo creado.
- **Depende de**: cualquier fase de implementación.

---

## Orden recomendado de ejecución

```
Fase 0  →  Fase 1  →  Fase 2  →  Fase 3  →  Fase 4  →  Fase 5  →  Fase 6  →  Fase 7  →  Fase 8
```

**Mínimo viable demo-able**: Fases 0 → 5. Con eso el organizador ya configura
canchas, captura horarios comprados, genera sorteo y confirma una temporada
completa con horarios.

**Importante**: Fase 6 (overrides) y Fase 7 (makeups) son las que más
fricción evitan en la operación real. No se pueden saltar para tener un
producto usable, pero pueden cortarse en una v0.5 si hay urgencia.

---

## Checklist final (revisa antes de cerrar cada fase)

- [ ] `pnpm typecheck` verde.
- [ ] `pnpm lint` sin warnings nuevos.
- [ ] `pnpm test` verde (incluyendo nuevos tests).
- [ ] Todos los `route.ts` nuevos son ≤ 30 líneas.
- [ ] Todas las features nuevas tienen función pura testeable sin DB cuando
      aplica (algoritmos).
- [ ] Sin `any`, sin `as`, sin imports muertos.
- [ ] Sanitización canónica aplicada donde toca (Regla 1–4 de CLAUDE.md).
- [ ] Mensajes de error en español, legibles, accionables.
- [ ] Componentes ≤ 150 líneas, funciones ≤ 20 líneas.

---

## Notas para la IA codificadora

1. **No improvises nombres de tablas, columnas, ni endpoints**. Están
   definidos en `scheduling-plan.md` §3 y §6.
2. **Si encuentras ambigüedad**, lee `scheduling-plan.md` primero. Si no
   está ahí, pregunta antes de codear.
3. **No saltes tests**. Cada feature con lógica de negocio debe tener su
   archivo `*.test.ts` adyacente.
4. **No mezcles fases**. Termina y mergea fase N antes de empezar N+1
   (salvo Fase 8 que es independiente).
5. **Commits**: prefijo con `T<X.Y>:` para trazabilidad
   (ej. `T1.1: create scheduling base tables`).
6. **Si una tarea crece**: divídela y agrega subtarea. No la dejes inflar.
