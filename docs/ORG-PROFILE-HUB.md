# Hub de la organización — perfil y configuración central

> **Estado:** plan aprobado (jul 2026), sin construir. Documento maestro del
> módulo `/admin/organizacion`. Reúne en un solo lugar **todo lo que pertenece
> a la organización** — datos de identidad, tema, y los defaults que se
> **copian** a cada liga nueva. Sustituye y expande `docs/ORG-SETTINGS.md`
> (que queda como puntero). Motivado por pedido explícito de Jocobi: "es el
> momento de concentrar toda la config de la organización en su perfil".

---

## 0. Norte y principio rector

Una organización real corre **varias ligas/divisiones a la vez** (ej.
`SANCIONES.xlsx` trae "Varonil" y "Champions" del mismo organizador). Hoy cada
liga nueva repite el mismo llenado de reglamento, duración de partido, buffer,
jornadas y selección de canchas. El hub existe para que el organizador defina
**una vez** sus defaults a nivel organización y cada liga arranque ya
configurada.

**Principio de herencia — copiar al crear, NO heredar en vivo** (decisión
§4.5 de `docs/MODULOS-GESTION-LIGA.md`, ratificada por Jocobi para este plan):

- El default de organización se **copia** a la liga al crearla.
- De ahí en adelante cada liga es **independiente**: cambiar el default de la
  organización **no** mueve retroactivamente ligas ya creadas.
- Un **torneo relámpago** (reglas de una sola vez) es una liga normal con su
  propio config editable — no hereda cambios futuros.
- Se descarta la herencia en vivo (columnas nullable + resolución org→liga en
  cada lectura) por costo/complejidad y por el choque con `locked_at`.

---

## 1. Inventario — qué pertenece a la organización

Barrido de schema + docs (jul 2026). Tres categorías: **identidad** (datos de
la org), **catálogo** (inventario propiedad de la org que las ligas usan), y
**default** (plantilla que se copia a cada liga nueva).

| Bloque                            | Qué                                                                                                   | Categoría                            | Dónde vive hoy                                                                                   | Estado                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **General**                       | Nombre, logo, slug/URL única, ciudad                                                                  | Identidad                            | `organizations` + `PATCH /api/organizations/[id]` (`updateOrganization`)                         | Backend ✅ · sin UI de autoservicio                                                           |
| **Tema**                          | Paleta (preset), tipografía, logo render                                                              | Identidad visual                     | `organization_themes` + `/admin/organizacion/tema` (`features/org-theming`)                      | ✅ construido — solo enlazar al hub                                                           |
| **Reglamento por defecto**        | Puntos, desempates, umbral amarillas, fechas por roja, tarjeta azul, límite refuerzos, nivel finanzas | Default → `league_config`            | `organization_config` + `entities/organization-config`                                           | Backend ✅ · **falta endpoint `GET/PATCH /api/organizations/[id]/config` + UI**               |
| **Ajustes de sorteo por defecto** | Duración de partido, buffer, jornadas regulares, formato, no-repetir rival, permitir repetidos        | Default → `league_scheduling_config` | Solo a nivel liga (`league_scheduling_config`). **No hay plantilla org**                         | ❌ **hueco principal — tabla nueva + seed + endpoint + UI**                                   |
| **Canchas**                       | Inventario de canchas (nombre, ciudad, dirección, color, capacidad)                                   | Catálogo (ya es propiedad de la org) | `venues` (FK `organization_id`, unicidad por org). Ligas se suscriben vía `league_venues`        | Backend ✅ · UI de gestión hoy vive dentro del sorteo de liga — evaluar mover/duplicar al hub |
| **Catálogo de cobros** (finanzas) | Conceptos de cobro reusables sin liga (ej. renta suelta de cancha), montos en centavos                | Catálogo → seed a liga               | Planeado en `fee_concepts` con `league_id NULL` = concepto de organización (§3.1 / §5.3 MODULOS) | ⏳ depende de Épica C (finanzas) — se integra al hub cuando exista                            |
| **Miembros**                      | Usuarios de la organización y sus roles                                                               | Identidad/acceso                     | `league_members` + `/admin/organizations/[id]` (vista **owner**, cross-org)                      | Parcial · decisión de producto: ¿self-service del organizer aquí?                             |

### Notas del inventario

- **Canchas ya son org-level por diseño.** `venues` tiene FK a
  `organization_id` y unicidad `(organizationId, nameCanonical)`. Las ligas
  **no poseen** canchas: eligen cuáles usar (`league_venues`, con `priority`)
  y les fijan bandas horarias (`venue_time_windows`, por liga). Por eso el
  inventario de canchas es un candidato natural del hub, aunque su edición hoy
  viva incrustada en el flujo de sorteo de la liga (tab "Canchas" del
  screenshot). Ver §6, decisión abierta D-3.
- **Descansos y Slots fijos** (tabs del screenshot: `teamRestRequests`,
  `venueTimeWindows`/`teamPurchasedTimeslots`) son **por liga y por equipo**,
  no org-level. **No entran al hub** — se quedan en el sorteo de la liga.
