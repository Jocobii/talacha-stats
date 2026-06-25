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

### Dos flujos paralelos de datos (coexisten hasta v3)

| Flujo  | Descripción                                        | Tablas escritas                                                                     |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **V1** | Excel semanal → importación bulk → stats           | `players`, `player_registrations`, `player_season_stats`                            |
| **V2** | Registro CURP + gestión en-app (cédulas, jornadas) | `global_players`, `league_members`, `inscriptions`, `matches`, `match_player_stats` |

**Regla de routing entre flujos:**

- Feature toca stats importadas de Excel → tablas V1
- Feature toca registro de identidad, inscripción o captura en-app (cédula de partido) → tablas V2
- Feature toca ambas → prioridad de stats: `player_season_stats` (Excel) > `match_player_stats` / `match_events` (partido a partido)

No eliminar tablas V1 hasta confirmar que todas las ligas migradas usan el flujo V2.

---

## 1.5 Posicionamiento del producto — leer antes de proponer features

TalachaStats es una **plataforma de gestión de ligas + capa de identidad y contenido para fútbol amateur local**. El diferenciador central NO es la gestión en sí misma (eso lo hacen muchos): es que **toda la operación desemboca en identidad global de jugador (anclada al CURP) y en contenido presumible**. Conforme más ligas de la ciudad adopten la plataforma, la calidad del dato mejora sola — un jugador verificado con CURP real es incorruptible.

Cambio de estrategia (2026): **ahora sí construimos gestión de liga completa** — sorteo/calendario, canchas, cédulas de partido, liguilla. Lo hacemos porque capturar el dato en-app (en vez de depender solo del Excel del organizador) hace el dato más rico, más en tiempo real y más apto para generar contenido e identidad. Pero la gestión es el **medio**, no el producto. El producto sigue siendo el ego del jugador y el contenido del organizador.

Lo que construimos, en capas (todas activas hoy en alguna medida):

1. **Identidad global de jugador** — `global_players` con CURP hash. La fundación. Sin esto, todo lo demás es frágil.
2. **Gestión de la liga** — ligas, equipos, jugadores, jornadas, sorteo/calendario, canchas, cédulas de partido, liguilla. Captura el dato estructurado.
3. **Identidad de la liga** — página pública con branding, perfiles de jugador, tabla, goleadores, jornadas.
4. **Generación de contenido** post-jornada/post-importación (píldoras del narrador, imágenes para WhatsApp/Facebook, stories del org-hub, assets para compartir).
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
- **`import-excel`** — Importación bulk del corte semanal (ExcelJS). Incluye `column-mapper`, `anomaly-detector`, `matching` (fuzzy de nombres) y `confirm` (transacción). Escribe stats V1.

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
❌  entities/player/queries.ts  →  features/import-excel/
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
export function ImportWizard() {
  const [step, setStep] = useState("upload");
  ...
}
```

### 3.4 Transacciones en features, no en routes ni en queries

```typescript
// features/import-excel/confirm.ts ✅
export async function confirmImport(data: ParsedImport) {
  return db.transaction(async (tx) => {
    await tx.insert(players).values(...);
    await tx.insert(playerSeasonStats).values(...);
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

#### Tablas V1 — Excel / legacy

| Tabla                          | Constraint                              | Regla práctica                                                          |
| ------------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `player_registrations`         | `UNIQUE(player_id, league_id)`          | Un jugador, un equipo por liga. Eliminar registro anterior para moverlo |
| `player_season_stats`          | `UNIQUE(player_id, league_id)`          | Siempre upsert, nunca insert directo                                    |
| `player_season_stats_snapshot` | `UNIQUE(player_id, league_id, jornada)` | Re-importar la misma jornada sobreescribe                               |
| `team_standings_snapshot`      | `UNIQUE(team_id, league_id, jornada)`   | Ídem                                                                    |
| `teams`                        | `UNIQUE(league_id, name_canonical)`     | "Deportivo" en Liga Lunes ≠ Liga Martes                                 |

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
- **Sin librerías de formularios** (react-hook-form, formik). El proyecto es suficientemente simple: validar en cliente para feedback inmediato, validar en server como fuente de verdad, y siempre mostrar el error de la API en la UI.
- **Peticiones internas desde el cliente:** siempre `apiFetch<T>` de `@/shared/api/client`, nunca `fetch()` desnudo (serializa el body, respeta el error del backend, devuelve `ApiResult<T>` tipado). Para Server Components que llaman rutas internas, usar `serverFetch` de `@/shared/lib/server-fetch`.

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
| Archivos de lógica   | `kebab-case`                 | `excel-import-bulk.ts`   |
| Componentes React    | `PascalCase`                 | `ImportWizard.tsx`       |
| Funciones exportadas | `camelCase`                  | `confirmBulkImport()`    |
| Schemas Zod y tipos  | `PascalCase`                 | `CreateLeagueSchema`     |
| Rutas API            | `kebab-case`                 | `/api/top-scorers`       |
| Columnas DB          | `snake_case`                 | `full_name`, `league_id` |
| Ramas git            | `feat/*`, `fix/*`, `chore/*` | `feat/player-profile`    |

---

## 10. Deuda técnica — `src/lib/` (legacy)

`src/lib/` es código en producción activo. No lo elimines, pero tampoco crees funciones nuevas ahí. Si tocas un archivo de `src/lib/`, migralo a FSD en ese mismo commit.

| Archivo legacy             | Destino FSD                              |
| -------------------------- | ---------------------------------------- |
| `lib/excel-import-bulk.ts` | `features/import-excel/bulk.ts`          |
| `lib/excel-import.ts`      | `features/import-excel/events.ts`        |
| `lib/narrator.ts`          | `features/narrator-analysis/analysis.ts` |
| `lib/standings.ts`         | `features/standings/calculate.ts`        |
| `lib/stats.ts`             | `features/player-stats/aggregate.ts`     |
| `lib/preview.ts`           | `features/match-preview/build.ts`        |

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
- **Stats tienen dos fuentes**. `player_season_stats` (Excel, prioridad 1) y `match_events` (partido a partido, prioridad 2 / fallback). Un jugador puede tener stats de ambas fuentes en ligas distintas — el perfil las muestra correctamente por fuente.

### Otros

- **Liga ≠ equipo**. Siempre filtrar por `league_id` cuando trabajes con equipos.
- **Snapshots son acumulados**. Para goles en jornada 5: `J5.goals − J4.goals`.
- **El narrador es un usuario clave** y nuestro evangelizador interno. `/admin/analisis` y `/api/narrator` son features críticas usadas en vivo.
- **El organizador es la puerta, el jugador es el motor**. El viral loop empieza por el jugador presumiendo sus stats; el organizador adopta porque sus jugadores presionan.
- **El "corte semanal" (lun/mar) es el evento clave** — toda la generación de contenido se dispara después de la importación bulk.
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
