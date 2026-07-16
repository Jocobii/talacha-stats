# Motor de cobros (Finanzas) — arquitectura del engine

> **Estado:** especificación de arquitectura (jul 2026). Fuente de verdad **técnica** del
> motor de finanzas. Implementa la **Épica C** de `docs/MODULOS-GESTION-LIGA.md`; ese doc
> es el mapa de producto (por qué y en qué orden), este es el contrato de ingeniería (cómo).
> Si hay conflicto sobre convenciones generales del codebase, manda `AGENTS.md`.

> **Regla de lectura:** todo paso de la Épica C (C1–C9) y de la Épica E (Niveles 1-2)
> debe cumplir los **principios P1–P8** de la §2. Un PR de finanzas que viole un principio
> se rechaza aunque "funcione".

---

## 1. Qué problema resuelve y qué NO

### 1.1 El problema

En una liga real **todo se cobra**: registrar un equipo, sacar la credencial de cada
jugador, rentar el horario fijo de la liga, rentar una cancha suelta para ir a jugar con
amigos (sin liga de por medio), el arbitraje, e incluso una fianza de fondo por si un
equipo deja de presentarse. Hoy eso vive en el cuaderno o en un Excel del organizador,
sin precisión y sin rastro.

El motor sustituye ese cuaderno con **una sola pieza reutilizable** que cualquier módulo
puede invocar para cobrar, sin escribir lógica financiera nueva cada vez. La meta explícita
de Jocobi: **agregar un cobro nuevo debe ser una fila de catálogo, no código nuevo.**

### 1.2 Alcance por nivel (gate por `finance_level`)

El motor es el mismo en los tres niveles; lo que cambia es qué conceptos/triggers/vistas
se prenden. `league_config.finance_level` (0 | 1 | 2) es el interruptor.

| Nivel | Qué habilita                                                                                                                            | Tablas nuevas                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **0** | "¿Quién debe?" — catálogo de conceptos + cuentas de cobro + ledger (cargo, abono en efectivo, saldo). Incluye rentas sueltas de cancha. | `fee_concepts`, `billing_accounts`, `ledger_entries`, `finance_events` |
| **1** | Fianza (depósito castigable por sanción), arbitraje (cuenta por pagar al árbitro), egresos.                                             | **ninguna** — conceptos/triggers nuevos                                |
| **2** | Cierre por torneo (ingresos − egresos), corte de caja por jornada, recibos.                                                             | **ninguna** — vistas de agregación                                     |

> **Principio de negocio:** subir de nivel **nunca** cambia el schema. Niveles 1-2 son
> conceptos, triggers y vistas encima del mismo motor. Si un nivel pide una tabla nueva,
> el diseño está mal.

### 1.3 Qué NO es (anti-alcance)

- **No es una pasarela de pago.** Default = efectivo. No cobra con tarjeta, no toca Stripe/PayPal
  en el producto. `method` es un campo informativo (`cash` | `transfer` | `spei`), no una integración.
- **No es un calendario de reservas.** El _tracking_ de renta suelta de cancha es un cargo
  manual contra una cuenta externa (nombre + teléfono); el calendario completo sigue siendo de
  `venue-management` a futuro (§3.1.3 del doc maestro).
- **No es contabilidad fiscal.** No emite CFDI ni calcula impuestos. Es el estado de cuenta
  operativo del organizador.

---

## 2. Principios de diseño (P1–P8) — no negociables

Cada uno existe para cumplir el encargo: **genérico, reutilizable, resiliente, preciso y fácil de adoptar.**

### P1 — Montos en centavos, enteros. Siempre.

Todo monto (`fee_concepts.default_amount_cents`, `ledger_entries.amount_cents`) es un
**entero en centavos** (`$150.00 → 15000`). Nunca `numeric`, `decimal` ni `float`.

- Evita el redondeo silencioso de JS (`0.1 + 0.2 !== 0.3`) al sumar saldos.
- Es el estándar de los sistemas de cobro (Stripe et al.).
- La aritmética del motor (sumas, comparaciones) ocurre **toda en centavos**; la UI formatea
  a pesos solo para mostrar, con un helper único `formatCents(cents)` en `entities/ledger/lib`.