- **`new-season`** copia el config **resuelto de la liga origen** (no de la
  organización) — preserva reglas propias temporada tras temporada. El hub
  solo alimenta el **alta de liga nueva**, no la renovación de temporada.

---

## 2. Forma del hub

Ruta `/admin/organizacion` (singular, implícito a la sesión — mismo patrón que
`/admin/organizacion/tema` ya usa: sin `[id]` porque un organizer administra
solo la suya). Tabs con el mismo patrón de `LeagueTabBar` /
`leagues/[id]/layout.tsx`.

```
/admin/organizacion
  ├─ General          nombre · logo · slug · ciudad        [backend ✅, falta UI]
  ├─ Tema             enlazar /admin/organizacion/tema      [✅ construido]
  ├─ Reglamento       default que se copia a league_config  [backend ✅, falta endpoint+UI]
  ├─ Sorteo           default que se copia a scheduling      [NUEVO — todo por construir]
  ├─ Canchas          inventario org (venues)               [backend ✅, decisión de ubicación]
  └─ Miembros         (owner-only hoy) — decisión abierta    [parcial]
```

Cada tab que sea **default** muestra el aviso ya presente en el screenshot de
sorteo, adaptado: _"Estos valores se copian a cada liga nueva al momento de
crearla. No afectan ligas ya creadas."_ — para que quede explícito el modelo
copy-on-create y nadie espere herencia retroactiva.

---

## 3. Modelo de datos — lo único nuevo

Todo el bloque de identidad, reglamento y canchas **ya tiene tablas**. El único
schema nuevo es la **plantilla de sorteo por organización**, calcada de
`league_scheduling_config` menos lo que es estado de ejecución (`lastSeed`,
`updatedAt` de ejecución) y menos lo que es identidad de liga.

```
organization_scheduling_config          -- 1:1 con organizations
  organization_id        uuid  PK FK → organizations(id) on delete cascade
  regular_matchdays      int   null      -- null = usar teamsCount-1 al crear liga
  regular_format         text  default 'single'
  match_duration_minutes int   default 50
  buffer_minutes         int   default 0
  allow_duplicate_matchups boolean default false
  no_repeat_within       int   default 3
  updated_at             timestamptz
```

- **`regular_matchdays` nullable a propósito.** A nivel liga es
  `teamsCount - 1` (round-robin), que depende del nº de equipos y no se conoce
  a nivel organización. `null` = "no forzar, dejar que el alta de liga calcule
  el default por equipos". Un número explícito = "esta org siempre juega N
  jornadas regulares" (ej. las 15 del screenshot).
- **Se excluyen** `lastSeed` (estado de un sorteo concreto) y el `regularFormat`
  se mantiene aunque MVP solo implemente `'single'` — para paridad con la liga.
- Sigue el patrón de `organization_config`: **sin `locked_at`** (una plantilla
  nunca se congela).

### Entidad y seed (FSD, AGENTS.md §3.7)

- `entities/organization-scheduling-config/` → `model.ts` (DTO +
  `UpdateOrganizationSchedulingConfigSchema`, reusa validaciones de
  `league-scheduling-config` si existen) y `queries.ts`
  (`findOrganizationSchedulingConfig`, `upsert…`). Recordar el split
  cliente/servidor del barrel: `queries.ts` **no** se re-exporta desde
  `index.ts` (memoria `entity-barrel-client-server-split`).
- Extender el seed de alta de liga: hoy `seedLeagueConfig(db, leagueId, orgId)`
  copia solo el reglamento. Se agrega la copia del sorteo — o un
  `seedLeagueSchedulingConfig(db, leagueId, orgId)` hermano, o se amplía el
  existente para copiar ambos en la misma transacción. Ambos se llaman desde
  `quickCreateLeague` (`features/league-onboarding/quick-create.ts:138`) y
  `POST /api/leagues`. No-op si la org no configuró nada → el alta cae en los
  defaults del sistema (comportamiento actual intacto).

---

## 4. Endpoints

| Método      | Ruta                                                         | Estado                                                    |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `PATCH`     | `/api/organizations/[id]` (nombre/logo/slug/ciudad)          | ✅ existe (`updateOrganization`)                          |
| `GET/PATCH` | `/api/organizations/[id]/config` (reglamento default)        | ❌ nuevo — Zod `UpdateOrganizationConfigSchema` ya existe |
| `GET/PATCH` | `/api/organizations/[id]/scheduling-config` (sorteo default) | ❌ nuevo                                                  |
| `GET`       | slug-check (disponibilidad + reservados)                     | ✅ existe (`org-theming` onboarding)                      |

Controladores delgados (AGENTS.md §7.4): validan con Zod, delegan a
`entities/*/queries` y `features/*`. Autorización: organizer/owner de **su**
organización (mismo guard que `/admin/organizacion/tema`).

---

## 5. UI — reuso máximo (todo bajo gate de diseño)

- **Reglamento:** los componentes de `features/tournament-rules/ui/`
  (`TiebreakerList`, `DisciplineSection`, `ReinforcementSection`,
  `FinanceSection`) son estructuralmente idénticos salvo `locked_at`. Se
  parametrizan por `OrganizationConfigDto` en `features/organization-rules/`
  (calco sin lógica de bloqueo).
