# Plan técnico — Sorteo y calendarización de jornadas

> **Estado:** Aprobado — decisiones tomadas 2026-05-15
> **Autor:** Claude (asistente)
> **Fecha:** 2026-05-15
> **Audiencia:** founder/arquitecto + DBA + organizador
> **Documento hermano:** [`scheduling-tasks.md`](./scheduling-tasks.md) — desglose de tareas para implementación

Este documento responde a la solicitud de empezar el módulo crítico de gestión de
liga con foco en el **sorteo de partidos por jornada**. Cubre investigación,
modelo de datos, algoritmo, features FSD, endpoints, edge cases y fases de
entrega. Las 6 situaciones que planteaste están mapeadas explícitamente y se
mencionan por número (S1–S6) a lo largo del documento.

---

## 0. Nota estratégica — leer antes que nada

`docs/PRODUCT-STRATEGY.md` (revisado 2026-04-30) y `AGENTS.md` dicen lo
siguiente, textual:

> "Lo que el organizador NO quiere de nosotros: que le manejemos sorteos,
> calendario, pagos, arbitraje, cancha. Eso ya lo hace bien con WhatsApp."
>
> "TalachaStats es la capa de identidad digital y contenido para ligas locales
> de fútbol amateur. No somos software de gestión de ligas. No construimos
> sorteos, calendario, pagos, arbitraje ni cancha — eso lo resuelve el
> organizador con WhatsApp y Excel."

La feature que estamos planeando es **exactamente lo que la estrategia dice no
construir**. Eso no significa que esté mal hacerlo: significa que antes de
escribir código conviene decidir conscientemente una de tres rutas:

1. **Pivot de posicionamiento**: aceptar que TalachaStats sí va a hacer
   operación de liga, actualizar `PRODUCT-STRATEGY.md` y `AGENTS.md` para que
   futuras decisiones (mías y de cualquier otro agente) no entren en
   contradicción con el código.
2. **Feature opcional/premium**: dejar la estrategia intacta y posicionar el
   sorteo como módulo opt-in para los organizadores que sí lo quieran, sin
   moverlo al centro del producto. Implica un flag de habilitación por liga y
   evitar que la UI principal lo promocione.
3. **No construirlo aún**: dejar que el organizador siga sorteando en WhatsApp
   y, cuando tengas 10+ ligas pidiéndolo, retomar este plan. Es la opción que
   la heurística del producto recomienda hoy.

Mi recomendación: **opción 2 si decides hacerlo ya**, y dejar tareas explícitas
en este plan para actualizar la estrategia. El resto del documento asume que
vamos por la 1 o la 2.

### 0.1 Decisión tomada — Opción 2 (Feature opcional/premium)

El módulo de sorteo se construye como **feature opt-in por liga**:

- Flag booleano `scheduling_enabled` en la tabla `leagues` (default `false`).
- El menú `/admin/leagues/[id]/scheduling/*` solo aparece si el flag está
  encendido.
- No promocionar en la UI principal pública (`/`, `/ranking`).
- `PRODUCT-STRATEGY.md` y `AGENTS.md` se actualizan para describir el módulo
  como **operación premium**, sin moverlo al centro del producto.
- A futuro este flag podría amarrarse a un tier de pago en
  `organizations.tier`, pero eso está fuera del MVP.

---

## 1. Cómo se hace un sorteo en una liga real

### 1.1 Concepto base: round-robin

El estándar mundial para una temporada regular de liga es el **round-robin**
(todos contra todos). Variantes:

- **Single round-robin**: cada equipo se enfrenta a todos los demás una vez.
  Total de partidos = `N · (N−1) / 2`. Jornadas necesarias = `N−1` (par) o `N`
  (impar).
- **Double round-robin**: cada par juega dos veces (ida y vuelta). Es el modelo
  de la mayoría de las ligas profesionales europeas. Total = `N · (N−1)`.
- **Triple/cuádruple round-robin**: usado en ligas con pocos equipos (ej. liga
  escocesa antigua, KBO baseball).

Para fútbol amateur con 8–16 equipos, lo más común es **single round-robin**
seguido de eliminación directa (liguilla/playoffs). Eso encaja con S1.

### 1.2 Algoritmo del círculo (Circle Method)

Es el algoritmo canónico para generar round-robin balanceado. Funciona así
con N par:

1. Numera los equipos del 1 al N.
2. Coloca al equipo 1 fijo. El resto se acomoda alrededor de una "rueda".
3. Para cada jornada, empareja: 1 vs N, 2 vs N−1, 3 vs N−2, …
4. Rota todos los equipos excepto el 1 una posición en sentido horario.
5. Repite hasta cubrir N−1 jornadas.

Con N impar se agrega un equipo **dummy** (BYE): el equipo que en una jornada
"juegue contra el BYE" descansa esa jornada.

Pseudocódigo (versión TypeScript-friendly):

```ts
function generateRoundRobin(teams: string[]): Array<Array<[string, string | null]>> {
	// Si hay número impar, agregamos BYE (null) para que descanse uno cada jornada
	const list = teams.length % 2 === 0 ? [...teams] : [...teams, null];
	const n = list.length;
	const totalRounds = n - 1;
	const half = n / 2;

	const rounds: Array<Array<[string, string | null]>> = [];
	let rotation = [...list];

	for (let r = 0; r < totalRounds; r++) {
		const matches: Array<[string, string | null]> = [];
		for (let i = 0; i < half; i++) {
			const home = rotation[i];
			const away = rotation[n - 1 - i];
			// El primer slot alterna local/visitante por jornada para balance home/away
			const pair: [string, string | null] = r % 2 === 0 ? [home!, away] : [away!, home];
			matches.push(pair);
		}
		rounds.push(matches);
		// Rotación: fija el primer elemento, rota los demás
		rotation = [rotation[0], rotation[n - 1], ...rotation.slice(1, n - 1)];
	}

	return rounds;
}
```