- **Prohibido** hacer aritmética de dinero en el cliente sobre valores en pesos.

### P2 — Un solo punto de entrada dirigido por `trigger`

El motor expone **una** función para cobrar: `chargeForTrigger(trigger, context)`. Los módulos
no saben de conceptos ni de cuentas; solo declaran "ocurrió esta acción". Agregar un cobro que
reusa un trigger ya conectado es **una fila en `fee_concepts`, cero código** (P8). Conectar un
trigger que hoy no cobra nada es **un hook de una línea**, una sola vez por acción.

### P3 — No bloqueante: cobrar nunca rompe la operación

**Decisión (Jocobi, jul 2026):** el cobro es **no bloqueante** respecto a la acción que lo
origina. Registrar un equipo o un jugador **siempre** tiene éxito, aunque el cobro falle
(config incompleta, monto en cero, error transitorio de DB). Un error de finanzas jamás debe
impedir operar la liga.

Implicaciones de diseño:

- El hook (`chargeForTrigger`) se ejecuta **después** de que la transacción de negocio
  confirmó, **fuera** de esa transacción. El alta ya está commiteada cuando se intenta cobrar.
- Un fallo del cobro **no** propaga excepción a la acción de negocio: se captura, se registra
  en `finance_events` como `charge_failed` (P7) y el cargo queda como **pendiente** para
  reintento o registro manual. Nunca un `try/catch` vacío (AGENTS.md §18.4): se loguea explícito.
- El engine **devuelve un resultado**, no lanza: `ChargeResult` (§4.2) con `status` y detalle,
  para que el llamador decida si notifica al usuario (P3 no exime del feedback de §7.2b de AGENTS).

### P4 — Idempotencia: nunca cobrar dos veces lo mismo

**Decisión (Jocobi, jul 2026):** re-ejecutar un trigger (editar y re-guardar un alta,
reintentar tras un timeout) **no** crea un segundo cargo. Cada cargo automático lleva una
**idempotency key** derivada de forma determinista:

```
idempotency_key = `${trigger}:${concept_id}:${source_type}:${source_id}`
```

El ledger tiene `UNIQUE(idempotency_key)` (parcial: solo donde `idempotency_key IS NOT NULL`;
los cargos/abonos **manuales** no llevan key y sí pueden repetirse a propósito). El insert usa
`onConflictDoNothing` sobre esa key: si el cargo ya existe, es un no-op silencioso que reporta
`status: 'skipped_duplicate'`. Precisión garantizada sin depender de que el trigger corra una vez.

### P5 — Anulación (void), nunca borrado

**Decisión (Jocobi, jul 2026):** un cargo **no se elimina**. Cuando el sujeto se borra o el
cargo fue un error, se marca `status = 'voided'` con `voided_reason`, `voided_by` y `voided_at`.

- El historial contable queda intacto y auditable (P7).
- El cálculo de saldo **ignora** las filas `voided` (§4.3).
- Un pago (`payment`) también se anula por void, nunca por delete.
- El "hard delete" solo existe para el organizador con rol `owner` en casos de datos basura
  reales, y aun así deja rastro en `finance_events` (P7).

### P6 — El motor es agnóstico del sujeto (`billing_account`)

El ledger **nunca** referencia `team_id`/`player_id` directamente. Referencia una
`billing_account` que puede ser un **equipo**, un **jugador** individual (credencial) o un
**cliente externo sin liga** (fulano que solo renta la cancha). Agregar un cuarto tipo de
sujeto mañana (ej. un patrocinador) es una variante de `account_type`, no un rediseño del ledger.

### P7 — Bitácora de eventos detallada (auditoría de primera clase)

> Pedido explícito de Jocobi: **"este motor debe tener un tracking de logs detallado".**

Cada operación del motor —cargo creado, cargo omitido por duplicado, cargo fallido, pago
registrado, anulación, cambio de concepto, seed de catálogo— escribe una fila en
`finance_events`. Es un **append-only event log**: nunca se edita ni se borra. Responde
"¿qué pasó, cuándo, quién lo disparó y con qué contexto?" sin tener que reconstruirlo del ledger.

