# Código de credencial del jugador — identidad legible para asistencia

> **Estado:** propuesta de trabajo (jul 2026). Fuente de verdad de posicionamiento sigue siendo `AGENTS.md` §1.5. Este doc define el modelo de datos y el plan de implementación del **código de credencial**: un identificador humano, corto y único por liga que el árbitro usa para tomar asistencia sin depender del dorsal.

---

## 0. El problema (en una frase)

El dorsal no es un identificador confiable: un jugador cambia de camisa, dos jugadores repiten número, y ahí se pierde la precisión de **asistencia** (crítica para liguilla: N partidos jugados) y de goles. Necesitamos un identificador que **no dependa del dorsal** y que el árbitro pueda ubicar rápido en una lista impresa, sin escáneres ni pistolas QR (las ligas amateur no los van a usar).

## 1. La decisión — "Camino 2"

El jugador es una **entidad global** (una persona, un registro en toda la plataforma, anclada en CURP). Pero el **código de credencial no vive en el jugador global**: vive en su **pertenencia a una liga** (`league_members`). Se genera al inscribir al jugador en una liga, es corto (3–4 dígitos), arranca en `1` por cada liga y **nunca se agota globalmente** porque cada liga tiene su propio cajón de números.

Esto separa tres conceptos que hoy se confunden:

| Concepto                                         | Vive en          | Alcance            | Cambia            | Para qué sirve                                                   |
| ------------------------------------------------ | ---------------- | ------------------ | ----------------- | ---------------------------------------------------------------- |
| **Identidad global** (`global_players.id`, UUID) | `global_players` | Toda la plataforma | Nunca             | Identidad real, dedupe cross-org, historial                      |
| **Código de credencial** (`credential_code`)     | `league_members` | Único por liga     | Nunca (inmutable) | Que el árbitro ubique al jugador en la lista para **asistencia** |
| **Dorsal** (`dorsal`)                            | `league_members` | Informativo        | Puede cambiar     | Número de camisa; ya no es identificador                         |

El código **no reemplaza** al UUID interno (ese sigue siendo la llave verdadera e infinita). Es una etiqueta de display para el humano en la cancha.

## 2. Por qué `league_members` es el hogar correcto

- La asistencia se cuenta **dentro de una liga/torneo**, no entre organizaciones → el código pertenece a la inscripción, no a la persona.
- En la vida real las credenciales las emite **cada liga**; el mismo jugador puede traer una credencial `0042` en una liga y `0018` en otra. Eso es exactamente `league_members` (uno por `global_player × league`).
- Ya existe el precedente `matches.cedula` con formato por liga `{LEAGUE_CODE}-{NNNN}` y su generador `assignNextCedula` (MAX+1 + `padStart(4)` dentro de transacción). Reutilizamos ese patrón.

```
global_players (identidad, UUID)         ← infinito, invisible
      │ 1..N
league_members (pertenencia a liga)      ← AQUÍ vive credential_code (único por liga)
      │ 1..1
inscriptions (asignación a equipo)
      │ 1..N
match_player_stats (isPresent = asistencia del partido)
```

## 3. Reglas invariantes

1. **Único por liga.** `UNIQUE(league_id, credential_code)`. Dos jugadores de la misma liga no pueden compartir código.
2. **Inmutable.** Una vez asignado no se edita nunca. No hay UI de cambio.
3. **No se reutiliza.** Si un `league_member` pasa a `inactive`, su código queda quemado — no se reasigna. Esto evita que asistencias/goles históricos se peguen a otra persona.
4. **Generado en el servidor, atómico.** El cliente nunca propone el número; lo asigna el backend al crear el `league_member`.
5. **Secuencial y con relleno de ceros.** Se guarda el entero crudo; el display se rellena a un ancho configurable (default 4 → `0042`). El ancho es solo presentación, no limita la capacidad.

Capacidad: el ancho de display no acota nada (se rellena dinámicamente). Con alcance por liga y ~50 jugadores activos, 3–4 dígitos sobran por décadas aunque nunca se reciclen números.

## 4. Modelo de datos

### 4.1 Columna nueva en `league_members` (`src/db/schema.ts`)

```ts
// dentro de leagueMembers = pgTable("league_members", { ... })
credentialCode: integer("credential_code"), // nullable durante migración; NOT NULL objetivo tras backfill
```

Constraints nuevos en el bloque `(t) => [ ... ]`:

```ts
unique("uq_league_member_credential").on(t.leagueId, t.credentialCode),
check(
  "chk_credential_code_positive",
  drizzleSql`${t.credentialCode} IS NULL OR ${t.credentialCode} >= 1`,
),
```

> Decisión: se guarda **entero** (no texto). El display con ceros se hace en la capa de presentación con `padStart`, igual que el `NNNN` de la cédula. Esto simplifica el `MAX(...) + 1`.

### 4.2 Schema Zod (`src/entities/player/model.ts`)

Añadir al `LeagueMemberSchema` y a `CreateLeagueMemberSchema` **no** se expone en el create (lo genera el server):

```ts
// LeagueMemberSchema
credentialCode: z.number().int().min(1).nullable(),

// CreateLeagueMemberSchema → NO incluir credentialCode:
// el servidor lo asigna con assignNextCredential(). Nunca viene del cliente.
```

### 4.3 Helper de display (`src/entities/player/lib/credential.ts` o `src/lib/`)

```ts
/** Ancho de relleno por defecto para el código de credencial. */
export const CREDENTIAL_PAD_WIDTH = 4;

/** 42 → "0042". null → "—". */
export function formatCredentialCode(code: number | null, width = CREDENTIAL_PAD_WIDTH): string {
	if (code == null) return "—";
	return String(code).padStart(width, "0");
}
```

