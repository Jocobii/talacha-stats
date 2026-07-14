<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# TalachaStats — Guía para agentes de IA

Este archivo define cómo trabajar en este codebase. Aplica a cualquier agente (Claude, Copilot, Cursor, etc.) y también a devs humanos que lean el CLAUDE.md.

**Antes de escribir cualquier línea de código, lee esta guía completa.** Las decisiones aquí no son preferencias — son contratos que mantienen el proyecto coherente.

---

## 1. Orientación rápida del proyecto

TalachaStats es una **plataforma de gestión de ligas de fútbol amateur en México cuyo norte es generar contenido y alimentar el ego del jugador**. Sí gestiona la operación de la liga de punta a punta — ligas, equipos, jugadores, jornadas, calendario/sorteo, canchas, cédulas de partido, goleo, tabla y liguilla — pero la gestión **no es el fin**: es la forma de capturar dato limpio y estructurado que después se convierte en identidad de jugador, estadísticas presumibles y contenido listo para postear.

> **Estrella polar (leer siempre):** cada feature, incluso las de gestión pura, existe para que al final el jugador presuma sus números y el organizador tenga su liga "en serio" con contenido y presencia digital. Si una feature de gestión no termina alimentando dato/identidad/contenido, está mal priorizada.

La visión de fondo sigue intacta: conforme más ligas de la ciudad adopten la app, los datos de cada jugador son más confiables — porque un jugador registrado con su CURP real no puede duplicarse en ninguna otra liga.

El proyecto tiene tres capas:

- **Identidad global** — `global_players` anclados al CURP. Un jugador, una identidad, para siempre.
- **Pública** (`/`, `/ranking`, `/player/[id]`, `/ligas`, `/matchday`, etc.) — jugadores y aficionados ven stats, perfiles, jornadas y tabla
- **Admin** (`/admin/*`) — organizadores gestionan ligas, equipos, jornadas, calendario, canchas y cédulas; el narrador del Facebook Live consulta análisis pre-partido

### Dos flujos de datos (V1 legacy de solo-lectura + V2 activo)

| Flujo  | Descripción                                                                                     | Tablas                                                                              |
| ------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **V1** | Stats históricas de Excel — **solo lectura**. El flujo de importación fue eliminado (ver §1.6). | `players`, `player_registrations`, `player_season_stats`                            |
| **V2** | Registro CURP + gestión en-app (cédulas, jornadas)                                              | `global_players`, `league_members`, `inscriptions`, `matches`, `match_player_stats` |

**Regla de routing entre flujos:**

- Feature **lee** stats históricas de Excel → tablas V1 (ya no hay escritura in-app)
- Feature toca registro de identidad, inscripción o captura en-app (cédula de partido) → tablas V2
- Feature toca ambas → prioridad de stats: `player_season_stats` (Excel, histórico) > `match_player_stats` / `match_events` (partido a partido)

No eliminar tablas V1: conservan el dato ya importado y siguen sirviendo lecturas (tabla, perfiles). El flujo de importación (`import-excel`) se eliminó en 2026; las tablas quedan como histórico de solo-lectura.

---

## 1.5 Posicionamiento del producto — leer antes de proponer features

TalachaStats es una **plataforma de gestión de ligas + capa de identidad y contenido para fútbol amateur local**. El diferenciador central NO es la gestión en sí misma (eso lo hacen muchos): es que **toda la operación desemboca en identidad global de jugador (anclada al CURP) y en contenido presumible**. Conforme más ligas de la ciudad adopten la plataforma, la calidad del dato mejora sola — un jugador verificado con CURP real es incorruptible.

Cambio de estrategia (2026): **ahora sí construimos gestión de liga completa** — sorteo/calendario, canchas, cédulas de partido, liguilla. Lo hacemos porque capturar el dato en-app (en vez de depender solo del Excel del organizador) hace el dato más rico, más en tiempo real y más apto para generar contenido e identidad. Pero la gestión es el **medio**, no el producto. El producto sigue siendo el ego del jugador y el contenido del organizador.

Lo que construimos, en capas (todas activas hoy en alguna medida):

1. **Identidad global de jugador** — `global_players` con CURP hash. La fundación. Sin esto, todo lo demás es frágil.
2. **Gestión de la liga** — ligas, equipos, jugadores, jornadas, sorteo/calendario, canchas, cédulas de partido, liguilla. Captura el dato estructurado.
3. **Identidad de la liga** — página pública con branding, perfiles de jugador, tabla, goleadores, jornadas.
4. **Generación de contenido** post-jornada (píldoras del narrador, imágenes para WhatsApp/Facebook, stories del org-hub, assets para compartir).
5. **Pre-partido del narrador** — UI dedicada para el narrador del Facebook Live.
6. **Ecosistema de ciudad** — comparativos entre ligas, vitrina de jugadores libres, sponsors. Madura conforme crece la adopción.

**Heurística antes de implementar cualquier feature:**

1. ¿Refuerza la confiabilidad del dato del jugador (identidad)?
2. ¿El dato que captura o procesa termina alimentando contenido, stats presumibles o identidad? (Gestión que no desemboca en esto = baja prioridad.)
3. ¿Refuerza el ego del jugador o del organizador?
4. ¿Refuerza el viral loop (jugador presume → otros jugadores presionan a sus organizadores)?
5. ¿Resuelve mejor en-app algo que hoy es manual/frágil en WhatsApp+Excel (sorteo, cédula, goleo)?

**Documentos de referencia:** `docs/PRODUCT-STRATEGY.md` y `docs/player-identity-admin-ecosystem.md` dan contexto histórico y detalle. **Si hay conflicto sobre posicionamiento, este AGENTS.md manda** — es la fuente de verdad. (Nota: partes de `PRODUCT-STRATEGY.md` escritas antes de 2026 dicen que "no construimos gestión de liga"; eso quedó superado por el cambio de estrategia descrito arriba.)

---

## 1.6 Módulos del producto — estado real del código

Inventario de las features que existen hoy en `src/features/`. Cada una vive como un slice FSD; las capas superiores solo importan desde su `index.ts`.

### Identidad y registro

- **`admin-registration`** — Terminal de registro de alta velocidad por CURP. Hashea el CURP en server, busca en `global_players`, y en una transacción atómica crea `global_player` + `league_member` + `inscription`.

> **`import-excel` — ELIMINADO (2026).** El flujo de importación bulk de Excel, sus rutas (`/admin/import`, `/admin/imports`, `/api/import/*`, `/api/imports/*`) y sus entry points fueron removidos por decisión de producto. Las tablas V1 (`player_season_stats`, snapshots, `player_registrations`) se conservan como histórico de solo-lectura (§1, §4.3). La captura de datos ahora es 100% en-app vía cédula (V2, `match-resolution`). **No recrear este módulo.**

### Gestión de liga