- Es distinto del ledger: el ledger es el **estado** (qué se debe), `finance_events` es la
  **historia** (qué ocurrió, incluyendo lo que NO cambió el estado, como un duplicado omitido
  o un cobro que falló). Un cargo fallido no deja fila en el ledger pero **sí** en el log.
- Guarda `actor_type` (`system` | `user`), `actor_id`, `event_type`, `payload` (jsonb con el
  contexto: trigger, concepto, monto, resultado, error), y `correlation_id` para atar todos
  los eventos de una misma acción de negocio (un alta de equipo que dispara 2 conceptos comparte
  `correlation_id`).
- Nunca guarda secretos ni datos sensibles crudos (AGENTS.md §8.4); el payload es contexto operativo.

### P8 — Extender = dato, no código

La prueba de fuego del motor: **agregar un cobro nuevo que reusa un trigger existente es
insertar una fila en `fee_concepts`.** Sin migración, sin deploy, sin tocar el engine. Si un
cobro nuevo obliga a tocar código del engine, o el trigger no existía (una acción que hoy no
cobra nada), o el diseño se rompió. Este principio es el criterio de éxito de toda la Épica C.

---

## 3. Arquitectura FSD

Alineado a `AGENTS.md §3.1` (`app → features → entities → shared`). Nada de `entities` importa `features`.

```
entities/
  fee-concept/
    model.ts          # tipos $inferSelect/$inferInsert + Zod (FeeConcept, NewFeeConcept, triggers, kinds)
    queries.ts        # findActiveConceptsByTrigger, listConcepts, upsertConcept  (importa @/db)
    index.ts          # re-exporta SOLO model.ts (barrel client-safe — ver AGENTS memoria)
  billing-account/
    model.ts          # BillingAccount, account_type, invariante "exactamente un sujeto"
    queries.ts        # findOrCreateAccount(subject), getAccount, listAccountsByLeague
    index.ts
  ledger/
    model.ts          # LedgerEntry, direction, status, idempotency key builder
    lib/
      compute-balance.ts   # PURO: entries[] -> saldo en centavos (ignora voided)
      format-cents.ts      # PURO: cents -> "$1,500.00"
      build-idempotency-key.ts  # PURO: (trigger, conceptId, sourceType, sourceId) -> string
    queries.ts        # insertCharge, insertPayment, voidEntry, listEntriesByAccount
    index.ts
  finance-event/
    model.ts          # FinanceEvent, event_type, actor_type
    queries.ts        # appendEvent, listEventsByCorrelation, listEventsByLeague
    index.ts

features/
  finance/
    constants.ts      # TRIGGERS, CONCEPT_KINDS, ACCOUNT_TYPES, EVENT_TYPES, DIRECTIONS
    types.ts          # ChargeContext, ChargeResult, XView de estado de cuenta
    engine/
      charge-for-trigger.ts   # chargeForTrigger(trigger, ctx): orquesta conceptos→cuenta→ledger→evento
      resolve-subject.ts      # ctx.subject -> billing_account (via entities/billing-account)
      record-charge.ts        # inserta cargo idempotente + evento (una unidad)
    lib/
      map-account-statement.ts  # PURO: DTO -> AccountStatementView (§7.2b UI)
    model/
      useAccountStatement.ts    # hook RQ (lectura estado de cuenta)
      useRecordManualEntry.ts   # hook RQ (cargo/abono manual)
      useVoidEntry.ts           # hook RQ (anular)
    index.ts

app/api/leagues/[id]/
  fee-concepts/route.ts       # GET listar / POST crear
  fee-concepts/[cid]/route.ts # PATCH editar / DELETE desactivar
  billing-accounts/route.ts   # GET listar / POST crear (externa)
  ledger/route.ts             # GET estado de cuenta / POST cargo|abono manual
  ledger/[eid]/void/route.ts  # POST anular (P5)
```

