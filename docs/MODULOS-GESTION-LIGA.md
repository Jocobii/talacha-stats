# Módulos de gestión de liga — mapa, configurabilidad y modelo de datos

> **Estado:** propuesta de trabajo (jul 2026). Fuente de verdad de posicionamiento sigue siendo `AGENTS.md` §1.5. Este doc traduce ese norte a un plan concreto de módulos administrativos por construir.

## 0. Filosofía que filtra todo lo de abajo

Dos fuerzas mandan sobre cada decisión de este doc:

1. **"Que llevar una liga sea fácil".** El fútbol amateur vive en la informalidad. La mayoría de las ligas no quieren burocracia. Todo lo que agreguemos debe funcionar **con defaults** para que la liga informal nunca configure nada, y solo la liga fuerte abra las opciones avanzadas.
2. **El norte (AGENTS.md §1.5):** la gestión es el **medio**, no el fin. Cada módulo debe terminar alimentando dato limpio, identidad de jugador o contenido presumible. Si un módulo de gestión no desemboca en eso, es de baja prioridad.

Consecuencia práctica: **la capa financiera es opt-in y escalonada**; los esenciales deportivos aplican a todos pero con defaults tan buenos que el informal no los toca.

---

## 1. Lo que YA existe (verificado contra el código)

Inventario de `src/features/` (AGENTS.md §1.6) y hallazgos de revisión de código:

| Área         | Módulo / archivo                                                      | Estado                                                                         |
| ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Identidad    | `admin-registration` (CURP)                                           | Completo                                                                       |
| Alta de liga | `league-onboarding`, `league-management`                              | Completo                                                                       |
| Equipos      | `team-management`                                                     | Completo                                                                       |
| Captura      | `match-resolution` (cédula)                                           | Completo — captura goles, asistencias, tarjetas amarilla/azul/roja por jugador |
| Calendario   | `scheduling`, `sorteo-cockpit`                                        | Completo                                                                       |
| Canchas      | `venue-management`, `venue-calendar`                                  | Completo                                                                       |
| Liguilla     | `playoffs`                                                            | Completo                                                                       |
| Tabla        | `src/lib/standings.ts`                                                | Funcional, con matices (ver abajo)                                             |
| Contenido    | `narrator-analysis`, `post-import-content`, `org-hub`, `share-assets` | Completo                                                                       |

### 1.1 Hallazgos de la revisión (importante)

**Disciplina — parcial, sin motor.** La cédula ya persiste tarjetas por jugador (`matchPlayerStats.yellowCards / blueCards / redCards`) y se agregan en `playerSeasonStats`. Existe el estado `leagueMembers.status = "suspended"`, pero es **manual**: ninguna lógica acumula tarjetas ni dispara suspensiones automáticas. Hoy el organizador lleva la cuenta de cabeza. → **El dato se captura, pero no se convierte en decisión.** Falta el motor.

**Desempate — existe pero hardcodeado.** En `src/lib/standings.ts`, `sortStandings` ordena por **Puntos → Diferencia de goles → Goles a favor → nombre**. Funciona, pero (a) no es configurable por torneo y (b) no incluye **enfrentamiento directo (head-to-head)**, criterio que muchas ligas mexicanas usan primero. → No es módulo nuevo: es mejora configurable de `standings.ts`.

**Walkover.** `standings.ts` ya fija W.O. = 3-0 al ganador (`resolveGoals`). Correcto como default.

---

## 2. Módulos ESENCIALES que faltan (aplican a toda liga)

Universales, baratos de operar, con default para no romper lo "fácil".

### 2.1 Disciplina y suspensiones

Motor que acumula tarjetas (desde datos que **ya existen**) y marca suspensión automática para la siguiente jornada. Alimenta el norte (contenido: "expulsados/suspendidos de la jornada"). Alto valor, arranca sobre dato ya capturado.