- **`league-onboarding`** — Wizard de alta de liga: crear liga + carga bulk de equipos (`bulk-create-teams`).
- **`league-management`** — Utilidades de liga; genera el código corto de la liga (`generate-league-code`) usado como prefijo de cédulas (`LCN-0001`).
- **`team-management`** — CRUD de equipos: roster, settings, borrado. UI + hooks (`useTeamRoster`, `useTeamForm`).
- **`match-resolution`** — Cédula de partido: capturar stats por jugador, autosave, jugadores ad-hoc, walkover/forfeit, numeración de cédula y resolución final del marcador. Escribe `matches` + `match_player_stats`.
- **`playoffs`** — Liguilla: generador de brackets de eliminación directa (B = 2/4/8 con byes y seeding), propagación de ganadores entre slots, zonas de playoff por liga.

### Calendario, sorteo y canchas

- **`scheduling`** — Sorteo y calendarización completos (opt-in por liga). Pairing (circle method), descansos, generación y asignación de slots, jornadas makeup, overrides con snapshot. Ver §16 y `src/features/scheduling/README.md`.
- **`sorteo-cockpit`** — UI del cockpit de sorteo para el organizador.
- **`venue-management`** — CRUD de canchas (venues) + ventanas de horario; asignación de canchas a ligas.
- **`venue-calendar`** — Calendario de canchas: rentas, ventanas, detección de solapamientos, timeslots comprados por equipo.

### Contenido e identidad (el norte)

- **`narrator-analysis`** — Análisis pre-partido para el narrador del Facebook Live, con exportación a PDF/PNG.
- **`post-import-content`** — Genera **píldoras** narrativas tras la jornada (deltas de goleo, forma de equipos) listas para WhatsApp o para renderizar en imágenes. Devuelve datos, nunca JSX.
- **`org-hub`** — Stories, ticker y líneas narrativas del hub de la organización (presencia digital de la liga).
- **`share-assets`** — Deep links y URLs de assets para compartir perfiles/jornadas.

> Al agregar una feature nueva, ubícala en la capa correcta de esta lista y conéctala al norte (§1.5). Si es gestión pura, deja explícito en el PR cómo alimenta dato/contenido/identidad.

---

## 2. Stack — versiones exactas

No asumas versiones de tus datos de entrenamiento. Las versiones reales son:

| Paquete       | Versión    | Notas críticas                                                          |
| ------------- | ---------- | ----------------------------------------------------------------------- |
| `next`        | **16.x**   | App Router obligatorio. Pages Router no existe en este proyecto         |
| `react`       | **19.x**   | Nuevas APIs de concurrencia disponibles                                 |
| `drizzle-orm` | **0.45.x** | API relacional: `db.query.*` para reads con joins                       |
| `zod`         | **4.x**    | Breaking changes vs. Zod 3 — sintaxis puede diferir de tu training data |
| `tailwindcss` | **4.x**    | Breaking changes vs. v3 — nueva config, nueva sintaxis de plugins       |
| `typescript`  | **5.x**    | `strict: true` obligatorio                                              |

Si necesitas saber qué hace una API específica, revisa `node_modules/[paquete]/README.md` antes de asumir.

---

## 3. Arquitectura — reglas no negociables

### 3.1 Feature-Sliced Design (FSD)

La regla de dependencias es estricta:

```
app  →  features  →  entities  →  shared
```

**Nunca al revés. Nunca entre capas del mismo nivel.**

```
✅  app/api/players/route.ts  →  entities/player/queries.ts
✅  features/narrator-analysis/  →  lib/narrator.ts (legacy, ver §10)
❌  entities/player/queries.ts  →  features/match-resolution/
❌  shared/lib/normalize.ts  →  entities/player/
❌  features/standings/  →  features/narrator-analysis/
```

### 3.2 API Routes = controladores delgados

Un `route.ts` hace exactamente tres cosas:

1. Parsear y validar la entrada con Zod
2. Llamar a una función de `features/` o `entities/`
3. Retornar `apiSuccess()` o `apiError()`

```typescript
// ✅ CORRECTO
export async function GET(request: Request) {
  const leagueId = new URL(request.url).searchParams.get("league_id");
  if (!leagueId) return apiError("Falta league_id", 400);
  const standings = await getLeagueStandings(leagueId);
  return apiSuccess(standings);
}

// ❌ INCORRECTO — lógica de negocio en el route
export async function GET(request: Request) {
  const rows = await db.query.matches.findMany({ ... });
  const standings = rows.reduce((acc, m) => { /* cálculo */ }, {});
  return Response.json(standings);
}
```

### 3.3 Server Components por defecto

```typescript
// ✅ Page que muestra datos → Server Component
export default async function LeaguePage({ params }: { params: { id: string } }) {
  const league = await getLeague(params.id);
  return <LeagueDetail league={league} />;
}

// ✅ Formulario con estado → Client Component
"use client";
export function SorteoCockpit() {
  const [step, setStep] = useState("config");
  ...
}
```

### 3.4 Transacciones en features, no en routes ni en queries

```typescript
// features/admin-registration/register.ts ✅
export async function registerPlayer(data: RegistrationInput) {
  return db.transaction(async (tx) => {
    const player = await tx.insert(globalPlayers).values(...).returning();
    const member = await tx.insert(leagueMembers).values(...).returning();
    await tx.insert(inscriptions).values({ leagueMemberId: member.id, teamId });
  });
}
```

### 3.5 Calidad de código (SRP) — límites no negociables

- **Tamaño de archivo:** ningún componente supera **150 líneas**. Divide God Components en subcomponentes atómicos en `features/*/ui/` o `shared/ui/`.
- **Tamaño de función:** **máximo 20 líneas**. Si hace más de una cosa, divídela.
- **Custom Hooks obligatorios:** si la lógica de estado o efectos supera **20 líneas**, se extrae a `use[Nombre].ts` en `features/*/model/`. No dejar lógica de ciclo de vida en el cuerpo del componente.
- **Sin hardcoding (DRY):** magic strings, IDs, regex, timeouts y números mágicos van en `constants.ts` de la feature. Antes de crear una utilidad/tipo/componente, verifica si ya existe en `shared/`.
- **Nombres semánticos:** `isLoading` no `ld`, `userData` no `u`. Booleans con verbos auxiliares: `isLoading`, `hasTeams`, `shouldRedirect`, `canSubmit`.
- **Declarativo sobre imperativo:** prioriza `map`/`filter`/`reduce` sobre bucles.

### 3.6 Estructura interna de una feature con UI

```
features/[nombre]/
├── constants.ts          # Magic strings, regex, timeouts
├── types.ts              # Tipos compartidos de la feature
├── index.ts              # Exportaciones públicas (único punto de import externo)
├── lib/
│   └── [nombre]-utils.ts # Funciones puras sin ciclo de vida React
├── model/
│   └── use[Nombre].ts    # Custom Hook con estado + efectos
└── ui/
    ├── [Nombre].tsx       # Orquestador (≤ 80 líneas)
    └── [SubComp].tsx      # Subcomponentes atómicos (≤ 150 líneas)
```

### 3.7 Cómo agregar una feature nueva (orden)