**Regla de dependencias del engine:** `chargeForTrigger` vive en `features/finance/engine`
y **solo** llama a queries de `entities/*`. Los módulos que cobran (`team-management`,
`admin-registration`, `scheduling`, `venue-management`, `match-resolution`) importan
`chargeForTrigger` desde `features/finance` (index barrel). Nunca al revés.

---

## 4. Contratos del engine

### 4.1 `ChargeContext` — lo que el módulo declara

El llamador no sabe de conceptos ni cuentas. Pasa el hecho de negocio y el sujeto:

```typescript
// features/finance/types.ts
export type ChargeSubject =
	| { type: "team"; teamId: string }
	| { type: "player"; globalPlayerId: string }
	| { type: "external"; name: string; phone?: string };

export interface ChargeContext {
	trigger: Trigger; // 'team_registration' | 'player_registration' | ...
	organizationId: string;
	leagueId: string | null; // null si es renta suelta sin liga
	subject: ChargeSubject;
	source: { type: SourceType; id: string }; // entidad que originó (team.id, player.id, ...)
	actorId: string | null; // users.id que disparó la acción (auditoría); null si system puro
	correlationId?: string; // para atar eventos; el engine genera uno si no viene
	overrideAmountCents?: number; // opcional: el organizador fija un monto distinto al default del concepto
}
```

### 4.2 `chargeForTrigger` — el único punto de entrada

```typescript
// features/finance/engine/charge-for-trigger.ts
export async function chargeForTrigger(ctx: ChargeContext): Promise<ChargeResult> {
	// 1. Resolver conceptos activos de (org|liga) para este trigger.  (entities/fee-concept)
	// 2. Si no hay conceptos → status: 'no_concept', evento 'charge_skipped_no_concept'. (P3: no error)
	// 3. Resolver o crear la billing_account del sujeto.              (entities/billing-account, P6)
	// 4. Por cada concepto: insertar cargo idempotente (P4) + evento. (record-charge)
	// 5. Devolver ChargeResult agregado. NUNCA lanza al llamador.     (P3)
}

export type ChargeResult =
	| { status: "charged"; entries: LedgerEntrySummary[]; correlationId: string }
	| { status: "skipped_duplicate"; entries: LedgerEntrySummary[]; correlationId: string }
	| { status: "no_concept"; correlationId: string }
	| { status: "failed"; error: string; correlationId: string };
```

- **No lanza.** Traduce cualquier fallo a `status: 'failed'` + evento `charge_failed` (P3, P7).
- **Idempotente** por P4: si todos los conceptos ya se cobraron, `skipped_duplicate`.
- **Multi-concepto:** un mismo trigger puede tener N conceptos activos (ej. al registrar equipo:
  "Inscripción" + "Fianza"). Se cobran todos bajo el mismo `correlationId`.

### 4.3 Cálculo de saldo — función pura, testeable

```typescript
// entities/ledger/lib/compute-balance.ts  (sin imports de @/db — puro)
export function computeBalanceCents(entries: LedgerEntry[]): number {
	return entries
		.filter((e) => e.status === "active") // P5: ignora 'voided'
		.reduce((acc, e) => acc + signed(e), 0); // charge:+  payment:-  refund:-
}
```

Saldo de una cuenta = `SUM(charges) − SUM(payments) − SUM(refunds)`, todo en centavos, ignorando
`voided`. **Positivo = debe; negativo = tiene saldo a favor; cero = al corriente.**

### 4.4 Anulación (`voidEntry`) — P5

```typescript
// entities/ledger/queries.ts
export async function voidEntry(id: string, reason: string, byUserId: string) {
	// UPDATE ledger_entries SET status='voided', voided_reason, voided_by, voided_at=now() WHERE id=...
	// + appendEvent('entry_voided', { entryId: id, reason, actorId: byUserId })
}
```

Nunca `DELETE`. El saldo se recalcula solo porque `computeBalanceCents` filtra `voided`.

---

## 5. Modelo de datos final

