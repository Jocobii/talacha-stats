# Nueva Temporada v2 — Reinscripción real, no clonación ciega

> Plan de implementación. Estado: **propuesta**, sin código escrito.
> Contratos base: `AGENTS.md` §3 (FSD), §7.2a/§7.3 (UI + datos), §15 (migraciones), §19 (mapper), §20 (testing).

---

## 1. Problema

Hoy `POST /api/leagues/[id]/new-season` clona **todos** los equipos activos de la
temporada anterior y su roster. La realidad de la liga amateur es otra:

- Un torneo cierra con 30 equipos y el siguiente arranca con 6–8.
- Los equipos restantes se van inscribiendo entre la jornada 1 y la 4.
- Muchos simplemente desaparecen.

Consecuencias del comportamiento actual:

| Síntoma                                                                    | Causa                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Tabla de posiciones con 22 equipos fantasma en 0 puntos                    | Se copiaron equipos que nunca se inscribieron            |
| Sorteo imposible de correr (`regularMatchdays` calculado sobre 30 equipos) | El pairing recibe equipos que no van a jugar             |
| El organizador borra equipos a mano uno por uno                            | No hay flujo de "no continúa"                            |
| Rosters inflados / credenciales re-vinculadas a jugadores que no volvieron | `league_members` + `inscriptions` copiados sin confirmar |
| La opción vive escondida al fondo de Configuración                         | Punto de entrada equivocado                              |

Y un problema estructural: cuando un equipo sí regresa en la jornada 3, el
organizador lo da de alta desde cero y **recaptura todo el roster a mano**,
aunque ese mismo roster existe en la temporada anterior.

---

## 2. Decisiones tomadas

1. **Ningún equipo viene preseleccionado.** El wizard lista los 30 equipos con
   checkbox vacío; el organizador marca solo los que ya confirmaron.
2. **Banca de la temporada anterior.** Los equipos no seleccionados no se
   descartan: quedan en la liga nueva como `pending`, reactivables en un clic
   con su roster histórico, en cualquier jornada.
3. **Banner contextual al cerrar el torneo.** Cuando la liga termina, aparece un
   aviso en Posiciones y en el dashboard con la acción "Iniciar siguiente
   temporada". Deja de depender de que el organizador entre a Configuración.

---

## 3. Modelo de datos

### 3.1 Cambios de schema (una sola migración nueva, append-only — §15)

`teams`:

```ts
// status: 'active' | 'pending' | 'disbanded'
//   active   → juega, cuenta en tabla, sorteo, cédula
//   pending  → inscrito en la banca de la temporada, NO cuenta en nada
//   disbanded→ desapareció (comportamiento actual)
status: text("status").notNull().default("active"),

// Equipo del que se clonó (temporada anterior). Permite reconstruir el
// roster al reactivar sin recapturar. NULL para equipos creados de cero.
sourceTeamId: uuid("source_team_id").references(() => teams.id, {
  onDelete: "set null",
}),

// Jornada en la que el equipo se incorporó al torneo (altas tardías).
// NULL = arrancó desde la jornada 1.
joinedAtMatchday: integer("joined_at_matchday"),
```

`leagues`:

```ts
// Hasta qué jornada se aceptan altas de equipo. NULL = sin límite.
// Solo informativo/advertencia en v2; bloqueo duro queda para v2.1.
registrationCutoffMatchday: integer("registration_cutoff_matchday"),
```

> Migración: **una** nueva, aditiva, sin `DROP`, sin tocar snapshots ni
> `_journal.json`. Conexión directa (no pooler) al aplicar. Checklist §15.

### 3.2 Impacto en queries existentes

