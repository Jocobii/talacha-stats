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

TalachaStats es una plataforma web para estadísticas de fútbol amateur en México. Tiene dos caras:

- **Pública** (`/`, `/ranking`, `/player/[id]`, etc.) — jugadores ven sus stats y perfil
- **Admin** (`/admin/*`) — organizadores importan datos; el narrador del Facebook Live consulta análisis pre-partido

El flujo de datos central es: **Excel semanal → importación bulk → stats disponibles en la plataforma**. La mayoría de las features de escritura pasan por este pipeline.

---

## 2. Stack — versiones exactas

No asumas versiones de tus datos de entrenamiento. Las versiones reales son:

| Paquete | Versión | Notas críticas |
|---|---|---|
| `next` | **16.x** | App Router obligatorio. Pages Router no existe en este proyecto |
| `react` | **19.x** | Nuevas APIs de concurrencia disponibles |
| `drizzle-orm` | **0.45.x** | API relacional: `db.query.*` para reads con joins |
| `zod` | **4.x** | Breaking changes vs. Zod 3 — sintaxis puede diferir de tu training data |
| `tailwindcss` | **4.x** | Breaking changes vs. v3 — nueva config, nueva sintaxis de plugins |
| `typescript` | **5.x** | `strict: true` obligatorio |

Si necesitas saber qué hace una API específica de estas librerías, revisa `node_modules/[paquete]/README.md` o los tipos en `node_modules/[paquete]/dist/` antes de asumir.

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
✅  features/narrator-analysis/export-pdf.ts  →  lib/narrator.ts (legacy, ver §10)
❌  entities/player/queries.ts  →  features/import-excel/
❌  shared/lib/normalize.ts  →  entities/player/
❌  features/standings/  →  features/narrator-analysis/
```

Si necesitas compartir lógica entre dos features, extráela a `entities/` o `shared/lib/`.

### 3.2 API Routes = controladores delgados

Un `route.ts` hace exactamente tres cosas y nada más:

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

// ❌ INCORRECTO — nunca pongas lógica de negocio en un route
export async function GET(request: Request) {
  const rows = await db.query.matches.findMany({ ... });
  const standings = rows.reduce((acc, m) => { /* cálculo complejo */ }, {});
  return Response.json(standings);
}
```

### 3.3 Server Components por defecto

Cada página es Server Component hasta que necesite estado interactivo. Solo entonces se agrega `"use client"`.

```typescript
// ✅ Page que muestra datos → Server Component (sin "use client")
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

---

## 4. Base de datos

### 4.1 Dónde está el schema

Todo el schema vive en `src/db/schema.ts`. Es la fuente de verdad — los tipos de DB se infieren de ahí con `$inferSelect` y `$inferInsert`. No crees tipos de DB a mano.

```typescript
// ✅ Tipos inferidos desde el schema
export type Player    = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

// ❌ No duplicar manualmente
type Player = { id: string; fullName: string; ... }
```

### 4.2 Cómo hacer queries

```typescript
// Reads con joins → API relacional de Drizzle
const result = await db.query.players.findMany({
  with: { registrations: { with: { team: true } } },
  where: eq(players.id, playerId),
});

// Escrituras y queries complejas → builders
await db.insert(playerSeasonStats).values(data).onConflictDoUpdate({
  target: [playerSeasonStats.playerId, playerSeasonStats.leagueId],
  set: { goals: data.goals, updatedAt: new Date() },
});