> Extiende el boceto de `MODULOS-GESTION-LIGA.md §5.3` con lo que exigen las decisiones P3/P4/P5/P7:
> `idempotency_key`, `status`/campos de void y la tabla de bitácora `finance_events`.
> Tipos inferidos del schema Drizzle (`AGENTS.md §4.1`); columnas `snake_case` (§9).

### 5.1 `fee_concepts` — catálogo (el "dato, no código" de P8)

```
fee_concepts
  id                    uuid  PK
  organization_id       uuid  FK   NOT NULL
  league_id             uuid  FK   null    -- null = concepto de organización, reusable sin liga (renta suelta)
  name                  text  NOT NULL      -- 'Inscripción' | 'Credencial' | 'Fianza' | 'Horario fijo' | 'Renta de cancha' | 'Arbitraje'
  kind                  text  NOT NULL      -- 'charge' | 'deposit' (fianza) | 'expense'
  subject_type          text  NOT NULL      -- 'team' | 'player' | 'external' | 'any'
  trigger               text  NOT NULL      -- catálogo de §6 ; 'manual' si no lo dispara ninguna acción
  default_amount_cents  int   null          -- entero en centavos (P1) ; null = monto se fija al cobrar
  is_active             boolean NOT NULL default true
  created_at            timestamptz NOT NULL default now()
  updated_at            timestamptz NOT NULL default now()
  -- index: (organization_id, league_id, trigger, is_active) para findActiveConceptsByTrigger
```

### 5.2 `billing_accounts` — sujeto genérico (P6)

```
billing_accounts
  id                 uuid  PK
  organization_id    uuid  FK  NOT NULL
  league_id          uuid  FK  null         -- null si cuenta externa sin liga
  account_type       text  NOT NULL         -- 'team' | 'player' | 'external'
  team_id            uuid  FK  null          -- set si account_type = 'team'
  global_player_id   uuid  FK  null          -- set si account_type = 'player'
  external_name      text  null              -- set si account_type = 'external'
  external_phone     text  null
  created_at         timestamptz NOT NULL default now()
  -- CHECK: exactamente uno de (team_id | global_player_id | external_name) no-null según account_type
  -- UNIQUE parcial: (league_id, team_id) / (league_id, global_player_id) para no duplicar cuenta del mismo sujeto
```

### 5.3 `ledger_entries` — el estado (qué se debe)

```
ledger_entries
  id                 uuid  PK
  organization_id    uuid  FK  NOT NULL
  league_id          uuid  FK  null          -- null si billing_account externa sin liga
  billing_account_id uuid  FK  NOT NULL       -- P6: el único vínculo al sujeto
  concept_id         uuid  FK  null           -- null permitido en abonos/ajustes manuales sin concepto
  direction          text  NOT NULL           -- 'charge' | 'payment' | 'refund'
  amount_cents       int   NOT NULL           -- entero en centavos (P1) ; > 0 siempre (el signo lo da direction)
  method             text  NOT NULL default 'cash'  -- 'cash' | 'transfer' | 'spei' (informativo, no integración)
  note               text  null
  source_type        text  null               -- 'team_registration' | 'player_registration' | 'booking' | 'match' | 'manual'
  source_id          uuid  null               -- id de la entidad que originó el cargo
  idempotency_key    text  null               -- P4: `${trigger}:${concept}:${sourceType}:${sourceId}` ; null en manuales
  status             text  NOT NULL default 'active'  -- 'active' | 'voided'  (P5)
  voided_reason      text  null
  voided_by          uuid  FK  null            -- users.id (auditoría)
  voided_at          timestamptz null
  recorded_by        uuid  FK  null            -- users.id que capturó el cargo/abono manual
  created_at         timestamptz NOT NULL default now()
  -- UNIQUE parcial: (idempotency_key) WHERE idempotency_key IS NOT NULL   ← P4, garantiza no-duplicado
  -- index: (billing_account_id, status) para computeBalance ; (league_id, created_at) para corte de caja
```

### 5.4 `finance_events` — la historia (bitácora append-only, P7)