> **Actualización (jul 2026, revisión de `SANCIONES.xlsx` real de Jocobi):** la roja directa no siempre es "1 fecha y ya". El registro real de sanciones de la liga muestra casos graves (amenazas al árbitro, agresión a un adversario, conducta violenta) castigados con **semanas, meses o veto indefinido de la liga**, decididos por el organizador caso por caso — no por un umbral automático. El motor por lo tanto tiene dos capas:
>
> 1. **Automática** — amarillas acumuladas y roja directa siguen generando 1 fecha de suspensión de inmediato, sin intervención (comportamiento ya planeado).
> 2. **Escalable manual** — el organizador puede editar esa sanción automática y convertirla en una sanción por duración calendario (días/semanas/meses) o veto indefinido, con motivo en texto libre (igual que hoy en el Excel — sin catálogo de cláusulas por ahora, se agrega si hace falta más adelante). Ver §5.2 para el modelo de datos revisado.

### 2.2 Reglamento / configuración del torneo

Un solo lugar para: sistema de puntos, **criterios de desempate y su orden** (incl. head-to-head), reglas de disciplina, límite de refuerzos y elegibilidad. Absorbe la mejora de `standings.ts`. Es el hogar de casi toda la configurabilidad (§4).

### 2.3 Avisos de jornada

No mensajería completa (sobre-ingeniería para amateur), sino generar el "rol de la jornada" y recordatorios listos para pegar en WhatsApp. Se apoya en `share-assets` / `org-hub` existentes.

### 2.4 Panel del capitán (ligero)

Autoservicio: el capitán ve su rol, su roster y —cuando exista lo financiero— su saldo. Activa el viral loop y descarga trabajo del organizador.

---

## 3. Capa FINANCIERA (opt-in, escalonada)

Regla anti-informalidad: **nunca forzar pasarela de pago.** Default en efectivo. Cada liga prende solo el nivel que necesita. Los tres niveles comparten el mismo `catálogo de conceptos` + `estado de cuenta`; "fianza", "arbitraje" y "cierre" son capas encima. Un solo producto, progresivo.

- **Nivel 0 — "¿Quién debe?"** (hasta el más informal lo usa). Catálogo de conceptos (inscripción, credencial, cuota de horario) + estado de cuenta por equipo (cargo, abono en efectivo, saldo). Sustituye el cuaderno del organizador.
- **Nivel 1 — Liga formal.** Fianza como saldo retenido que se castiga con sanciones; arbitraje (tarifa por partido + cuenta por pagar al árbitro); egresos (cancha, balones, premios).
- **Nivel 2 — Liga fuerte.** Cierre financiero por torneo (ingresos − egresos = utilidad), corte de caja por jornada, recibos. Es el nivel que justifica que la liga cara pague por la plataforma.

> Referencia de mercado (jul 2026): FLM System / nadugol / iBeeScore son fuertes en lo deportivo pero flojos en contabilidad; LeagueApps/TeamSnap asumen pago digital con tarjeta (no calza con efectivo/fianza mexicanos); Clupik sí modela costo de arbitraje. El hueco defendible = **stats + finanzas del organizador + realidad mexicana (efectivo, fianza, horario fijo)**.

---

## 4. Marco de configurabilidad — qué controla el dueño de la liga

Cada opción configurable cuesta código, UI, pruebas y una decisión más para el organizador informal. **La configurabilidad se gana**, con este filtro de 3 preguntas (deben cumplirse las tres):

1. ¿De verdad **varía** entre ligas reales? (no hipotético)
2. ¿Un default equivocado produce un resultado **visiblemente mal** que erosiona la confianza en el dato? (tabla/campeón/suspensión incorrectos)
3. ¿Puede tener un **default sano** que el informal nunca toque?

### 4.1 Configurable (con default, y **bloqueado al arrancar el torneo**)