1. **Modelo** en `entities/[nombre]/model.ts` — tipos + schema Zod
2. **Queries** en `entities/[nombre]/queries.ts` — acceso a DB
3. **Lógica** en `features/[nombre]/` — orquestar queries, calcular, transformar
4. **Endpoint** en `app/api/[ruta]/route.ts` — validar + llamar feature + responder
5. **UI** en `app/(admin)/[ruta]/page.tsx` o `app/(public)/...` — componer componentes
6. **Conectar al norte:** dejar explícito cómo la feature alimenta dato/identidad/contenido (§1.5)

---

## 4. Base de datos

### 4.1 Tipos siempre inferidos desde el schema

```typescript
// ✅ Correcto — inferir desde Drizzle
export type Player    = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

// ❌ Incorrecto — nunca duplicar manualmente
type Player = { id: string; fullName: string; ... }
```

### 4.2 Cómo hacer queries

```typescript
// Reads con joins → API relacional
const result = await db.query.players.findMany({
	with: { registrations: { with: { team: true } } },
	where: eq(players.id, playerId),
});

// Escrituras → builders con upsert
await db
	.insert(playerSeasonStats)
	.values(data)
	.onConflictDoUpdate({
		target: [playerSeasonStats.playerId, playerSeasonStats.leagueId],
		set: { goals: data.goals, updatedAt: new Date() },
	});
```

### 4.3 Constraints clave

#### Tablas V2 — Identidad global (flujo CURP)

| Tabla            | Constraint                            | Regla práctica                                                                |
| ---------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `global_players` | `UNIQUE(curp_hash)`                   | Un jugador real, una fila. `curp_hash = sha256(CURP)` generado solo en server |
| `league_members` | `UNIQUE(global_player_id, league_id)` | Un jugador, una inscripción por liga                                          |
| `inscriptions`   | `UNIQUE(league_member_id)`            | Un jugador, un equipo por liga (`league_member_id` ya está scoped a liga)     |

#### Tablas de gestión (jornadas, partidos, liguilla, canchas)

| Tabla                      | Constraint                                                       | Regla práctica                                                                                             |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `matchdays`                | `UNIQUE(league_id, number)`                                      | `number` es la jornada (integer de negocio). Makeup se numeran después                                     |
| `matches`                  | `UNIQUE(league_id, cedula)`                                      | `cedula = "{LEAGUE_CODE}-{NNNN}"`. `status`: scheduled/played/walkover\_\*/postponed. BYE nunca se inserta |
| `match_player_stats`       | agregado por jugador por partido                                 | Fuente de stats V2 (captura en-app vía cédula); fallback frente a `player_season_stats`                    |
| `match_events`             | un evento por gol/asistencia/tarjeta/MVP                         | Detalle fino del partido; FK migrada a `global_players`                                                    |
| `playoff_brackets`         | `UNIQUE(league_id, zone_id)`                                     | Un bracket por zona de liguilla                                                                            |
| `playoff_slots`            | `UNIQUE(bracket_id, round, slot_index)`                          | Slots propagan ganador/perdedor; no hardcodear rondas                                                      |
| `venues` / `league_venues` | `UNIQUE(org_id, name_canonical)` / `UNIQUE(league_id, venue_id)` | Canchas scoped a la organización; asignadas a ligas                                                        |
| `team_rest_requests`       | `UNIQUE(team_id, league_id, matchday_number)`                    | Descansos del sorteo                                                                                       |

#### Tablas V1 — Excel / legacy (solo lectura)

> El flujo de importación que escribía estas tablas fue eliminado (§1.6). Conservan el dato histórico ya importado y siguen sirviendo lecturas; ya no hay escritura in-app.

| Tabla                          | Constraint                              | Regla práctica                                                                  |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------- |
| `player_registrations`         | `UNIQUE(player_id, league_id)`          | Un jugador, un equipo por liga. Eliminar registro anterior para moverlo         |
| `player_season_stats`          | `UNIQUE(player_id, league_id)`          | Siempre upsert, nunca insert directo                                            |
| `player_season_stats_snapshot` | `UNIQUE(player_id, league_id, jornada)` | Una fila por jornada (histórico Excel); el constraint era upsert al re-importar |
| `team_standings_snapshot`      | `UNIQUE(team_id, league_id, jornada)`   | Ídem                                                                            |
| `teams`                        | `UNIQUE(league_id, name_canonical)`     | "Deportivo" en Liga Lunes ≠ Liga Martes                                         |

### 4.4 Pool de conexiones

El cliente de DB está en `src/db/index.ts` con singleton para dev y `max: 1` para producción serverless. **No instancies un Pool nuevo** en ningún otro archivo.

---

## 5. Normalización de texto — regla obligatoria

| Momento                 | Función                       | Resultado           |
| ----------------------- | ----------------------------- | ------------------- |
| Antes de insertar en DB | `sanitizeName(raw)`           | `"juan de la cruz"` |
| Al mostrar en UI        | `titleCase(stored)`           | `"Juan de la Cruz"` |
| Búsqueda en DB          | `f_unaccent() + similarity()` | fuzzy matching      |

```typescript
import { sanitizeName, titleCase } from "@/shared/lib/normalize";

await db.insert(players).values({ fullName: sanitizeName(rawInput) });
<span>{titleCase(player.fullName)}</span>
```

---

## 6. Autenticación

```typescript
// Server Components y Layouts
const user = await getSessionUser();

// API Route Handlers
const user = await getSessionUserFromRequest(request);

// Autorización de liga
if (!canManageLeague(user, league.adminId)) {
	return apiError("Sin permisos para esta liga", 403);
}
```

Roles: `owner` (ve todo) / `organizer` (solo sus ligas).

---

## 7. Responses de API

Siempre usar los helpers de `src/types/index.ts`. Nunca `Response.json()` directo.

```typescript
return apiSuccess(data); // 200 { ok: true, data }
return apiSuccess(data, 201); // 201 al crear
return apiSuccessPaginated(items, meta);
return apiError("mensaje", 400); // { ok: false, error }
return apiError("no encontrado", 404);
```

### 7.1 Naming de endpoints (REST)

```
GET    /api/[recurso]               → listar
POST   /api/[recurso]               → crear
GET    /api/[recurso]/[id]          → detalle
PATCH  /api/[recurso]/[id]          → actualizar parcialmente
DELETE /api/[recurso]/[id]          → eliminar
POST   /api/[recurso]/[accion]      → acción especial (ej: /merge, /confirm, /schedule)
```

### 7.2 Frontend — reglas de UI