**Propiedades importantes:**

- Cada equipo juega exactamente una vez por jornada → satisface S4 (no
  repetición de rivales en la regular) automáticamente: dos equipos no se
  enfrentan más de una vez en N−1 jornadas.
- Si N es impar, el equipo que tenía BYE descansa esa jornada → base natural
  para el manejo de descansos solicitados (S3).
- La alternancia local/visitante en cada jornada garantiza balance home/away.

### 1.3 Tablas de Berger

Alternativa equivalente al círculo: las **Berger tables** son tablas
pre-computadas y publicadas por la FIDE. Son matemáticamente equivalentes al
método del círculo pero con una rotación distinta. Para nuestro caso no aporta
nada extra; usamos el círculo porque es más simple de generar
programáticamente.

### 1.4 Restricciones (constraints)

La literatura de _sports scheduling_ distingue:

- **Hard constraints** (obligatorias): si no se cumplen, el calendario es
  inválido.
  - Un equipo no juega dos partidos en la misma jornada.
  - Dos equipos no se enfrentan dos veces en la fase regular (S4).
  - Un equipo no puede jugar en una jornada donde solicitó descanso (S3).
  - Una cancha no puede tener dos partidos solapados en el tiempo (S5).
  - Un equipo no puede tener dos partidos solapados aunque sean en canchas
    distintas.
- **Soft constraints** (preferencias): se intentan, se penalizan si fallan.
  - Balance de partidos en local/visitante.
  - Evitar back-to-back de tres locales o tres visitantes seguidos.
  - Distribuir descansos equitativamente (cada equipo descansa una vez si N
    impar).
  - Preferir slots tempranos para equipos con histórico de no presentarse
    tarde (no aplica al MVP).

### 1.5 Scheduling con canchas y bandas horarias

La salida del round-robin son **pares de equipos por jornada**. Pero una
jornada real necesita además: ¿en qué cancha y a qué hora se juega cada uno?
Esto es un problema de **asignación de slots**.

Si hay 1 cancha y 4 partidos por jornada, los 4 partidos se asignan a 4 slots
consecutivos (S5). Si hay 2 canchas con horarios traslapados, podemos paralelizar.

**Restricciones de slots:**

- Cada slot puede tener máximo 1 partido por cancha.
- Cada equipo aparece en máximo un slot por jornada.
- El tiempo total disponible (ej. lunes 19:40–22:10) debe acomodar todos los
  partidos.

**Algoritmo de asignación (greedy + backtracking ligero):**

1. Genera la lista de slots disponibles para esa fecha (por cancha y
   ventana horaria — ver modelo en sección 3).
2. Ordena los partidos por restricción (ej. los que involucran a equipos con
   "preferencia de horario tarde" al final).
3. Para cada partido, asigna el primer slot libre que no rompa hard
   constraints.
4. Si no encuentra slot, hace backtracking: deshace la última asignación y
   prueba otra.

Para 8–16 equipos y 1–3 canchas, el espacio de soluciones es chico y un
greedy con backtracking encuentra solución óptima en milisegundos. **No
necesitamos** simulated annealing ni ILP en el MVP.

### 1.6 Recuperación, descansos y reprogramación

- **Recuperación (S2)**: equipos que entran tarde o se saltan jornadas
  arrastran un déficit. La literatura llama a esto **time-relaxed
  rescheduling**: los partidos pendientes se postponen a slots libres
  futuros. La política reactiva más simple es: al final de cada jornada,
  identifica qué equipos quedaron debajo del N de partidos objetivo y agenda
  un partido de recuperación en la siguiente jornada libre con slot
  disponible.
- **Descansos solicitados (S3)**: el equipo notifica antes de la
  generación → se excluye de la jornada. El round-robin se ajusta tratando
  ese equipo como BYE en esa jornada.
- **Reprogramación de un partido individual (S6)**: cambiar hora o cancha de
  un partido específico sin tocar el resto. Se modela como un override sobre
  la entidad `matches`.
- **Cambio de equipos en un partido ya programado (S6)**: cuando un equipo
  no puede y otro toma su lugar. Esto rompe la promesa de S4 (puede generar
  un par repetido) y debe avisarse explícitamente al usuario antes de
  permitirlo.

### 1.7 Eliminación directa (playoffs)

Fuera del alcance inmediato pero el modelo debe dejarle hueco. Después de N−1
jornadas regulares, los mejores K equipos pasan a una bracket de
single-elimination. En esa fase **sí** pueden repetirse rivales (S4) y los
partidos no tienen jornada (`matchday = null`) sino `playoff_round` (cuartos,
semis, final).

---

## 2. Las situaciones, mapeadas a reglas

| #   | Situación                                            | Mecanismo en el plan                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Configurar # de jornadas regulares antes de playoff  | Campo `regular_matchdays` en `league_scheduling_config`. Default = `N−1` (single round-robin).                                                                                                                                                                            |
| 2   | Equipos late + partidos de recuperación              | Tabla `makeup_matches` (apunta al partido original ausente). Generador detecta déficit por equipo.                                                                                                                                                                        |
| 3   | Descansos solicitados de 1 jornada                   | Tabla `team_rest_requests` (team, matchday, reason). El generador respeta antes de emparejar.                                                                                                                                                                             |
| 4   | No repetir rivales en la regular                     | Garantizado por el round-robin nativo. Si un swap manual (S6) rompe esto, validación + warning.                                                                                                                                                                           |
| 5   | Canchas + bandas horarias por liga                   | Tablas `venues` y `venue_time_windows`. Slot assigner respeta solapamientos y duración.                                                                                                                                                                                   |
| 6   | Editar horarios y swap de equipos sin regenerar      | Endpoints PATCH sobre `matches` con tabla `match_schedule_overrides` como audit log.                                                                                                                                                                                      |
| 7   | Horarios comprados por equipo para toda la temporada | Tabla `team_purchased_timeslots`. Slot assigner los respeta como **hard constraint**. Aplica a **cualquier** partido del equipo (local o visitante). Si dos equipos con slots distintos juegan entre sí, el conflict-detector pausa la asignación y avisa al organizador. |