| Config                                                 | Default                                     | Por qué configurable                                         |
| ------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------ |
| Criterios de desempate y su orden (incl. head-to-head) | Pts → DG → GF → nombre (el actual)          | Varía de verdad; un default malo corona al equipo equivocado |
| Umbral de amarillas para suspensión                    | 5 acumuladas → 1 fecha (ajustar con Jocobi) | Varía por liga; error = suspensión injusta                   |
| Fechas de suspensión por roja directa                  | 1 fecha                                     | Ídem                                                         |
| Significado de la tarjeta azul                         | (definir)                                   | No estándar entre ligas                                      |
| Conceptos y montos financieros                         | vacío / apagado                             | Por naturaleza cambian por liga                              |
| Límite de refuerzos / elegibilidad                     | sin límite                                  | Varía y afecta quién puede jugar                             |

### 4.2 Fijo con default sensato (no exponer en UI hasta que alguien lo pida)

- Puntos por victoria/empate: **3 / 1 / 0** (casi universal → default, no opción).
- Marcador de walkover: **3-0** (ya está así en `standings.ts`).
- Viven en `constants.ts`; movibles después, pero no se les gasta UI todavía.

### 4.3 Nunca configurable (convención del producto)

Cómo cuenta un gol, la identidad por CURP, el modelo de datos, los flujos de captura. Volverlo configurable solo trae bugs.

### 4.4 Gobernanza

- **Quién decide:** la config vive a nivel liga y la edita el **organizador** dueño de esa liga; el rol `owner` puede sobreescribir. Calza con los roles actuales (AGENTS.md §6).
- **Cuándo se congela (regla de oro):** la config se **bloquea al arrancar el torneo** (primera cédula resuelta). Antes: editable. Después: solo lectura, o cambio con acción explícita del `owner` registrada en auditoría. Cambiar el desempate en la jornada 10 destruye la confianza en la tabla — esto protege el norte más que cualquier feature.

### 4.5 Config por organización — default que se copia, no se hereda en vivo

> Decisión jul 2026 (planteada por Jocobi): una organización real corre varias ligas/divisiones a la vez (ej. `SANCIONES.xlsx` trae pestañas "Varonil" y "Champions" del mismo organizador). Sin un default por organización, cada liga nueva repite el mismo llenado de reglamento — y un torneo relámpago (reglas especiales, de una sola vez) necesita poder salirse de esa norma sin fricción.

**Modelo elegido: copiar al crear, no heredar en vivo.** `organization_config` (mismos campos que `league_config`, sin `locked_at`) guarda el default de la organización. Al crear una liga nueva, sus valores se **copian** a la fila de `league_config` de esa liga (o quedan los defaults del sistema si la organización tampoco configuró nada — `findLeagueConfigOrDefaults` ya cubre ese caso). De ahí en adelante cada liga es totalmente independiente:

- Un **torneo relámpago** simplemente no hereda cambios futuros de la organización — es una liga como cualquier otra, con su propio `league_config` editable hasta que arranque.
- Cambiar `organization_config` **no** mueve retroactivamente ligas ya creadas — mismo principio que protege `locked_at`: nadie quiere que la tabla de una liga en curso cambie de reglas porque alguien tocó la config de la organización.
- **Se descartó** la alternativa de herencia en vivo (columnas nullable en `league_config` + resolución org→liga en cada lectura) por el costo: requiere rediseñar el schema, mostrar en la UI qué campo está "heredado" vs "local", y complica la semántica de `locked_at` (¿se congela el override o también el valor heredado?). El filtro de configurabilidad de §4 ya lo dice: la complejidad se gana, no se regala.

---

## 5. Modelo de datos propuesto (alineado a FSD)

Boceto para arrancar; los tipos se infieren del schema Drizzle (AGENTS.md §4.1). Nombres tentativos.

### 5.1 `league_config` (base de §4)

Una fila por liga. Home de todo lo configurable, con defaults.