// sql.raw() solo para operaciones que Drizzle no soporta — documentar por qué
```

### 4.3 Constraints clave que debes respetar

| Tabla | Constraint | Significado práctico |
|---|---|---|
| `player_registrations` | `UNIQUE(player_id, league_id)` | Un jugador solo puede estar en un equipo por liga. Si necesitas moverlo, primero elimina el registro anterior |
| `player_season_stats` | `UNIQUE(player_id, league_id)` | Una fila de stats por jugador por liga. Siempre hacer upsert, nunca insert directo |
| `player_season_stats_snapshot` | `UNIQUE(player_id, league_id, jornada)` | Una snapshot por jornada. Re-importar la misma jornada sobreescribe, no duplica |
| `team_standings_snapshot` | `UNIQUE(team_id, league_id, jornada)` | Ídem para standings |
| `teams` | scoped a `league_id` | "Deportivo" en Liga Lunes ≠ "Deportivo" en Liga Martes. Son entidades distintas |

### 4.4 Pool de conexiones

El cliente de DB está en `src/db/index.ts`. Ya tiene el singleton pattern para dev y `max: 1` para producción serverless (Supabase pooler). **No instancies un Pool nuevo** en ningún otro archivo.

---

## 5. Normalización de texto — regla obligatoria

Todo campo de texto buscable (nombres de jugadores, equipos, ligas) sigue este ciclo:

| Momento | Función | Resultado |
|---|---|---|
| Antes de insertar en DB | `sanitizeName(raw)` | `"juan de la cruz"` — lowercase, sin espacios extra |
| Al mostrar en UI | `titleCase(stored)` | `"Juan de la Cruz"` — capitalizado respetando partículas |
| Búsqueda en DB | `f_unaccent() + similarity()` | fuzzy matching en PostgreSQL |

**Si escribes código que inserta nombres en la DB sin pasar por `sanitizeName()`, está mal.**

```typescript
import { sanitizeName, titleCase } from "@/shared/lib/normalize";

// Al guardar
await db.insert(players).values({ fullName: sanitizeName(rawInput) });

// Al mostrar
<span>{titleCase(player.fullName)}</span>
```

---

## 6. Autenticación

### 6.1 Cómo leer la sesión

```typescript
// En Server Components y Layouts
import { getSessionUser } from "@/shared/lib/auth";
const user = await getSessionUser(); // null si no hay sesión

// En API Route Handlers
import { getSessionUserFromRequest } from "@/shared/lib/auth";
const user = await getSessionUserFromRequest(request); // null si no hay sesión
```

### 6.2 Roles

```typescript
type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "organizer";
};

// owner    → ve y edita todo, gestiona usuarios
// organizer → solo sus ligas (verificar con canManageLeague())
```

### 6.3 Autorización de liga

```typescript
import { canManageLeague } from "@/shared/lib/auth";

if (!canManageLeague(user, league.adminId)) {
  return apiError("Sin permisos para esta liga", 403);
}
```

### 6.4 Lo que NO debes hacer

- No uses `cookies()` directamente en API routes — usa `getSessionUserFromRequest(request)`
- No implementes tu propio sistema de tokens — usa `signSession` / `verifySession` de `shared/lib/session.ts`
- No hardcodees roles en lógica de negocio — usa `user.role === "owner"` o `canManageLeague()`

---

## 7. Responses de API

Siempre usar los helpers de `src/types/index.ts`. Nunca `Response.json()` directo.

```typescript
import { apiSuccess, apiSuccessPaginated, apiError } from "@/types";