---

## 3. Modelo de datos propuesto

Reuso lo que ya existe (`leagues`, `teams`, `matches`) y agrego tablas nuevas.
Drizzle, snake_case en DB, camelCase en TS, FK con `onDelete: 'cascade'`
salvo donde se indique.

### 3.1 Schema (Drizzle, en `src/db/schema.ts`)

```ts
// ---------------------------------------------------------------------------
// LEAGUES (ampliación) — Flag opt-in del módulo de sorteo
// ---------------------------------------------------------------------------
// Añadir a `leagues`:
//   schedulingEnabled: boolean NOT NULL DEFAULT false
// Solo se muestra la UI de scheduling y se aceptan endpoints si el flag = true.

// ---------------------------------------------------------------------------
// LEAGUE_SCHEDULING_CONFIG — Configuración de calendarización por liga
// 1:1 con `leagues`. Una fila por liga.
// ---------------------------------------------------------------------------
export const leagueSchedulingConfig = pgTable("league_scheduling_config", {
	leagueId: uuid("league_id")
		.primaryKey()
		.references(() => leagues.id, { onDelete: "cascade" }),
	// Número de jornadas regulares antes de eliminación directa.
	// Default: teamsCount - 1 (single round-robin). Editable por el organizador.
	regularMatchdays: integer("regular_matchdays").notNull(),
	// "single" | "double" — define la fase regular
	regularFormat: text("regular_format").notNull().default("single"),
	// Duración por defecto de un partido en minutos (ej. 50 para Liga Lunes)
	matchDurationMinutes: integer("match_duration_minutes").notNull().default(50),
	// Minutos de buffer entre partidos consecutivos en la misma cancha
	bufferMinutes: integer("buffer_minutes").notNull().default(0),
	// Si true, permite swap manual de equipos en un partido aunque rompa S4
	allowDuplicateMatchups: boolean("allow_duplicate_matchups").notNull().default(false),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// VENUES — Canchas físicas disponibles para una liga
// Una liga puede usar 1+ canchas. Una cancha puede compartirse entre ligas
// (varias ligas en la misma instalación) → tabla independiente.
// ---------------------------------------------------------------------------
export const venues = pgTable(
	"venues",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		nameCanonical: text("name_canonical").notNull(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		city: text("city"),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_venues_org_canonical").on(t.organizationId, t.nameCanonical),
		index("venues_org_idx").on(t.organizationId),
	],
);

// ---------------------------------------------------------------------------
// LEAGUE_VENUES — Pivote: qué canchas usa una liga y con qué prioridad
// ---------------------------------------------------------------------------
export const leagueVenues = pgTable(
	"league_venues",
	{
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venues.id, { onDelete: "cascade" }),
		// Prioridad para el slot assigner: menor número = se llena primero
		priority: integer("priority").notNull().default(1),
	},
	(t) => [unique("uq_league_venue").on(t.leagueId, t.venueId)],
);

// ---------------------------------------------------------------------------
// VENUE_TIME_WINDOWS — Banda horaria disponible de una cancha para una liga
// Permite por ejemplo: Liga Lunes usa cancha A los lunes de 19:40 a 22:10.
// Múltiples filas por liga × cancha si la disponibilidad es heterogénea.
// ---------------------------------------------------------------------------
export const venueTimeWindows = pgTable(
	"venue_time_windows",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venues.id, { onDelete: "cascade" }),
		// "lunes" | "martes" | ... — debe coincidir con leagues.dayOfWeek por default,
		// pero permite override si una jornada se mueve a otro día
		dayOfWeek: text("day_of_week").notNull(),
		// Horas en formato HH:MM. Inclusivo en startTime, exclusivo en endTime.
		startTime: text("start_time").notNull(), // "19:40"
		endTime: text("end_time").notNull(), // "22:10"
		isActive: boolean("is_active").notNull().default(true),
	},
	(t) => [index("vtw_league_idx").on(t.leagueId), index("vtw_venue_idx").on(t.venueId)],
);

// ---------------------------------------------------------------------------
// MATCHDAYS — Representación explícita de cada jornada de una liga
// Permite distinguir "regular" de "playoff" y guardar metadatos por jornada.
// ---------------------------------------------------------------------------
export const matchdays = pgTable(
	"matchdays",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		number: integer("number").notNull(), // 1..N
		phase: text("phase").notNull().default("regular"), // "regular" | "playoff"
		scheduledDate: date("scheduled_date").notNull(),
		status: text("status").notNull().default("draft"), // "draft" | "published" | "in_progress" | "completed"
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_matchday_league_number").on(t.leagueId, t.number),
		index("matchdays_league_idx").on(t.leagueId),
		check("chk_matchday_phase", drizzleSql`${t.phase} IN ('regular','playoff')`),
		check(
			"chk_matchday_status",
			drizzleSql`${t.status} IN ('draft','published','in_progress','completed')`,
		),
	],
);

// ---------------------------------------------------------------------------
// MATCHES (ampliación) — Campos nuevos en la tabla existente
// ---------------------------------------------------------------------------
// Añadir a `matches`:
//   matchdayId: uuid (FK a matchdays.id, nullable durante migración)
//   venueId: uuid (FK a venues.id, nullable)
//   kickoffAt: timestamp with time zone (fecha + hora exacta del partido)
//   isMakeup: boolean (default false)
//   originalMatchdayNumber: integer (si es de recuperación, qué jornada
//     debió haber sido)
//
// El campo `matchday: integer` queda como deprecated y se calcula desde
// matchdays.number durante la transición.

// ---------------------------------------------------------------------------
// TEAM_REST_REQUESTS — Equipos que piden descansar en una jornada (S3)
// Se respeta antes de generar el sorteo. Si se crea después de generar,
// se requiere regenerar o reprogramar manualmente.
// ---------------------------------------------------------------------------
export const teamRestRequests = pgTable(
	"team_rest_requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		matchdayNumber: integer("matchday_number").notNull(),
		reason: text("reason"),
		requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		unique("uq_team_rest").on(t.teamId, t.leagueId, t.matchdayNumber),
		index("trr_league_matchday_idx").on(t.leagueId, t.matchdayNumber),
	],
);

// ---------------------------------------------------------------------------
// MAKEUP_MATCHES — Partidos de recuperación para equipos late (S2)
// Apunta opcionalmente a un "partido original ausente" si se sabe cuál fue
// la jornada que se saltó. Permite tracking del déficit por equipo.
// ---------------------------------------------------------------------------
export const makeupMatches = pgTable(
	"makeup_matches",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		matchId: uuid("match_id")
			.notNull()
			.references(() => matches.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		originalMatchdayNumber: integer("original_matchday_number"),
		reason: text("reason"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("mm_team_idx").on(t.teamId), index("mm_match_idx").on(t.matchId)],
);

// ---------------------------------------------------------------------------
// TEAM_PURCHASED_TIMESLOTS — Horarios comprados por equipo (S7)
//
// Un equipo paga por jugar siempre a una hora fija, en una cancha fija (o
// cualquier cancha) durante toda la temporada. Es hard constraint para el
// slot assigner.
//
// El horario aplica a CUALQUIER partido del equipo (local o visitante).
// Si dos equipos con slots distintos se enfrentan, el slot assigner reporta
// conflicto y deja la decisión al organizador (no auto-resuelve).
//
// MVP: no guardamos datos de pago (monto, fecha, status). Eso se modela
// después si hace falta. Solo guardamos la asignación.
// ---------------------------------------------------------------------------
export const teamPurchasedTimeslots = pgTable(
	"team_purchased_timeslots",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		// Hora exacta en formato HH:MM (zona local de la organización).
		// Aplica a TODOS los partidos del equipo durante esta temporada.
		startTime: text("start_time").notNull(), // "18:50"
		// Opcional: si compró una cancha específica además del horario.
		// Si es NULL, cualquier cancha activa de la liga es válida.
		venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
		// Vigencia: aplica desde esta fecha (inclusive) hasta este matchday.
		// Si endMatchdayNumber es NULL, aplica a toda la temporada.
		activeFromDate: date("active_from_date").notNull(),
		endMatchdayNumber: integer("end_matchday_number"),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		// Un solo horario comprado vigente por equipo × liga
		unique("uq_team_purchased").on(t.teamId, t.leagueId),
		index("tpt_team_idx").on(t.teamId),
		index("tpt_league_idx").on(t.leagueId),
	],
);

// ---------------------------------------------------------------------------
// MATCH_SCHEDULE_OVERRIDES — Audit log de cambios manuales (S6)
// No es una tabla de estado: es de historia. El estado actual está en
// `matches`. Esto permite saber quién cambió qué y cuándo.
// ---------------------------------------------------------------------------
export const matchScheduleOverrides = pgTable(
	"match_schedule_overrides",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		matchId: uuid("match_id")
			.notNull()
			.references(() => matches.id, { onDelete: "cascade" }),
		changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
		// "time" | "venue" | "team_swap" | "matchday"
		changeType: text("change_type").notNull(),
		previousValue: jsonb("previous_value").notNull(), // snapshot del estado anterior
		newValue: jsonb("new_value").notNull(),
		reason: text("reason"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("mso_match_idx").on(t.matchId), index("mso_changed_by_idx").on(t.changedBy)],
);
```