```
league_config
  league_id            uuid  FK unique
  points_win           int   default 3
  points_draw          int   default 1
  tiebreakers          jsonb default '["points","head_to_head","goal_diff","goals_for","name"]'
  yellow_threshold     int   default 5     -- amarillas acumuladas → 1 fecha
  red_card_matches     int   default 1     -- fechas por roja directa
  reinforcement_limit  int   null          -- null = sin límite
  finance_level        int   default 0     -- 0 | 1 | 2
  locked_at            timestamptz null     -- se setea al resolver la 1a cédula
```

- Entidad: `entities/league-config/` (model + queries).
- Feature: `features/tournament-rules/` (leer/editar, validar bloqueo por `locked_at`).
- El sort de `standings.ts` pasa a leer `tiebreakers` en vez de hardcodear.

### 5.1b `organization_config` (default de la organización — §4.5)

Una fila por organización. Mismos campos que `league_config`, sin `locked_at` (a nivel organización nunca se congela). Se copia a `league_config` al crear una liga — ver §4.5 y §6.

```
organization_config
  organization_id      uuid  FK unique
  points_win           int   default 3
  points_draw          int   default 1
  tiebreakers          jsonb default '["points","head_to_head","goal_diff","goals_for","name"]'
  yellow_threshold     int   default 5
  red_card_matches     int   default 1
  blue_card_meaning    text  default 'temp'
  reinforcement_limit  int   null
  finance_level        int   default 0
  updated_at           timestamptz
```

- Entidad: `entities/organization-config/` (model + queries) — reusa los enums de `entities/league-config` (`TiebreakerCriterion`, `BlueCardMeaning`) para no duplicar el catálogo.
- Seed: `seedLeagueConfig(dbOrTx, leagueId, organizationId)` — copia `organization_config` a la liga nueva si existe; no-op si la organización no configuró nada (el fallback a defaults del sistema ya lo cubre `findLeagueConfigOrDefaults`). Se llama desde los flujos de alta de liga (`POST /api/leagues`, `quickCreateLeague`).
- `new-season` copia el `league_config` **resuelto de la liga origen** (no de la organización) a la liga nueva — preserva las reglas propias de esa liga temporada tras temporada, incluidas las de un torneo relámpago que se repite.
- UI de "Reglamento por defecto de la organización" queda como paso propio, UI-GATE, cuando se necesite (no bloquea A9-A11 — el seed funciona sin pantalla, se puede sembrar por SQL/consola mientras tanto). **Ver `docs/ORG-SETTINGS.md`** — ahí vive el plan completo del futuro hub de configuración de la organización (nombre, logo, slug, tema, y este reglamento por defecto todos juntos).

### 5.2 Disciplina — `suspensions`

El motor lee tarjetas ya persistidas y materializa suspensiones. Soporta dos
modos de duración porque la realidad de la liga los mezcla (ver `SANCIONES.xlsx`
de Jocobi, jul 2026): amarillas/roja directa se cuentan **por partido**
(jornadas), pero el organizador puede escalar un caso grave a una sanción
**por tiempo calendario** (semanas, meses) o a **veto indefinido**. Sin
catálogo de cláusulas por ahora — `reason_detail` es texto libre, igual que
el Excel actual; se agrega catálogo estructurado solo si el volumen lo pide.

```
suspensions
  id                 uuid
  global_player_id   uuid FK
  league_id          uuid FK
  reason             text  -- 'yellow_accumulation' | 'red_card' | 'manual'
  reason_detail      text  null  -- motivo libre (ej. "Amenazas al árbitro")
  duration_type      text  -- 'matches' | 'time' | 'permanent'
  -- duration_type = 'matches' (default automático de amarillas/roja):
  matches_total      int   null
  matches_served     int   default 0
  -- duration_type = 'time' (escalado manual: semanas/meses):
  duration_value     int   null
  duration_unit      text  null  -- 'days' | 'weeks' | 'months'
  starts_on          date  null
  ends_on            date  null  -- calculado: starts_on + duration_value/unit
  -- duration_type = 'permanent': sin campos de duración, solo status.
  status             text  -- 'active' | 'served' | 'lifted'  ('lifted' = el owner perdonó/levantó el veto)
  source_match_id    uuid null FK  -- partido que la originó (solo automáticas)
  recorded_by        uuid null FK  -- users.id — quién capturó la sanción manual (auditoría)
  created_at         timestamptz
  updated_at         timestamptz
```

