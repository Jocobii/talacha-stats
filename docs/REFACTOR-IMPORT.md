# Refactor: Pipeline de Importación Excel

**Estado:** En progreso  
**Fecha de inicio:** 2026-04-28  
**Contexto:** [`excel-import-bulk.ts`](../src/lib/excel-import-bulk.ts) acumula 774 líneas con parseo, matching, validación, detección de anomalías y persistencia mezclados. Este documento define la arquitectura objetivo, los contratos de cada módulo y el orden de ejecución del refactor.

---

## Por qué refactorizamos ahora

El importador es el corazón del producto. Antes de construir el motor de detección de anomalías e integridad (que es el siguiente paso crítico de negocio), necesitamos código que:

1. **Sea testeable** — cada módulo se puede probar en aislamiento.
2. **Sea performante** — hoy hay N+1 queries en preview y ~5 queries/jugador en confirm.
3. **Sea extensible** — agregar reglas de anomalías no debe tocar código de persistencia.
4. **Respete la arquitectura FSD** definida en [CLAUDE.md](../CLAUDE.md).

---

## Estado actual vs. estado objetivo

### Archivos actuales (a migrar)

| Archivo | Líneas | Responsabilidades mezcladas |
|---|---|---|
| `src/lib/excel-import-bulk.ts` | 774 | Parseo Excel + fuzzy matching + preview + confirm + snapshots |
| `src/lib/excel-import.ts` | 363 | Parseo evento-partido + matching + confirm (flujo evento por evento) |
| `src/app/api/import/bulk/route.ts` | 122 | Validación Zod + **lógica de exclude_rows** + delegación |
| `src/app/api/import/route.ts` | 58 | Validación + delegación |

### Estructura objetivo (Feature-Sliced Design)

```
src/features/import-excel/
├── parser.ts            # Solo lectura y normalización del buffer Excel
├── resolver.ts          # Fuzzy matching jugadores/equipos contra DB (batch)
├── anomaly-detector.ts  # Motor de reglas estadísticas (sin acceso a DB directo)
├── preview.ts           # Orquesta parser + resolver + anomaly-detector
├── confirm.ts           # Persiste con transacción y batch inserts
└── index.ts             # Re-exports públicos del feature
```

> **Regla de oro durante la migración:** Los archivos en `src/lib/` se mantienen intactos hasta que el nuevo módulo en `features/` pasa sus tests. El route apunta a `lib/` hasta el corte final. No hay big-bang.

---

## Contratos de módulos

### `parser.ts`

**Responsabilidad única:** Recibir un `Buffer` y devolver tipos normalizados. Sin DB, sin red, sin efectos secundarios.

```typescript
// Input
type ParserInput = {
  buffer: Buffer;
  options?: MappedImportOptions; // si viene de template guardado
};

// Output
type ParsedBulkImport =
  | { type: "goleadores"; rows: GoleadoresRow[]; jornada?: number }
  | { type: "standings"; rows: StandingsRow[]; jornada?: number };

// Funciones exportadas
export function parseBulkBuffer(input: ParserInput): Promise<ParsedBulkImport>
```

**Criterios de aceptación:**
- Retorna `ParsedBulkImport` o lanza `ParseError` tipado (nunca `Error` genérico).
- Testeable con fixtures de Excel sin DB.
- Los helpers `str()`, `num()`, `findCol()`, `detectJornada()` son privados a este archivo.

---

### `resolver.ts`

**Responsabilidad única:** Dado un conjunto de nombres crudos, devolver las resoluciones jugador/equipo consultando la DB en batch (sin N+1).

```typescript
// Input
type ResolverInput = {
  playerNames: string[];    // nombres únicos del Excel
  teamNames: string[];      // equipos únicos del Excel
  leagueId: string;
  city: string;
};

// Output
type ResolverOutput = {
  playerResolutions: PlayerResolution[];
  teamMap: Map<string, string | null>; // teamName → teamId | null (nuevo)
};

// Función exportada
export async function resolveImportEntities(input: ResolverInput): Promise<ResolverOutput>
```

**El fix de N+1:**
Hoy `findSimilarPlayers` se llama en un loop secuencial (1 query × N jugadores).
La solución es una **query única con unnest**:

```sql
-- Encuentra similitudes para todos los nombres en una sola query
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
WHERE
  similarity(f_unaccent(p.full_name), f_unaccent(query_name)) > 0.45
  OR (p.alias IS NOT NULL AND similarity(f_unaccent(p.alias), f_unaccent(query_name)) > 0.45)
ORDER BY query_name, score DESC
```

Impacto esperado: de **N queries** a **1 query** para matching, independientemente del tamaño del Excel.

**Criterios de aceptación:**
- Máximo 3 queries para cualquier tamaño de Excel (matching batch, enrich teams, equipos existentes).
- Lógica dominante (DOMINANT_SCORE_MIN / DOMINANT_GAP_MIN) preservada.
- Testeable con mocks de DB.

---

### `anomaly-detector.ts`

**Responsabilidad única:** Recibir stats importadas + historial de snapshots y devolver un reporte de anomalías. **Sin acceso a DB.** Los datos de contexto se pasan como parámetro.

```typescript
// Input
type AnomalyInput = {
  rows: GoleadoresRow[];
  jornada: number;
  // Historial previo: últimos N snapshots por jugador (cargados por preview.ts)
  history: Map<string, PlayerSeasonStatsSnapshot[]>; // playerId → snapshots ordenados
  // Stats de equipos para cross-validation
  teamGoalTotals: Map<string, number>; // teamId → goles totales en standings
};

// Output
type AnomalyLevel = "ok" | "warning" | "critical";

type AnomalyReport = {
  rawName: string;
  level: AnomalyLevel;
  flags: AnomalyFlag[];
};

type AnomalyFlag = {
  rule: "monotonicity" | "delta_spike" | "zscore" | "cross_validation" | "goals_per_game";
  level: AnomalyLevel;
  message: string;
  context: {
    current: number;
    previous?: number;
    average?: number;
    zscore?: number;
    threshold?: number;
  };
};

// Función exportada
export function detectAnomalies(input: AnomalyInput): AnomalyReport[]
```

**Las 5 reglas implementadas:**

| Regla | Trigger warning | Trigger critical |
|---|---|---|
| Monotonicidad | — | `delta < 0` (goles bajaron) |
| Delta spike | `delta ≥ 4` | `delta ≥ 6` |
| Z-score | `Z ≥ 2.5` (necesita ≥ 3 jornadas de historial) | `Z ≥ 4` |
| Cross-validation vs standings | `sum_individual > team_total × 1.1` | `sum_individual > team_total × 1.3` |
| Goles/partido | `ratio > 3.0` | `ratio > 5.0` |

**Criterios de aceptación:**
- Función pura (sin efectos secundarios, sin DB).
- 100% testeable con datos mock.
- Si no hay historial suficiente (< 3 jornadas), las reglas Z-score se omiten silenciosamente.

---

### `preview.ts`

**Responsabilidad única:** Orquestar los tres módulos anteriores y devolver el preview completo con anomalías incluidas.

```typescript
export async function generateBulkPreview(
  parsed: ParsedBulkImport,
  leagueId: string,
): Promise<BulkImportPreview>

// BulkImportPreview se extiende con:
type BulkImportPreview = {
  // ... campos actuales ...
  anomalies?: AnomalyReport[]; // nuevo campo
  hasBlockingAnomalies: boolean; // true si alguna es "critical"
};
```

**Criterios de aceptación:**
- Carga historial de snapshots en **una query batch** (no N queries).
- Delega parsing a `parser.ts`, matching a `resolver.ts`, anomalías a `anomaly-detector.ts`.
- No contiene lógica de DB propia salvo la carga de contexto.

---

### `confirm.ts`

**Responsabilidad única:** Persistir el resultado de una importación confirmada en una transacción.

```typescript
export async function confirmBulkImport(
  payload: BulkConfirmPayload,
): Promise<BulkImportResult>

// BulkConfirmPayload extiende el actual con:
type BulkConfirmPayload = {
  leagueId: string;
  parsed: ParsedBulkImport;
  playerResolutions?: Record<string, string>;
  excludeIndices?: Set<number>; // MOVIDO DESDE route.ts
};
```

**El fix de batch inserts:**

Hoy el loop hace ~5 queries/jugador dentro de la transacción. La estrategia:

```typescript
// 1. Pre-cargar todos los equipos de la liga en UNA query (antes del loop)
const existingTeams = await tx.query.teams.findMany({
  where: eq(teams.leagueId, leagueId),
});
const teamMap = new Map(existingTeams.map(t => [t.name.toLowerCase(), t.id]));

// 2. Resolver todos los playerIds de una vez (antes del loop)
// ... un Map<rawName, playerId> pre-construido

// 3. Bulk insert de stats (un solo insert con array)
await tx.insert(playerSeasonStats).values(allStatsRows)
  .onConflictDoUpdate({ ... });

// 4. Bulk insert de snapshots (un solo insert con array)
await tx.insert(playerSeasonStatsSnapshot).values(allSnapshotRows)
  .onConflictDoUpdate({ ... });
```

Impacto esperado: de **~150 queries** (30 jugadores × 5) a **~8 queries** totales.

**Criterios de aceptación:**
- Máximo 10 queries por importación independientemente del número de jugadores.
- `excludeIndices` manejado aquí, no en el route.
- Rollback completo si cualquier insert falla.
- Registra en `import_audit_log` (tabla pendiente de crear — ver Issue #9).

---

## Orden de implementación (secuencia de issues)

```
#1 [RFC]      Definir contratos y estructura FSD          ← este documento
#2 [Refactor] Crear parser.ts + tests                     ← sin riesgo, sin DB
#3 [Refactor] Crear resolver.ts con batch query           ← fix N+1 crítico
#4 [Refactor] Crear anomaly-detector.ts + tests           ← módulo nuevo, pura función
#5 [Refactor] Crear preview.ts orquestando #2-#4          ← integra todo
#6 [Refactor] Crear confirm.ts con batch inserts          ← fix performance confirm
#7 [Refactor] Limpiar route.ts bulk (< 40 líneas)        ← depende de #5 y #6
#8 [Refactor] Migrar excel-import.ts (flujo evento)       ← mismo patrón, después
#9 [Schema]   Tabla import_audit_log + migración          ← paralelo a #6
#10 [UI]      Mostrar AnomalyReport en pantalla preview   ← depende de #5
```

> Issues #2 y #9 se pueden trabajar en paralelo.
> Issues #3, #4, #5 son secuenciales.
> Issue #7 es el punto de corte — cuando se mergea, `src/lib/excel-import-bulk.ts` se puede eliminar.

---

## Métricas de éxito

| Métrica | Hoy | Objetivo |
|---|---|---|
| Queries en preview (30 jugadores) | ~32 (N+1) | ≤ 5 |
| Queries en confirm (30 jugadores) | ~150 | ≤ 10 |
| Líneas por archivo | 774 (monolito) | ≤ 150 promedio |
| Archivos con tests | 0 | ≥ 4 |
| Anomalías detectadas antes de confirmar | 0 | 5 reglas activas |

---

## Decisiones de arquitectura y razonamiento

**¿Por qué `anomaly-detector.ts` no toca la DB?**
Para que sea testeable unitariamente sin fixtures de base de datos. `preview.ts` es responsable de cargar el contexto histórico y pasarlo como parámetro. Esto respeta la separación de capas y hace las reglas independientes del ORM.

**¿Por qué no bloquear la importación en anomalías críticas?**
En v1, el organizador ve los flags y decide. Bloquear automáticamente genera fricciones con organizadores legítimos que tienen datos correctos pero inusuales (un delantero estrella puede genuinamente meter 5 goles). En v2, con suficiente historial, se puede implementar un flujo de aprobación por `owner`. La arquitectura ya lo contempla con `hasBlockingAnomalies`.

**¿Por qué no migrar `excel-import.ts` (flujo evento-partido) al mismo tiempo?**
El flujo de importación por eventos es menos usado y está más estable. Migrarlo en la misma PR aumenta el riesgo y el diff innecesariamente. Se hace en Issue #8, después de validar el patrón con el flujo bulk.

**¿La query `unnest` para batch matching es compatible con Drizzle?**
No directamente — Drizzle no soporta `unnest` como función de tabla. Se implementa con `db.execute(sql`...`)` igual que las queries de similitud actuales. No es un anti-patrón en este caso: el CLAUDE.md lo permite para operaciones que Drizzle no soporta nativamente.