### 3.2 Migraciones a `matches` existente

Drizzle migrations a aplicar:

1. `ALTER TABLE matches ADD COLUMN matchday_id UUID REFERENCES matchdays(id);`
2. `ALTER TABLE matches ADD COLUMN venue_id UUID REFERENCES venues(id);`
3. `ALTER TABLE matches ADD COLUMN kickoff_at TIMESTAMPTZ;`
4. `ALTER TABLE matches ADD COLUMN is_makeup BOOLEAN NOT NULL DEFAULT FALSE;`
5. Backfill: para partidos existentes, crear `matchdays` retrospectivamente
   a partir de `matches.matchday` y `matches.matchDate`. Vincular vía FK.
6. (Futuro, no en esta entrega) drop `matches.matchday` cuando todo el código
   lea de `matchday_id`.

### 3.3 Constraint de no-repetición (S4)

A nivel de DB no podemos hacer un `UNIQUE (least(home, away), greatest(home, away), league_id, phase=regular)`
directo porque Postgres no soporta expresiones simétricas en UNIQUE de forma
limpia. Opciones:

- **Recomendada**: validar en la capa de feature (`pairing-generator`) antes
  del `INSERT` (regla análoga a la Regla 1 de sanitización en CLAUDE.md:
  verificación previa, no confiar solo en el constraint).
- Alternativa: índice único parcial con expresión: `CREATE UNIQUE INDEX
uq_regular_pair ON matches (league_id, LEAST(home_team_id, away_team_id),
GREATEST(home_team_id, away_team_id)) WHERE is_makeup = false AND
matchday_id IN (SELECT id FROM matchdays WHERE phase = 'regular');` — más
  robusto pero más complejo.

Mi recomendación: implementar la validación en feature **y** el índice
parcial como red de seguridad. Esto es alineado con la filosofía de Regla 1
de CLAUDE.md.

---

## 4. Algoritmo en tres capas

Separar capas hace que cada una sea testeable de forma independiente y que la
edición manual (S6) no requiera regenerar todo.