- Entidad: `entities/suspension/`.
- Feature: `features/discipline/`:
  - Motor automático — al resolver una cédula (`match-resolution`), recalcula amarillas acumuladas vs `league_config.yellow_threshold` y crea suspensión `duration_type: 'matches'`; roja directa crea una igual con `matches_total = league_config.red_card_matches`. Decrementa `matches_served` al pasar la jornada.
  - Escalado manual — el organizador edita una suspensión existente (o crea una nueva `reason: 'manual'`) y la convierte a `duration_type: 'time'` (con `duration_value`/`duration_unit`, calcula `ends_on`) o `'permanent'`. Requiere `canManageLeague` — mismo guard que el resto de features administrativas.
  - Vigencia: para `'matches'` es `matches_served < matches_total`; para `'time'` es `today < ends_on`; para `'permanent'` siempre activa hasta `status = 'lifted'`.
- Conecta al norte: alimenta píldoras de contenido y sincroniza `leagueMembers.status`.

### 5.3 Finanzas — catálogo + ledger (Nivel 0)

```
fee_concepts
  id          uuid
  league_id   uuid FK
  name        text        -- 'Inscripción', 'Credencial', 'Fianza', 'Horario fijo'
  kind        text        -- 'charge' | 'deposit' (fianza) | 'expense'
  default_amount numeric null

ledger_entries
  id           uuid
  league_id    uuid FK
  team_id      uuid null FK   -- cargo/abono por equipo
  concept_id   uuid null FK
  direction    text           -- 'charge' | 'payment' | 'refund'
  amount       numeric
  method       text default 'cash'  -- 'cash' | 'transfer' | 'spei'
  note         text null
  created_at   timestamptz
```

- Entidad: `entities/ledger/`. Feature: `features/finance/`.
- Saldo por equipo = SUM(charges) − SUM(payments). Fianza = concepto `deposit` que se castiga con `charge` ligado a una suspensión.
- Niveles 1-2 (arbitraje, egresos, cierre) se agregan como conceptos/vistas encima; **no** tablas nuevas por nivel.

---

## 6. Orden de ataque sugerido

1. **`league_config` + desempate configurable** — desbloquea todo lo demás y arregla un hueco real (head-to-head). Bajo riesgo, alto retorno.
2. **Disciplina/suspensiones** — construye sobre dato ya capturado; alimenta el norte.
3. **Finanzas Nivel 0** (catálogo + ledger "¿quién debe?") — el diferenciador de mercado; ya vendible.
4. **Avisos de jornada** + **Panel del capitán** — cierran el viral loop.
5. **Finanzas Nivel 1-2** — para ligas fuertes, cuando haya demanda.

> Al implementar cada uno, seguir §3.7 de AGENTS.md (modelo → queries → feature → endpoint → UI) y dejar explícito en el PR cómo alimenta dato/identidad/contenido.

---

## 7. Desglose por tareas (un commit por paso)

Cada línea = un paso cerrable con su commit `conventional-commits`. Orden pensado para que cada commit compile y no rompa lo anterior. Jocobi corre tests/git/build (memoria del proyecto).

### Épica A — `league_config` + desempate configurable

- [x] **A1** Schema: tabla `league_config` con defaults + migración.
      `feat(db): add league_config table with rules defaults`
- [x] **A2** Entidad `entities/league-config/` (model + Zod + queries get/upsert).
      `feat(league-config): add entity model and queries`
- [x] **A3** Refactor `standings.ts`: `sortStandings` lee `tiebreakers` en vez de hardcodear; helper de head-to-head.
      `refactor(standings): drive tiebreakers from league_config incl. head-to-head`
