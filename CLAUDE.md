@AGENTS.md

---

# FutbolStats — Guía de trabajo con Claude

Este archivo define cómo trabajamos en este proyecto. Toda respuesta, todo archivo nuevo y todo cambio debe respetar estas reglas.

---

## Stack

| Capa          | Tecnología                                                                 |
| ------------- | -------------------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router)                                                    |
| Base de datos | PostgreSQL + Drizzle ORM                                                   |
| Validación    | Zod                                                                        |
| Estilos       | Tailwind CSS                                                               |
| Excel         | SheetJS (xlsx)                                                             |
| Lenguaje      | TypeScript estricto                                                        |
| Estado global | Zustand (solo cuando el estado cruza más de 2 componentes no relacionados) |

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
│   │   ├── registro/page.tsx   # Terminal de registro CURP (Client Component)
│   │   └── [sección]/page.tsx  # Server Components por defecto
│   └── api/
│       ├── players/
│       │   ├── lookup/route.ts   # GET ?curp_hash=...
│       │   └── register/route.ts # POST — transacción global_player + league_member + inscription
│       └── [recurso]/route.ts    # Controladores HTTP delgados
│
├── features/                   # Casos de uso completos
│   ├── admin-registration/     # Terminal de registro de alta velocidad (CURP)
│   │   ├── lookup.ts           # Buscar jugador por curp_hash
│   │   ├── register.ts         # Crear global_player + league_member + inscription (tx atómica)
│   │   ├── hash.ts             # sha256(CURP) — solo se ejecuta en servidor
│   │   └── index.ts
│   ├── import-excel/           # Flujo V1 — importación bulk desde Excel
│   │   ├── parser.ts
│   │   ├── preview.ts
│   │   ├── confirm.ts
│   │   └── index.ts
│   ├── narrator-analysis/
│   ├── standings/
│   └── player-stats/
│
├── entities/                   # Entidades de negocio
│   ├── player/
│   │   ├── model.ts            # GlobalPlayerSchema, LeagueMemberSchema, InscriptionSchema
│   │   ├── queries.ts          # findByHash, upsertGlobal, createMember, createInscription
│   │   └── index.ts
│   ├── league/
│   ├── team/
│   └── match/
│
└── shared/                     # Primitivos reutilizables
    ├── db/
    │   ├── schema.ts           # global_players, league_members, inscriptions + tablas V1
    │   └── index.ts
    ├── ui/                     # Componentes base sin lógica de negocio
    │   ├── Button.tsx
    │   ├── Table.tsx
    │   └── Badge.tsx
    ├── api/
    │   ├── response.ts         # apiSuccess, apiError — lado servidor
    │   └── client.ts           # apiFetch<T> — lado cliente (OBLIGATORIO)
    └── lib/
        └── normalize.ts        # sanitizeToCanonical, titleCase — no reimplementar