### 4.1 Capa 1 — Pairing generator (sin tiempo ni cancha)

**Entrada:**

- Lista de equipos activos en la liga.
- Configuración (`regular_matchdays`, `regular_format`).
- Set de descansos solicitados (`team_rest_requests`).
- Matriz de pares ya jugados (vacía en generación inicial, poblada para S2/S6).

**Salida:**

- Array `Matchday[]`, cada uno con `Pairing[]` (par de teamIds, o `null` si
  BYE).

**Algoritmo:**

```
function generatePairings(input):
    1. Si N es impar, añade BYE virtual.
    2. Aplica circle method para producir N-1 jornadas base.
    3. Para cada jornada:
       a. Si algún equipo tiene rest_request para esa jornada, intercambia
          su par con el BYE de la jornada (forzando que descanse).
       b. Si el intercambio rompe S4 (par repetido), backtrack: prueba con
          otra jornada base o aborta con error explicable.
    4. Verifica que cada par no se repita en la fase regular.
    5. Retorna estructura.
```

**Edge case**: con N=8 y descansos solicitados, no siempre existe solución
(p.ej. si 5 equipos piden descansar la misma jornada). El generador debe
detectarlo y devolver un error explicable al usuario, no crashear.

### 4.2 Capa 2 — Slot assigner (asigna canchas y horarios)

**Entrada:**

- Pairings de una jornada (output de capa 1).
- Fecha objetivo de la jornada.
- Lista de venues activos para la liga con sus `venue_time_windows`.
- `match_duration_minutes`, `buffer_minutes` de la config.
- **Horarios comprados** (`team_purchased_timeslots`) vigentes para la liga.

**Salida:**

- Cada partido con `venueId` + `kickoffAt`.
- Lista de **conflictos de horarios comprados** que requieren decisión manual.

**Algoritmo (greedy con prioridad por horario comprado):**

```
function assignSlots(pairings, date, venues, purchasedSlots, config):
    1. Genera lista de slots disponibles:
       Para cada venue con time_window que caiga en `date.dayOfWeek`:
         slot 1: startTime, startTime + duration
         slot 2: slot1.end + buffer, slot1.end + buffer + duration
         ... hasta que slot.end > endTime
    2. Para cada pairing, detecta conflicto de horario comprado (S7):
       a. Si ambos equipos compraron slots con startTime distintos → CONFLICTO.
          Marca el pairing como "needs_manual" y NO lo asignes en automático.
       b. Si solo uno (o ambos con misma hora) tiene slot comprado, ese
          horario es hard constraint para este pairing.
    3. Ordena pairings: primero los que tienen horario comprado, luego el resto.
    4. Para cada pairing con horario comprado:
       a. Busca slot que coincida con startTime del comprador.
       b. Si el comprador tiene venue específico, fuerza esa cancha.
       c. Si no encuentra slot exacto → reporta error explicable.
    5. Para los pairings sin horario comprado, asigna greedy:
       - Primer slot libre que no rompa solapamiento por equipo.
    6. Devuelve { assigned: Match[], conflicts: Pairing[], errors: string[] }.
```

**Conflict detector** (`conflict-detector.ts`) es un módulo separado que
toma `Pairing[]` y `TeamPurchasedTimeslot[]` y devuelve `Conflict[]` con
detalle de qué pares tienen choque irresoluble. El endpoint `preview`
incluye esta lista para que la UI muestre alertas antes de confirmar.

**Por qué greedy basta**: con ≤16 equipos y ≤3 canchas, hay máximo 8 pares
por jornada y máximo ~24 slots disponibles. El greedy converge en
microsegundos. Si en el futuro tenemos torneos de 32+ equipos, se sustituye
por un solver más serio sin tocar la capa 1.

### 4.3 Capa 3 — Override engine (cambios manuales — S6)

No regenera nada. Sirve para tres operaciones puntuales:

- **`changeKickoff(matchId, newKickoffAt)`**: valida que el nuevo horario no
  cause solapamiento. Guarda override en `match_schedule_overrides`.
- **`changeVenue(matchId, newVenueId, newKickoffAt?)`**: idem, validando que
  el nuevo venue tenga ventana horaria que cubra el partido.
- **`swapTeam(matchId, oldTeamId, newTeamId)`**: cambia uno de los dos
  equipos del partido. Valida:
  - Que `newTeamId` pertenezca a la misma liga.
  - Que el partido no rompa S4 si `allow_duplicate_matchups = false`. Si lo
    rompe, devuelve error 409 con mensaje claro (siguiendo Regla 1 de
    CLAUDE.md).
  - Que `newTeamId` no tenga otro partido el mismo día que cause
    solapamiento.

### 4.4 Capa de recuperación (S2)

No es una "capa" en el mismo nivel; es un caso especial de invocar capa 1
con la matriz de pares ya jugados pre-poblada y solo los equipos con
déficit:

```
function generateMakeupMatches(leagueId):
    1. Identifica equipos con partidos jugados < regular_matchdays.
    2. Para cada equipo, identifica rivales pendientes (no jugados aún).
    3. Empareja en jornadas futuras con slots libres.
    4. Marca cada match con is_makeup = true y registra fila en makeup_matches.
```

Restricciones específicas:

- Un partido de recuperación NO debe rompar S4 entre los dos equipos.
- Debe respetar S3 (descansos vigentes).
- Puede agendarse en jornadas regulares futuras si hay slot, o en jornadas
  dedicadas a "recuperación" entre la regular y los playoffs.

---

## 5. Estructura FSD propuesta

Siguiendo CLAUDE.md (`features/`, `entities/`, `shared/`):