- [x] **A4** Feature `features/tournament-rules/`: leer/editar config + validar bloqueo por `locked_at`.
      `feat(tournament-rules): editable league rules with lock-on-start`
- [x] **A5** Endpoint `GET/PATCH /api/leagues/[id]/config`.
      `feat(api): league config read/update endpoint`
- [x] **A6** 🎨 UI-GATE — "Reglamento del torneo" en `/admin/leagues/[id]` (colapsado por default).
      `feat(admin): tournament rules settings screen`
- [x] **A7** Setear `locked_at` al resolver la primera cédula.
      `feat(match-resolution): freeze league config on first resolved cedula`

> Extensión jul 2026 (§4.5) — config por organización, copia al crear liga.

- [x] **A8** Doc: `organization_config` + decisión copy-on-create (hecho, este mismo cambio).
      `docs: add organization-level rules default (copy-on-create)`
- [x] **A9** Schema `organization_config` + entidad `entities/organization-config/`.
      `feat(db): add organization_config table and entity`
- [x] **A10** Seed `league_config` desde `organization_config` al crear liga (`POST /api/leagues`, `quickCreateLeague`).
      `feat(league-onboarding): seed league_config from organization defaults`
- [x] **A11** `new-season` copia el `league_config` resuelto de la liga origen.
      `feat(api): carry league_config over on new season`

### Épica B — Disciplina y suspensiones

> Modelo revisado jul 2026 tras revisar `SANCIONES.xlsx` real — ver §2.1 y §5.2.
> Dos capas: motor automático por partidos (amarillas/roja directa) + escalado
> manual por tiempo calendario o veto indefinido para casos graves.

- [x] **B1** Schema: tabla `suspensions` (con `duration_type` matches/time/permanent) + migración.
      `feat(db): add suspensions table with matches, time and permanent duration modes`
- [x] **B2** Entidad `entities/suspension/` (model + queries: vigencia según `duration_type`).
      `feat(suspension): add entity model and queries`
- [x] **B3** Feature `features/discipline/`: motor que acumula tarjetas vs `yellow_threshold`/`red_card_matches` y materializa suspensiones `duration_type: 'matches'`.
      `feat(discipline): card accumulation and auto-suspension engine`
- [x] **B4** Hook en `match-resolution`: al resolver cédula, recalcular disciplina.
      `feat(discipline): recompute suspensions on cedula resolution`
- [x] **B5** Decremento de fechas pendientes al avanzar jornada + sync `leagueMembers.status`.
      `feat(discipline): decrement served matches and sync member status`
- [x] **B6** Escalado manual: editar una suspensión a `duration_type: 'time'` (semanas/meses, calcula `ends_on`) o `'permanent'` (veto), con `reason_detail` libre y `recorded_by` para auditoría. Endpoint `PATCH /api/suspensions/[id]`. También incluye alta manual desde cero (`POST /api/leagues/[id]/suspensions`, `reason: 'manual'`) — necesaria para el panel "Registrar sanción" del mockup de B7.
      `feat(discipline): manual escalation and from-scratch suspension creation`
- [x] **B7** 🎨 UI — lista de suspendidos por liga (admin) + señalización + acciones "escalar"/"levantar"/"registrar sanción". Mockup: `Suspensiones.html` (admin-redesign/screen-suspensions.jsx). Modal centrado (`shared/ui/Modal`) en vez del drawer lateral del mockup — mismo patrón que el resto del admin.
      `feat(admin): suspensions list view with manual escalation`
- [x] **B7b** Vista global `/admin/suspensiones` en el sidebar principal (grupo Gestión): todas las ligas visibles para el usuario (owner=todas, organizer=su org) en una sola pantalla — filtro de liga/estado/tipo, alta manual con selector de liga (roster cargado bajo demanda) y escalar/levantar sin cambiar de pantalla. Pedido explícito: flujo "domingo en la noche" con sanciones de varias ligas a la vez.
      `feat(admin): global cross-league suspensions view`