- **Server Components por defecto** (§3.3). `"use client"` solo para estado/interacción.
- **Tailwind, sin CSS custom** salvo `globals.css`. Colores del sistema: `green-600` para acciones primarias, `gray-*` para neutros, `red-*` para destructivos. **Modo claro forzado** — panel administrativo, sin dark mode.
- **Formularios = React Hook Form + `zodResolver`** (`@hookform/resolvers`). Stack estándar del proyecto (2026): cada formulario se cablea a un **Zod schema único** que vive en `model/*-form-schema.ts` (client-safe, sin imports de `@/db`) y que **también** valida el API route con `safeParse`. Define la validación una vez, infiere los tipos de ahí. Inputs no-controlados (cero `useState`-soup); valores no estándar (chips, pickers) vía `Controller`. El server sigue siendo la fuente de verdad y la UI siempre muestra el error de la API. No usar formik ni validación a mano con `useState`.
- **Estado-de-servidor = TanStack Query** (`@tanstack/react-query`). Lecturas y mutaciones a rutas internas se hacen con `useQuery`/`useMutation` (caché, `isPending`/`isError`, invalidación), envueltos en hooks por feature en `model/` (p. ej. `useCreateLeague`). No reinventar loading/error con `useState`. El `QueryClientProvider` se monta una vez en `RootLayout`.
- **Tablas/grids con muchos datos = TanStack Table** (`@tanstack/react-table`, ya instalado) — headless, para orden/filtro/paginación.
- **Peticiones internas desde el cliente:** siempre `apiFetch<T>` de `@/shared/api/client` (es el transporte dentro de los `queryFn`/`mutationFn`), nunca `fetch()` desnudo (serializa el body, respeta el error del backend, devuelve `ApiResult<T>` tipado). Para Server Components que llaman rutas internas, usar `serverFetch` de `@/shared/lib/server-fetch`.
- **Nunca llames `setState` síncronamente dentro de un `useEffect`.** Dispara renders en cascada y rompe el lint de React (`react-hooks/set-state-in-effect`). En su lugar:
  - Para **inicializar estado** desde una fuente externa (localStorage, props calculadas), usa el **lazy initializer** de `useState`: `useState(() => leerValorInicial())`, con guarda `typeof window === "undefined"` para SSR. No restaures con `setState` en un efecto.
  - Para **derivar** un valor de otros estados/props, **calcúlalo durante el render** (o `useMemo`), no con un efecto + `setState`.
  - Reserva `useEffect` para sincronizar con sistemas externos (escribir a localStorage, suscripciones, DOM). Llamar `setState` solo dentro de un **callback** de evento o de suscripción, nunca en el cuerpo del efecto.
  - Referencia: https://react.dev/learn/you-might-not-need-an-effect

### 7.2b Feedback obligatorio en toda mutación (regla no negociable)

**Toda acción que guarda, actualiza, elimina o crea algo — sin excepción — debe mostrarle feedback al usuario.** Nunca una mutación silenciosa: ni éxito mudo ni error tragado.

- **Transporte:** `notify` de `@/shared/lib/notify` (`notify.success(...)` / `notify.error(...)`). Nadie importa `sileo` directamente (§ nota en `shared/lib/notify/index.ts`).
- **Éxito:** todo `onSuccess` de un `useMutation` (o equivalente) llama `notify.success("...")` con un mensaje concreto ("Reglamento guardado", "Equipo eliminado" — no "Listo" genérico si hay contexto mejor).
- **Error:** todo `onError` / rama `!ok` llama `notify.error(...)` con el mensaje que vino del backend (`res.error`) cuando exista, no un genérico que oculte la causa.
- Mensajes inline en la propia UI (ej. un `<p>` de error bajo un botón) **no sustituyen** el toast — pueden coexistir, pero el toast es obligatorio porque el usuario puede no tener el ojo puesto ahí cuando la mutación resuelve.
- Aplica también a acciones fuera de TanStack Query (server actions, `fetch` directo en un handler) — mismo criterio: si cambia estado en el servidor, el usuario se entera.

### 7.3 Datos del frontend — 5 capas y caché (contrato)

> Detalle, racional y plan de migración en `docs/FRONTEND-DATA-STRATEGY.md`. Esto es el contrato corto.

Toda lectura/mutación a rutas internas pasa por estas capas; cada una es testeable por separado:

```
apiFetch/serverFetch (transporte) → entities (DTO) → lib/map-*.ts (mapper) → model/use*.ts (hooks RQ) → ui/*.tsx (componente tonto)
```

- **El componente es tonto.** Recibe **ViewModels + callbacks por props**. Cero `fetch`, cero mapeo, cero regla de negocio en la UI. Si un componente arma datos o decide reglas, está mal: muévelo al mapper o al hook.
- **El mapper es el único puente DTO → ViewModel** (§19) y donde vive la lógica de negocio/formateo. Puro, en `lib/map-*.ts`, con test unitario.
- **Los hooks RQ son dueños de la caché.** La key SIEMPRE sale de la fábrica central `@/shared/api/query-keys.ts` (`queryKeys.*`); prohibido armar el array a mano. `queryFn`/`mutationFn` usan `apiFetch` y devuelven ViewModels mapeados; en `!ok` hacen `throw new Error(res.error)`.
- **Invalidación explícita** tras cada mutación con `queryClient.invalidateQueries`, según el mapa de invalidación (ver doc y comentario de `query-keys.ts`). No usar `router.refresh()` para refrescar datos de una query.
- **Patrón SSR→props:** el Server Component baja el DTO mapeado como `initialData` del hook; el cliente invalida puntualmente en vez de recargar la ruta.

### 7.4 El tipo de respuesta es un DTO nombrado en `entities/` — nunca inline ni exportado desde el route

El genérico `T` de `apiFetch<T>` y el `data` que el route pasa a `apiSuccess(data)` son **el mismo contrato** y deben salir de **un solo tipo nombrado que vive en `entities/[recurso]`** (inferido con `$inferSelect` §4.1, o un `z.infer` de un schema en el módulo de la entidad). Define el tipo una vez; el route lo importa para tipar su salida y el callsite lo importa para el genérico.

```typescript
// entities/league/model.ts — fuente única del contrato
export const CreateLeagueResponseSchema = z.object({ id: z.string().uuid() });
export type CreateLeagueResponse = z.infer<typeof CreateLeagueResponseSchema>;

// app/api/leagues/route.ts (capa app) — importa de entities, valida la salida
import { type CreateLeagueResponse } from "@/entities/league";
return apiSuccess<CreateLeagueResponse>({ id: league.id });

// features/league-onboarding/model/useCreateLeague.ts (capa features) — mismo tipo
import { type CreateLeagueResponse } from "@/entities/league";
const res = await apiFetch<CreateLeagueResponse>("/api/leagues", { ... });
```

- **Prohibido `apiFetch<{ ... }>` inline** y prohibido re-declarar el shape a mano en el callsite (§4.1). Si el tipo no existe, créalo en la entidad, no en el componente.
- **Prohibido exportar el tipo de respuesta desde `route.ts` e importarlo en una feature/entity:** eso es `features → app`, invierte la dependencia y **viola §3.1**. El contrato siempre baja de `entities`, capa que tanto `app` como `features` pueden importar.
- El DTO de `entities` es la entrada del mapper → `XView` (§19): no se consume crudo en la UI. Este §7.4 fija de dónde sale el DTO; §19 fija cómo se transforma para la UI.

---

## 8. Seguridad — reglas para el agente

### 8.1 Nunca introduzcas dependencias con CVEs conocidos