```
finance_events
  id                 uuid  PK
  organization_id    uuid  FK  NOT NULL
  league_id          uuid  FK  null
  correlation_id     uuid  NOT NULL           -- ata todos los eventos de una misma acción de negocio
  event_type         text  NOT NULL           -- ver catálogo abajo
  actor_type         text  NOT NULL           -- 'system' | 'user'
  actor_id           uuid  null               -- users.id si actor_type='user'
  billing_account_id uuid  null
  ledger_entry_id    uuid  null               -- set cuando el evento produjo/afectó una fila del ledger
  payload            jsonb NOT NULL default '{}'  -- contexto: { trigger, conceptId, amountCents, result, error, ... }
  created_at         timestamptz NOT NULL default now()
  -- index: (correlation_id) , (league_id, created_at) , (event_type)
  -- APPEND-ONLY: sin UPDATE ni DELETE. Nunca guarda secretos (AGENTS §8.4).
```

Catálogo de `event_type` (en `features/finance/constants.ts`):

```
charge_created            -- se insertó un cargo
charge_skipped_duplicate  -- P4: la idempotency key ya existía, no-op
charge_skipped_no_concept -- P3: el trigger no tiene concepto activo
charge_failed             -- P3: el cobro falló (payload.error con el detalle)
payment_recorded          -- se registró un abono
entry_voided              -- P5: se anuló un cargo/abono
concept_created / concept_updated / concept_deactivated
catalog_seeded            -- se sembró el catálogo a una liga nueva (C8)
```

### 5.5 Relación entre ledger y bitácora

```
Acción de negocio (alta de equipo)
        │  correlationId = C
        ▼
chargeForTrigger('team_registration', ctx)
        ├── concepto "Inscripción" → ledger_entry #1 (charge)  + finance_event(charge_created, C)
        ├── concepto "Fianza"      → ledger_entry #2 (deposit) + finance_event(charge_created, C)
        └── (si reintento)         → ambos skipped         + finance_event(charge_skipped_duplicate, C)

Estado (¿quién debe?) = SUM sobre ledger_entries activos.
Historia (¿qué pasó?)  = finance_events filtrado por correlation_id o liga.
```

---

## 6. Catálogo de triggers y su conexión

Un `trigger` es el punto de enganche entre una acción de módulo y el motor. Conectar un
trigger es un hook de una línea, **una sola vez por acción** (P2). Después, cada concepto que
use ese trigger es solo dato (P8).

| Trigger               | Acción que lo dispara (módulo)                        | Sujeto por defecto                                       | Nivel | Hook (paso) |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------- | ----- | ----------- |
| `team_registration`   | Alta de equipo (`team-management`)                    | `team`                                                   | 0     | C4          |
| `player_registration` | Alta de jugador / credencial (`admin-registration`)   | `player` (al jugador, no al equipo — decisión de Jocobi) | 0     | C4          |
| `schedule_booking`    | Reserva del horario fijo de la liga (`scheduling`)    | `team`                                                   | 0     | C5          |
| `venue_ad_hoc_rental` | Renta suelta de cancha (`venue-management`)           | `external`                                               | 0     | C5          |
| `match_referee`       | Resolución de cédula → arbitraje (`match-resolution`) | `team` / liga                                            | 1     | E2          |
| `manual`              | Cargo/abono que el organizador registra a mano        | cualquiera                                               | 0     | C6          |

**Cómo se ve un hook (no bloqueante, P3):**

```typescript
// features/team-management/create-team.ts  (después de que la tx del alta commiteó)
const team = await createTeamTx(input); // ← negocio; si esto falla, falla el alta
void chargeForTrigger({
	// ← cobro; no se await-ea de forma que bloquee el 200
	trigger: TRIGGERS.TEAM_REGISTRATION,
	organizationId,
	leagueId,
	subject: { type: "team", teamId: team.id },
	source: { type: "team_registration", id: team.id },
	actorId: user.id,
}).then((result) => notifyIfRelevant(result)); // feedback al organizador (§7.2b AGENTS)
return team;
```

