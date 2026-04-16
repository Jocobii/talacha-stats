@AGENTS.md

---

# FutbolStats — Guía de trabajo con Claude

Este archivo define cómo trabajamos en este proyecto. Toda respuesta, todo archivo nuevo y todo cambio debe respetar estas reglas.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Base de datos | PostgreSQL + Drizzle ORM |
| Validación | Zod |
| Estilos | Tailwind CSS |
| Excel | SheetJS (xlsx) |
| Lenguaje | TypeScript estricto |

---

## Arquitectura: Feature-Sliced Design adaptado a Next.js full-stack

FSD define capas con una regla de dependencia estricta: **las capas superiores pueden importar de las inferiores, nunca al revés, nunca entre capas del mismo nivel.**

```
app  →  features  →  entities  →  shared
```

### Estructura de carpetas objetivo

```
src/
├── app/                        # Next.js routing — solo rutas y layouts
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── [sección]/page.tsx  # Server Components por defecto
│   └── api/
│       └── [recurso]/route.ts  # Controladores HTTP delgados
│
├── features/                   # Casos de uso completos
│   ├── import-excel/           # Una carpeta por feature
│   │   ├── parser.ts           # Leer y normalizar Excel
│   │   ├── preview.ts          # Generar vista previa
│   │   ├── confirm.ts          # Persistir datos importados
│   │   └── index.ts            # Exportaciones públicas del feature
│   ├── narrator-analysis/
│   ├── standings/
│   └── player-stats/
│
├── entities/                   # Entidades de negocio
│   ├── player/
│   │   ├── model.ts            # Tipos + schema Zod
│   │   ├── queries.ts          # Acceso a DB (get, list, search, upsert)
│   │   └── index.ts
│   ├── league/
│   ├── team/
│   └── match/
│
└── shared/                     # Primitivos reutilizables
    ├── db/
    │   ├── schema.ts
    │   └── index.ts
    ├── ui/                     # Componentes base sin lógica de negocio
    │   ├── Button.tsx
    │   ├── Table.tsx
    │   └── Badge.tsx
    ├── api/
    │   └── response.ts         # apiSuccess, apiError
    └── lib/
        └── normalize.ts        # Utilitarios puros (strings, fechas, etc.)
```

> **Estado actual:** El proyecto usa `lib/` en lugar de `features/` y `entities/`. Los archivos nuevos deben seguir la estructura objetivo. Los existentes se migran cuando se toquen, no en un refactor masivo.

---

## Reglas de arquitectura (no negociables)

### 1. Regla de dependencias FSD
```
✅ app/api/ → features/ → entities/ → shared/
✅ app/(admin)/ → features/ → shared/ui/
❌ entities/ → features/
❌ features/player-stats/ → features/narrator-analysis/
❌ shared/ → entities/ ni features/
```

### 2. API Routes = controladores delgados
Los archivos `route.ts` solo hacen tres cosas:
1. Parsear y validar la entrada con Zod
2. Llamar a una función de `features/` o `entities/`
3. Retornar `apiSuccess()` o `apiError()`

```typescript
// ✅ CORRECTO
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league_id");
  if (!leagueId) return apiError("Falta league_id", 400);

  const standings = await getLeagueStandings(leagueId); // ← feature/entity
  return apiSuccess(standings);
}

// ❌ INCORRECTO — lógica de negocio en el route
export async function GET(request: Request) {
  const rows = await db.query.matches.findMany({ ... });
  const standings = rows.reduce((acc, m) => { /* cálculo complejo */ }, {});
  return Response.json(standings);
}
```

### 3. Server Components por defecto, Client solo cuando necesario
```typescript
// ✅ Page que solo muestra datos → Server Component (sin "use client")
export default async function LeaguePage({ params }) {
  const league = await getLeague(params.id);  // consulta directa a DB o fetch
  return <LeagueDetail league={league} />;
}

// ✅ Formulario con estado → Client Component
"use client";
export function ImportWizard() {
  const [step, setStep] = useState("upload");
  ...
}
```

### 4. Un schema Zod, un tipo — mismo archivo
```typescript
// entities/player/model.ts
export const PlayerSchema = z.object({
  fullName: z.string().min(2).max(100),
  alias: z.string().max(50).optional(),
});

export type Player = z.infer<typeof PlayerSchema>;
// No duplicar tipos manualmente si Zod puede inferirlos
```

### 5. Transacciones en features, no en routes ni en queries
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

## Reglas de backend

### Naming de endpoints
```
GET    /api/[recurso]               → listar
POST   /api/[recurso]               → crear
GET    /api/[recurso]/[id]          → detalle
PATCH  /api/[recurso]/[id]          → actualizar parcialmente
DELETE /api/[recurso]/[id]          → eliminar
POST   /api/[recurso]/[accion]      → acción especial (ej: /merge, /confirm)
```

