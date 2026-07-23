# UNIVERSAL-SEARCH — Buscador universal por organización

> Design doc. Estado: **propuesta, pendiente de aprobación de Jocobi.**
> Fuente de verdad de posicionamiento sigue siendo `AGENTS.md` §1.5. La
> convención de matching de texto ya está declarada en `AGENTS.md` §344 y en
> `shared/lib/normalize.ts` (`f_unaccent() + similarity()`); este doc la lleva
> de "declaración" a implementación real y la extiende a un buscador
> multi-entidad.

## 0. Objetivo de producto

Hoy el home del subdominio tiene un buscador de una sola cosa: equipos
("¿En qué equipo juegas?"). Queremos un **buscador universal por organización**:
que desde un solo campo el aficionado o el organizador encuentre **casi todo lo
de la org** — equipos, ligas, jugadores (en ranking y sancionados), canchas, y
reglamento — con tolerancia a errores de dedo y resultados agrupados y rankeados.

Encaja directo en la capa 3 del producto (identidad de la liga, `AGENTS.md`
§1.5): entre más fácil sea llegar a un perfil de jugador o a una tabla, más se
presume el número y más se consume el contenido. El buscador es un acelerador
del viral loop, no una feature de "gestión" aislada.

**Alcance del término "org":** todo lo que devuelve el buscador está **escopado
a una sola organización** (por `slug`/subdominio). No hay búsqueda abierta a toda
la plataforma. Esto no es un detalle de UX: es una regla de negocio dura
(`AGENTS.md` §14, ver §6 de este doc).

---

## 1. Lo que YA existe (verificado contra el código)

| Pieza                             | Archivo                                                                                                                                                              | Qué hace                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| UI hero search                    | `features/org-home-search/ui/OrgHomeSearch.tsx`                                                                                                                      | Input con debounce 300ms / mín. 2 letras, dropdown de resultados, navega a `/{leagueSlug}`        |
| Hook                              | `features/org-home-search/model/useOrgTeamSearch.ts`                                                                                                                 | `useQuery` con key `queryKeys.organizations.teamSearch`, `staleTime` 30s                          |
| Controlador                       | `app/api/org/[slug]/search-teams/route.ts`                                                                                                                           | Resuelve org por slug, valida mín. 2 chars, llama a la entidad                                    |
| Query                             | `entities/organization/queries.ts` → `searchOrgTeams()`                                                                                                              | `ilike(teams.nameCanonical, '%q%')` acotado a ligas activas de la org, orden por nombre, límite 8 |
| Otros buscadores del mismo patrón | `entities/player/queries.ts` (`searchOrgGlobalPlayers`, `searchDirectoryPlayers`), `features/discipline/ui/PlayerSearchAutocomplete.tsx`, `ranking/PlayerSearch.tsx` | Todos `ilike '%…%'` por columna, cada uno por su lado                                             |

### 1.1 Hallazgos de la revisión (importante)

**Las extensiones fuzzy ya están instaladas, pero el buscador no las usa.**
`package.json` corre `db:sync --ext pg_trgm,unaccent`. Es decir, `pg_trgm`
(similitud de trigramas, tolerancia a typos) y `unaccent` ya viven en la DB. El
buscador actual, en cambio, hace `ilike '%q%'` plano: sin fuzzy, sin ranking.

**La estrategia oficial ya está escrita, solo no implementada.** `AGENTS.md`
§344 y el header de `shared/lib/normalize.ts` dicen textual: "Búsqueda/matching →
`f_unaccent() + similarity()`". Este doc no inventa estrategia nueva: implementa
la que ya es contrato del proyecto.

**Las columnas canónicas ya están pobladas.** `sanitizeToCanonical()` alimenta
`teams.nameCanonical`, `globalPlayers.fullNameCanonical`,
`playerProfiles.normalizedName`, y hay `leagues.nameCanonical`/`slug`. Son las
columnas sobre las que deben ir los índices trgm.

**`ilike '%q%'` no puede usar índice.** El comodín inicial obliga a scan
secuencial. Con pocos equipos por org no se nota; con jugadores a escala de
ciudad sí. Un índice **GIN `gin_trgm_ops`** resuelve esto y además habilita el
fuzzy.

**No hay ranking ni cross-entity.** Cada buscador devuelve una sola entidad
ordenada por nombre. No hay noción de "qué tan bueno es el match" ni de mezclar
equipos + jugadores + ligas en una respuesta.

---

## 2. Estrategias evaluadas

| Estrategia                                        | Fortaleza                                                                                            | Debilidad                                                                              | Veredicto                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| **pg_trgm + `similarity()` + GIN**                | Ya instalado; fuzzy/typos sobre nombres cortos; escala a cientos de miles de filas; cero infra nueva | Menos bueno para texto largo                                                           | **Motor principal**                     |
| **FTS Postgres (`tsvector` + GIN)**               | Ideal para texto largo por palabras (reglamento)                                                     | Pobre para nombres cortos y typos                                                      | **Complemento** solo para reglamento    |
| **Motor externo** (Meilisearch/Typesense/Algolia) | UX de búsqueda premium                                                                               | Infra + sincronización + costo; sobrado para escala de una ciudad y presupuesto actual | **Descartado hoy**, escape hatch futuro |