> El `void` + `.then` documenta la intención de P3: el alta ya está hecha; el cobro corre
> aparte y su resultado alimenta el toast, pero su fallo no revierte nada. En un entorno
> serverless donde no conviene dejar promesas colgando, el hook se `await`-ea pero **envuelto
> en el propio `chargeForTrigger` que no lanza** (P3), así el `await` nunca rompe el alta.

---

## 7. Gate por `finance_level` — cómo se enciende

`league_config.finance_level` (0|1|2) es el interruptor. El gate se aplica en **dos capas**:

1. **Lectura de conceptos:** `findActiveConceptsByTrigger` solo devuelve conceptos si el
   `finance_level` de la liga habilita ese `kind`/trigger. Nivel 0 no ve conceptos de arbitraje
   aunque existan; simplemente no se cobran.
2. **UI:** las pantallas de estado de cuenta (C9) solo aparecen si `finance_level >= 0` y la liga
   tiene al menos un concepto activo. La liga informal que nunca prende finanzas **no ve nada**
   (regla anti-informalidad del doc maestro §0).

Un cobro nunca se dispara "por accidente": sin concepto activo para el trigger, `chargeForTrigger`
devuelve `no_concept` y no pasa nada (P3). Prender finanzas = crear conceptos, no tocar código.

---

## 8. Guía de adopción — cómo un módulo empieza a cobrar

Receta de 3 pasos para conectar cualquier acción nueva (cumple P2/P8):

1. **¿El trigger ya existe?** (tabla §6). Si sí → salta al paso 3.
2. **Si no existe:** agrégalo a `TRIGGERS` en `features/finance/constants.ts` y pon el hook de
   una línea `chargeForTrigger({ trigger, ... })` justo después de que la transacción de negocio
   commitea (P3: fuera de la tx, no bloqueante). Esto se hace **una vez** por acción.
3. **Crea el/los conceptos** en `fee_concepts` (fila de catálogo o UI de C6) con ese `trigger`,
   su `default_amount_cents` y su `subject_type`. Cero código. Esto es P8 en acción.

**Checklist de adopción (por PR que agrega un cobro):**

- [ ] El hook corre **después** del commit de negocio y **no** dentro de su transacción (P3).
- [ ] `chargeForTrigger` no se deja lanzar hacia la acción de negocio (P3).
- [ ] El cargo automático lleva `source` bien formado para su `idempotency_key` (P4).
- [ ] Montos en centavos enteros de punta a punta (P1); la UI usa `formatCents` (nunca aritmética en pesos).
- [ ] El sujeto pasa por `billing_account`, no por `team_id`/`player_id` sueltos (P6).
- [ ] La acción emite eventos en `finance_events` con `correlation_id` (P7).
- [ ] El resultado (`ChargeResult`) alimenta un `notify.success/error` al organizador (§7.2b AGENTS).
- [ ] Hay pruebas del caso duplicado, del caso `no_concept` y del caso `failed` (§10, §20 AGENTS).

---

## 9. Resiliencia — qué pasa cuando algo sale mal

| Escenario                                         | Comportamiento del motor                                                                                                 | Principio |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| Config incompleta: trigger sin concepto activo    | `no_concept`, no cobra, log `charge_skipped_no_concept`. El alta procede.                                                | P3        |
| Reintento del mismo trigger (doble submit, retry) | `skipped_duplicate` por la idempotency key, no duplica.                                                                  | P4        |
| Error transitorio de DB al insertar el cargo      | `failed`, log `charge_failed` con el error; el alta ya está hecha; cargo queda pendiente para reintento/registro manual. | P3, P7    |
| Se borra el equipo/jugador con cargos             | Los cargos se **anulan** (void) con motivo; el histórico y la bitácora quedan.                                           | P5, P7    |
| Monto default en `null`                           | Se requiere `overrideAmountCents` al cobrar; si no viene, `failed` con error claro (no cobra $0 silencioso).             | P1, P3    |
| Cliente externo sin liga                          | `billing_account` con `account_type='external'`, `league_id=null`; el ledger lo soporta igual.                           | P6        |
| Duda de "¿qué pasó con este cobro?"               | `finance_events` por `correlation_id` reconstruye la historia completa.                                                  | P7        |