- [ ] **B8** Píldora de contenido "suspendidos de la jornada" (`post-import-content`).
      `feat(content): suspended-players matchday pill`

### Épica C — Finanzas Nivel 0 (¿quién debe?)

- [ ] **C1** Schema: `fee_concepts` + `ledger_entries` + migración.
      `feat(db): add fee_concepts and ledger_entries tables`
- [ ] **C2** Entidad `entities/ledger/` (model + queries + cálculo de saldo).
      `feat(ledger): add entity, queries and balance computation`
- [ ] **C3** Feature `features/finance/`: catálogo de conceptos + registrar cargo/abono.
      `feat(finance): fee concepts catalog and charge/payment recording`
- [ ] **C4** Endpoints `/api/leagues/[id]/fee-concepts` y `/api/leagues/[id]/ledger`.
      `feat(api): finance concepts and ledger endpoints`
- [ ] **C5** 🎨 UI-GATE — estado de cuenta por equipo ("quién debe" + registrar pago en efectivo).
      `feat(admin): team account statement screen`

### Épica D — Avisos + panel del capitán

- [ ] **D1** Generador de "rol de la jornada" texto para WhatsApp.
      `feat(content): matchday schedule text for WhatsApp`
- [ ] **D2** 🎨 UI-GATE — vista pública del capitán: rol, roster y saldo (si finanzas activas).
      `feat(public): captain self-service panel`

### Épica E — Finanzas Nivel 1-2 (diferido, según demanda)

- [ ] **E1** Fianza como `deposit` castigable por suspensión.
      `feat(finance): deposit (fianza) with sanction deductions`
- [ ] **E2** Arbitraje: tarifa por partido + cuenta por pagar al árbitro.
      `feat(finance): referee fees and payables`
- [ ] **E3** Egresos + cierre por torneo (ingresos − egresos) + corte de caja.
      `feat(finance): expenses, tournament close and cash cut`

> Regla de commits: un paso = un commit. Cerrar un paso genera su mensaje listo para que Jocobi lo ejecute; no avanzar al siguiente hasta que el anterior esté verde.

---

## 8. 🎨 Gate de diseño — detenerse antes de cualquier UI

**Regla para el agente:** todo paso marcado **🎨 UI-GATE** (y cualquier trabajo de UI en general) **NO se empieza directo**. Antes de escribir el primer componente, el agente **se detiene y le pregunta a Jocobi**:

> "Voy a construir la UI de **[feature]**. ¿Tienes un diseño para dármelo (Figma, imagen, referencia, specs), o quieres que lo decida yo?"

Y espera respuesta. Según la respuesta:

- **Jocobi tiene diseño** → lo implementa fiel a ese diseño (respetando además AGENTS.md §7.2: Tailwind, modo claro forzado, `green-600` primario, componentes ≤150 líneas).
- **Jocobi no tiene diseño / dice "decide tú"** → el agente propone y construye, pero deja el paso listo para que **otra IA de diseño** genere el look de esa feature. La idea es que el diseño lo lleve una IA especializada (p. ej. flujo de Figma/diseño) para que **todas las features compartan el mismo lenguaje visual y se vean profesionales**, en vez de una UI distinta por módulo.

**Por qué el gate:** la lógica (schema, queries, feature, endpoint) puede avanzar sin bloqueo; la UI es donde se juega la consistencia visual del producto. Detenerse ahí da la oportunidad de centralizar el diseño y mantener coherencia de marca (ver `docs/ORG-THEMING.md`, `docs/TOURNAMENT-SKINS.md` y AGENTS.md §7.2).

**Regla práctica:** el agente puede completar todos los pasos **no-UI** de una épica de corrido; al llegar a un paso 🎨 UI-GATE, pausa y pregunta antes de tocar `ui/` o `page.tsx`.
