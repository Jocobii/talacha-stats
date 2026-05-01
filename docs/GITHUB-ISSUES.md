# GitHub Issues — Refactor Pipeline de Importación

Copia y pega cada bloque como un issue en https://github.com/users/Jocobii/projects/2

**Labels a crear antes de empezar:**

- `refactor` (color: #e4e669)
- `feature` (color: #0075ca)
- `schema` (color: #d4edda)
- `ui` (color: #bfd4f2)
- `tests` (color: #f9d0c4)
- `epic` (color: #7057ff)
- `blocked` (color: #d93f0b)
- `performance` (color: #e99695)

**Milestones a crear:**

- `v1 — Refactor Import` (sin fecha límite por ahora)
- `v1 — Integridad de Datos`

---

## Issue #1 — [RFC] Arquitectura FSD para features/import-excel

**Labels:** `epic`, `refactor`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —

---

### Contexto

El archivo `src/lib/excel-import-bulk.ts` tiene 774 líneas y mezcla 5 responsabilidades distintas: parseo de Excel, fuzzy matching contra DB, generación de preview, detección de anomalías y persistencia. El archivo `excel-import.ts` agrega otras 363 líneas con el mismo problema. El `route.ts` de bulk tiene lógica de negocio (filtrado de `exclude_rows`) que debería estar en la capa de features.

Este issue documenta la arquitectura aprobada y sirve como tracking del conjunto de issues que lo implementan.

### Decisión

Migrar a Feature-Sliced Design con la siguiente estructura:

```
src/features/import-excel/
├── parser.ts            # Solo lectura y normalización del buffer Excel
├── resolver.ts          # Fuzzy matching jugadores/equipos contra DB (batch)
├── anomaly-detector.ts  # Motor de reglas estadísticas (función pura, sin DB)
├── preview.ts           # Orquesta parser + resolver + anomaly-detector
├── confirm.ts           # Persiste con transacción y batch inserts
└── index.ts             # Re-exports públicos
```

### Documento de referencia

Ver [`docs/REFACTOR-IMPORT.md`](./REFACTOR-IMPORT.md) para contratos completos de cada módulo.

### Issues hijos (este epic se cierra cuando todos estén merged)

- [ ] #2 — Crear `parser.ts` + tests
- [ ] #3 — Crear `resolver.ts` con batch query (fix N+1)
- [ ] #4 — Crear `anomaly-detector.ts` + tests
- [ ] #5 — Crear `preview.ts` orquestando parser + resolver + detector
- [ ] #6 — Crear `confirm.ts` con batch inserts
- [ ] #7 — Limpiar `route.ts` bulk (< 40 líneas)
- [ ] #8 — Migrar `excel-import.ts` (flujo evento-partido)
- [ ] #9 — Tabla `import_audit_log` + migración
- [ ] #10 — Mostrar `AnomalyReport` en UI de preview

### Criterio de cierre

`src/lib/excel-import-bulk.ts` eliminado del repo y todos los issues hijos en estado `Done`.

---

## Issue #2 — [Refactor] Crear parser.ts — separar parseo Excel de lógica de negocio

**Labels:** `refactor`, `tests`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —  
**Bloqueado por:** #1

---

### Qué hay que hacer

Extraer toda la lógica de lectura y normalización del Excel de `excel-import-bulk.ts` a un nuevo archivo `src/features/import-excel/parser.ts`.

### Alcance exacto (qué se mueve)

Mover de `excel-import-bulk.ts` a `parser.ts`:

- `parseBulkExcel(buffer)` → renombrar a `parseBulkBuffer({ buffer, options? })`
- `parseBulkExcelMapped(buffer, options)` → integrar en `parseBulkBuffer`
- `tryParseGoleadores(rows, jornada)` → función privada del módulo
- `tryParseStandings(rows, jornada)` → función privada del módulo
- `detectJornada(sheetName, sheet)` → función privada del módulo
- `detectZone(row)` → función privada del módulo
- `findCol(keys, candidates)` → función privada del módulo
- Helpers `str()` y `num()` → funciones privadas del módulo

### Lo que NO se mueve en este issue

- Lógica de DB (queda en `resolver.ts` y `confirm.ts`)
- Lógica de matching (queda en `resolver.ts`)

### Contrato del módulo

```typescript
// src/features/import-excel/parser.ts

export type ParserInput = {
	buffer: Buffer;
	options?: MappedImportOptions;
};

export async function parseBulkBuffer(input: ParserInput): Promise<ParsedBulkImport>;
```

### Tests requeridos

Crear `src/features/import-excel/__tests__/parser.test.ts` con fixtures de archivos Excel reales (o buffers sintéticos):

- [ ] Parsea correctamente un Excel de goleadores con columnas estándar
- [ ] Parsea con mapeo manual de columnas (`MappedImportOptions`)
- [ ] Auto-detecta jornada desde el nombre de la hoja
- [ ] Filtra filas vacías y filas de encabezado repetido
- [ ] Lanza `ParseError` tipado si no se reconoce el formato
- [ ] Los nombres pasan por `sanitizeName` antes de salir del parser

### Criterio de aceptación

- [ ] `parser.ts` existe y exporta `parseBulkBuffer`
- [ ] Todos los tests pasan (`pnpm test parser`)
- [ ] `excel-import-bulk.ts` sigue funcionando sin cambios (no se toca todavía)
- [ ] No hay imports de `@/db` en `parser.ts`

---

## Issue #3 — [Refactor] Crear resolver.ts — batch fuzzy matching sin N+1

**Labels:** `refactor`, `performance`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —  
**Bloqueado por:** #2

---

### El problema actual

En `generateBulkPreview`, por cada jugador del Excel se ejecuta `findSimilarPlayers()` de forma secuencial. Con 30 jugadores son 30 queries SQL de `pg_trgm similarity` corriendo en serie. Cada una hace un full-scan con similitud trigrama — son lentas. Resultado: el preview tarda varios segundos.

### Qué hay que hacer

Crear `src/features/import-excel/resolver.ts` con una query única que resuelve **todos los jugadores en una sola roundtrip** usando `unnest`.

### La query batch

```sql
SELECT
  query_name,
  p.id,
  p.full_name,
  p.alias,
  GREATEST(
    similarity(f_unaccent(p.full_name), f_unaccent(query_name)),
    COALESCE(similarity(f_unaccent(p.alias), f_unaccent(query_name)), 0)
  ) AS score
FROM unnest($1::text[]) AS query_name
CROSS JOIN players p
WHERE (
  similarity(f_unaccent(p.full_name), f_unaccent(query_name)) > 0.45
  OR (p.alias IS NOT NULL AND similarity(f_unaccent(p.alias), f_unaccent(query_name)) > 0.45)
)
AND EXISTS (
  SELECT 1 FROM player_registrations pr
  JOIN leagues l ON l.id = pr.league_id
  WHERE pr.player_id = p.id AND l.city = $2
)
ORDER BY query_name, score DESC
```

> Nota: usar `db.execute(sql`...`)` ya que Drizzle no soporta `unnest` como función de tabla. Ver CLAUDE.md — permitido para operaciones no soportadas por Drizzle.

### Contrato del módulo

```typescript
// src/features/import-excel/resolver.ts

export type ResolverInput = {
	playerNames: string[];
	teamNames: string[];
	leagueId: string;
	city: string;
};

export type ResolverOutput = {
	playerResolutions: PlayerResolution[];
	teamMap: Map<string, string | null>; // nombre normalizado → teamId existente | null
};

export async function resolveImportEntities(input: ResolverInput): Promise<ResolverOutput>;
```

### Queries permitidas (máximo 3 total)

1. Batch similarity de jugadores (unnest query)
2. Enrich con equipos activos por IDs (ya existe, es batch)
3. Equipos existentes en la liga (una query con `inArray`)

### Criterio de aceptación

- [ ] `resolver.ts` existe y exporta `resolveImportEntities`
- [ ] Preview de 30 jugadores: máximo **3 queries** a la DB (verificar con logs de Drizzle)
- [ ] La lógica DOMINANT_SCORE_MIN / DOMINANT_GAP_MIN se preserva
- [ ] `excel-import-bulk.ts` sigue sin tocarse

---

## Issue #4 — [Refactor] Crear anomaly-detector.ts — motor de reglas estadísticas

**Labels:** `refactor`, `feature`, `tests`  
**Milestone:** v1 — Integridad de Datos  
**Assignees:** —  
**Bloqueado por:** #1

---

### Qué hay que hacer

Crear `src/features/import-excel/anomaly-detector.ts`. Este módulo es una **función pura** — no hace queries a la DB, recibe todo el contexto como parámetros.

### Las 5 reglas a implementar

**Regla 1 — Monotonicidad**
Los goles acumulados nunca pueden bajar entre jornadas.

- Critical: `delta < 0`

**Regla 2 — Delta spike**
Goles atribuidos en una sola jornada fuera de rango para fútbol amateur.

- Warning: `delta >= 4`
- Critical: `delta >= 6`

**Regla 3 — Z-score por jugador**
Comparar el delta de esta jornada contra el historial personal del jugador.
Fórmula: `Z = (delta_actual − media_histórica) / desviación_estándar`
Requiere mínimo 3 jornadas de historial. Si no hay suficiente, se omite silenciosamente.

- Warning: `Z >= 2.5`
- Critical: `Z >= 4.0`

**Regla 4 — Cross-validation vs standings**
La suma de goles individuales de un equipo no puede superar los goles a favor del equipo en la tabla de posiciones.

- Warning: `sum_individual > team_total × 1.1`
- Critical: `sum_individual > team_total × 1.3`

**Regla 5 — Ratio goles/partidos**
`ratio = goals / matchesPlayed` (solo si `matchesPlayed > 0`)

- Warning: `ratio > 3.0`
- Critical: `ratio > 5.0`

### Contrato del módulo

```typescript
// src/features/import-excel/anomaly-detector.ts

export type AnomalyLevel = "ok" | "warning" | "critical";

export type AnomalyFlag = {
	rule: "monotonicity" | "delta_spike" | "zscore" | "cross_validation" | "goals_per_game";
	level: AnomalyLevel;
	message: string; // descripción legible para el admin
	context: {
		current: number;
		previous?: number;
		average?: number;
		zscore?: number;
		threshold?: number;
	};
};

export type AnomalyReport = {
	rawName: string;
	level: AnomalyLevel; // el nivel más alto de sus flags
	flags: AnomalyFlag[];
};

export type AnomalyInput = {
	rows: GoleadoresRow[];
	jornada: number;
	history: Map<string, PlayerSeasonStatsSnapshot[]>; // playerId → snapshots ordenados asc
	playerIdMap: Map<string, string>; // rawName → playerId
	teamGoalTotals: Map<string, number>; // teamId → goles_a_favor de standings
	teamIdMap: Map<string, string>; // rawName equipo → teamId
};

export function detectAnomalies(input: AnomalyInput): AnomalyReport[];
```

### Tests requeridos

Crear `src/features/import-excel/__tests__/anomaly-detector.test.ts`:

- [ ] Jugador con delta negativo → Critical (monotonicidad)
- [ ] Jugador con 7 goles en una jornada → Critical (delta spike)
- [ ] Jugador con Z-score > 4 → Critical (zscore)
- [ ] Jugador con Z-score 3.0 pero historial < 3 jornadas → sin flag de zscore
- [ ] Suma de goles individuales > total del equipo × 1.3 → Critical (cross_validation)
- [ ] Jugador sin anomalías → AnomalyReport con level "ok" y flags vacíos
- [ ] Función pura: misma entrada siempre produce misma salida

### Criterio de aceptación

- [ ] `anomaly-detector.ts` existe y exporta `detectAnomalies`
- [ ] Todos los tests pasan
- [ ] **Cero imports de `@/db`** en el archivo
- [ ] La función es síncrona (no `async`)

---

## Issue #5 — [Refactor] Crear preview.ts — orquestar sin lógica de negocio

**Labels:** `refactor`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —  
**Bloqueado por:** #2, #3, #4

---

### Qué hay que hacer

Crear `src/features/import-excel/preview.ts` que orqueste los tres módulos anteriores. Este archivo puede hacer queries a la DB, pero solo para cargar el **contexto** necesario (historial de snapshots, totales de standings). Toda la lógica se delega.

### Contrato

```typescript
export async function generateBulkPreview(
	parsed: ParsedBulkImport,
	leagueId: string,
): Promise<BulkImportPreview>;

// BulkImportPreview extendido:
type BulkImportPreview = {
	type: BulkImportType;
	jornada?: number;
	rows: GoleadoresRow[] | StandingsRow[];
	playerResolutions?: PlayerResolution[];
	warnings: string[];
	summary: { players?: number; teams?: number; totalGoals?: number };
	anomalies?: AnomalyReport[]; // NUEVO
	hasBlockingAnomalies: boolean; // NUEVO — true si alguna es "critical"
};
```

### Queries permitidas en preview.ts (máximo 5 total)

1. Liga → obtener `city` (ya existe)
2. `resolveImportEntities()` — delega a resolver.ts (usa sus 3 queries)
3. Historial de snapshots para los jugadores resueltos — **una query batch** con `inArray(playerId, ids)`
4. Totales de standings del equipo — una query

### Criterio de aceptación

- [ ] `preview.ts` exporta `generateBulkPreview` con la nueva firma
- [ ] El campo `anomalies` está presente en la respuesta para importaciones tipo "goleadores"
- [ ] Máximo 5 queries totales en un preview de 30 jugadores

---

## Issue #6 — [Refactor] Crear confirm.ts — batch inserts en transacción

**Labels:** `refactor`, `performance`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —  
**Bloqueado por:** #5

---

### El problema actual

`confirmBulkImport` en `excel-import-bulk.ts` ejecuta dentro de una transacción un loop que hace ~5 queries por jugador: buscar equipo, insertar equipo si no existe, insertar registration, upsert stats, upsert snapshot. Con 30 jugadores: ~150 queries en una sola transacción.

### La solución — pre-cargar y batch insert

```typescript
// ANTES (150 queries para 30 jugadores)
for (const row of rows) {
  const team = await tx.query.teams.findFirst(...);  // query
  if (!team) await tx.insert(teams)...;              // query
  await tx.insert(playerRegistrations)...;           // query
  await tx.insert(playerSeasonStats)...;             // query
  await tx.insert(playerSeasonStatsSnapshot)...;     // query
}

// DESPUÉS (8 queries totales independiente del tamaño)
const existingTeams = await tx.query.teams.findMany(...);  // 1 query — todos los equipos de la liga
const newTeamNames = computeNewTeams(rows, existingTeams); // cálculo en memoria
if (newTeamNames.length) await tx.insert(teams).values(newTeamNames); // 1 query bulk
await tx.insert(playerRegistrations).values(allRegistrations).onConflictDoNothing(); // 1 query bulk
await tx.insert(playerSeasonStats).values(allStats).onConflictDoUpdate(...);         // 1 query bulk
await tx.insert(playerSeasonStatsSnapshot).values(allSnaps).onConflictDoUpdate(...); // 1 query bulk
```

### Lo que se mueve desde route.ts

La lógica de `exclude_rows` (parseo de keys "g:{index}:{nombre}", filtrado de rows) debe moverse a `confirm.ts` como parte del `BulkConfirmPayload`:

```typescript
export type BulkConfirmPayload = {
	leagueId: string;
	parsed: ParsedBulkImport;
	playerResolutions?: Record<string, string>;
	excludeIndices?: Set<number>; // MOVIDO DESDE route.ts
};
```

### Criterio de aceptación

- [ ] `confirm.ts` exporta `confirmBulkImport`
- [ ] Preview de 30 jugadores: máximo **10 queries** dentro de la transacción
- [ ] `excludeIndices` manejado en `confirm.ts`, no en el route
- [ ] Rollback completo verificado: si un insert falla, nada se persiste

---

## Issue #7 — [Refactor] Limpiar route.ts bulk — solo validar y delegar

**Labels:** `refactor`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —  
**Bloqueado por:** #5, #6  
**Este issue elimina `src/lib/excel-import-bulk.ts`**

---

### Qué hay que hacer

Una vez que `preview.ts` y `confirm.ts` existen y están testeados, simplificar `src/app/api/import/bulk/route.ts` a:

1. Parsear y validar `FormData` con Zod
2. Llamar `parseBulkBuffer` (de `parser.ts` via `index.ts`)
3. Si `action === "preview"` → llamar `generateBulkPreview`
4. Si `action === "confirm"` → llamar `confirmBulkImport`
5. Retornar `apiSuccess` o `apiError`

El archivo no debe superar **40 líneas**. La lógica de `exclude_rows` ya estará en `confirm.ts`.

### Criterio de aceptación

- [ ] `route.ts` tiene ≤ 40 líneas
- [ ] **Cero lógica de negocio** en el route
- [ ] Se eliminan los imports de `@/lib/excel-import-bulk`
- [ ] El archivo `src/lib/excel-import-bulk.ts` se elimina del repo en este PR
- [ ] Smoke test manual: importar un Excel de goleadores end-to-end sin errores

---

## Issue #8 — [Refactor] Migrar excel-import.ts (flujo evento-partido)

**Labels:** `refactor`  
**Milestone:** v1 — Refactor Import  
**Assignees:** —  
**Bloqueado por:** #7

---

### Qué hay que hacer

Aplicar el mismo patrón de FSD al flujo de importación por eventos de partido (`excel-import.ts`). Este flujo es menos crítico que el bulk, pero tiene los mismos problemas de arquitectura.

La estructura objetivo:

```
src/features/import-match/
├── parser.ts       # Parseo de hoja Eventos y Resultados
├── resolver.ts     # Matching de jugadores para flujo de eventos
├── confirm.ts      # Inserción de match_events en transacción
└── index.ts
```

### Criterio de aceptación

- [ ] `src/lib/excel-import.ts` eliminado del repo
- [ ] `src/app/api/import/route.ts` reducido a ≤ 30 líneas

---

## Issue #9 — [Schema] Tabla import_audit_log + migración

**Labels:** `schema`, `feature`  
**Milestone:** v1 — Integridad de Datos  
**Assignees:** —  
**Bloqueado por:** #1 (puede trabajarse en paralelo con #2)

---

### Por qué es necesario

Hoy cuando alguien importa con datos inflados o erróneos, no hay manera de saber quién importó, cuándo, qué cambió ni revertirlo. Un log de auditoría es el requisito mínimo para operar la plataforma con confianza.

### Schema propuesto

```sql
CREATE TABLE import_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id    UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  imported_by  UUID REFERENCES users(id) ON DELETE SET NULL,  -- null si fue anónimo
  import_type  TEXT NOT NULL,   -- 'goleadores' | 'standings'
  jornada      INTEGER,
  rows_upserted INTEGER NOT NULL DEFAULT 0,
  rows_created  INTEGER NOT NULL DEFAULT 0,
  has_anomalies BOOLEAN NOT NULL DEFAULT false,
  anomaly_count INTEGER NOT NULL DEFAULT 0,   -- cuántas flags se detectaron
  confirmed_with_criticals BOOLEAN NOT NULL DEFAULT false, -- confirmó a pesar de anomalías críticas
  payload_hash  TEXT,           -- SHA-256 del payload JSON para detectar re-importaciones idénticas
  imported_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX audit_league_idx ON import_audit_log(league_id);
CREATE INDEX audit_imported_at_idx ON import_audit_log(imported_at DESC);
```

### En Drizzle (schema.ts)

Agregar la tabla `importAuditLog` con los mismos campos en `src/db/schema.ts`.

### Criterio de aceptación

- [ ] Migración SQL creada en `src/db/migrations/`
- [ ] Tabla agregada a `src/db/schema.ts`
- [ ] `confirmBulkImport` en `confirm.ts` (Issue #6) inserta en esta tabla al final de la transacción

---

## Issue #10 — [UI] Mostrar AnomalyReport en pantalla de preview

**Labels:** `ui`, `feature`  
**Milestone:** v1 — Integridad de Datos  
**Assignees:** —  
**Bloqueado por:** #5

---

### Qué hay que hacer

La respuesta del preview ya incluirá `anomalies: AnomalyReport[]`. Mostrar esa información en `src/app/admin/import/page.tsx` con indicadores visuales claros.

### Diseño sugerido

Para cada jugador en la lista de resoluciones, agregar un indicador de nivel:

- Sin anomalía → sin badge
- Warning → badge amarillo con ícono de alerta y tooltip con el mensaje
- Critical → badge rojo, la fila resaltada, y el texto del flag expandido (no solo tooltip)

Si `hasBlockingAnomalies === true`, mostrar un banner en el top de la pantalla:

```
⚠️ Esta importación contiene X estadísticas marcadas como críticas.
   Puedes continuar, pero quedará registrado en el historial de auditoría.
   [Ver detalles] [Cancelar] [Confirmar de todas formas]
```

### Criterio de aceptación

- [ ] Jugadores con anomalías muestran badge con nivel correcto
- [ ] El mensaje de cada flag es legible (viene del `anomaly-detector.ts`)
- [ ] El banner aparece cuando `hasBlockingAnomalies === true`
- [ ] Confirmar con anomalías críticas funciona (no bloquea, solo advierte)
- [ ] Sin regresiones visuales en el flujo normal (sin anomalías)
