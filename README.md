# TalachaStats

> Plataforma de estadísticas cross-liga para jugadores amateurs de fútbol 7 en México.  
> Un perfil global por jugador. Todas sus ligas, todos sus goles.

---

## Índice

1. [¿Qué es TalachaStats?](#1-qué-es-talachastats)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Flujos clave](#5-flujos-clave)
6. [Setup local](#6-setup-local)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Comandos disponibles](#8-comandos-disponibles)
9. [Convenciones de código](#9-convenciones-de-código)
10. [Guía para agregar una feature](#10-guía-para-agregar-una-feature)
11. [Estado de migración arquitectónica](#11-estado-de-migración-arquitectónica)

---

## 1. ¿Qué es TalachaStats?

TalachaStats resuelve un problema muy concreto: en las ligas de fútbol amateur locales de México, los jugadores participan en varias ligas a la vez (Liga Lunes, Liga Martes…) y las estadísticas viven en hojas de Excel desconectadas. No hay un perfil consolidado por jugador.

La plataforma tiene **dos caras**:

| Cara    | URL                             | Quién la usa                                      |
| ------- | ------------------------------- | ------------------------------------------------- |
| Pública | `/`, `/ranking`, `/player/[id]` | Jugadores, familiares, aficionados                |
| Admin   | `/admin/*`                      | Organizadores de liga, narrador del Facebook Live |

El **narrador del Facebook Live** es un usuario clave. Antes de cada partido necesita datos contextuales de los dos equipos (racha, goleadores, estadísticas). El módulo `/admin/analisis` y el endpoint `/api/narrator` están diseñados específicamente para él.

---

## 2. Stack tecnológico

| Capa            | Tecnología                       | Notas                                 |
| --------------- | -------------------------------- | ------------------------------------- |
| Framework       | **Next.js 16** (App Router)      | Server Components por defecto         |
| Base de datos   | **PostgreSQL** + **Drizzle ORM** | Hosted en Supabase                    |
| Validación      | **Zod 4**                        | Un schema = un tipo, sin duplicación  |
| Estilos         | **Tailwind CSS 4**               | Modo claro forzado, sin dark mode     |
| Excel           | **ExcelJS**                      | Reemplazó a `xlsx` por CVEs críticos  |
| PDF             | **PDFKit**                       | Exportación del análisis del narrador |
| Lenguaje        | **TypeScript 5** (strict)        | `any` prohibido                       |
| Package manager | **pnpm**                         |                                       |

---

## 3. Arquitectura

El proyecto usa **Feature-Sliced Design (FSD) adaptado a Next.js full-stack**.

### Regla de dependencias

```
app  →  features  →  entities  →  shared
```

Las capas superiores importan de las inferiores. **Nunca al revés, nunca entre capas del mismo nivel.**

```
✅  features/narrator-analysis → entities/player
✅  app/api/players → entities/player
❌  entities/player → features/import-excel
❌  shared/ → entities/
```

### Estructura de carpetas

```
src/
├── app/                          # Next.js routing — solo rutas y layouts
│   ├── (public)/                 # Cara pública (sin auth)
│   │   ├── page.tsx              # Home — HeroSection, StatsBar, LeaderboardTeaser
│   │   ├── ranking/              # Rankings cross-liga, filtrable por liga y ciudad
│   │   ├── player/[id]/          # Perfil público del jugador
│   │   ├── players/              # Directorio de jugadores
│   │   ├── matchday/             # Página de jornada
│   │   └── analysis/             # Vista pública de análisis
│   ├── admin/                    # Panel admin (requiere sesión)
│   │   ├── import/               # Wizard de importación de Excel
│   │   ├── analisis/             # Herramienta del narrador
│   │   ├── leagues/              # CRUD de ligas
│   │   ├── teams/                # Vista de equipos
│   │   ├── players/              # Gestión de jugadores
│   │   ├── matches/              # Detalle de partido + preview
│   │   ├── narrator/             # Panel narrador
│   │   └── users/                # Gestión de usuarios (solo owner)
│   ├── api/                      # Route handlers — solo validación + llamada a feature/entity
│   │   ├── auth/                 # login, logout, me, setup
│   │   ├── import/               # bulk, detect, templates
│   │   ├── leagues/              # CRUD + standings, top-scorers, top-assists
│   │   ├── matches/              # CRUD + events + preview
│   │   ├── narrator/             # Análisis pre-partido + export PDF
│   │   ├── players/              # CRUD + stats + search
│   │   ├── ranking/              # Ranking cross-liga
│   │   ├── teams/                # CRUD + roster + merge
│   │   └── analytics/visit/      # Tracking de visitas
│   └── login/
│
├── features/                     # Casos de uso completos
│   └── narrator-analysis/
│       ├── export-pdf.ts         # Genera PDF del análisis para el narrador
│       └── export-png.tsx        # Exportación como imagen
│
├── entities/                     # Entidades de negocio puras
│   ├── player/
│   │   ├── model.ts              # Tipos + schemas Zod
│   │   ├── queries.ts            # Acceso a DB (get, list, search, upsert)
│   │   ├── ranking.ts            # Lógica de ranking cross-liga
│   │   └── index.ts              # Re-exportaciones públicas
│   ├── user/
│   │   ├── model.ts
│   │   ├── queries.ts
│   │   └── index.ts
│   └── analytics/
│       └── queries.ts
│
├── lib/                          # ⚠️ Capa legacy — ver §11
│   ├── excel-import.ts           # Importador event-by-event (formato antiguo)
│   ├── excel-import-bulk.ts      # Importador bulk (goleadores + standings)
│   ├── narrator.ts               # Análisis pre-partido
│   ├── standings.ts              # Cálculo de tabla de posiciones
│   ├── stats.ts                  # Agregación de stats de jugador
│   └── preview.ts                # Preview de partido por match_id
│
├── shared/                       # Primitivos reutilizables
│   ├── lib/
│   │   ├── auth.ts               # getSessionUser() / getSessionUserFromRequest()
│   │   ├── session.ts            # HMAC-SHA256, sign/verify, cookie helpers
│   │   ├── normalize.ts          # sanitizeName(), titleCase()
│   │   ├── cities.ts             # Lista de ciudades de México
│   │   ├── active-city.ts        # Ciudad activa del admin (cookie)
│   │   ├── pagination.ts         # Helper de paginación
│   │   ├── excel.ts              # readWorkbook(), sheetToObjects()
│   │   └── server-fetch.ts       # fetch con base URL resuelta en server
│   └── ui/
│       ├── Icon.tsx              # Wrapper de lucide-react (strokeWidth=2)
│       ├── PublicNav.tsx         # Barra de navegación pública
│       ├── PublicFooter.tsx      # Footer público
│       ├── FilterBar.tsx         # Filtros reutilizables
│       ├── LeagueSelect.tsx      # Selector de liga
│       ├── CityFilter.tsx        # Filtro de ciudad
│       ├── Pagination.tsx        # Paginación
│       ├── NavigationProgress.tsx
│       └── TrackVisit.tsx        # Beacon de visita (client component)
│
├── db/
│   ├── schema.ts                 # Definición completa del schema Drizzle
│   ├── index.ts                  # Cliente de DB + re-exportaciones
│   ├── migrate.ts                # Script de migración manual
│   ├── views.sql                 # Vistas SQL auxiliares
│   └── migrations/               # Archivos SQL generados por drizzle-kit
│
└── types/
    └── index.ts                  # apiSuccess(), apiError() y tipos globales
```

---

## 4. Modelo de datos

### Diagrama de entidades

```
users ──────────────────────────────── leagues
  (owner | organizer)                    │
                                         │ (scoped)
                                       teams ────────── matches
                                         │                │
                           player_registrations      match_events
                                    │
players ────────────────────────────┘
  │
  ├── player_season_stats          (stats acumuladas por liga, fuente: Excel)
  ├── player_season_stats_snapshot (historial de stats por jornada)
  └── team_standings_snapshot      (tabla de posiciones por jornada)
```

### Tablas principales

| Tabla                          | Descripción                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `users`                        | Cuentas admin. Roles: `owner` (ve todo) / `organizer` (solo sus ligas)                          |
| `players`                      | Identidad global del jugador — independiente de liga o equipo                                   |
| `leagues`                      | Liga por día/torneo (`Liga Lunes`, `Liga Martes`…). Tiene `city`, `season`, `status`            |
| `teams`                        | Equipo **siempre scoped a una liga**. "Deportivo" en Liga Lunes ≠ "Deportivo" en Liga Martes    |
| `player_registrations`         | Pivote jugador ↔ equipo ↔ liga. `UNIQUE(player_id, league_id)` — un jugador, un equipo por liga |
| `matches`                      | Partido entre dos equipos de la misma liga                                                      |
| `match_events`                 | Eventos granulares: `goal`, `assist`, `yellow_card`, `red_card`, `own_goal`, `mvp`              |
| `player_season_stats`          | Stats acumuladas importadas desde Excel. `UNIQUE(player_id, league_id)`. **Fuente primaria**    |
| `player_season_stats_snapshot` | Historial por jornada. Permite ver progresión y corregir re-importaciones                       |
| `team_standings_snapshot`      | Tabla de posiciones importada. `UNIQUE(team_id, league_id, jornada)`                            |
| `import_templates`             | Plantillas de mapeo de columnas Excel → campos del sistema                                      |
| `page_views`                   | Visitas únicas por visitor_id (UUID en cookie)                                                  |

### Decisiones de diseño importantes

**Stats: dos fuentes, una prioridad**

Las estadísticas de un jugador pueden venir de dos fuentes:

1. `player_season_stats` — importadas desde el Excel semanal del organizador _(prioridad alta)_
2. `match_events` — registradas partido a partido _(fallback)_

Cuando existen datos en `player_season_stats`, siempre se usan. Los `match_events` son el respaldo si no hay importación.

**Snapshots acumulados, no deltas**

`player_season_stats_snapshot` guarda stats **acumuladas** hasta la jornada N, no las de esa jornada. Para saber cuántos goles marcó alguien en la jornada 5 se calcula `J5.goals − J4.goals`. Esto permite re-importar una jornada sin romper el historial.

**Normalización de nombres**

Todos los campos de texto buscables (nombres de jugadores, equipos, ligas) siguen una convención estricta definida en `shared/lib/normalize.ts`:

```
Almacenamiento en BD  → sanitizeName()   (lowercase + trim + colapso de espacios)
Display en UI         → titleCase()      (primera letra por palabra, respeta partículas)
Búsqueda en DB        → f_unaccent() + similarity() en PostgreSQL
```

---

## 5. Flujos clave

### Autenticación

El sistema usa sesiones propias con **HMAC-SHA256** (sin dependencias externas como NextAuth).

```
Login → POST /api/auth/login
  → verifica email + bcrypt(password)
  → signSession(userId) → token base64url {userId}|{expiresAt}|{hmac}
  → Set-Cookie: ts_session (HttpOnly, SameSite=Strict, 7 días)

Cada request protegido:
  → getSessionUser()             (Server Components — lee cookies() de next/headers)
  → getSessionUserFromRequest()  (API Routes — lee el Request directamente)
  → verifySession(token) → confirma HMAC + expiry + user activo en DB
```

El admin layout redirige a `/login` si no hay sesión válida (segunda línea de defensa; el middleware es la primera).

**Roles:**

- `owner` — puede ver y editar todo, incluyendo gestión de usuarios
- `organizer` — solo puede gestionar sus ligas (verificado con `canManageLeague()`)

### Importación de Excel (flujo bulk)

Es el flujo más complejo. El wizard en `/admin/import` sigue estos pasos:

```
1. Upload del .xlsx
2. POST /api/import/bulk (action=preview)
   → parseBulkExcel() o parseBulkExcelMapped() si hay template guardado
   → auto-detección del tipo: "goleadores" | "standings"
   → fuzzy matching de nombres de jugadores (sanitizeName + similarity)
   → devuelve preview: rows parseadas + player resolutions + warnings

3. El usuario resuelve ambigüedades de jugadores (nuevo vs. existente)

4. POST /api/import/bulk (action=confirm)
   → confirmBulkImport()
   → upsert en player_season_stats (ON CONFLICT DO UPDATE)
   → insert en player_season_stats_snapshot (historial por jornada)
   → upsert en team_standings_snapshot
   → todo dentro de una transacción
```

Los templates (`import_templates`) guardan el mapeo de columnas del Excel para que el organizador no tenga que reconfigurar cada semana.

### Análisis pre-partido del narrador

`/admin/analisis` y `GET /api/narrator?team_a={id}&team_b={id}&league_id={id}`:

```
narrator.ts recopila, en orden de prioridad:
  1. player_season_stats   → roster + stats de cada equipo
  2. match_events          → fallback si no hay import
  3. team_standings_snapshot → posición, récord, forma
  4. matches               → últimos 5 resultados + Head-to-Head

Calcula por jugador:
  → goalsPerMatch, contributions (goles + asistencias)
  → dangerRating: ALTO / MEDIO / BAJO

Devuelve NarratorAnalysis con:
  → teamA, teamB (con roster, topScorer, topAssist, currentStreak)
  → h2h (head-to-head histórico)
  → keyMatchups (enfrentamientos individuales clave)
  → generatedAt timestamp

Exportación:
  → POST /api/narrator/export → PDF generado con PDFKit (pdfkit, sin browser)
```

---

## 6. Setup local

### Prerrequisitos

- Node.js 20+
- pnpm
- PostgreSQL (local o una instancia en Supabase)

### Pasos

```bash
# 1. Clonar
git clone <repo-url>
cd talachastats

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp env.local.example .env.local
# Editar .env.local con tus valores (ver §7)

# 4. Correr migraciones
pnpm db:migrate:run

# 5. Crear el primer usuario owner (solo primera vez)
# Enviar POST /api/auth/setup con { secret, email, password, name }
# El SETUP_SECRET está en .env.local

# 6. Levantar el servidor de desarrollo
pnpm dev
```

La app corre en `http://localhost:3000`.

El panel admin está en `http://localhost:3000/admin` — requiere iniciar sesión.

---

## 7. Variables de entorno

| Variable               | Descripción                                                         | Requerida |
| ---------------------- | ------------------------------------------------------------------- | --------- |
| `DATABASE_URL`         | Connection string de PostgreSQL                                     | ✅        |
| `SESSION_SECRET`       | Secreto HMAC para tokens de sesión. Mínimo 32 chars                 | ✅        |
| `SETUP_SECRET`         | Contraseña para crear el primer usuario owner via `/api/auth/setup` | ✅        |
| `NEXT_PUBLIC_BASE_URL` | URL base pública (ej: `https://talachastats.com`)                   | ✅        |

> **Nunca** subas `.env.local` al repositorio. El `.gitignore` ya lo excluye.

---

## 8. Comandos disponibles

```bash
pnpm dev              # Servidor de desarrollo en localhost:3000
pnpm build            # Build de producción
pnpm start            # Servidor de producción (requiere build previo)
pnpm lint             # ESLint

pnpm db:generate      # Genera archivos de migración desde el schema (drizzle-kit)
pnpm db:migrate       # Aplica migraciones (drizzle-kit push — solo desarrollo)
pnpm db:migrate:run   # Corre el script src/db/migrate.ts (producción)
```

---

## 9. Convenciones de código

### Naming

| Elemento            | Convención   | Ejemplo                             |
| ------------------- | ------------ | ----------------------------------- |
| Archivos de lógica  | `kebab-case` | `player-stats.ts`                   |
| Componentes React   | `PascalCase` | `NarratorPanel.tsx`                 |
| Funciones           | `camelCase`  | `getLeagueStandings()`              |
| Tipos y schemas Zod | `PascalCase` | `PlayerStats`, `CreateLeagueSchema` |
| Rutas API           | `kebab-case` | `/api/top-scorers`                  |
| Columnas DB         | `snake_case` | `full_name`, `league_id`            |
| Variables TS        | `camelCase`  | `leagueId`, `homeScore`             |

### TypeScript

- `strict: true` siempre
- Prohibido `any` — usar `unknown` + narrowing
- Prohibido `as SomeType` salvo que sea inevitable y se documente el porqué
- Tipos de retorno explícitos en funciones de `features/` y `entities/`
- Preferir `type` sobre `interface` (salvo que se necesite `extends`)

```typescript
// ✅ Correcto
export async function getLeagueStandings(leagueId: string): Promise<TeamStanding[]> { ... }

// ❌ Incorrecto
export async function getLeagueStandings(leagueId) { ... }
```

### API Routes — patrón obligatorio

Los `route.ts` solo hacen tres cosas: validar entrada con Zod, llamar a una función de `features/` o `entities/`, y retornar `apiSuccess` o `apiError`.

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
  const standings = rows.reduce((acc, m) => { /* cálculo aquí */ }, {});
  return Response.json(standings);
}
```

### Responses

```typescript
return apiSuccess(data); // { ok: true, data }
return apiSuccess(data, 201); // crear recurso
return apiError("mensaje", 400); // { ok: false, error }
return apiError("no encontrado", 404);
```

### Transacciones

Las transacciones van en `features/`, nunca en `route.ts` ni en `entities/`.

```typescript
// features/import-excel/confirm.ts ✅
export async function confirmImport(data: ParsedImport) {
  return db.transaction(async (tx) => {
    await tx.insert(players).values(...);
    await tx.insert(playerSeasonStats).values(...);
  });
}
```

### Iconos

Todos los iconos usan el componente `shared/ui/Icon.tsx` como wrapper de `lucide-react`. Los estándares son `strokeWidth=2` y tamaños de 12/16/20/24px.

### Normalización de nombres

Antes de insertar cualquier nombre en la DB, pasarlo por `sanitizeName()`. Para mostrarlo en la UI, usar `titleCase()`. Nunca guardar un nombre sin normalizar.

---

## 10. Guía para agregar una feature

Seguir este orden para cualquier nueva funcionalidad:

**1. Modelo** — `entities/[nombre]/model.ts`
Define los tipos y schema Zod. Un schema = un tipo, sin duplicación.

**2. Queries** — `entities/[nombre]/queries.ts`
Acceso a DB con Drizzle. Devuelve tipos explícitos. Maneja el caso "no encontrado".

**3. Lógica** — `features/[nombre]/`
Orquesta queries, calcula, transforma. Aquí van las transacciones.

**4. Endpoint** — `app/api/[ruta]/route.ts`
Valida con Zod → llama al feature/entity → responde con `apiSuccess`/`apiError`.

**5. UI** — `app/(public)/[ruta]/page.tsx` o `app/admin/[ruta]/page.tsx`
Server Component por defecto. Client Component solo si hay estado interactivo.

**6. Menú** — actualizar `app/admin/layout.tsx` si aplica.

### Naming de endpoints

```
GET    /api/[recurso]            → listar
POST   /api/[recurso]            → crear
GET    /api/[recurso]/[id]       → detalle
PATCH  /api/[recurso]/[id]       → actualizar parcialmente
DELETE /api/[recurso]/[id]       → eliminar
POST   /api/[recurso]/[accion]   → acción especial (ej: /merge, /confirm)
```

---

## 11. Estado de migración arquitectónica

El proyecto está en migración de una arquitectura `lib/` plana hacia FSD completo. **No hay un refactor masivo planeado** — la migración ocurre archivo por archivo cuando se toca cada módulo.

| Archivo                           | Estado                              | Destino objetivo              |
| --------------------------------- | ----------------------------------- | ----------------------------- |
| `src/lib/excel-import-bulk.ts`    | Legacy en uso activo                | `features/import-excel/`      |
| `src/lib/excel-import.ts`         | Legacy (formato antiguo de eventos) | `features/import-excel/`      |
| `src/lib/narrator.ts`             | Legacy en uso activo                | `features/narrator-analysis/` |
| `src/lib/standings.ts`            | Legacy                              | `features/standings/`         |
| `src/lib/stats.ts`                | Legacy                              | `features/player-stats/`      |
| `src/lib/preview.ts`              | Legacy                              | `features/match-preview/`     |
| `src/features/narrator-analysis/` | **FSD ✅**                          | ya migrado (export)           |
| `src/entities/player/`            | **FSD ✅**                          | ya migrado                    |
| `src/entities/user/`              | **FSD ✅**                          | ya migrado                    |

**Regla al tocar un archivo legacy:** migrarlo a la capa correcta de FSD. No crear nuevas funciones en `src/lib/`.

---

## Ramas de git

| Rama      | Propósito                          |
| --------- | ---------------------------------- |
| `master`  | Producción estable                 |
| `dev`     | Desarrollo activo — hacer PRs aquí |
| `feat/*`  | Features nuevas                    |
| `fix/*`   | Correcciones                       |
| `chore/*` | Mantenimiento (deps, config)       |

---

_TalachaStats — Tijuana, México_