Antes de agregar una librería nueva, verifica que no tenga vulnerabilidades activas. El criterio del proyecto: no instalar paquetes con CVEs de severidad HIGH o CRITICAL sin fix disponible.

### 8.2 Si introduces una dep transitiva vulnerable, usa pnpm overrides

```jsonc
// package.json — override si el salto de versión es compatible
"pnpm": {
  "overrides": {
    "paquete-vulnerable": ">=version-con-fix"
  }
}
```

### 8.3 Si el fix no es compatible, documenta en .trivyignore

El archivo `.trivyignore` suprime CVEs con justificación explícita. **Toda entrada requiere un comentario** que explique por qué no se puede parchear y cuándo revisarlo.

```
# ✅ Válido
# GHSA-xxxxx: uuid@8 requerido por exceljs@4. Fix requiere uuid v14 (breaking).
# Revisar cuando exceljs soporte uuid >= 14.
GHSA-xxxxx

# ❌ Inválido — sin justificación
GHSA-yyyyy
```

Si agregas una entrada sin comentario, el PR será rechazado.

### 8.4 Nunca hardcodees secretos

Las variables `SESSION_SECRET`, `DATABASE_URL`, `SETUP_SECRET` solo existen en `.env.local` (ignorado por git). Si necesitas un valor de configuración nuevo, agrégalo a las variables de entorno y documéntalo en el README (§7).

### 8.5 Historial de decisiones de seguridad del proyecto

| Decisión                         | Motivo                                                                |
| -------------------------------- | --------------------------------------------------------------------- |
| `exceljs` reemplazó a `xlsx`     | CVEs de alta severidad en `xlsx` sin parche                           |
| `uuid@8` en `.trivyignore`       | Transitiva de `exceljs`. Fix (uuid v14) es incompatible con exceljs@4 |
| Sesiones HMAC propias            | Control total del token, sin deps adicionales                         |
| `postcss` pinneado via overrides | CVE en versiones < 8.5.10                                             |

---

## 9. Convenciones de naming

| Elemento             | Convención                   | Ejemplo                  |
| -------------------- | ---------------------------- | ------------------------ |
| Archivos de lógica   | `kebab-case`                 | `assign-cedula.ts`       |
| Componentes React    | `PascalCase`                 | `SorteoCockpit.tsx`      |
| Funciones exportadas | `camelCase`                  | `registerPlayer()`       |
| Schemas Zod y tipos  | `PascalCase`                 | `CreateLeagueSchema`     |
| Rutas API            | `kebab-case`                 | `/api/top-scorers`       |
| Columnas DB          | `snake_case`                 | `full_name`, `league_id` |
| Ramas git            | `feat/*`, `fix/*`, `chore/*` | `feat/player-profile`    |

---

## 10. Deuda técnica — `src/lib/` (legacy)

`src/lib/` es código en producción activo. No lo elimines, pero tampoco crees funciones nuevas ahí. Si tocas un archivo de `src/lib/`, migralo a FSD en ese mismo commit.

| Archivo legacy     | Destino FSD                              |
| ------------------ | ---------------------------------------- |
| `lib/narrator.ts`  | `features/narrator-analysis/analysis.ts` |
| `lib/standings.ts` | `features/standings/calculate.ts`        |
| `lib/stats.ts`     | `features/player-stats/aggregate.ts`     |
| `lib/preview.ts`   | `features/match-preview/build.ts`        |

---

## 11. Lo que nunca debes hacer

- **No instales librerías nuevas** sin justificación explícita
- **No uses `console.log`** en producción — solo `console.error` para errores reales en el server
- **No uses `sql.raw()`** salvo que Drizzle no soporte la operación
- **No uses Redux, Zustand** ni estado global — no hay necesidad
- **No uses react-hook-form ni formik**
- **No uses `fetch()` directamente en Client Components** — siempre `apiFetch<T>` de `@/shared/api/client` (serializa body, respeta errores del backend, devuelve `ApiResult<T>` tipado)
- **No hagas queries a la DB** desde componentes de presentación
- **No dupliques tipos** si Zod puede inferirlos
- **No uses CSS custom** cuando Tailwind lo puede hacer
- **No agregues entradas a `.trivyignore` sin comentario** de justificación
- **No escribas `try/catch` vacíos** ni silencies errores (§18.4)
- **No consumas el DTO crudo en la UI** en código nuevo — pasa por un mapper a `XView` (§19)
- **No entregues código nuevo sin pruebas** (componentes con lógica, hooks, mappers y funciones puras, §20)

---

## 12. Checklist antes de hacer commit

**General**

- [ ] ¿El código nuevo sigue la jerarquía FSD?
- [ ] ¿Los nombres que se insertan en DB pasan por `sanitizeName()` / `sanitizeToCanonical()`?
- [ ] ¿Los API routes solo validan + llaman feature/entity + responden?
- [ ] ¿Usé `apiSuccess` / `apiError` en lugar de `Response.json()` directo?
- [ ] ¿Si el componente es Client y hace una petición interna, usé `apiFetch<T>` en vez de `fetch()` desnudo?
- [ ] ¿Los tipos de DB se infieren con `$inferSelect` / `$inferInsert`?
- [ ] ¿No agregué `any` ni `as SomeType` sin documentar por qué?
- [ ] ¿Las transacciones están en `features/`, no en `route.ts`?
- [ ] ¿Si toqué algo en `src/lib/`, lo migré a FSD?
- [ ] ¿Las nuevas dependencias no tienen CVEs HIGH/CRITICAL sin fix?
- [ ] ¿Si agregué algo a `.trivyignore`, tiene comentario de justificación?
- [ ] ¿Toda mutación (guardar/actualizar/eliminar/crear) muestra `notify.success`/`notify.error` al usuario? (§7.2b)
- [ ] ¿Usé early returns y me mantuve en ≤ 3 niveles de indentación? (§18.1–18.2)
- [ ] ¿Todo `try/catch` maneja o re-propaga el error explícitamente? (§18.4)
- [ ] ¿El código nuevo expone `XView` a la UI vía mapper, no el DTO crudo? (§19)
- [ ] ¿Agregué pruebas (Vitest + Testing Library) cubriendo loading/error/nulos/edge cases? (§20)

**Identidad global (si el feature toca V2)**

- [ ] ¿El `curp_hash` se calcula solo en el servidor con `sha256()`?
- [ ] ¿El registro de jugador es una transacción atómica (`global_player` + `league_member` + `inscription`)?
- [ ] ¿Las queries de `league_members` NO exponen `internal_notes` ni `institution_photo_url` fuera de su liga?
- [ ] ¿Consulté existencia por `curp_hash` antes del insert (no solo confío en el constraint)?
- [ ] ¿El flujo de registro tiene hard stop si no hay CURP real?

---

## 13. Contexto de dominio — cosas que no son obvias

### Identidad global (lo más importante)