- **Sorteo:** replicar el formulario del screenshot ("Parámetros del sorteo")
  contra `organization_scheduling_config`. Reusar los mismos inputs numéricos y
  el toggle "permitir rivales repetidos".
- **Formularios:** React Hook Form + Zod (AGENTS.md §7.2). **Feedback
  obligatorio** en cada mutación: `notify.success/error` en todo `useMutation`
  (memoria `mandatory-mutation-feedback`, AGENTS.md §7.2b). Sin `setState`
  dentro de `useEffect` (memoria `avoid-setstate-in-effect`).
- **Barrels de feature:** un `index.ts` de feature no mezcla data-fetchers
  server-only con componentes/hooks client-safe si un Client Component importa
  de ahí (memoria `feature-barrel-client-server-split`).

---

## 6. Decisiones abiertas (para cerrar con Jocobi antes de construir)

- **D-1 · Miembros en el hub.** Hoy la gestión de miembros vive en
  `/admin/organizations/[id]` como vista **owner** (cross-org). ¿Se agrega un
  tab de autoservicio para que el organizer gestione su propia org, o se deja
  owner-only? Decisión de producto pendiente.
- **D-2 · `regular_matchdays` default.** ¿Se expone el campo a nivel org (org
  que "siempre juega 15") o se deja siempre `null` (calcular por equipos al
  crear liga)? Recomendación: exponerlo opcional, con placeholder "automático
  por nº de equipos".
- **D-3 · Ubicación de Canchas.** El inventario `venues` es org-level, pero su
  UI hoy vive dentro del sorteo de liga (y hay **UI duplicada** entre
  `canchas/` y `sorteo/canchas/` — memoria `duplicate-canchas-windows-ui`).
  ¿Se agrega tab "Canchas" al hub como fuente única de verdad del inventario, y
  el sorteo de liga solo **selecciona** de ese inventario? Recomendado, pero es
  refactor — evaluar esfuerzo aparte.
- **D-4 · Catálogo de cobros.** `fee_concepts` con `league_id NULL` son
  conceptos de organización. Se integran al hub como tab "Cobros" **solo
  después** de que exista la Épica C (finanzas). Fuera de alcance de este plan.

---

## 7. Plan por épicas (un commit por paso — memoria `commit-message-per-step`)

> **Gate de diseño (AGENTS.md §8 / memoria `ui-gate-ask-design`):** antes de
> escribir cualquier `ui/`, detenerse y preguntar a Jocobi si tiene diseño.
> Todos los pasos marcados 🎨 son UI-GATE.

**Épica O — Andamiaje del hub**

- **O1** Layout `/admin/organizacion` con `OrgTabBar` (patrón `LeagueTabBar`) +
  guard organizer/owner. Enlazar el tab **Tema** al `/admin/organizacion/tema`
  existente. 🎨
- **O2** Tab **General**: formulario nombre/logo/slug/ciudad contra el
  `PATCH /api/organizations/[id]` que ya existe (+ subida de logo y slug-check
  reusando lo de onboarding). 🎨

**Épica P — Reglamento por defecto** (backend listo)

- **P1** Endpoint `GET/PATCH /api/organizations/[id]/config` (Zod ya existe).
- **P2** Feature `features/organization-rules/` (calco de `tournament-rules`
  sin `locked_at`).
- **P3** Tab **Reglamento** reusando componentes de `tournament-rules/ui`. 🎨

**Épica Q — Sorteo por defecto** (el hueco — nada existe)

- **Q1** Schema `organization_scheduling_config` + migración.
- **Q2** Entidad `entities/organization-scheduling-config/` (model + queries).
- **Q3** Extender el seed de alta de liga para copiar también el sorteo
  (`quickCreateLeague` + `POST /api/leagues`), con test de que copia y de que
  es no-op sin default.
- **Q4** Endpoint `GET/PATCH /api/organizations/[id]/scheduling-config`.
- **Q5** Tab **Sorteo** (réplica del formulario "Parámetros del sorteo"). 🎨

**Épica R — Canchas al hub** (opcional, según D-3)

- **R1** Tab **Canchas**: mover/consolidar la gestión de inventario `venues` al
  hub; el sorteo de liga pasa a solo seleccionar. Resuelve de paso la UI
  duplicada. 🎨

Orden sugerido de arranque (a confirmar): **O → P → Q**. General y Reglamento
son baratos (backend listo) y validan el patrón del hub con tabs; Sorteo es el
mayor esfuerzo pero ataca el dolor que originó el pedido.

---

## 8. Fuera de alcance

- Herencia en vivo org→liga (descartada, §0).
- Renovación de temporada (`new-season` copia de la liga origen, no de la org).
- Descansos y slots fijos (son por liga/equipo, no org-level).
- Subdominios por organización (pospuesto — ver `docs/ORG-THEMING.md`).
- Catálogo de cobros (depende de Épica C finanzas — D-4).