return apiSuccess(data);           // 200 { ok: true, data }
return apiSuccess(data, 201);      // 201 al crear
return apiSuccessPaginated(items, meta); // con paginación
return apiError("mensaje", 400);   // 400 { ok: false, error }
return apiError("no autorizado", 401);
return apiError("no encontrado", 404);
```

---

## 8. Convenciones de naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos de lógica | `kebab-case` | `excel-import-bulk.ts` |
| Componentes React | `PascalCase` | `ImportWizard.tsx` |
| Funciones exportadas | `camelCase` | `confirmBulkImport()` |
| Schemas Zod y tipos | `PascalCase` | `CreateLeagueSchema`, `TeamStanding` |
| Rutas API | `kebab-case` | `/api/top-scorers` |
| Columnas DB | `snake_case` | `full_name`, `league_id` |
| Variables locales | `camelCase` | `leagueId`, `homeScore` |
| Ramas git | `feat/*`, `fix/*`, `chore/*` | `feat/player-profile` |

---

## 9. TypeScript — reglas estrictas

```typescript
// ❌ Prohibido
function getData(id): any { ... }
const result = value as MyType;

// ✅ Correcto
function getData(id: string): Promise<Player | null> { ... }
// Si necesitas narrowing:
if (isPlayer(value)) { ... }

// Tipos de retorno explícitos SIEMPRE en features/ y entities/
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> { ... }

// En componentes React no son obligatorios (Next.js los infiere bien)
export default function PlayerCard({ player }: { player: Player }) { ... }
```

---

## 10. Deuda técnica — `src/lib/` (legacy)

`src/lib/` es una capa plana que aún no ha sido migrada a FSD. Los archivos ahí son código en producción activo — no los elimines, pero tampoco crees funciones nuevas en esa carpeta.

**Regla:** si tocas un archivo de `src/lib/`, migralo a la capa correcta en ese mismo PR/commit.

| Archivo legacy | Destino FSD |
|---|---|
| `lib/excel-import-bulk.ts` | `features/import-excel/bulk.ts` |
| `lib/excel-import.ts` | `features/import-excel/events.ts` |
| `lib/narrator.ts` | `features/narrator-analysis/analysis.ts` |
| `lib/standings.ts` | `features/standings/calculate.ts` |
| `lib/stats.ts` | `features/player-stats/aggregate.ts` |
| `lib/preview.ts` | `features/match-preview/build.ts` |

---

## 11. Lo que nunca debes hacer

- **No instales librerías nuevas** sin justificación explícita. El stack es deliberadamente minimalista
- **No uses `console.log`** en producción. Solo `console.error` para errores reales en el servidor
- **No uses `sql.raw()`** salvo que Drizzle no soporte la operación — y si lo haces, comenta por qué
- **No uses Redux, Zustand ni ningún estado global** — no hay necesidad en este proyecto
- **No uses react-hook-form ni formik** — el proyecto es suficientemente simple sin ellas
- **No hagas queries a la DB desde componentes de presentación** — solo desde `entities/` o `features/`
- **No dupliques tipos** si Zod puede inferirlos con `z.infer<typeof MySchema>`
- **No uses CSS custom** cuando Tailwind lo puede hacer — salvo `globals.css`
- **No apliques `!important`** ni `style={{}}` inline salvo casos excepcionales documentados
- **No mezcles `"use client"` sin necesidad** — el costo de hidratación existe

---

## 12. Checklist antes de hacer commit

- [ ] ¿El código nuevo sigue la jerarquía FSD (app → features → entities → shared)?
- [ ] ¿Los nombres que se insertan en DB pasan por `sanitizeName()`?
- [ ] ¿Los API routes solo validan + llaman feature/entity + responden?
- [ ] ¿Usé `apiSuccess` / `apiError` en lugar de `Response.json()` directo?
- [ ] ¿Los tipos de DB se infieren con `$inferSelect` / `$inferInsert`?
- [ ] ¿No agregué `any` ni `as SomeType` sin documentar por qué?
- [ ] ¿Las transacciones están en `features/`, no en `route.ts`?
- [ ] ¿Si toqué algo en `src/lib/`, lo migré a FSD?

---

## 13. Contexto de dominio — cosas que no son obvias

- **Liga ≠ equipo**. "Deportivo" en Liga Lunes y "Deportivo" en Liga Martes son registros distintos en `teams`. Siempre filtrar por `league_id` cuando trabajes con equipos
- **Stats tienen dos fuentes**. `player_season_stats` (de Excel, prioridad) y `match_events` (por partido, fallback). Si existen datos en `player_season_stats`, siempre se usan sobre `match_events`
- **Snapshots son acumulados**. `player_season_stats_snapshot` guarda stats totales hasta la jornada N, no el delta de esa jornada. Para calcular goles en jornada 5: `J5.goals − J4.goals`
- **El narrador es un usuario clave**. `/admin/analisis` y `/api/narrator` son features críticas — el narrador las usa en vivo durante el partido de Facebook
- **Ciudades están predefinidas**. El listado de ciudades de México está en `shared/lib/cities.ts`. No hardcodees ciudades en ningún otro lugar
- **`jornada` es un integer de negocio**, no una fecha. Representa la ronda de la liga (1, 2, 3…)
