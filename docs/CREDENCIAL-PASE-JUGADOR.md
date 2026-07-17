# Credencial del jugador — el pase que da derecho a jugar (vigencia + alcance)

> **Estado:** propuesta de trabajo (jul 2026). La fuente de verdad de posicionamiento sigue siendo `AGENTS.md` §1.5. Este doc define el modelo de datos y el plan de implementación de la **credencial como pase**: la entidad que otorga el **derecho a jugar**, con vigencia y alcance (por liga vs. por organización).
>
> **No confundir con** `docs/CREDENCIAL-CODIGO-JUGADOR.md`: ese doc define `credential_code`, una etiqueta de display por liga para asistencia. Son cosas distintas — ver §1.

---

## 0. El problema (en una frase)

En las ligas amateur la credencial se compra, y hay dos modelos: (a) **desechable** — la compras para una sola liga/torneo y solo sirve ahí (ej. Casa Blanca, jueves); (b) **anual por organización** — la compras una vez y juegas en todas las ligas de esa organización durante un año (ej. Novofut: lunes, miércoles y viernes). Hoy el sistema no modela ese "derecho a jugar": solo tiene la pertenencia a la liga (`league_members`) y un código de display. Falta la entidad **pase**.

## 1. La trampa de terminología — dos "credenciales" distintas

| Concepto                                                | Vive en          | Qué es                                                                                   | Vigencia  | Se paga |
| ------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- | --------- | ------- |
| **Código de credencial** (`credential_code`)            | `league_members` | Etiqueta corta por liga (`0042`) para que el árbitro te ubique en la lista de asistencia | No aplica | No      |
| **Credencial / pase** (`player_credentials`, **nuevo**) | tabla nueva      | El **derecho a jugar**: alcance (liga u organización) + vigencia                         | Sí        | Sí      |

Son capas ortogonales. Por eso la entidad nueva se llama **`player_credentials`** ("pase" / "credencial") y **no** toca `credential_code`. Un jugador con pase anual sigue teniendo un `credential_code` distinto en cada liga donde se inscribe — eso es correcto y esperado.

## 2. La decisión — el pase es una entidad aparte, colgada de `global_players`

El derecho a jugar no vive en la liga ni en el jugador global directamente: vive en un **pase** que pertenece a la identidad global y declara **a qué alcanza** y **hasta cuándo**.

```
global_players (identidad, CURP)            ← ya existe · infinito · anclaje real
      │ 1..N
player_credentials (EL PASE — nuevo)        ← alcance (liga | org) + vigencia
      │ 1..N  autoriza
league_members (pertenencia a liga)         ← ya existe · dorsal, credential_code, asistencia
      │ 1..1
inscriptions (asignación a equipo)          ← ya existe
```

Esto refleja la realidad de Tijuana a escala: **un mismo jugador (mismo CURP) acumula muchos pases** a lo largo del tiempo y entre organizaciones — un anual en Novofut, un desechable en otra liga de otra org, etc. La identidad global es el hilo que los une.

## 3. Los dos modelos, mapeados al pase

| Modelo real                      | `scope`         | `organization_id` | `league_id`        | Vigencia                            | Autoriza                   |
| -------------------------------- | --------------- | ----------------- | ------------------ | ----------------------------------- | -------------------------- |
| **Desechable** (por liga/torneo) | `single_league` | org de la liga    | la liga específica | Mientras la liga esté `active` (§5) | Solo esa liga              |
| **Anual** (por organización)     | `organization`  | la org            | `null`             | `valid_until = valid_from + 1 año`  | Todas las ligas de esa org |

### 3.1 Decisión: el desechable vence al abrir nueva temporada (sin fechas)

`POST /api/leagues/[id]/new-season` **crea una liga nueva** (nuevo `id`; la anterior pasa a `status = 'finished'`) y clona equipos + `league_members` + `inscriptions`. Aprovechamos eso:

- El pase `single_league` está amarrado a `league_id`. Cuando nace la nueva temporada (nuevo `league_id`), **ese pase deja de cubrir** automáticamente — el jugador copiado necesita comprar de nuevo. No hace falta calcular fechas: el fin del torneo = la liga pasa a `finished`.
- El pase `organization` sí cubre la nueva temporada, porque su alcance es la org (incluye cualquier liga suya) mientras siga dentro del año.

Por eso `valid_from`/`valid_until` **solo son obligatorios para `organization`**. Para `single_league` son opcionales y la vigencia real la marca `leagues.status`.

## 4. Modelo de datos

### 4.1 Tabla nueva `player_credentials` (`src/db/schema.ts`)