### Responses siempre consistentes
```typescript
// Siempre usar apiSuccess / apiError de shared/api/response.ts
return apiSuccess(data);          // { ok: true, data }
return apiSuccess(data, 201);     // crear
return apiError("mensaje", 400);  // { ok: false, error }
return apiError("no encontrado", 404);
```

### Validación de entrada obligatoria
Todo input externo pasa por Zod antes de tocar la DB.

```typescript
const parsed = MySchema.safeParse(body);
if (!parsed.success) return apiError(parsed.error.message, 400);
// Después de aquí, parsed.data es 100% confiable
```

### Queries de DB
- Usar la API relacional de Drizzle (`db.query.*`) para lecturas con joins
- Usar `db.select/insert/update/delete` para escrituras y queries con lógica compleja
- No usar `sql.raw()` salvo para operaciones que Drizzle no soporta (ej: transacciones con conflictos complejos)
- Manejar siempre el caso de "no encontrado" antes de retornar

---

## Reglas de frontend

### Componentes
```
shared/ui/          → componentes genéricos: Button, Badge, Table, Modal
features/*/ui/      → componentes específicos de un feature: ImportWizard, NarratorPanel
app/(admin)/*/      → páginas: componen features y entities, no tienen lógica propia
```

### Estilos con Tailwind
- Clases utilitarias directas, sin CSS custom salvo en `globals.css`
- Colores del sistema: `green-600` para acciones primarias, `gray-*` para neutros, `red-*` para destructivos
- Modo claro forzado — este es un panel administrativo, sin soporte dark mode
- No usar clases de Tailwind con `!important` ni `style={}` inline salvo casos excepcionales

### Estado del cliente
```typescript
// ✅ Estado local con useState para forms y UI transitoria
const [step, setStep] = useState<Step>("upload");

// ✅ Fetch de datos en Server Components cuando sea posible
// ✅ fetch() en Client Components para interacciones post-render

// ❌ No usar librerías de estado global (Redux, Zustand) — no hay necesidad en este proyecto
```

### Formularios
- Sin librerías de forms (react-hook-form, formik) — el proyecto es suficientemente simple
- Validar en el cliente antes de enviar (feedback inmediato), validar en el server (fuente de verdad)
- Mostrar errores de la API en la UI siempre

---

## Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos de lógica | kebab-case | `player-stats.ts` |
| Componentes React | PascalCase | `NarratorPanel.tsx` |
| Funciones | camelCase | `getLeagueStandings()` |
| Tipos y schemas | PascalCase | `PlayerStats`, `CreateLeagueSchema` |
| Rutas API | kebab-case | `/api/top-scorers` |
| Columnas DB | snake_case | `full_name`, `league_id` |
| Variables TS | camelCase | `leagueId`, `homeScore` |

---

## TypeScript

- `strict: true` siempre
- No usar `any` — si el tipo es desconocido, usar `unknown` y narrowing
- No usar `as SomeType` salvo que sea absolutamente necesario y se documente por qué
- Tipos de retorno explícitos en funciones de `features/` y `entities/` (no en componentes)
- Preferir `type` sobre `interface` salvo que se necesite `extends` o `implements`

```typescript
// ✅
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> { ... }

// ❌
export async function getLeagueStandings(leagueId) { ... }
```

---

## Cómo agregar una nueva feature (checklist)

Cuando se pida una nueva funcionalidad, seguir este orden:

1. **Definir el modelo** en `entities/[nombre]/model.ts` — tipos + schema Zod
2. **Escribir las queries** en `entities/[nombre]/queries.ts` — acceso a DB
3. **Implementar la lógica** en `features/[nombre]/` — orquestar queries, calcular, transformar
4. **Crear el endpoint** en `app/api/[ruta]/route.ts` — validar + llamar feature + responder
5. **Construir la UI** en `app/(admin)/[ruta]/page.tsx` — componer componentes
6. **Agregar al menú** si aplica en `app/(admin)/layout.tsx`

---

## Lo que NO hacemos

- No instalar librerías nuevas sin justificación explícita
- No duplicar lógica que ya existe en `features/` o `entities/`
- No hacer queries a la DB desde componentes de presentación
- No poner lógica de negocio en archivos `route.ts`
- No crear tipos duplicados si Zod puede inferirlos
- No usar `console.log` en producción — usar `console.error` solo para errores reales en el server
- No mezclar Server y Client Components sin necesidad
- No usar CSS custom cuando Tailwind lo puede hacer

---

## Contexto del dominio

- Los jugadores tienen identidad global (tabla `players`) pero participan en múltiples ligas con diferentes equipos
- `player_registrations` es la tabla pivote: un jugador, un equipo por liga (`UNIQUE player_id + league_id`)
- Las stats vienen de dos fuentes: `player_season_stats` (importadas desde Excel, prioridad) y `match_events` (partido a partido, fallback)
- Los equipos están siempre scoped a una liga — "Deportivo" en Liga Lunes ≠ "Deportivo" en Liga Martes
- El narrador del Facebook Live es un usuario clave — las features de análisis pre-partido son críticas