Auditar y filtrar por `status = 'active'` (hoy varias asumen "todo lo que no es
disbanded"):

- Tabla de posiciones (`features/standings/`, `lib/standings.ts`)
- Pairing y slots (`features/scheduling/pairing-generator/`, `slot-assigner/`)
- Selector de equipos de la cédula (`features/match-resolution/`)
- Roster / `TeamsSection` de Configuración
- Zonas de playoffs y bracket

Regla: **`pending` se comporta exactamente como `disbanded` para todo lo
deportivo.** La única diferencia es que es reactivable y conserva su vínculo con
la temporada anterior.

---

## 4. Backend

### 4.1 Refactor previo obligatorio

`app/api/leagues/[id]/new-season/route.ts` tiene hoy ~370 líneas de lógica de
negocio dentro del route — viola §3.2 (controlador delgado) y §3.4
(transacciones en `features/`). Antes de agregar features:

```
features/season-rollover/
├── constants.ts
├── types.ts
├── index.ts
├── lib/
│   ├── clone-league-settings.ts   # zonas, scheduling config, venues, reglamento
│   ├── clone-team-roster.ts       # league_members + inscriptions + credenciales
│   └── map-rollover-view.ts       # DTO → RolloverView (§19)
└── model/
    ├── useSeasonRollover.ts       # mutación RQ
    └── useLeagueCompletion.ts     # query del estado "torneo terminado"
```

El route queda en: parsear con Zod → llamar `createNextSeason(...)` → `apiSuccess`.

`clone-team-roster.ts` se extrae como función pura-ish reutilizable, porque la
usan **dos** flujos: el rollover inicial y la reactivación de un equipo de la
banca. Es el corazón del ahorro de trabajo del organizador.

### 4.2 `POST /api/leagues/[id]/new-season` — nuevo contrato

```ts
const NewSeasonSchema = z.object({
	season: z.string().min(1).max(50),
	// IDs de equipos de la liga origen que SÍ continúan. Puede venir vacío:
	// una temporada puede arrancar sin ningún equipo confirmado todavía.
	confirmedTeamIds: z.array(z.string().uuid()).default([]),
	// Si true, copia el roster de los equipos confirmados. Default true.
	copyRosters: z.boolean().default(true),
	registrationCutoffMatchday: z.number().int().positive().nullable().default(null),
});
```

Comportamiento:

| Equipo origen                            | En la liga nueva                            | Roster                     |
| ---------------------------------------- | ------------------------------------------- | -------------------------- |
| En `confirmedTeamIds`                    | `status: 'active'`, `sourceTeamId` seteado  | Copiado (si `copyRosters`) |
| No listado, `status: 'active'` en origen | `status: 'pending'`, `sourceTeamId` seteado | **No** se copia            |
| `status: 'disbanded'` en origen          | No se crea                                  | —                          |

Lo demás (zonas, scheduling config, canchas, ventanas, reglamento, marcar origen
como `finished`) se conserva igual. Todo sigue en una sola transacción.

**Ahorro clave:** el roster de un equipo `pending` no se duplica en
`league_members`. Se reconstruye al reactivar, leyendo del `sourceTeamId`. Así no
inflamos la tabla ni re-vinculamos credenciales de jugadores que no volvieron.

### 4.3 `POST /api/teams/[id]/activate` — reactivar desde la banca

```ts
const ActivateTeamSchema = z.object({
	// Jornada en la que entra. Default: jornada actual de la liga.
	joinedAtMatchday: z.number().int().positive().optional(),
	copyRoster: z.boolean().default(true),
});
```

1. Valida que el equipo esté `pending` y que el usuario pueda gestionar la liga.
2. Transacción: `status → 'active'`, setea `joinedAtMatchday`, y si
   `copyRoster && sourceTeamId`, llama `cloneTeamRoster(sourceTeamId, teamId, tx)`
   — mismas reglas de credencial que el rollover (`credential_id` nunca se
   copia; solo se re-vincula el pase `organization` vigente).
3. Si ya hay jornadas generadas, devuelve en la respuesta
   `{ requiresRescheduling: true, pendingMatchdays: n }` para que la UI avise.

Respuesta: `TeamActivationResponse` en `entities/team/model.ts` (§7.4).

### 4.4 `GET /api/leagues/[id]/completion` — señal de "torneo terminado"

Hoy `status: 'finished'` lo escribe el propio rollover, así que no sirve como
disparador del banner. Se necesita una señal **derivada**:

```ts
type LeagueCompletionState = {
	isComplete: boolean;
	reason: "playoffs_resolved" | "all_matchdays_played" | null;
	pendingMatches: number;
	lastMatchdayNumber: number | null;
};
```

Lógica (en `entities/league/queries.ts`, ejecutada en DB — §17):

- `isComplete = true` si el bracket de playoffs tiene la final resuelta, **o**
  si no hay bracket y no quedan `matches` con `status = 'scheduled'` en la liga.
- `pendingMatches` sale de un `COUNT(*)` con `WHERE`, nunca de traer todo y
  filtrar en memoria (§17.3).

---

## 5. Frontend

### 5.1 Wizard de nueva temporada (3 pasos)

Reemplaza el `NewSeasonButton` inline actual (que además usa `useState` para
loading/error, violando §7.2). Nuevo slice en `features/season-rollover/ui/`,
compuesto con `PageShell`/`Card`/`Stack`/`Typography` (§7.2a):

**Paso 1 — Nombre de la temporada.** Input + preview del código de liga que se
generará. React Hook Form + `zodResolver` sobre
`model/season-rollover-form-schema.ts` (client-safe, reusado por el route).

**Paso 2 — ¿Quiénes continúan?** El corazón del cambio.

```
┌─────────────────────────────────────────────────────────┐
│  ¿Qué equipos continúan en Clausura 2026?               │
│                                                          │
│  De la temporada anterior siguen registrados 30 equipos. │
│  Marca solo los que ya confirmaron. Los demás quedan     │
│  en la banca y los puedes activar cuando se inscriban.   │
│                                                          │
│  [ Marcar todos ]  [ Limpiar ]        3 de 30 marcados   │
│                                                          │
│  ☑ Deportivo Roble        18 jugadores   1° lugar        │
│  ☑ Atlético Sur           15 jugadores   4° lugar        │
│  ☑ Real Otay              21 jugadores   7° lugar        │
│  ☐ Juventud FC            12 jugadores  11° lugar        │
│  ☐ Los Compas             14 jugadores  19° lugar        │
│  …                                                       │
└─────────────────────────────────────────────────────────┘
```

- Checkboxes **vacíos** por default (decisión §2.1).
- Cada fila muestra señal útil para decidir: posición final, jugadores en roster,
  partidos jugados. El ViewModel `RolloverTeamView` (§19) lo arma en el mapper.
- Búsqueda por nombre si hay > 12 equipos.
- Se permite continuar con **0 marcados** — es un caso real y válido.

**Paso 3 — Confirmar.** Resumen honesto de lo que va a pasar:

```
  ✓ 3 equipos activos, con su roster (54 jugadores)
  ⏸ 27 equipos en banca, activables cuando se inscriban
  ✓ 4 canchas, 2 zonas de clasificación, reglamento
  ✓ Clausura 2025 queda archivada como temporada terminada
  ⚠ El sorteo se calculará sobre 3 equipos. Si esperas más,
    corre el sorteo cuando cierres inscripciones.
```

Mutación con TanStack Query (`useSeasonRollover`), key desde `queryKeys.*`,
`notify.success` / `notify.error` obligatorios (§7.2b).

### 5.2 Banner de fin de torneo

Componente `SeasonEndBanner` en `features/season-rollover/ui/`. Se muestra
cuando `isComplete && league.status === 'active'`:

- **Tab Posiciones** de la liga (arriba de la tabla) — donde el organizador ve
  al campeón, momento natural.
- **Dashboard `/admin`** — tarjeta por cada liga terminada sin sucesora.

Copy: _"Clausura 2025 terminó. Inicia la siguiente temporada y decide qué
equipos continúan."_ + botón primario. Dismissable, con reaparición en el
dashboard (no se pierde).

Se mantiene el acceso desde Configuración como ruta secundaria — pero deja de
ser la única.

### 5.3 Banca en Configuración → Equipos

`TeamsSection` gana una sección plegable **"Banca — equipos de la temporada
anterior (27)"**:

```
  Juventud FC        12 jugadores en Clausura 2025    [ Activar ]
  Los Compas         14 jugadores en Clausura 2025    [ Activar ]
```

Al activar: modal corto → jornada de ingreso (default: la actual) + toggle
"traer el roster de la temporada pasada" → `notify.success("Juventud FC activado
con 12 jugadores")`. Si ya hay calendario generado, aviso explícito de que hay
que regenerar o agregar jornadas makeup.

Mismo control accesible desde el tab **Sorteo**, antes de correr el pairing —
ahí es donde el organizador se da cuenta de que le faltan equipos.

### 5.4 Capa de datos

```
apiFetch → entities/team DTO → lib/map-rollover-view.ts → model/useRolloverTeams.ts → ui/
```

Componentes tontos, ViewModels por props, keys desde `@/shared/api/query-keys.ts`,
invalidación explícita tras activar un equipo (`queryKeys.leagueTeams(leagueId)`,
`queryKeys.leagueStandings(leagueId)`, `queryKeys.schedulingPreview(leagueId)`).

---

## 6. Testing (§20)

| Unidad                     | Casos obligatorios                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clone-team-roster.ts`     | roster vacío; jugador con CURP `PENDING_*`; jugador con pase `organization` vigente (se re-vincula) y sin pase (`credential_id = null`); jugador suspendido (no se copia) |
| `createNextSeason`         | `confirmedTeamIds` vacío → todos `pending`; ids inexistentes → error 400; equipo `disbanded` en la lista → ignorado; slug/código duplicado → 409                          |
| `activateTeam`             | equipo ya `active` → 409; sin `sourceTeamId` → activa sin roster; con calendario generado → `requiresRescheduling: true`                                                  |
| `getLeagueCompletionState` | liga sin partidos; partidos pendientes; playoffs sin final; final resuelta                                                                                                |
| `map-rollover-view.ts`     | `titleCase` en nombres; sin `internal_notes` en el view; equipo sin posición final → `null`                                                                               |
| `RolloverTeamPicker.tsx`   | loading / error / lista vacía; marcar y desmarcar; contador; continuar con 0 marcados                                                                                     |
| `SeasonEndBanner.tsx`      | no renderiza si `isComplete = false`; no renderiza si la liga ya está `finished`                                                                                          |

---

## 7. Orden de trabajo

| #   | Entrega                                                                                                       | Depende de |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Migración: `teams.status = 'pending'`, `source_team_id`, `joined_at_matchday`, `registration_cutoff_matchday` | —          |
| 2   | Auditar y filtrar `status = 'active'` en standings, sorteo, cédula, zonas                                     | 1          |
| 3   | Extraer `features/season-rollover/` desde el route; adelgazar `route.ts` (sin cambio funcional)               | —          |
| 4   | Nuevo contrato de `new-season` (`confirmedTeamIds`) + tests                                                   | 1, 3       |
| 5   | `POST /api/teams/[id]/activate` + `cloneTeamRoster` reutilizado + tests                                       | 3, 4       |
| 6   | Wizard de 3 pasos (RHF + RQ + primitivos de UI)                                                               | 4          |
| 7   | `GET /completion` + `SeasonEndBanner` en Posiciones y dashboard                                               | —          |
| 8   | Banca en `TeamsSection` y en el tab Sorteo                                                                    | 5          |
| 9   | `registrationCutoffMatchday` como advertencia en alta tardía                                                  | 1, 5       |

Los pasos 3 y 7 son independientes y se pueden paralelizar. El 2 es el de mayor
riesgo de regresión: sin él, los equipos `pending` aparecen en la tabla y
reproducimos el bug que estamos arreglando, ahora con otro nombre.

---

## 8. Conexión con el norte (§1.5)

Esto es gestión, pero desemboca en dato e identidad:

- **Dato limpio:** una tabla de posiciones con 8 equipos reales en vez de 30
  fantasma es contenido publicable desde la jornada 1. Hoy no lo es.
- **Identidad:** el roster no se recaptura a mano en cada alta tardía, así que el
  jugador conserva su vínculo `global_player → league_member` temporada tras
  temporada, sin duplicados por retecleo.
- **Ego del jugador:** `joinedAtMatchday` permite decir "líder de goleo habiendo
  entrado en la jornada 4" — una píldora narrativa que hoy es imposible generar.