```ts
export const PLAYER_CREDENTIAL_SCOPES = ["single_league", "organization"] as const;
export const PLAYER_CREDENTIAL_STATUSES = ["active", "expired", "suspended", "cancelled"] as const;

export const playerCredentials = pgTable(
	"player_credentials",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		globalPlayerId: uuid("global_player_id")
			.notNull()
			.references(() => globalPlayers.id, { onDelete: "cascade" }),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		scope: text("scope").notNull().$type<PlayerCredentialScope>(), // 'single_league' | 'organization'
		// Solo set cuando scope = 'single_league'. Null para el pase de organización.
		leagueId: uuid("league_id").references(() => leagues.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("active").$type<PlayerCredentialStatus>(),
		validFrom: date("valid_from"), // requerido para 'organization'
		validUntil: date("valid_until"), // requerido para 'organization' (validFrom + 1 año)
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("player_credentials_global_player_idx").on(t.globalPlayerId),
		index("player_credentials_org_idx").on(t.organizationId),
		index("player_credentials_league_idx").on(t.leagueId),
		// Coherencia scope ↔ campos
		check(
			"chk_credential_scope_shape",
			drizzleSql`(
				(${t.scope} = 'single_league' AND ${t.leagueId} IS NOT NULL)
				OR
				(${t.scope} = 'organization'  AND ${t.leagueId} IS NULL
				 AND ${t.validFrom} IS NOT NULL AND ${t.validUntil} IS NOT NULL)
			)`,
		),
		check(
			"chk_credential_status",
			drizzleSql`${t.status} IN ('active','expired','suspended','cancelled')`,
		),
		// Un solo pase de organización vigente por (jugador, org): evita duplicar el anual.
		// (El de liga puede repetirse entre ligas; el UNIQUE parcial va en la migración SQL.)
	],
);

export type PlayerCredential = typeof playerCredentials.$inferSelect;
export type NewPlayerCredential = typeof playerCredentials.$inferInsert;
```

> **Índice parcial** (en SQL crudo dentro de la migración, Drizzle no lo expresa nativo):
>
> ```sql
> CREATE UNIQUE INDEX uq_org_credential_active
>   ON player_credentials (global_player_id, organization_id)
>   WHERE scope = 'organization' AND status = 'active';
> ```

### 4.2 Columna nueva en `league_members` (`src/db/schema.ts`)

```ts
// Qué pase autoriza esta inscripción a la liga. Nullable durante migración
// y para inscripciones sin pago aún (pendiente de credencial).
credentialId: uuid("credential_id").references(() => playerCredentials.id, {
	onDelete: "set null",
}),
```

`league_members` no cambia en nada más: `dorsal`, `credential_code`, `inscription_date`, asistencia, siloing — todo igual.

### 4.3 Schema Zod (`src/entities/player-credential/model.ts`, nuevo)

Un tipo = un schema Zod (AGENTS.md §7). `scope` discrimina la forma:

```ts
export const PlayerCredentialScopeSchema = z.enum(PLAYER_CREDENTIAL_SCOPES);
export const PlayerCredentialStatusSchema = z.enum(PLAYER_CREDENTIAL_STATUSES);

export const PlayerCredentialSchema = z.object({
	id: z.string().uuid(),
	globalPlayerId: z.string().uuid(),
	organizationId: z.string().uuid(),
	scope: PlayerCredentialScopeSchema,
	leagueId: z.string().uuid().nullable(),
	status: PlayerCredentialStatusSchema,
	validFrom: isoDate.nullable(),
	validUntil: isoDate.nullable(),
	createdAt: z.coerce.date(),
});

// El server decide vigencia y estatus; el cliente solo pide "qué compra".
export const CreatePlayerCredentialSchema = z.discriminatedUnion("scope", [
	z.object({
		scope: z.literal("single_league"),
		globalPlayerId: z.string().uuid(),
		leagueId: z.string().uuid(), // la org se deriva de la liga en el server
	}),
	z.object({
		scope: z.literal("organization"),
		globalPlayerId: z.string().uuid(),
		organizationId: z.string().uuid(),
		// validFrom/validUntil los calcula el server (hoy → +1 año)
	}),
]);
```

## 5. Validación — ¿este jugador puede jugar en la liga L hoy?

Función única, reusada al inscribir (`league_members`) y en cotejo/acta. El jugador está autorizado si existe un `player_credential` suyo que cumpla **todo**:

```
credential.global_player_id = jugador
credential.status = 'active'
Y una de las dos coberturas:
  ── scope = 'organization'
       AND credential.organization_id = L.organization_id
       AND credential.valid_from <= hoy <= credential.valid_until
  ── scope = 'single_league'
       AND credential.league_id = L.id
       AND L.status = 'active'      ← la vigencia del desechable es la vida de la liga
```

Si ninguno cubre → **no autorizado** (bloquear inscripción / marcar alineación indebida). Esta función es el único punto que decide "derecho a jugar"; ni la UI ni otros callsites lo reimplementan.

## 6. Interacción con "Nueva Temporada"

En `POST /api/leagues/[id]/new-season`, al clonar `league_members` a la liga nueva:

1. **No copiar `credential_id`** — se inserta en `null`. La temporada nueva arranca sin pase, igual que arranca disciplinariamente limpia.
2. Tras clonar, correr una **re-vinculación**: por cada `league_member` copiado, buscar un pase `organization` **activo y vigente** del jugador para esa org; si existe, setear `credential_id` a ese pase (el anual cubre la nueva temporada sin recomprar).
3. Los que no tengan pase `organization` vigente quedan con `credential_id = null` → aparecen como **"pendiente de credencial"** hasta que compren el desechable de la nueva temporada.

Esto implementa la decisión 1 sin fechas: el desechable "vence" porque la liga vieja quedó `finished` y la nueva es otro `league_id`.

## 7. Estados y transiciones del pase

- `active` → operativo.
- `expired` → el anual pasó `valid_until`. Un job/servicio (o verificación perezosa al validar) lo mueve a `expired`; también se deriva en la consulta comparando contra hoy.
- `suspended` → congelado por disciplina (independiente de las suspensiones por partidos, que siguen en `suspensions`).
- `cancelled` → anulado (reembolso, error de captura).

**Renovación del anual:** no se edita el pase vencido; se **crea uno nuevo** (`valid_from = hoy`, `valid_until = +1 año`) con el mismo `global_player_id` y `organization_id`. El índice parcial garantiza un solo `organization/active` a la vez.

## 8. Migración / backfill

Para los `league_members` existentes (que hoy no tienen pase):

1. Crear la tabla `player_credentials` y la columna `league_members.credential_id` (nullable).
2. Backfill idempotente (patrón de `drizzle/migrate-to-league-members.ts`): por cada `league_member` en una liga `active`, crear un pase `single_league` retroactivo (`scope='single_league'`, `league_id`, `status='active'`) y apuntar `credential_id` a él. Los `league_members` de ligas `finished` pueden quedar sin pase (histórico) — no afecta validaciones futuras.
3. No inferir pases `organization` automáticamente: el anual es una decisión de negocio/pago, no se adivina del histórico.

## 9. Plan por pasos (un commit por paso)

> Jocobi ejecuta migraciones/tests/commits; el agente solo escribe código. Cada paso cierra con su mensaje conventional-commits. Los pasos de UI abren gate de diseño.

**Paso 1 — Schema + migración.** Tabla `player_credentials` (con check de forma por `scope` e índice parcial `uq_org_credential_active`), columna `league_members.credential_id`. Generar migración Drizzle.
`feat(db): add player_credentials pass entity and credential_id on league_members`

**Paso 2 — Tipos y schema Zod.** `src/entities/player-credential/model.ts` con `PlayerCredentialSchema` + `CreatePlayerCredentialSchema` (discriminado por scope). Re-export desde el barrel de entities (solo `model.ts`, no `queries.ts` — AGENTS.md §7).
`feat(player-credential): add domain model and creation schemas for the pass`

**Paso 3 — Función de autorización.** `canPlayInLeague(player, league, date)` (§5) en `src/features/.../lib/` o `entities/player-credential/lib/`, con tests unitarios de las dos coberturas y los bordes (vencido, liga finished, sin pase).
`feat(player-credential): add pass-based play authorization check`

**Paso 4 — Alta de pase.** Endpoint/handler para crear pase (desechable deriva org de la liga; anual calcula vigencia hoy→+1 año). `notify.success/error` obligatorio (AGENTS.md §7.2b).
`feat(player-credential): issue single-league and annual organization passes`

**Paso 5 — Enganche en inscripción.** Al crear un `league_member`, exigir/enlazar un pase válido vía §5; setear `credential_id`.
`feat(admin-registration): require a valid pass when registering a player into a league`

**Paso 6 — Nueva Temporada.** No copiar `credential_id`; re-vincular pases `organization` vigentes; dejar el resto como "pendiente de credencial" (§6).
`feat(leagues): carry over annual passes and reset single-league passes on new season`

**Paso 7 — Backfill.** Script idempotente que crea pases `single_league` retroactivos para ligas activas (§8).
`chore(db): backfill single-league passes for existing league members`

**Paso 8 — UI.** Estado de credencial en el panel de registro / roster ("vigente", "pendiente", "vencida"), alta/renovación del pase, y bloqueo visible de inscripción sin pase válido. **Gate de diseño: revisar con Jocobi antes de programar UI.**
`feat(admin-registration): surface pass status and gate registration in the UI`

## 10. Fuera de alcance / decisiones abiertas

- **Pago/precio:** este doc modela **solo vigencia y alcance** (decisión de Jocobi). El cobro (monto, pasarela, comprobante) se conecta después vía una referencia de pago en `player_credentials`; no se diseña aquí.
- **Pase anual configurable ≠ 1 año exacto:** default 12 meses; si alguna org quiere temporada fiscal u otra duración, se parametriza sin cambiar el modelo.
- **Verificación de identidad:** la foto/INE sigue anclada a `global_players`/`league_members`; el pase no la duplica.
- **Sanción por alineación indebida:** el motor de disciplina (`suspensions`) es independiente; §5 solo **detecta** la condición "jugó sin pase que cubra la liga" — la política sancionadora se define aparte.