Decisión: **pg_trgm como motor principal; FTS solo para reglamento; nada externo
por ahora.** Toda la lógica queda detrás de una sola función de servicio para
poder cambiar el almacén interno sin tocar API ni UI (ver §5).

---

## 3. Entidades buscables

| `kind`       | Fuente                                             | Columna de match                  | Navega a                    | Notas de scope                                 |
| ------------ | -------------------------------------------------- | --------------------------------- | --------------------------- | ---------------------------------------------- |
| `team`       | `teams` ⨝ `leagues`                                | `teams.nameCanonical`             | `/{leagueSlug}`             | Ligas activas de la org                        |
| `league`     | `leagues`                                          | `leagues.nameCanonical`           | `/{leagueSlug}`             | Ligas de la org                                |
| `player`     | `globalPlayers` ⨝ `leagueMembers`                  | `globalPlayers.fullNameCanonical` | perfil público del jugador  | **Solo jugadores que la org dio de alta** (§6) |
| `suspension` | `suspensions` ⨝ jugador                            | nombre del sancionado             | ficha/listado de disciplina | Suspensiones de ligas de la org                |
| `venue`      | `venues` / `leagueVenues`                          | `venues.name`                     | detalle de cancha           | Canchas de la org                              |
| `rule`       | `leagueConfig` / `organizationConfig` (reglamento) | texto del reglamento (FTS)        | sección de reglamento       | Config de la org/liga                          |

"Jugadores en ranking" no es una entidad aparte: es el `player` con sus stats de
`playerSeasonStats` / `matchPlayerStats` mostradas en el resultado (badge de
goles, por ejemplo). "Sancionados" sí es `kind` propio porque el intent del
usuario ("¿quién está suspendido?") es distinto al de buscar al jugador.

---

## 4. Modelo de datos e índices

### 4.1 Fase 1 — sin denormalizar (arrancar ya)

No se crea tabla nueva. Se agregan **índices GIN trgm** sobre las columnas
canónicas que realmente se buscan, más un `tsvector` para reglamento. Migración
nueva en `drizzle/migrations/`:

```sql
-- extensiones ya instaladas por db:sync (pg_trgm, unaccent); este bloque es defensivo
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX IF NOT EXISTS teams_name_canonical_trgm
  ON teams USING gin (name_canonical gin_trgm_ops);
CREATE INDEX IF NOT EXISTS global_players_full_name_canonical_trgm
  ON global_players USING gin (full_name_canonical gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leagues_name_canonical_trgm
  ON leagues USING gin (name_canonical gin_trgm_ops);
CREATE INDEX IF NOT EXISTS venues_name_trgm
  ON venues USING gin (name gin_trgm_ops);
-- reglamento: FTS por palabra (columna/idioma a confirmar en §8)
-- CREATE INDEX ... USING gin (to_tsvector('spanish', <col_reglamento>));
```

Nota: si alguna columna canónica pudiera venir con acentos residuales, indexar
sobre `f_unaccent(col)` y buscar sobre `f_unaccent(q)` para simetría. Confirmar
contra `sanitizeToCanonical()` (hoy ya remueve acentos salvo Ñ).

### 4.2 Fase 2 — tabla `search_documents` (cuando escale)

Un solo índice, ranking uniforme, agregar entidades nuevas es trivial:

```
search_documents(
  id, entity_type, entity_id,
  org_id, league_id,          -- para escopar el WHERE
  title, subtitle, canonical,  -- canonical = texto indexado (trgm)
  url, weight,                 -- weight = boost por tipo de entidad
  updated_at
)
  GIN (canonical gin_trgm_ops)
```

Mantenimiento: triggers en las tablas fuente **o** escritura en el write-path de
cada entidad. Se migra por dentro de `searchOrgUniversal` **sin tocar** el API ni
la UI. No construir esto hasta que la Fase 1 muestre límites reales de
rendimiento (ver §7, criterio de disparo).

---

## 5. Arquitectura FSD

El principio: **todo detrás de una sola función de servicio** para que UI y API
no cambien cuando se pase de Fase 1 a Fase 2.

```
features/global-search/
  ui/GlobalSearch.tsx          ← command-palette: input + resultados agrupados por kind + navegación teclado
  ui/GlobalSearchResults.tsx
  model/useUniversalSearch.ts  ← useQuery, key central, debounce 300ms / mín. 2 chars, enabled por longitud
  constants.ts
        │
        ▼
app/api/org/[slug]/search/route.ts   ← controlador delgado (patrón de search-teams):
                                        resuelve org por slug, valida q, parsea ?types=, llama a la entidad
        │
        ▼
entities/search/queries.ts
  searchOrgUniversal(orgId, q, { types?, limit? }): Promise<SearchHit[]>
        │  Fase 1: UNION ALL de una sub-query trgm por entidad, cada rama escopada a la org,
        │          ordenado por similarity() desc; Fase 2: SELECT sobre search_documents.
        ▼
  type SearchHit =
    | { kind: 'team';       id; title; subtitle; url; score }
    | { kind: 'league';     ... }
    | { kind: 'player';     ...; stats? }
    | { kind: 'suspension'; ... }
    | { kind: 'venue';      ... }
    | { kind: 'rule';       ...; snippet }
```