## 5. Generación del código

Espejo directo de `features/match-resolution/lib/assign-cedula.ts`. Vive junto a la lógica de alta de miembros (p. ej. `src/features/admin-registration/lib/assign-credential.ts` o el feature que cree `league_members`).

```ts
/**
 * Asigna el siguiente credential_code para una liga.
 * MAX(credential_code) + 1 dentro de la MISMA transacción que crea el league_member.
 * El UNIQUE(league_id, credential_code) es la red de seguridad ante carreras.
 */
export async function assignNextCredential(tx: Transaction, leagueId: string): Promise<number> {
	// Serializa por liga para evitar dos altas simultáneas con el mismo número.
	await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${"cred:" + leagueId}))`);

	const [row] = await tx.execute(sql`
    SELECT COALESCE(MAX(credential_code), 0) AS max_code
    FROM league_members
    WHERE league_id = ${leagueId}
  `);

	return Number(row.max_code) + 1;
}
```

Puntos clave:

- Se llama **dentro de la transacción** que inserta el `league_member`, no antes.
- `pg_advisory_xact_lock` serializa las altas concurrentes de la misma liga; el `UNIQUE` cubre el caso extremo (si saltara, reintentar la transacción una vez).
- No se reutilizan huecos: siempre `MAX + 1`, aunque haya códigos "quemados" por miembros inactivos.

## 6. Dónde se dispara

Al crear un `league_member` (alta de jugador en una liga / inscripción). En ese `useMutation`/handler:

1. Abrir transacción.
2. `const code = await assignNextCredential(tx, leagueId)`.
3. Insertar `league_member` con `credentialCode: code`.
4. `notify.success(...)` / `notify.error(...)` obligatorio (AGENTS.md §7.2b).

El código se muestra al oficinista tras el alta y va impreso en la credencial.

## 7. Lista impresa / acta del partido

La lista que usa el árbitro se ordena para búsqueda rápida:

- **Agrupada por equipo**, y dentro de cada equipo **ordenada ascendente por `credential_code`**.
- Columnas: `código (padStart)` · `nombre` · casilla de asistencia.
- El árbitro lee el código de la credencial, salta a esa fila, **confirma la cara** (la foto sigue siendo la prueba real de presencia) y palomea.

Esto alimenta el mismo flujo de resolución que ya existe (`match-resolution`); no cambia la captura, solo acelera la ubicación del jugador.

## 8. Relación con la asistencia (no se toca la captura)

La asistencia ya se persiste en `match_player_stats.isPresent` (por `inscription`, único `(match_id, player_registration_id)`). El código de credencial **no cambia** ese modelo: solo es el puente humano entre la credencial física y la fila correcta. El conteo de "N partidos jugados" para liguilla se sigue derivando de `isPresent`.

## 9. Migración / backfill

Para `league_members` existentes sin código:

- Por cada `league_id`, asignar `credential_code` secuencial (1..n) **ordenando por `inscription_date`, luego `created_at`** (estable y reproducible).
- Tras el backfill, evaluar volver la columna `NOT NULL`.
- Script en `src/db/` siguiendo el patrón de `migrate-to-league-members.ts` (idempotente: no re-numerar quien ya tenga código).

## 10. Plan por pasos (un commit por paso)

> Jocobi ejecuta migraciones/tests/commits; el agente solo escribe código. Cada paso cierra con su mensaje conventional-commits.

**Paso 1 — Schema + migración.** Columna `credential_code`, `UNIQUE(league_id, credential_code)`, check `>= 1`. Generar migración Drizzle.
`feat(db): add credential_code to league_members with per-league unique constraint`

**Paso 2 — Tipos y schema Zod.** `LeagueMemberSchema.credentialCode`; helper `formatCredentialCode` + `CREDENTIAL_PAD_WIDTH`. Solo `model.ts` se re-exporta desde el barrel; `queries.ts` no (AGENTS.md §7).
`feat(player): expose credentialCode in domain model and add display helper`

**Paso 3 — Generador.** `assignNextCredential(tx, leagueId)` con advisory lock + `MAX+1`, espejo de `assign-cedula`.
`feat(admin-registration): generate sequential per-league credential code on member creation`

**Paso 4 — Integración en alta.** Llamar al generador dentro de la transacción de creación del `league_member`; feedback con `notify`.
`feat(admin-registration): assign credential code when registering a player into a league`

**Paso 5 — Backfill.** Script idempotente para `league_members` existentes; luego evaluar `NOT NULL`.
`chore(db): backfill credential_code for existing league members`

**Paso 6 — Lista impresa / credencial.** Mostrar `credentialCode` en la credencial y en el acta impresa (agrupado por equipo, ordenado por código). _Gate de diseño: preguntar a Jocobi por el diseño antes de programar UI._
`feat(match-resolution): show credential code on printable roster grouped by team`

## 11. Fuera de alcance / decisiones abiertas

- **QR / escaneo:** descartado por decisión del usuario (ligas amateur no lo usarán). El código es puramente visual.
- **Ancho de display por org/liga:** default 4; configurable después si alguna org lo pide.
- **Trigger de inmutabilidad en DB:** opcional. Por ahora la inmutabilidad se garantiza no exponiendo UI de edición; evaluar un trigger `BEFORE UPDATE` si hace falta blindar a nivel DB.
- **Alcance por liga vs por organización:** este doc asume **por liga** (números más cortos, arranque en 1 por liga). Si más adelante se quiere un solo código por org across sus ligas, mover el generador a alcance org sin cambiar el resto del diseño.