---

## 10. Testing (obligatorio — AGENTS.md §20)

El motor **no está completo sin pruebas**. Cobertura mínima:

**Funciones puras (unit directo, entrada → salida):**

- `computeBalanceCents`: cargos + abonos, saldo a favor (negativo), **ignora `voided`**, lista vacía → 0.
- `formatCents`: `15000 → "$150.00"`, `0`, montos grandes con separador de miles, negativos.
- `buildIdempotencyKey`: determinista para los mismos inputs; distinta si cambia cualquier parte.

**Engine (`chargeForTrigger`, con `entities/*` mockeadas — sin DB real, §20.3):**

- Happy path: 1 concepto → 1 cargo + 1 evento `charge_created`, `status: 'charged'`.
- Multi-concepto: 2 conceptos del mismo trigger → 2 cargos, mismo `correlationId`.
- **Idempotencia (P4):** segunda llamada con el mismo `source` → `skipped_duplicate`, no segundo cargo.
- **No bloqueante (P3):** la query de insert lanza → resultado `failed`, **no** re-lanza; hay evento `charge_failed`.
- **Sin concepto (P3):** trigger sin conceptos activos → `no_concept`, cero escrituras en ledger.
- **Void (P5):** anular deja el registro con `status='voided'` y lo excluye del saldo.
- Sujeto externo (P6): `account_type='external'`, `league_id=null` resuelve y cobra.

**Casos de borde (§20.2):** monto `null` sin override, liga con `finance_level=0` que no habilita
arbitraje, cuenta duplicada del mismo sujeto (el UNIQUE parcial la reusa).

**Ubicación:** co-locado (`compute-balance.test.ts`, `charge-for-trigger.test.ts`), entorno `node`
para lo puro; hooks RQ con `createQueryWrapper()` (§20.4 AGENTS).

---

## 11. Relación con la Épica C (mapa paso → principio)

| Paso | Qué construye                                                                             | Principios que debe cumplir               |
| ---- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| C1   | Schema `fee_concepts`, `billing_accounts`, `ledger_entries`, `finance_events` + migración | P1, P4, P5, P6, P7                        |
| C2   | Entidades (model + queries + `computeBalanceCents`)                                       | P1, P5, P6                                |
| C3   | Engine `chargeForTrigger` + tests (incl. externa)                                         | P2, P3, P4, P7                            |
| C4   | Hooks en alta de equipo y jugador                                                         | P2, P3, P8                                |
| C5   | Hooks en reserva de horario y renta suelta                                                | P2, P3, P6                                |
| C6   | Catálogo de conceptos + registro manual de cargo/abono                                    | P5, P8                                    |
| C7   | Endpoints concepts / billing-accounts / ledger (+ void)                                   | P5, §3.2 AGENTS                           |
| C8   | Seed de conceptos org → liga (copy-on-create)                                             | P8, evento `catalog_seeded` (P7)          |
| C9   | 🎨 UI-GATE — estados de cuenta (equipo/jugador/externo)                                   | P1 (`formatCents`), §7.2b, §8 gate diseño |

> Cada paso = un commit `conventional-commits` (memoria del proyecto). No avanzar al siguiente
> hasta que el anterior esté verde. Jocobi corre tests/git/build.

---

## 12. Decisiones abiertas (para cerrar con Jocobi cuando toque)

- **Reintento automático de cargos `failed`:** ¿un job que reintenta los pendientes, o siempre
  registro manual? Por ahora: manual (más simple, cero infraestructura de colas).
- **Recibo/comprobante al abonar:** ¿generar un asset compartible (liga con el norte de contenido)
  cuando un jugador paga? Candidato natural para Nivel 2, no bloquea Nivel 0.
- **Fianza (Nivel 1):** el `deposit` se castiga con un `charge` ligado a una `suspension`
  (`entities/suspension`, Épica B). Definir la regla exacta de descuento al implementar E1.
- **Multi-moneda / propinas al árbitro:** fuera de alcance hasta que exista una liga que lo pida
  (filtro de configurabilidad, §4 del doc maestro).
