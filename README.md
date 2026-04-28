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
9. [Seguridad](#9-seguridad)
10. [Convenciones de código](#10-convenciones-de-código)
11. [Guía para agregar una feature](#11-guía-para-agregar-una-feature)
12. [Estado de migración arquitectónica](#12-estado-de-migración-arquitectónica)

---

## 1. ¿Qué es TalachaStats?

TalachaStats resuelve un problema muy concreto: en las ligas de fútbol amateur locales de México, los jugadores participan en varias ligas a la vez (Liga Lunes, Liga Martes…) y las estadísticas viven en hojas de Excel desconectadas. No hay un perfil consolidado por jugador.

La plataforma tiene **dos caras**:

| Cara | URL | Quién la usa |
|---|---|---|
| Pública | `/`, `/ranking`, `/player/[id]` | Jugadores, familiares, aficionados |
| Admin | `/admin/*` | Organizadores de liga, narrador del Facebook Live |

El **narrador del Facebook Live** es un usuario clave. Antes de cada partido necesita datos contextuales de los dos equipos (racha, goleadores, estadísticas). El módulo `/admin/analisis` y el endpoint `/api/narrator` están diseñados específicamente para él.

---

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Components por defecto |
| Base de datos | **PostgreSQL** + **Drizzle ORM** | Hosted en Supabase |
| Validación | **Zod 4** | Un schema = un tipo, sin duplicación |
| Estilos | **Tailwind CSS 4** | Modo claro forzado, sin dark mode |
| Excel | **ExcelJS** | Reemplazó a `xlsx` por CVEs críticos |
| PDF | **PDFKit** | Exportación del análisis del narrador |
| Lenguaje | **TypeScript 5** (strict) | `any` prohibido |
| Package manager | **pnpm** | |

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
├── lib/                          # ⚠️ Capa legacy — ver §12
│   ├── excel-import.ts
│   ├── excel-import-bulk.ts
│   ├── narrator.ts
│   ├── standings.ts
│   ├── stats.ts
│   └── preview.ts
│
├── shared/                       # Primitivos reutilizables
│   ├── lib/
│   │   ├── auth.ts               # getSessionUser() / getSessionUserFromRequest()
│   │   ├── session.ts            # HMAC-SHA256, sign/verify, cookie helpers
│   │   ├── normalize.ts          # sanitizeName(), titleCase()
│   │   ├── cities.ts             # Lista de ciudades de México
│   │   ├── active-city.ts        # Ciudad activa del admin (cookie)
│   │   ├── pagination.ts
│   │   ├── excel.ts
│   │   └── server-fetch.ts
│   └── ui/
│       ├── Icon.tsx              # Wrapper de lucide-react (strokeWidth=2)
│       ├── PublicNav.tsx
│       ├── PublicFooter.tsx
│       ├── FilterBar.tsx
│       ├── LeagueSelect.tsx
│       ├── CityFilter.tsx
│       ├── Pagination.tsx
│       ├── NavigationProgress.tsx
│       └── TrackVisit.tsx
│
├── db/
│   ├── schema.ts                 # Definición completa del schema Drizzle
│   ├── index.ts                  # Cliente de DB + re-exportaciones
│   ├── migrate.ts
│   ├── views.sql
│   └── migrations/
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

| Tabla | Descripción |
|---|---|
| `users` | Cuentas admin. Roles: `owner` (ve todo) / `organizer` (solo sus ligas) |
| `players` | Identidad global del jugador — independiente de liga o equipo |
| `leagues` | Liga por día/torneo. Tiene `city`, `season`, `status` |
| `teams` | Equipo **siempre scoped a una liga**. "Deportivo" en Liga Lunes ≠ "Deportivo" en Liga Martes |
| `player_registrations` | Pivote jugador ↔ equipo ↔ liga. `UNIQUE(player_id, league_id)` |
| `matches` | Partido entre dos equipos de la misma liga |
| `match_events` | Eventos granulares: `goal`, `assist`, `yellow_card`, `red_card`, `own_goal`, `mvp` |
| `player_season_stats` | Stats acumuladas importadas desde Excel. `UNIQUE(player_id, league_id)`. **Fuente primaria** |
| `player_season_stats_snapshot` | Historial por jornada. Permite progresión y re-importaciones sin romper el historial |
| `team_standings_snapshot` | Tabla de posiciones importada. `UNIQUE(team_id, league_id, jornada)` |
| `import_templates` | Plantillas de mapeo de columnas Excel → campos del sistema |
| `page_views` | Visitas únicas por visitor_id (UUID en cookie) |

### Decisiones de diseño importantes

**Stats: dos fuentes, una prioridad.** Las estadísticas vienen de `player_season_stats` (Excel, prioridad alta) o de `match_events` (partido a partido, fallback). Cuando existen datos en `player_season_stats`, siempre se usan.

**Snapshots acumulados, no deltas.** `player_season_stats_snapshot` guarda stats totales hasta la jornada N. Para saber los goles de la jornada 5: `J5.goals − J4.goals`. Esto permite re-importar sin romper el historial.

**Normalización de nombres.** Todo campo de texto buscable sigue el ciclo: `sanitizeName()` al guardar en DB → `titleCase()` al mostrar en UI → `f_unaccent() + similarity()` para búsqueda en PostgreSQL.

---

## 5. Flujos clave

### Autenticación

El sistema usa sesiones propias con **HMAC-SHA256** (sin NextAuth).

```
Login → POST /api/auth/login
  → verifica email + bcrypt(password)
  → signSession(userId) → token base64url {userId}|{expiresAt}|{hmac}
  → Set-Cookie: ts_session (HttpOnly, SameSite=Strict, 7 días)

Cada request protegido:
  → getSessionUser()             (Server Components)
  → getSessionUserFromRequest()  (API Routes)
  → verifySession(token) → confirma HMAC + expiry + user activo en DB
```

Roles: `owner` (ve y edita todo) / `organizer` (solo sus ligas, verificado con `canManageLeague()`).

### Importación de Excel (flujo bulk)

```
1. Upload del .xlsx en /admin/import
2. POST /api/import/bulk (action=preview)
   → auto-detección del tipo: "goleadores" | "standings"
   → fuzzy matching de nombres de jugadores
   → devuelve preview: rows + player resolutions + warnings

3. El usuario resuelve ambigüedades (jugador nuevo vs. existente)

4. POST /api/import/bulk (action=confirm)
   → upsert en player_season_stats
   → insert en player_season_stats_snapshot (historial)
   → upsert en team_standings_snapshot
   → todo en una transacción
```

### Análisis pre-partido del narrador

`GET /api/narrator?team_a={id}&team_b={id}&league_id={id}` recopila en orden de prioridad: `player_season_stats` → `match_events` → `team_standings_snapshot` → `matches`. Calcula `dangerRating` por jugador (ALTO/MEDIO/BAJO) y exporta a PDF via `POST /api/narrator/export`.

---

## 6. Setup local

### Prerrequisitos

- Node.js 20+
- pnpm
- PostgreSQL (local o Supabase)

### Pasos

```bash
# 1. Clonar e instalar
git clone <repo-url> && cd talachastats
pnpm install

# 2. Variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus valores (ver §7)

# 3. Migraciones
pnpm db:migrate:run

# 4. Crear primer usuario owner (solo primera vez)
# POST /api/auth/setup  →  { secret, email, password, name }
# El SETUP_SECRET está en .env.local

# 5. Levantar
pnpm dev   # http://localhost:3000
```

El panel admin: `http://localhost:3000/admin`

---

## 7. Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL | ✅ |
| `SESSION_SECRET` | Secreto HMAC para tokens de sesión. Mínimo 32 chars | ✅ |
| `SETUP_SECRET` | Contraseña para crear el primer usuario owner | ✅ |
| `NEXT_PUBLIC_BASE_URL` | URL base pública (ej: `https://talachastats.com`) | ✅ |

> **Nunca** subas `.env.local` al repositorio.

---

## 8. Comandos disponibles

```bash
pnpm dev              # Servidor de desarrollo en localhost:3000
pnpm build            # Build de producción
pnpm start            # Servidor de producción
pnpm lint             # ESLint

pnpm db:generate      # Genera migraciones desde el schema (drizzle-kit)
pnpm db:migrate       # Aplica migraciones (desarrollo)
pnpm db:migrate:run   # Corre src/db/migrate.ts (producción)
```

---

## 9. Seguridad

### Escaneo de vulnerabilidades con Trivy

El proyecto usa **Trivy** para escanear dependencias, secretos y misconfigurations de forma automática en cada PR y push.

El workflow `.github/workflows/security.yml` corre en tres pasos:

1. **Tabla legible en logs** — muestra exactamente qué paquete, qué CVE y qué versión lo corrige, antes de fallar
2. **Job Summary** — resumen en Markdown visible directo en la página del workflow (pestaña "Summary"), sin necesidad de abrir los logs
3. **Enforce + SARIF** — falla el pipeline si hay `CRITICAL` o `HIGH` con fix disponible; sube resultados a la pestaña **Security → Code scanning** del repo

Adicionalmente, todos los lunes a las 8am corre un escaneo completo incluyendo `MEDIUM` que reporta sin bloquear.

### Qué hacer cuando el pipeline falla por Trivy

**1. Ir a la pestaña "Summary" del workflow run** — ahí está el resumen con el detalle del CVE.

**2. Ver la tabla en los logs** del paso "Show vulnerabilities" — muestra Package, CVE, Severity, versión instalada y versión con fix.

**3. Actualizar el paquete** si hay una versión con fix disponible:
```bash
pnpm update <paquete>
# o forzar versión específica en package.json y correr pnpm install
```

**4. Si el paquete afectado es una dependencia transitiva** (no está en tu `package.json` directamente), tienes dos opciones:

```jsonc
// Opción A: override en package.json (si el salto de versión es compatible)
"pnpm": {
  "overrides": {
    "paquete-vulnerable": ">=version-con-fix"
  }
}
```

```
# Opción B: suprimir en .trivyignore si el fix no es compatible
# → OBLIGATORIO documentar por qué y cuándo revisar
```

### El archivo `.trivyignore`

`.trivyignore` contiene CVEs suprimidos con justificación. **Toda entrada debe explicar:**
- Por qué no se puede parchear ahora
- Cuándo revisar o quitar la excepción

```
# ✅ Entrada válida — tiene contexto y plan
# GHSA-xxxxx: uuid@8 requerido por exceljs@4. Fix requiere uuid v14 (breaking).
# Revisar cuando exceljs soporte uuid >= 14.
GHSA-xxxxx

# ❌ Entrada inválida — sin justificación
GHSA-yyyyy
```

Agregar una entrada sin comentario es equivalente a parchear un bug sin entender por qué falla.

### Historial de decisiones de seguridad relevantes

| Decisión | Motivo |
|---|---|
| `exceljs` reemplazó a `xlsx` | `xlsx` tenía CVEs de alta severidad sin parche disponible |
| `uuid@8` suprimido en `.trivyignore` | Dependencia transitiva de `exceljs`. Fix requiere uuid v14, incompatible con exceljs@4 |
| Sesiones HMAC propias (sin NextAuth) | Control total del ciclo de vida del token, sin dependencias adicionales |
| `postcss` pinneado via `pnpm.overrides` | CVE de alta severidad en versiones < 8.5.10 |

---

## 10. Convenciones de código

### Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos de lógica | `kebab-case` | `excel-import-bulk.ts` |
| Componentes React | `PascalCase` | `NarratorPanel.tsx` |
| Funciones | `camelCase` | `getLeagueStandings()` |
| Tipos y schemas Zod | `PascalCase` | `PlayerStats`, `CreateLeagueSchema` |
| Rutas API | `kebab-case` | `/api/top-scorers` |
| Columnas DB | `snake_case` | `full_name`, `league_id` |
| Variables TS | `camelCase` | `leagueId`, `homeScore` |

### TypeScript

- `strict: true` siempre
- Prohibido `any` — usar `unknown` + narrowing
- Tipos de retorno explícitos en `features/` y `entities/`
- Preferir `type` sobre `interface`

### API Routes — patrón obligatorio

```typescript
// ✅ CORRECTO — validar + llamar feature + responder
export async function GET(request: Request) {
  const leagueId = new URL(request.url).searchParams.get("league_id");
  if (!leagueId) return apiError("Falta league_id", 400);
  const standings = await getLeagueStandings(leagueId);
  return apiSuccess(standings);
}
```

### Responses

```typescript
return apiSuccess(data);         // { ok: true, data }
return apiSuccess(data, 201);    // crear recurso
return apiError("mensaje", 400); // { ok: false, error }
```

### Normalización de nombres

Antes de insertar en DB → `sanitizeName()`. Para mostrar en UI → `titleCase()`. Nunca guardar un nombre sin normalizar.

---

## 11. Guía para agregar una feature

1. **Modelo** — `entities/[nombre]/model.ts` — tipos + schema Zod
2. **Queries** — `entities/[nombre]/queries.ts` — acceso a DB con tipos explícitos
3. **Lógica** — `features/[nombre]/` — orquestar queries, transacciones aquí
4. **Endpoint** — `app/api/[ruta]/route.ts` — validar + llamar feature + responder
5. **UI** — Server Component por defecto, Client solo si hay estado interactivo
6. **Menú** — actualizar `app/admin/layout.tsx` si aplica

### Naming de endpoints

```
GET    /api/[recurso]            → listar
POST   /api/[recurso]            → crear
GET    /api/[recurso]/[id]       → detalle
PATCH  /api/[recurso]/[id]       → actualizar parcialmente
DELETE /api/[recurso]/[id]       → eliminar
POST   /api/[recurso]/[accion]   → acción especial (/merge, /confirm)
```

---

## 12. Estado de migración arquitectónica

El proyecto está en migración de `lib/` plana hacia FSD completo. La migración ocurre archivo por archivo cuando se toca cada módulo — no hay refactor masivo planeado.

| Archivo | Estado | Destino objetivo |
|---|---|---|
| `src/lib/excel-import-bulk.ts` | Legacy en uso activo | `features/import-excel/` |
| `src/lib/excel-import.ts` | Legacy (formato antiguo) | `features/import-excel/` |
| `src/lib/narrator.ts` | Legacy en uso activo | `features/narrator-analysis/` |
| `src/lib/standings.ts` | Legacy | `features/standings/` |
| `src/lib/stats.ts` | Legacy | `features/player-stats/` |
| `src/lib/preview.ts` | Legacy | `features/match-preview/` |
| `src/features/narrator-analysis/` | **FSD ✅** | ya migrado |
| `src/entities/player/` | **FSD ✅** | ya migrado |
| `src/entities/user/` | **FSD ✅** | ya migrado |

**Regla:** si tocas un archivo legacy, migralo en ese mismo PR. No crees funciones nuevas en `src/lib/`.

---

## Ramas de git

| Rama | Propósito |
|---|---|
| `master` | Producción estable |
| `dev` | Desarrollo activo — hacer PRs aquí |
| `feat/*` | Features nuevas |
| `fix/*` | Correcciones |
| `chore/*` | Mantenimiento (deps, config) |

---

*TalachaStats — Tijuana, México*