- **`global_players` es la fuente de verdad permanente**. Una vez que un jugador tiene un `curp_hash` real, ese registro no se modifica salvo superadmin con justificación.
- **`curp_hash` nunca se calcula en el cliente**. El CURP en texto plano llega al server, se hashea con `sha256()`, y solo el hash toca la DB.
- **Jugadores migrados del sistema viejo** reciben `curp_hash = sha256("PENDING_" + id)` como dummy. Se regularizan orgánicamente cuando el jugador aparece en ventanilla con INE.
- **El sistema funciona con ambos estados en paralelo**. Un jugador puede ser "PENDING" en `global_players` y seguir apareciendo en stats. No bloquear nada por tener dummy CURPs.

### Modelo de liga e inscripción (V2)

- **Liga = torneo**. No existe tabla `tournaments`. El scope de unicidad de `inscriptions` está dado por `league_member_id`, que ya está scoped a `league_id`.
- **`league_members` es la capa de la institución**. Cada liga tiene su vista privada del jugador: `internal_notes`, `institution_photo_url`. Una liga no puede leer esos campos de otra liga (enforced en queries, no en schema).
- **Un jugador, un equipo por liga**. `UNIQUE(league_member_id)` en `inscriptions`. Para mover a un jugador de equipo, actualizar el registro existente.

### Coexistencia V1 / V2

- **Dos sistemas de identidad viven juntos**. V1: `players` + `player_registrations`. V2: `global_players` + `league_members` + `inscriptions`. No mezclar en queries.
- **Stats tienen dos fuentes**. `player_season_stats` (Excel, histórico de solo-lectura, prioridad 1) y `match_events` (partido a partido, prioridad 2 / fallback). Un jugador puede tener stats de ambas fuentes en ligas distintas — el perfil las muestra correctamente por fuente.

### Otros

- **Liga ≠ equipo**. Siempre filtrar por `league_id` cuando trabajes con equipos.
- **Snapshots son acumulados**. Para goles en jornada 5: `J5.goals − J4.goals`.
- **El narrador es un usuario clave** y nuestro evangelizador interno. `/admin/analisis` y `/api/narrator` son features críticas usadas en vivo.
- **El organizador es la puerta, el jugador es el motor**. El viral loop empieza por el jugador presumiendo sus stats; el organizador adopta porque sus jugadores presionan.
- **El cierre de jornada es el evento clave** — la generación de contenido (píldoras, imágenes) se dispara tras capturar y cerrar la jornada en-app vía cédula. (Antes dependía de la importación bulk de Excel, ya eliminada.)
- **Ciudades están predefinidas** en `shared/lib/cities.ts`. No hardcodees ciudades.
- **`jornada` es un integer de negocio**, no una fecha — representa la ronda de la liga.

---

## 14. Identidad global de jugadores — reglas no negociables

> Ver `docs/player-identity-admin-ecosystem.md` para el diseño completo.

### El modelo de datos V2

```
global_players          ← identidad pura, inmutable post-registro
    ↓ (1:N)
league_members          ← jugador dentro de una liga específica
    ↓ (1:1)
inscriptions            ← equipo asignado dentro de esa liga
```

### Reglas del CURP hash

- `sha256(CURP)` solo se calcula en el servidor, nunca en el cliente.
- `curp_hash` es `NOT NULL UNIQUE` en `global_players`. Sin excepciones.
- Jugadores migrados: `sha256("PENDING_" + old_player_id)`. No bloquear el sistema por esto.
- Una vez asignado un hash real, no puede regresar a dummy.

### Flujo de registro (Terminal de Alta Velocidad)

```
CURP (18 chars) → hash en server → buscar en global_players
   ├─ Encontrado  → confirmar identidad → seleccionar liga + equipo
   └─ No encontrado → formulario (nombre + fecha_nacimiento + foto?)
                      → transacción atómica: global_player + league_member + inscription
```

**Hard stops de negocio:**

- Adultos: sin INE, no hay registro.
- Menores: padre/tutor trae CURP del menor.
- Sin CURP real = sin registro. No hay excepciones en este flujo.

### Transacción atómica del registro

```typescript
// features/admin-registration/register.ts ✅
export async function registerPlayer(data: RegistrationInput) {
	return db.transaction(async (tx) => {
		const player = await tx
			.insert(globalPlayers)
			.values({ curpHash, fullName, birthDate })
			.returning();
		const member = await tx
			.insert(leagueMembers)
			.values({ globalPlayerId: player.id, leagueId, status: "active" })
			.returning();
		await tx.insert(inscriptions).values({ leagueMemberId: member.id, teamId });
	});
}
```

### Data siloing

`internal_notes` e `institution_photo_url` de `league_members` son privados por liga. Nunca exponerlos en queries que devuelvan datos de múltiples ligas. Esto se enforza en el código de queries, no en el schema.

---

## 15. Migraciones de base de datos — reglas no negociables

> **FALLA CRÍTICA** romper cualquiera de estas reglas. No hay excepciones.

### Filosofía

Las migraciones son **registros históricos inmutables**. Una vez que un archivo de migración ha sido commiteado, pusheado o aplicado a cualquier entorno compartido, staging o producción:

- **NUNCA** editarlo
- **NUNCA** renombrarlo
- **NUNCA** reordenarlo
- **NUNCA** eliminarlo
- **NUNCA** regenerarlo
- **NUNCA** cambiar su SQL
- **NUNCA** modificar snapshots ni meta history anteriores

Todo cambio de schema **DEBE** hacerse mediante migraciones nuevas, append-only.

### Workflow obligatorio

Para CUALQUIER cambio de schema:

1. Modificar únicamente los archivos de schema de Drizzle
2. Generar una NUEVA migración
3. Aplicar la migración
4. Nunca tocar migraciones previas

**Permitido:**

- Crear nueva migración
- Agregar columnas nuevas
- Crear tablas nuevas
- Agregar índices o constraints
- Crear data migrations
- Crear views/functions/triggers vía nueva migración

**Prohibido:**

- Editar SQL de migración anterior
- Mergear migraciones
- Squash sin instrucción explícita del dev
- Cambiar hashes históricos
- Eliminar historial de migraciones
- Modificar `_journal.json`
- Editar manualmente snapshots de Drizzle
- Regenerar migraciones baseline en entornos existentes

### Seguridad antes de generar

Antes de generar cualquier migración:

- Inspeccionar las migraciones existentes
- Preservar el orden de migraciones
- Asegurarse de que el número/tag de la nueva migración es único
- Verificar que ninguna migración anterior fue modificada

Si las migraciones existentes parecen inconsistentes: **DETENER**, explicar el problema, **NO auto-corregir reescribiendo el historial**.

### Reglas de producción

**NUNCA** asumir que la base de datos es desechable. Jamás:

- Hacer `DROP SCHEMA`
- Hacer `TRUNCATE` en tablas de producción
- Resetear migraciones
- Recrear el historial de migraciones
- Eliminar `__drizzle_migrations`
- Ejecutar SQL destructivo

...salvo instrucción explícita y documentada del dev.

### Conexión para migraciones

Para correr migraciones usar **siempre** conexión directa a PostgreSQL.