```
src/
├── entities/
│   ├── venue/
│   │   ├── model.ts        # Venue, VenueSchema (Zod)
│   │   ├── queries.ts      # getVenue, listVenuesByLeague
│   │   └── index.ts
│   ├── matchday/
│   │   ├── model.ts        # Matchday, MatchdayPhase, statuses
│   │   ├── queries.ts      # getMatchday, listMatchdaysByLeague
│   │   └── index.ts
│   └── match/              # NUEVA — actualmente sólo hay route handlers
│       ├── model.ts
│       ├── queries.ts      # getMatch, listMatchesByMatchday, listByTeamSeason
│       └── index.ts
│
├── features/
│   └── scheduling/
│       ├── constants.ts                 # duración default, status enums, límites
│       ├── types.ts                     # Pairing, GeneratedSchedule, etc.
│       ├── index.ts
│       ├── pairing-generator/
│       │   ├── circle-method.ts         # Algoritmo puro (testeable sin DB)
│       │   ├── apply-rest-requests.ts   # Inserta BYEs solicitados
│       │   ├── validate-no-duplicates.ts
│       │   └── generate-pairings.ts     # Orquestador (≤ 80 líneas)
│       ├── slot-assigner/
│       │   ├── build-slots.ts           # Genera slots desde venue_time_windows
│       │   ├── assign-greedy.ts         # Greedy con backtracking ligero
│       │   └── assign-slots.ts          # Orquestador
│       ├── overrides/
│       │   ├── change-kickoff.ts
│       │   ├── change-venue.ts
│       │   └── swap-team.ts
│       ├── makeup-builder/
│       │   ├── detect-deficit.ts
│       │   ├── build-makeup-matches.ts
│       │   └── confirm-makeup.ts
│       ├── lib/
│       │   ├── time-overlap.ts          # Helpers puros de cálculo horario
│       │   └── pair-key.ts              # Normaliza pares (sort de ids)
│       ├── model/
│       │   ├── useSchedulingPreview.ts  # Custom hook UI (≤ 20 líneas o se rompe)
│       │   └── useScheduleEditor.ts
│       └── ui/
│           ├── SchedulingConfigForm.tsx     # ≤ 150 líneas
│           ├── VenueManager.tsx
│           ├── GeneratePreview.tsx
│           ├── MatchdayBoard.tsx            # Listado con drag-and-drop (futuro)
│           ├── MatchEditPanel.tsx
│           └── RestRequestsList.tsx
```

Cada función pura (circle method, slot assigner, validators) ≤ 20 líneas.
Cada componente ≤ 150. Conforme a la sección 3.2 de AGENTS.md.

---

## 6. Endpoints REST propuestos

Todos los handlers `route.ts` son **delgados**: validan con Zod, llaman a
feature, retornan `apiSuccess`/`apiError`. Sin lógica de negocio.

### 6.1 Configuración

| Método | Ruta                                         | Descripción                                |
| ------ | -------------------------------------------- | ------------------------------------------ |
| GET    | `/api/leagues/[id]/scheduling-config`        | Lee la config de calendarización           |
| PUT    | `/api/leagues/[id]/scheduling-config`        | Crea o actualiza la config (upsert)        |
| GET    | `/api/venues?organization_id=xxx`            | Lista canchas de una organización          |
| POST   | `/api/venues`                                | Crea cancha (con sanitización canónica)    |
| PATCH  | `/api/venues/[id]`                           | Edita cancha                               |
| DELETE | `/api/venues/[id]`                           | Elimina cancha                             |
| GET    | `/api/leagues/[id]/venues`                   | Canchas asignadas a la liga + sus ventanas |
| POST   | `/api/leagues/[id]/venues`                   | Asigna cancha a la liga (con prioridad)    |
| DELETE | `/api/leagues/[id]/venues/[venueId]`         | Desasigna cancha                           |
| POST   | `/api/leagues/[id]/venues/[venueId]/windows` | Crea ventana horaria                       |
| PATCH  | `/api/venue-windows/[id]`                    | Edita ventana                              |
| DELETE | `/api/venue-windows/[id]`                    | Elimina ventana                            |

### 6.2 Descansos y matchdays

| Método | Ruta                              | Descripción                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/api/leagues/[id]/rest-requests` | Lista descansos                                      |
| POST   | `/api/leagues/[id]/rest-requests` | Crea descanso para un equipo en una jornada          |
| DELETE | `/api/rest-requests/[id]`         | Cancela descanso                                     |
| GET    | `/api/leagues/[id]/matchdays`     | Lista jornadas con estado                            |
| POST   | `/api/leagues/[id]/matchdays`     | Crea jornada explícitamente (fecha + número + phase) |
| PATCH  | `/api/matchdays/[id]`             | Edita fecha o status                                 |

### 6.3 Sorteo (capa 1 + 2)

| Método | Ruta                                         | Descripción                                                                          |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| POST   | `/api/leagues/[id]/schedule/preview`         | Corre capa 1 + capa 2 y devuelve preview JSON sin persistir. Idempotente.            |
| POST   | `/api/leagues/[id]/schedule/confirm`         | Persiste el preview. Crea `matchdays` y `matches`. Transacción atómica.              |
| POST   | `/api/leagues/[id]/matchdays/[n]/regenerate` | Regenera solo la jornada N (manteniendo las demás). Útil si cambian descansos tarde. |

### 6.4 Edición y overrides (S6)

| Método | Ruta                          | Descripción                          |
| ------ | ----------------------------- | ------------------------------------ |
| PATCH  | `/api/matches/[id]/kickoff`   | Cambia hora del partido              |
| PATCH  | `/api/matches/[id]/venue`     | Cambia cancha                        |
| POST   | `/api/matches/[id]/swap-team` | Intercambia uno de los dos equipos   |
| GET    | `/api/matches/[id]/overrides` | Lista cambios históricos del partido |

### 6.5 Recuperación (S2)

| Método | Ruta                                | Descripción                                     |
| ------ | ----------------------------------- | ----------------------------------------------- |
| GET    | `/api/leagues/[id]/makeups/deficit` | Reporte de equipos con déficit                  |
| POST   | `/api/leagues/[id]/makeups/preview` | Propone partidos de recuperación                |
| POST   | `/api/leagues/[id]/makeups/confirm` | Persiste los makeups (marca `is_makeup = true`) |

---

## 7. Validación Zod (en `src/types/index.ts`)

```ts
export const SchedulingConfigSchema = z.object({
	regularMatchdays: z.number().int().min(1).max(50),
	regularFormat: z.enum(["single", "double"]),
	matchDurationMinutes: z.number().int().min(20).max(120),
	bufferMinutes: z.number().int().min(0).max(50),
	allowDuplicateMatchups: z.boolean().default(false),
});