```

> **Estado actual:** El proyecto usa `lib/` en lugar de `features/` y `entities/`. Los archivos nuevos deben seguir la estructura objetivo. Los existentes se migran cuando se toquen, no en un refactor masivo. Las tablas V1 (`players`, `player_registrations`) coexisten con las V2 (`global_players`, `league_members`, `inscriptions`) hasta la convergencia en v3.

---

## Reglas de calidad de código (no negociables)

### Principio de Responsabilidad Única (SRP)

- **Límite estricto de tamaño**: ningún archivo de componente supera las 150 líneas.
- **Custom Hooks obligatorios**: si la lógica de estado o efectos supera las 20 líneas, se extrae a `use[Name].ts` en la carpeta `model/` de la feature.
- **Anti God Components**: divide interfaces complejas en subcomponentes atómicos dentro de `features/*/ui/` o `shared/ui/`.

### Sin hardcoding (DRY)

- Strings repetidos, IDs, regex, timeouts y "magic numbers" van en `constants.ts` de la feature.
- Antes de crear una nueva utilidad, tipo o componente visual: verifica si ya existe en `shared/`. Si no existe, créalo ahí si es reutilizable.

### Métricas de funciones

- **Máximo 20 líneas por función**. Si hace más de una cosa, divídela.
- Nombres descriptivos y semánticos: `isLoading` no `ld`, `userData` no `u`.
- Booleans con verbos auxiliares: `isLoading`, `hasTeams`, `shouldRedirect`, `canSubmit`.
- Prioriza métodos declarativos (`map`, `filter`, `reduce`) sobre bucles imperativos.

### TypeScript estricto

- Sin `any`. Tipos desconocidos: `unknown` + narrowing.
- Sin `as SomeType` salvo necesidad absoluta, documentada.
- Tipos de retorno explícitos en funciones de `features/` y `entities/`.
- Preferir `type` sobre `interface` salvo que se necesite `extends`/`implements`.
- Orden de imports: 1. React/librerías externas · 2. Capas FSD superiores · 3. Capas locales · 4. Tipos/estilos.
- Sin imports muertos ni variables sin usar.

### Estructura interna de una feature con UI

```
features/[nombre]/
├── constants.ts          # Magic strings, regex, timeouts
├── types.ts              # Tipos compartidos de la feature
├── index.ts              # Exportaciones públicas
├── lib/
│   └── [nombre]-utils.ts # Funciones puras sin ciclo de vida React
├── model/
│   └── use[Nombre].ts    # Custom Hook con estado + efectos
└── ui/
    ├── [Nombre].tsx       # Orquestador (≤ 80 líneas)
    └── [SubComp].tsx      # Subcomponentes atómicos (≤ 150 líneas)
```

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

## SANITIZACIÓN Y PREVENCIÓN DE DUPLICADOS — CUMPLIMIENTO OBLIGATORIO

> Estas reglas son **NO NEGOCIABLES**. Aplican a cualquier tarea de desarrollo,
> refactorización o creación de endpoints y componentes relacionados con el CRUD
> de Equipos, Jugadores y Ligas. Si una instrucción las rompe, **notificar el
> riesgo de negocio y corregir antes de implementar**.

---

### Regla 1 — Verificación previa obligatoria (anti-duplicados)

Antes de cualquier `INSERT` o `UPDATE` en la DB, la aplicación **debe** validar
proactivamente la existencia del registro. Nunca confiar solo en el `catch` del
constraint de la DB.

| Entidad | Clave de unicidad             | Acción si existe                        |
| ------- | ----------------------------- | --------------------------------------- |
| Jugador | `global_players.curp_hash`    | Abortar y devolver flujo de vinculación |
| Equipo  | `(league_id, name_canonical)` | Rechazar con `apiError(..., 409)`       |
| Liga    | `(org_id, name_canonical)`    | Rechazar con `apiError(..., 409)`       |

```typescript
// ✅ CORRECTO — verificar antes del insert
const existing = await db.query.teams.findFirst({
	where: and(eq(teams.leagueId, leagueId), eq(teams.nameCanonical, canonical)),
});
if (existing) return apiError(`Ya existe un equipo con ese nombre ("${existing.name}")`, 409);

// ❌ INCORRECTO — confiar solo en el constraint de DB
try {
	await db.insert(teams).values({ name, leagueId });
} catch (e) {
	return apiError("Error al crear equipo"); // mensaje oscuro, UX rota
}
```

---

### Regla 2 — Patrón de almacenamiento canónico (dos columnas)

Toda entidad con nombre crítico para el negocio tiene **dos columnas** en la DB:

| Columna          | Propósito                              | Ejemplo            |
| ---------------- | -------------------------------------- | ------------------ |
| `name`           | Texto original del usuario (display)   | `"Deportivo F.C."` |
| `name_canonical` | Texto normalizado (búsquedas/GROUP BY) | `"deportivo fc"`   |

Tablas que aplican actualmente: `teams`, `leagues`, `global_players`
(`full_name_canonical`).

**Nunca** usar la columna `name` para filtros, `GROUP BY` ni comparaciones de
unicidad — siempre usar `name_canonical`.

---

### Regla 3 — Pipeline de sanitización (backend únicamente)

Toda cadena destinada a una columna `*_canonical` pasa obligatoriamente por
`sanitizeToCanonical()` de `shared/lib/normalize.ts` **antes** de tocar el ORM.

```typescript
import { sanitizeToCanonical } from "@/shared/lib/normalize";

// Al crear o actualizar cualquier entidad con nombre canónico:
const nameCanonical = sanitizeToCanonical(input.name);
```

**Pipeline interno de la función (no reimplementar):**

1. `trim()`
2. `normalize('NFD')` — descompone diacríticos
3. Elimina marcas diacríticas U+0300-U+036F, **excepto U+0303** (tilde → preserva Ñ/ñ)
4. `normalize('NFC')` — recompone `n + U+0303` → `ñ`
5. Elimina `[^a-zA-Z0-9\sñÑ]` — puntuación, guiones, puntos (`"F.C."` → `"FC"`)
6. `toLowerCase()`
7. Colapsa espacios múltiples
8. `trim()` final

**Función de referencia** (ya implementada en `src/shared/lib/normalize.ts`):

```typescript
export function sanitizeToCanonical(text: string): string {
	if (!text) return "";
	return text
		.trim()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, (m) => (m === "̃" ? m : ""))
		.normalize("NFC")
		.replace(/[^a-zA-Z0-9\sñÑ]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}
```

> **No reimplementar esta función en otro archivo.** Si necesitas la lógica,
> importa desde `@/shared/lib/normalize`.

---

### Regla 4 — Sanitización en el frontend (UX)

Los formularios React **no** sanitizan en tiempo real. La responsabilidad del
canonical es 100% del backend.

| Evento     | Acción permitida            | Acción prohibida                 |
| ---------- | --------------------------- | -------------------------------- |
| `onChange` | Actualizar estado           | Limpiar acentos o caracteres     |
| `onBlur`   | `.trim()` visual del campo  | Normalizar, canonicalizar        |
| `onSubmit` | Enviar texto crudo a la API | Calcular `_canonical` en cliente |

Para estética visual (ej. todo en mayúsculas): usar **CSS únicamente**
(`text-transform: uppercase`), nunca modificar el valor del estado.

---

### Checklist de cumplimiento al crear/editar entidades

Antes de hacer PR con cualquier endpoint o feature de CRUD, verificar:

- [ ] Columna `*_canonical` existe en el schema de Drizzle
- [ ] `sanitizeToCanonical()` se llama en backend antes del insert/update
- [ ] Consulta de existencia por canonical **antes** del insert (no solo constraint)
- [ ] Error 409 con mensaje legible si hay duplicado
- [ ] Formularios React sin sanitización en `onChange`
- [ ] No hay reimplementación de la lógica de canonicalización fuera de `normalize.ts`

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
return apiSuccess(data); // { ok: true, data }
return apiSuccess(data, 201); // crear
return apiError("mensaje", 400); // { ok: false, error }
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

// ✅ Lógica de estado compleja → Custom Hook
// useRegistrationForm.ts en features/[nombre]/model/

// ✅ Estado que cruza componentes no relacionados → Zustand store
// features/[nombre]/model/use[Nombre]Store.ts

// ✅ Fetch de datos en Server Components cuando sea posible
// ✅ fetch() en Client Components para interacciones post-render

// ❌ Redux — no hay necesidad en este proyecto
```

### Peticiones HTTP desde el cliente — `apiFetch` (OBLIGATORIO)

Todo Client Component que haga una petición a una API Route interna **debe** usar
`apiFetch<T>` de `@/shared/api/client`. Está prohibido usar `fetch()` directamente.

```typescript
import { apiFetch } from "@/shared/api/client";

// ✅ CORRECTO
const result = await apiFetch<SeedResult>("/api/seed-liga", {
	method: "POST",
	body: { ...form, organizationId: form.organizationId || undefined },
});

if (!result.ok) {
	setError(result.error); // mensaje viene del backend, sin hardcoding
} else {
	setResult(result.data); // tipado como SeedResult
}

// ❌ INCORRECTO — fetch desnudo, boilerplate repetido, manejo de error frágil
const res = await fetch("/api/seed-liga", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(body),
});
const data = await res.json();
if (!res.ok || !data.ok) {
	setError(data.error ?? "Error al generar la liga.");
}
```

**Reglas derivadas:**

- `apiFetch` serializa el `body` automáticamente — no llamar `JSON.stringify()` antes.
- El tipo genérico `<T>` debe ser el tipo del campo `data` del response exitoso.
- Errores de red (sin conexión, CORS) se propagan como excepción — envolver en `try/catch`
  solo si el componente necesita manejarlos distinto a un error de negocio.
- Para Server Components que llaman rutas internas autenticadas usar `serverFetch`
  de `@/shared/lib/server-fetch` — nunca `apiFetch` (es solo para el cliente).

---

### Formularios

- Sin react-hook-form ni formik — el proyecto es suficientemente simple
- Validar en el cliente antes de enviar (feedback inmediato), validar en el server (fuente de verdad)
- Mostrar errores de la API en la UI siempre

---

## Convenciones de nombres

| Elemento           | Convención | Ejemplo                             |
| ------------------ | ---------- | ----------------------------------- |
| Archivos de lógica | kebab-case | `player-stats.ts`                   |
| Componentes React  | PascalCase | `NarratorPanel.tsx`                 |
| Funciones          | camelCase  | `getLeagueStandings()`              |
| Tipos y schemas    | PascalCase | `PlayerStats`, `CreateLeagueSchema` |
| Rutas API          | kebab-case | `/api/top-scorers`                  |
| Columnas DB        | snake_case | `full_name`, `league_id`            |
| Variables TS       | camelCase  | `leagueId`, `homeScore`             |

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
- No crear God Components — ningún archivo supera 150 líneas
- No hardcodear magic strings, regex ni timeouts — van en `constants.ts`
- No poner lógica de estado/efectos en el cuerpo del componente si supera 20 líneas — va en un Custom Hook
- No usar `any` ni casts sin documentar
- No importar entre features del mismo nivel — solo a través de una capa superior
- No usar `fetch()` directamente en Client Components — siempre `apiFetch<T>` de `@/shared/api/client`

---

## Contexto del dominio

### Visión y enfoque nuevo

TalachaStats está evolucionando hacia una **plataforma de identidad global para fútbol amateur a nivel ciudad**. La apuesta es: si varias ligas de la misma ciudad adoptan la app, la identidad de cada jugador anclada al CURP se vuelve incorruptible — no hay manera de que el mismo jugador aparezca como dos personas distintas. El dato mejora solo conforme crece la adopción.

### Modelo de identidad (V2 — nuevo)

- **`global_players`** es la fuente de verdad permanente. Una vez registrado con CURP real, ese jugador existe para siempre en la plataforma con su identidad verificada.
- **`league_members`** conecta un `global_player` con una liga específica. Tiene datos privados de la institución (`internal_notes`, `institution_photo_url`) que no se comparten entre ligas.
- **`inscriptions`** asigna a un `league_member` a un equipo. Un jugador solo puede estar en un equipo por liga.
- El `curp_hash` es `sha256(CURP)` calculado **solo en el servidor**. Nunca llega texto plano de CURP a la DB.

### Coexistencia V1 / V2

- **V1 (legacy):** tablas `players` + `player_registrations` + `player_season_stats`. Ligas que usan solo Excel siguen funcionando con estas tablas. No eliminarlas.
- **V2 (nuevo):** tablas `global_players` + `league_members` + `inscriptions`. Ligas con registro presencial usan este flujo.
- **Regla de routing:** feature toca stats de Excel → V1; feature toca registro/inscripción → V2.

### Otros conceptos clave

- **Liga = torneo.** No existe tabla `tournaments`. El scope de unicidad de una inscripción ya está dado por `league_member_id`.
- Los **equipos están siempre scoped a una liga** — "Deportivo" en Liga Lunes ≠ "Deportivo" en Liga Martes.
- **Stats tienen dos fuentes:** `player_season_stats` (Excel, prioridad 1) y `match_events` (partido a partido, fallback). Un jugador puede tener stats de ambas fuentes en ligas distintas.
- El **narrador del Facebook Live** es un usuario clave — las features de análisis pre-partido son críticas y se usan en vivo.

### Documento de referencia completo

`docs/player-identity-admin-ecosystem.md` — diseño cerrado, listo para implementación. Incluye el flujo completo de registro, estrategia de migración y decisiones de diseño.