```
# ✅ CORRECTO — conexión directa
db.<project>.supabase.co

# ❌ PROHIBIDO para migraciones — pooler/pgbouncer
pooler.supabase.com
```

### Baseline (onboarding de DB existente)

Si se incorpora una base de datos de producción existente:

- Crear **UNA** migración baseline limpia
- Marcarla como aplicada
- Continuar con migraciones append-only desde ahí

**NUNCA** crear múltiples migraciones baseline compitiendo.

### Manejo de errores y drift

Si ocurre alguna de estas situaciones:

- Tablas que ya existen
- Hashes de migraciones faltantes
- Historial de migraciones inconsistente
- Drift de schema detectado

**NO** reescribir migraciones antiguas, **NO** modificar el historial silenciosamente, **NO** auto-eliminar registros de migraciones.

En cambio:

1. Explicar la inconsistencia
2. Proponer migraciones correctivas append-only
3. Pedir confirmación antes de cualquier acción destructiva

### Checklist antes de cualquier migración

- [ ] ¿Revisé las migraciones existentes antes de generar?
- [ ] ¿La nueva migración tiene un número/tag único que no existe aún?
- [ ] ¿No modifiqué ningún archivo de migración anterior?
- [ ] ¿Usé conexión directa (no pooler) para aplicar?
- [ ] ¿Si hay inconsistencia, la reporté en lugar de auto-corregirla?
- [ ] ¿La migración es forward-only y no destruye datos existentes?

---

## 16. Módulo de sorteo — reglas para agentes

> Ver `docs/PRODUCT-STRATEGY.md §11` para el contexto de producto y `src/features/scheduling/README.md` para la arquitectura técnica detallada.

### Restricciones que nunca se pueden violar

- **S4** (sin duplicados en fase regular) se aplica en dos lugares: `validate-no-duplicates.ts` en runtime y el índice parcial `uq_regular_pair` en la DB. Ambos deben mantenerse sincronizados.
- **El seed siempre se guarda** en `leagueSchedulingConfig.lastSeed` al confirmar. Nunca confirmar sin persistir el seed.
- **BYE no es un partido**. Pairings con `awayTeamId === null` nunca se insertan en `matches`.
- **`isMakeup: true`** solo se pone en partidos generados por `build-makeup-matches.ts`. No mezclar con partidos regulares.

### Dónde vive cada responsabilidad

| Qué necesitas hacer                         | Archivo correcto                                    |
| ------------------------------------------- | --------------------------------------------------- |
| Cambiar el algoritmo de emparejamiento      | `pairing-generator/circle-method.ts`                |
| Cambiar cómo se aplican los descansos       | `pairing-generator/apply-rest-requests.ts`          |
| Cambiar la generación de slots              | `slot-assigner/build-slots.ts`                      |
| Cambiar la prioridad de asignación de slots | `slot-assigner/assign-greedy.ts`                    |
| Agregar un tipo nuevo de override           | `overrides/` + nuevo `changeType` en `CHANGE_TYPES` |
| Cambiar la lógica de déficit                | `makeup/detect-deficit.ts`                          |
| Cambiar qué se persiste al confirmar        | `app/api/leagues/[id]/schedule/confirm/route.ts`    |

### Reglas de contribución

- Las funciones de `pairing-generator/` y `slot-assigner/` son **puras** (sin imports de `@/db`). Si necesitas agregar una consulta, hazla en el endpoint o en una función entity separada y pasa el resultado como argumento.
- Todo override registra un snapshot en `match_schedule_overrides`. Si agregas un nuevo tipo de cambio, incluye siempre `previousValue` y `newValue`.
- Las jornadas makeup se numeran secuencialmente después de la última regular. No hardcodear números de jornada.
- El formato `"double"` (vuelta y vuelta) devuelve 400 hasta que se implemente el generador correspondiente. No eliminar esa validación silenciosamente.

---

## 17. Arquitectura de datos — "Thin Client, Smart Backend" (NO NEGOCIABLE)

Actúas como Senior Software Architect. Al escribir código, proponer soluciones o modificar features existentes, debes adherirte estrictamente al paradigma **"Thin Client, Smart Backend"**.

### 17.1 Responsabilidades del frontend (Thin Client)

El frontend debe ser lo más "tonto" posible. Sus **únicas** responsabilidades son:

- Gestión de estado de UI y renderizado
- Captura de input del usuario
- Formateo local si es estrictamente necesario (fechas, moneda)

**NUNCA** colocar lógica de negocio, manipulación pesada de datos, sorting o filtering de datasets grandes en el frontend, salvo que sea explícitamente requerido y justificado (ej. requisitos offline-first).

### 17.2 Responsabilidades del backend y base de datos (Smart Backend)

El backend (APIs, Server Actions, DB) maneja **toda** la lógica de negocio.

- **Fetching de datos:** Traer exactamente los datos que el cliente necesita, en la forma exacta en que los necesita. No over-fetching.
- **Filtering y sorting:** Deben hacerse a nivel de query de base de datos (cláusulas `WHERE` de PostgreSQL) o dentro de la capa de servicio del backend.
- **Diseño de endpoints:** Evitar "God APIs" que devuelven datasets masivos sin refinar. Crear endpoints de propósito específico o usar query parameters para acotar la entrega de datos.

### 17.3 Anti-patrones estrictos (PROHIBIDO)

**No hacer fetch de todos los registros para filtrarlos en memoria con JavaScript/TypeScript.**

```typescript
// 🚫 MAL — over-fetching y filtrado en memoria del cliente
const allLeagues = await getLeagues(city); // devuelve todo
const active = allLeagues.filter((l) => l.status !== "finished");
const finished = allLeagues.filter((l) => l.status === "finished");

// ✅ BIEN — filtrado a nivel de DB
// Opción A: queries/endpoints distintos
const activeLeagues = await getActiveLeagues(city);
const finishedLeagues = await getFinishedLeagues(city);

// Opción B: parámetro de query que ejecuta el WHERE en la DB
const activeLeagues = await getLeagues(city, { status: "active" });
const finishedLeagues = await getLeagues(city, { status: "finished" });
```

### 17.4 Proceso de decisión

Antes de escribir código que maneje datos, pregúntate en silencio:

1. ¿Esta lógica evalúa una regla de negocio? → Ponerla en el backend.
2. ¿Estoy transformando un array grande de datos? → Moverlo a la query de DB.
3. ¿Estoy descargando datos que el usuario no está viendo ahora mismo? → Refactorizar el endpoint.

Si debes poner lógica de negocio en el frontend, **debes** comenzar tu respuesta con una justificación breve explicando por qué rompe la arquitectura estándar y por qué es inevitable.

---

## 18. Clean Code estricto — patrones de diseño (refuerza §3.5)

§3.5 ya fija los límites de tamaño (componente ≤ 150, orquestador ≤ 80, función ≤ 20) y SRP. Estas reglas los complementan y son igual de inquebrantables.

### 18.1 Early returns — patrón Bouncer

Falla rápido. Las validaciones, guardas y casos base van **al principio** de la función. El "happy path" queda limpio y al final, sin anidar en `else`.