export const CreateVenueSchema = z.object({
	name: z.string().min(2).max(100),
	organizationId: z.string().uuid(),
	city: z.string().max(80).optional(),
	notes: z.string().max(500).optional(),
});

export const CreateVenueWindowSchema = z
	.object({
		venueId: z.string().uuid(),
		dayOfWeek: z.enum(DAYS_OF_WEEK),
		startTime: z.string().regex(/^\d{2}:\d{2}$/),
		endTime: z.string().regex(/^\d{2}:\d{2}$/),
	})
	.refine((v) => v.startTime < v.endTime, "startTime debe ser anterior a endTime");

export const RestRequestSchema = z.object({
	teamId: z.string().uuid(),
	matchdayNumber: z.number().int().min(1),
	reason: z.string().max(500).optional(),
});

export const GenerateScheduleSchema = z.object({
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	// Fechas explícitas opcionales; si no, se calculan por dayOfWeek a partir de startDate
	matchdayDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const ChangeKickoffSchema = z.object({
	kickoffAt: z.string().datetime(),
});

export const SwapTeamSchema = z.object({
	oldTeamId: z.string().uuid(),
	newTeamId: z.string().uuid(),
	reason: z.string().max(500).optional(),
});

export const MakeupBuildSchema = z.object({
	teamIds: z.array(z.string().uuid()).optional(), // si vacío, todos con déficit
	maxFutureMatchdays: z.number().int().min(1).max(20).default(5),
});
```

---

## 8. Sanitización (cumplimiento CLAUDE.md)

CLAUDE.md exige sanitización canónica para entidades con nombre crítico de
negocio (Regla 1–4). En este módulo aplica para:

- **`venues.name`** → `venues.name_canonical`. Constraint
  `UNIQUE(organization_id, name_canonical)`. Sanitizar en backend con
  `sanitizeToCanonical()` de `shared/lib/normalize.ts`. Verificar existencia
  antes del insert (Regla 1).

No requieren `*_canonical`:

- `team_rest_requests`, `makeup_matches`, `matchdays` — no son entidades con
  nombre.

---

## 9. Edge cases que debemos cubrir

1. **N=2** (dos equipos en la liga): el round-robin produce 1 partido. El
   organizador probablemente quiere múltiples enfrentamientos: validar y
   forzar `regularFormat = double` o más.
2. **Equipo se inscribe a mitad de temporada (S2)**: hasta su inscripción no
   aparece en pairings. A partir de ese momento se generan makeups contra
   equipos que aún no enfrentó.
3. **Equipo se retira a mitad de temporada**: sus partidos futuros se
   marcan como `cancelled`. Si ya jugó algunos, sus resultados quedan
   históricos (tema de tabla general, fuera de scope).
4. **Más equipos solicitan descanso que canchas/slots disponibles**: si N=8
   y 6 piden descanso la misma jornada, no hay solución → error explicable.
5. **Solapamiento ya existente al editar venue/hora**: la validación debe
   rechazar y proponer slot alternativo libre.
6. **Cambio de jornada de un partido individual**: técnicamente es mover el
   partido a otro matchday. Permite que la "jornada lógica" sea distinta a
   "qué jornada está jugándose ese viernes".
7. **Resultados ya capturados al hacer override**: si el partido ya tiene
   `status = completed`, los overrides de hora/venue se permiten (sólo es
   corregir el historial), pero el swap de equipos se bloquea — alteraría
   estadísticas ya importadas.
8. **Doble round-robin con descansos**: si `regularFormat = double` y un
   equipo descansa, debe descansar simétricamente en ida y vuelta para
   mantener N−1 partidos para todos. Si no, queda déficit.
9. **DST / cambios de horario**: usar `timestamp with time zone` en
   `kickoff_at`. Las ventanas horarias se guardan como `HH:MM` local del
   día → al generar slots se interpreta en la zona de la organización.
10. **Una liga sin cancha asignada**: el slot assigner debe arrojar error
    explicable, no panic. Bloquear el endpoint `schedule/preview` si no hay
    ≥1 venue activo.

---

## 10. Fases de entrega sugeridas

Recomiendo trocear así para que cada fase sea releasable y testeable. Cada
fase termina con tests unitarios verdes y validación manual del organizador.

### Fase 1 — Configuración y venues (1–2 días)

- Migraciones: `league_scheduling_config`, `venues`, `league_venues`,
  `venue_time_windows`, `matchdays`.
- Entities `venue`, `matchday`.
- CRUD de venues + ventanas (endpoints y UI básica en
  `/admin/leagues/[id]/setup`).
- Sin algoritmo todavía. Sólo configurar.

**Deliverable demo**: el organizador puede capturar canchas y horarios
disponibles.

### Fase 2 — Pairing generator + preview (2 días)

- `features/scheduling/pairing-generator/` con circle method puro.
- Endpoint `POST /api/leagues/[id]/schedule/preview` que devuelve JSON.
- UI mínima: botón "Vista previa de jornadas" + tabla de pares.
- Descansos opcional: si hay, se respetan; si no, sin descansos.

**Deliverable demo**: el organizador ve qué partidos saldrían si confirma.
Sin canchas todavía — sólo pares.

### Fase 3 — Slot assigner + confirm (2–3 días)

- `features/scheduling/slot-assigner/`.
- Endpoint `POST /api/leagues/[id]/schedule/confirm` (transacción).
- Migración a `matches` (añadir `matchday_id`, `venue_id`, `kickoff_at`,
  `is_makeup`).
- UI: confirmación con horarios.

**Deliverable demo**: el organizador genera y persiste la temporada
completa, ve calendario por jornada con canchas y horas.

### Fase 4 — Edición manual (S6) (2 días)

- `features/scheduling/overrides/`.
- Endpoints PATCH de kickoff/venue + POST swap-team.
- Tabla `match_schedule_overrides` (audit log).
- UI: panel de edición de un partido con validaciones inline.

**Deliverable demo**: el organizador edita un partido sin regenerar la
temporada.

### Fase 5 — Recuperación + descansos (S2 + S3) (2 días)

- `features/scheduling/makeup-builder/`.
- Tabla `team_rest_requests`, `makeup_matches`.
- Reporte de déficit + preview/confirm de makeups.
- UI: tarjeta de "equipos con partidos pendientes" + flujo de descansos.

**Deliverable demo**: equipo entra tarde, organizador genera sus makeups en
2 clicks.

### Fase 6 — Pulido (a definir)

- Drag-and-drop entre slots en la UI.
- Eliminación directa / bracket de playoffs.
- Notificación a equipos vía WhatsApp (separado).

---

## 11. Checklist de cumplimiento CLAUDE.md

- [ ] `venues.name_canonical` existe en el schema y se genera con
      `sanitizeToCanonical()` antes de cualquier `INSERT`/`UPDATE`.
- [ ] Verificación de existencia por canonical antes de insertar venues.
- [ ] Errores 409 explícitos con mensaje legible (no constraint catch).
- [ ] Formularios React **sin** sanitización en `onChange`.
- [ ] Lógica de transacciones en `features/scheduling/*`, **no** en
      `route.ts`.
- [ ] Cada `route.ts` ≤ ~30 líneas (parse Zod, llamar feature, responder).
- [ ] Cada función ≤ 20 líneas; cada componente ≤ 150.
- [ ] Sin `any`. Tipos de retorno explícitos en `features/` y `entities/`.
- [ ] Schemas Zod son la fuente única; tipos se infieren con `z.infer<>`.
- [ ] Imports respetan el orden FSD (`app → features → entities → shared`).
- [ ] Server components por defecto en `app/admin/leagues/[id]/scheduling/`,
      Client sólo donde hay estado de formulario o drag.

---

## 12. Decisiones tomadas

Las preguntas abiertas fueron resueltas por el founder el 2026-05-15:

1. **Sorteo aleatorio** con seed almacenado en `matchdays.draw_seed` (o en
   `league_scheduling_config.last_seed`) para reproducibilidad y auditoría.
   Mismo seed = mismo sorteo.
2. **Doble round-robin: NO en el MVP**. El schema mantiene
   `regular_format: 'single' | 'double'` pero el generador solo implementa
   `'single'`. `'double'` queda para fase posterior.
3. **Múltiples ventanas horarias por cancha el mismo día: SÍ, exponerlas en
   UI**. Las canchas se rentan todo el día (mañana = uso libre / ligas
   infantiles, tarde-noche = torneo serio). Estilo de UI: **calendario
   visual semanal**, tipo Google Calendar, con bloques arrastables/clickeables
   para definir disponibilidad.
4. **Jornadas no se mueven a otro día**. Si quedan partidos pendientes el
   lunes (jornada incompleta), se juegan hasta la siguiente semana en el
   mismo día de la liga. No soportamos jornadas "movidas" a feriados.
5. **Sponsors/publicidad por venue**: fuera del MVP.
6. **Permisos sobre venues**: organizers (no solo owners) pueden CRUD venues
   y windows de su organización.
7. **Posicionamiento**: Opción 2 — módulo opt-in/premium por liga (ver
   sección 0.1).
8. **Horarios comprados (S7, nuevo)**: existen. Un equipo compra el horario
   para toda la temporada y aplica a cualquier partido suyo (local o
   visitante). Cuando dos equipos con horarios distintos coinciden, el
   sistema detecta el conflicto y deja que el organizador decida
   manualmente.

---

## 13. Fuentes de la investigación

- [Round-robin tournament — Wikipedia](https://en.wikipedia.org/wiki/Round-robin_tournament) — método del círculo, Berger tables, manejo de N impar (BYE).
- [Sports Scheduling Simplified — Uri Itai, Medium](https://medium.com/coinmonks/sports-scheduling-simplified-the-power-of-the-rotation-algorithm-in-round-robin-tournament-eedfbd3fee8e) — rotación con anchor, balance home/away.
- [Strategies for dealing with uncertainty in time-relaxed sports timetabling — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9468531/) — políticas reactivas/proactivas para reprogramación de partidos postpuestos.
- [Advanced Scheduler — The FA Grassroots Technology](https://grassrootstechnology.thefa.com/support/solutions/articles/48001146067-advanced-scheduler) — manejo práctico de timeslots primarios/secundarios y constraints de venue.
- [A Pragmatic Approach for Solving the Sports Scheduling Problem — PATAT 2022](https://www.patatconference.org/patat2022/proceedings/PATAT_2022_paper_21.pdf) — taxonomía hard/soft constraints (BR1, BR2, FA2, separation, availability, mating).
- [Solving the Sports League Scheduling Problem with Tabu Search](https://leria-info.univ-angers.fr/~jinkao.hao/papers/ECAI00WS.pdf) — referencia académica de algoritmos para casos grandes (no requerido en MVP).
- [Sports Scheduling: Algorithms and Applications — Sam Scott, UW CSEP 521](https://courses.cs.washington.edu/courses/csep521/07wi/prj/sam_scott.pdf) — buen panorama general.