Convenciones que se reusan tal cual: `queryKeys.search.universal(orgSlug, q, types)`
en la fábrica central (§7.3 AGENTS, prohibido armar el array a mano); debounce +
`enabled: q.length >= 2` (patrón actual del hero search); controlador delgado
(§3.2).

**Barrel split (memoria del proyecto):** `entities/search/queries.ts` importa
`@/db` → server-only → **nunca** se re-exporta desde `entities/search/index.ts`.
El `index.ts` solo exporta el tipo `SearchHit` y lo client-safe. Mismo criterio
para `features/global-search/index.ts` (no mezclar data-fetchers server con
UI/hook client-safe).

### 5.1 Ranking

`ORDER BY` compuesto: `similarity(canonical, q)` desc → boost a match
exacto/prefijo → prioridad por tipo (`weight`: p. ej. equipo/liga > jugador >
cancha). Usar umbral trgm (`set_limit(0.2)` o el operador `%`) para cortar ruido.
Límite por tipo y global para que ningún `kind` inunde la respuesta.

---

## 6. Scope y seguridad (no negociable)

Toda rama de la query va escopada a la organización. En especial `player`: aplica
la regla de `AGENTS.md` §14 — una org solo puede encontrar jugadores que **ella
misma** dio de alta (membresía en una de sus ligas o `registeredByOrganizationId`).
Reusar el mismo criterio de scope que `searchOrgGlobalPlayers` / `listOrgPlayers`.
El bug de julio 2026 (búsqueda abierta a todo `global_players`) no se debe
reintroducir por la puerta del buscador universal.

El buscador público del subdominio (aficionado, sin sesión) puede exponer
equipos, ligas, jugadores con perfil público, canchas y reglamento; **no** debe
exponer datos administrativos. Definir en §8 si "sancionados" es público o
requiere sesión de organizador.

---

## 7. Plan por fases

Un commit por paso (memoria del proyecto). Mensajes conventional-commits que
Jocobi ejecuta.

**Fase A — Motor de datos (sin UI)**

1. Migración: índices GIN trgm sobre columnas canónicas + FTS reglamento.
   `feat(db): add trgm/fts indexes for universal search`
2. `entities/search/queries.ts` con `searchOrgUniversal` (equipos + ligas primero).
   `feat(search): universal org search service (teams+leagues)`
3. Agregar ramas `player` (con scope §6), `suspension`, `venue`, `rule`.
   `feat(search): add player/suspension/venue/rule branches`

**Fase B — API + tipos** 4. `app/api/org/[slug]/search/route.ts` + `SearchHit` en barrel client-safe +
`queryKeys.search.universal`.
`feat(api): universal org search endpoint`

**Fase C — UI (gate de diseño: preguntar a Jocobi antes)** 5. `features/global-search` command-palette + hook. Reemplaza o convive con
`org-home-search` (decisión §8).
`feat(search): universal search command palette`

**Fase D — Escala (solo si hace falta)** 6. Tabla `search_documents` + sincronización, migrando el interno de
`searchOrgUniversal`. Disparo: cuando p95 de la búsqueda supere ~150ms con la
Fase 1, medible con `db/simulator/measure-queries.ts`.

---

## 8. Decisiones pendientes (para Jocobi)

1. **¿"Sancionados" es público o solo organizador?** Define si ese `kind` aparece
   en el buscador del aficionado o solo en el de admin.
2. **¿El buscador universal reemplaza al hero de equipos, o convive?** Opción A:
   `OrgHomeSearch` se vuelve el buscador universal. Opción B: el hero sigue
   siendo solo-equipos y el universal vive en el header/⌘K.
3. **Reglamento:** ¿en qué columna/tabla vive el texto hoy (`leagueConfig` /
   `organizationConfig`)? ¿Idioma del `tsvector` (`'spanish'`)? ¿O basta filtrado
   en cliente por ser poco texto por org?
4. **Alcance del match en jugadores:** ¿solo nombre, o también alias/dorsal
   (`buildSearchKey` ya combina nombre::dorsal)?
5. **Superficie de entrada:** ¿solo subdominio público, o también un ⌘K global en
   el shell de admin para el organizador?

---

## 9. Qué NO hace este doc

- No decide UI concreta (colores, layout del command-palette): eso pasa por el
  gate de diseño (Fase C).
- No construye la Fase 2 (`search_documents`) por adelantado: es optimización
  prematura hasta que la Fase 1 muestre el límite.
- No introduce motor de búsqueda externo.