```typescript
// ✅ BIEN — guardas arriba, happy path plano
function buildPlayerView(member: LeagueMember | null): PlayerView | null {
	if (!member) return null;
	if (member.status !== "active") return null;
	return mapLeagueMemberToPlayerView(member);
}

// ❌ MAL — anidación de if/else, happy path enterrado
function buildPlayerView(member: LeagueMember | null) {
	if (member) {
		if (member.status === "active") {
			return mapLeagueMemberToPlayerView(member);
		} else {
			return null;
		}
	} else {
		return null;
	}
}
```

### 18.2 Máximo 2–3 niveles de indentación

Prohibido el "callback hell" y la anidación profunda. Si una función pasa de **3 niveles** de indentación, extrae la rama interna a una función con nombre. Esto trabaja en conjunto con los early returns (§18.1) y el límite de 20 líneas por función (§3.5).

### 18.3 Inmutabilidad por defecto

- `const` siempre. `let` solo si es estrictamente inevitable; `var` nunca.
- No mutar arrays, estados ni props. Usa spread / métodos funcionales (`map`, `filter`, `reduce`) en vez de `push`/`splice`/asignación in-place.
- Esto extiende "declarativo sobre imperativo" de §3.5.

```typescript
// ✅ BIEN
const activeMembers = members.filter((member) => member.status === "active");

// ❌ MAL — mutación
const activeMembers = [];
for (const member of members) {
	if (member.status === "active") activeMembers.push(member);
}
```

### 18.4 Manejo de errores predecible — Error Boundaries

- **Prohibido `try/catch` vacío** o que silencie el error. Si capturas, o lo manejas explícitamente o lo re-propagas.
- En React, usa **Error Boundaries** para que un fallo de render no tumbe toda la app; propaga el error hacia la UI con un estado de error claro (TanStack Query ya expone `isError`/`error`, §7.2).
- En el server solo `console.error` para errores reales (§11). Nunca tragues un error de DB o de validación.

```typescript
// ❌ MAL — error silenciado
try {
	await confirmSchedule(parsed);
} catch (caughtError) {
	// nada
}

// ✅ BIEN — manejo explícito y propagación
try {
	await confirmSchedule(parsed);
} catch (caughtError) {
	console.error("confirmSchedule failed", caughtError);
	return apiError("No se pudo confirmar el sorteo", 500);
}
```

---

## 19. Límite API ↔ UI — mapper DTO → ViewModel (código nuevo)

Regla para **features y lecturas nuevas** (no obliga a migrar lo existente, pero todo código nuevo la cumple sin excepción):

- Cada lectura de la API/DB pasa por un **mapper puro** que convierte el DTO/entidad cruda en un **ViewModel** orientado a la UI (`mapLeagueMemberToPlayerView`, `mapMatchDtoToMatchView`).
- Los componentes consumen **exclusivamente el `XView`**, nunca el DTO crudo ni la entidad de Drizzle directamente.
- El mapper es donde aplicas `titleCase()` (§5), formateos de fecha/moneda y el data siloing (§14) — así el ViewModel jamás carga campos privados (`internal_notes`, `institution_photo_url`).

```typescript
// features/player-profile/lib/map-player-view.ts ✅ función pura, testeable
import { titleCase } from "@/shared/lib/normalize";

export function mapLeagueMemberToPlayerView(member: LeagueMember): PlayerView {
	return {
		id: member.id,
		displayName: titleCase(member.fullName),
		teamName: member.team ? titleCase(member.team.name) : null,
		// NO se exponen internal_notes ni institution_photo_url
	};
}
```

**Dónde vive:** el mapper en `features/[nombre]/lib/map-*.ts` (puro, sin imports de `@/db`); el tipo `XView` en `features/[nombre]/types.ts`. Esto encaja con "Thin Client, Smart Backend" (§17): el backend entrega el DTO acotado, el mapper le da la forma exacta que la UI consume. No reintroduce lógica de negocio en el cliente — el mapper solo transforma forma, no calcula reglas.

> Coherencia con §4.1: los tipos de DB se siguen infiriendo con `$inferSelect`. El DTO es esa entidad inferida; el `XView` es un tipo nuevo de la feature. No dupliques tipos de DB a mano.

---

## 20. Testing estricto — obligatorio

> El código **no está completo sin sus pruebas**. Stack del proyecto: **Vitest** + **@testing-library/react** + `jsdom` (unit/componente) y **Playwright** (e2e). No introducir Jest ni otro runner.

### 20.1 Qué debe llevar prueba

- **Componentes** con lógica condicional o estados (loading/error/empty) → test con Testing Library.
- **Custom Hooks** (`model/use*.ts`) → test de comportamiento (no de implementación).
- **Mappers** (§19) y **funciones puras** de `lib/` → test unitario directo (entrada → salida).

### 20.2 Cobertura de casos, no solo el happy path

Prueba explícitamente: estados de carga, estados de error, valores nulos/vacíos y edge cases (jornada 0, roster vacío, CURP dummy `PENDING_*`, walkover/forfeit). Un test que solo cubre el happy path se considera incompleto.

### 20.3 Mocks estrictos

Aísla la unidad: mockea `apiFetch`/`serverFetch`, rutas de Next y dependencias externas para evitar tests frágiles. Nunca pegues a la DB real ni a la red en pruebas unitarias.

### 20.4 Ubicación y naming

- Co-locado con el archivo: `use-team-roster.test.ts`, `map-player-view.test.ts`, `PlayerCard.test.tsx`. El harness (`vitest.config.ts`) colecta los co-localizados (`src/**/*.test.{ts,tsx}`), no solo los de `__tests__/`.
- `.test.tsx` para componentes/hooks; `.test.ts` para mappers/utils.
- **Entorno por defecto = `node`** (rápido, para tests puros). Los tests que tocan DOM (hooks con `renderHook`, componentes con RTL) declaran su entorno por archivo en la primera línea: `// @vitest-environment jsdom`.
- **Hooks de Query:** usar `createQueryWrapper()` de `@/shared/test/react-query` y mockear `@/shared/api/client` (única costura de red). Ver `features/team-management/model/useLeagueTeams.test.tsx` como plantilla.

```typescript
// features/player-profile/lib/map-player-view.test.ts
import { describe, it, expect } from "vitest";
import { mapLeagueMemberToPlayerView } from "./map-player-view";

describe("mapLeagueMemberToPlayerView", () => {
	it("aplica titleCase al nombre", () => {
		const view = mapLeagueMemberToPlayerView(buildMember({ fullName: "juan de la cruz" }));
		expect(view.displayName).toBe("Juan de la Cruz");
	});

	it("no expone campos privados de la liga", () => {
		const view = mapLeagueMemberToPlayerView(buildMember({ internalNotes: "secreto" }));
		expect(view).not.toHaveProperty("internalNotes");
	});

	it("teamName es null cuando no hay equipo asignado", () => {
		const view = mapLeagueMemberToPlayerView(buildMember({ team: null }));
		expect(view.teamName).toBeNull();
	});
});
```
