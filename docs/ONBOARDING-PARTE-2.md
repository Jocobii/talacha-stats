# Onboarding Parte 2 — Arranque (Cancha → Liga → Horario)

> **Estado:** plan de implementación. Léelo completo antes de escribir código.
> **Fuente de verdad de reglas:** `AGENTS.md`. Este doc solo describe **qué** construir y **cómo encaja** con el código existente; las convenciones (FSD, DTO→ViewModel, RHF+Zod, TanStack Query, testing, migraciones) mandan sin excepción.

---

## 1. Problema y objetivo

Hoy el onboarding termina en la Parte 1 (`/onboarding`): el organizador captura **nombre + slug** y **paleta/estilo** de su organización, y cae directo en `/admin`. Ahí se topa con un panel vacío sin saber por dónde empezar.

El siguiente paso lógico es **capturar los catálogos mínimos para que la operación funcione**. Hoy el único catálogo obligatorio es la **cancha** (`venues`): sin cancha no hay dónde registrar horarios, y sin horario el sorteo/calendario de la liga no tiene dónde colocar partidos.

**Objetivo de la Parte 2:** un flujo guiado, corto y "smooth" que, justo después de crear la organización, lleve al organizador a:

1. **Registrar su primera cancha** (obligatoria; puede agregar más).
2. **Crear su primera liga.**
3. **Asignar la cancha a la liga con un horario** (una ventana simple).
4. **Terminar** entendiendo el patrón, para poder repetirlo solo después.

Equipos y jugadores **quedan fuera** de la Parte 2 — se capturan después en el wizard de configuración de liga que ya existe (`/admin/leagues/[id]/setup`, pasos Equipos → Jugadores → Listo).

### Conexión al norte (§1.5 AGENTS.md)

La cancha y el horario son **gestión pura**, pero desembocan en el norte: sin ellos no hay calendario, sin calendario no hay cédula capturada en-app, y sin cédula no hay dato limpio → identidad → contenido. La Parte 2 es el primer eslabón que habilita toda la captura de dato estructurado de la liga.

---

## 2. Decisiones tomadas (no reabrir sin acuerdo)

| Decisión                | Elección                                                                                | Implicación                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ubicación**           | Flujo **nuevo dedicado post-org**: ruta `/onboarding/arranque`.                         | La Parte 1 (`/onboarding`) deja de redirigir a `/admin` al terminar; ahora redirige a `/onboarding/arranque`. El wizard de liga en `/admin/leagues/[id]/setup` **no se toca**. |
| **Cantidad de canchas** | **Una obligatoria, más opcionales.**                                                    | El paso "Cancha" exige mínimo 1 para avanzar; permite agregar varias en la misma pantalla sin obligar.                                                                         |
| **Horario**             | **Una ventana simple**: día heredado de la liga (`dayOfWeek`) + hora inicio + hora fin. | No se pide el día (se toma de `league.dayOfWeek`). Solo `startTime` y `endTime`. Múltiples ventanas se agregan después en `/admin/leagues/[id]/canchas`.                       |

---

## 3. Piezas del código que ya existen (REUTILIZAR, no reescribir)

El flujo se arma **orquestando funciones que ya existen**. No dupliques lógica de negocio.

### Casos de uso (capa `features/`)

| Necesidad             | Función existente                                       | Archivo                                          |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Crear cancha          | `createVenue(input: CreateVenueInput)`                  | `src/features/venue-management/create-venue.ts`  |
| Asignar cancha a liga | `assignVenueToLeague(leagueId, venueId, priority?)`     | `src/features/venue-management/assign-venue.ts`  |
| Crear ventana horaria | `createWindow(leagueId, input: CreateVenueWindowInput)` | `src/features/venue-management/venue-windows.ts` |
| Crear liga            | `quickCreateLeague(input, session)`                     | `src/features/league-onboarding/quick-create.ts` |

### Contratos Zod (capa `types` / `entities`)

| Schema                                    | Campos clave                                                                                               | Archivo                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `CreateVenueSchema`                       | `name`, `organizationId`, `city?`, `address?`, `capacity(1-6, def 1)`, `color(hex, def #60A5FA)`, `notes?` | `src/types/index.ts`                                         |
| `CreateVenueWindowSchema`                 | `venueId`, `dayOfWeek`, `startTime(HH:MM)`, `endTime(HH:MM)`, refine `start < end`                         | `src/types/index.ts`                                         |
| `QuickCreateLeagueSchema`                 | `name`, `dayOfWeek`, `season`, `category?`, `organizationId?`                                              | `src/features/league-onboarding/model/league-form-schema.ts` |
| `DAY_VALUES` / `DAYS` / `defaultSeason()` | días client-safe + default de temporada                                                                    | mismo archivo                                                |

### API routes que ya existen (probablemente suficientes)

- `POST /api/venues` → crea cancha (usa `createVenue`).
- `POST /api/leagues/quick-create` → crea liga (usa `quickCreateLeague`).
- `POST /api/leagues/[id]/venues` → asigna cancha a liga (verificar que exista y llame `assignVenueToLeague`).
- `POST /api/leagues/[id]/venues/[venueId]/windows` → crea ventana (verificar que llame `createWindow`).

> **Tarea de verificación (paso 0):** abre cada uno de esos 4 route handlers y confirma su método, forma del body y forma de la respuesta (`apiSuccess<T>` con qué `T`). El plan asume que existen y funcionan; si alguno falta o difiere, ajústalo respetando §3.2/§7 de AGENTS.md **antes** de cablear la UI. No inventes el shape: léelo.

### Patrón de referencia para la UI

- **Parte 1 (org):** `src/app/(shell)/onboarding/OnboardingForm.tsx` — wizard de 2 pasos con `useState<step>`, indicador de pasos (`StepDot`), y `apiFetch` en los handlers. **Copia este patrón de UX** (mismo look, mismos tokens `bg-surface`, `text-ink`, `bg-brand`, etc.).
- **Wizard de liga:** `src/features/league-onboarding/ui/OnboardingWizard.tsx` + `model/useOnboardingWizard.ts` — patrón de orquestador + hook de paso. **Copia este patrón de arquitectura** (hook dueño del estado del wizard, UI tonta por props).
- **Alta de cancha:** `src/app/(shell)/admin/canchas/NewVenueModal.tsx` + `VenueFormFields.tsx` — campos y validación de cancha ya resueltos; reutiliza los subcomponentes de campos si es viable en vez de reescribir inputs.

---

## 4. Arquitectura del flujo nuevo

Nueva feature: **`features/arranque-onboarding/`** (FSD, §3.6). Nombre distinto de `league-onboarding` para no mezclar responsabilidades (aquel arma equipos/jugadores; este arma catálogos + liga + horario).

```
features/arranque-onboarding/
├── constants.ts               # ARRANQUE_STEPS, límites, textos de paso
├── types.ts                   # ArranqueStep, CreatedVenue, ViewModels del wizard
├── index.ts                   # Exports públicos
├── model/
│   ├── arranque-schema.ts      # (opcional) schema client-safe si se necesita uno propio
│   ├── useArranqueWizard.ts    # Estado del wizard: paso, cancha(s) creada(s), liga creada
│   ├── useCreateVenueStep.ts   # Mutation crear cancha (TanStack Query + apiFetch)
│   ├── useCreateLeagueStep.ts  # Mutation crear liga (reusa /api/leagues/quick-create)
│   └── useAssignVenueWindow.ts # Mutation asignar cancha + crear ventana
└── ui/
    ├── ArranqueWizard.tsx      # Orquestador (≤ 80 líneas): decide qué paso pinta
    ├── StepVenue.tsx           # Paso 1: capturar cancha(s)
    ├── StepLeague.tsx          # Paso 2: crear liga
    ├── StepSchedule.tsx        # Paso 3: asignar cancha + horario simple
    └── StepReady.tsx           # Paso 4: listo + CTAs
```

Ruta (capa `app`):

```
src/app/(shell)/onboarding/arranque/
├── page.tsx                    # Server Component: auth + gating + baja datos iniciales
└── ArranqueClient.tsx          # "use client": monta useArranqueWizard + ArranqueWizard
```

> **Regla de dependencias (§3.1):** `app → features → entities → shared`. La `page.tsx` importa la feature; la feature nunca importa de `app`. Los tipos de respuesta bajan de `entities`, no del route (§7.4).

---

## 5. Pasos del wizard (UX)

Barra de progreso de 4 pasos reutilizando el estilo de `StepDot` de la Parte 1.

### Paso 1 — Cancha (obligatorio, mínimo 1)

- Formulario RHF + `zodResolver(CreateVenueSchema)` (§7.2). `organizationId` se inyecta desde la sesión en el server, **no** se pide al usuario ni se confía del cliente.
- Campos visibles: **nombre** (obligatorio), y en un "más opciones" plegable: ciudad, dirección, capacidad (1–6), color, notas. Mantener la fricción mínima: nombre basta.
- Al guardar → `POST /api/venues` → agrega la cancha a la lista `createdVenues` del hook.
- Lista de canchas ya creadas debajo del form, con opción de agregar otra.
- **Gate:** botón "Continuar" deshabilitado hasta `createdVenues.length >= 1`.
- Copy de encabezado: algo como _"Registra tu primera cancha. Aquí se jugarán los partidos y de aquí saldrán los horarios."_

### Paso 2 — Crear liga

- Formulario RHF + `zodResolver(QuickCreateLeagueSchema)`.
- Campos: **nombre**, **día** (chips `DAYS`), **temporada** (prellenar con `defaultSeason()`), categoría opcional.
- Al guardar → `POST /api/leagues/quick-create` → guarda `createdLeague` (incluye `id`, `dayOfWeek`) en el hook.
- Manejar el error `LEAGUE_EXISTS` mostrando el mensaje del backend (§7.2: la UI siempre muestra el error de la API).

### Paso 3 — Asignar cancha + horario

- Contexto mostrado: liga creada (nombre, día) + selector de **cuál cancha** asignar (de `createdVenues`; si solo hay una, preseleccionada).
- **Horario simple:** solo `startTime` y `endTime` (inputs `time`, formato `HH:MM`). El **día NO se pide**: se hereda de `createdLeague.dayOfWeek`.
- Al confirmar, dos llamadas encadenadas (el hook las orquesta; la UI queda tonta):
  1. `POST /api/leagues/[leagueId]/venues` con `{ venueId }` → `assignVenueToLeague`.
  2. `POST /api/leagues/[leagueId]/venues/[venueId]/windows` con `{ venueId, dayOfWeek: league.dayOfWeek, startTime, endTime }` → `createWindow`.
- Validación previa en cliente (`start < end`) + mostrar el error de solapamiento (409) que ya devuelve `createWindow`.
- **Nota de robustez:** si (1) sucede y (2) falla, la cancha queda asignada sin ventana — estado recuperable, no huérfano. El hook debe reflejar el error de (2) y permitir reintentar solo esa parte. No hace falta transacción entre ambas (viven en endpoints distintos); documenta este orden en el hook.

### Paso 4 — Listo

- Confirmación + explicación de una línea de qué sigue: _"Tu liga ya tiene cancha y horario. Ahora agrega equipos y jugadores."_
- CTAs:
  - **Primario:** "Configurar equipos y jugadores" → `/admin/leagues/[createdLeague.id]/setup` (entra al wizard existente).
  - **Secundario:** "Ir al panel" → `/admin`.

---

## 6. Gating y reanudación (importante)

Hoy `src/app/(shell)/onboarding/page.tsx` hace: `if (user.organizationId) redirect("/admin")`. Con la Parte 2, la lógica de a-dónde-mandar-al-usuario cambia.

**Cambio en el redirect post-org:**

- `OnboardingForm.handleCreate` (Parte 1) actualmente hace `router.push("/admin")` tras crear la org y (opcional) el tema. **Cambiar a `router.push("/onboarding/arranque")`.**

**Gating de `/onboarding/arranque/page.tsx` (Server Component):**

1. `getSessionUser()`; si no hay usuario → `redirect("/login")`.
2. Si `!user.organizationId` → `redirect("/onboarding")` (aún no creó la org).
3. Si la Parte 2 **ya está completa** → `redirect("/admin")` (no re-onboardear).

**¿Cómo se sabe si la Parte 2 está completa?** Derivar del dato (evita migración): la org tiene **≥1 liga con ≥1 cancha asignada y ≥1 ventana**. Crear un query en `entities/organization` o en la feature:

```ts
// entities/organization/queries.ts (o features/arranque-onboarding/queries.ts)
export async function getArranqueState(organizationId: string): Promise<{
	hasVenue: boolean;
	hasLeague: boolean;
	hasScheduledLeague: boolean; // liga con leagueVenue + venueTimeWindow
	isComplete: boolean; // hasScheduledLeague
}>;
```

- Consulta a nivel DB (§17: filtrado en la query, no en memoria). Usa `COUNT`/`EXISTS` sobre `venues`, `leagues`, `leagueVenues`, `venueTimeWindows` scoped a `organizationId`.
- `isComplete = hasScheduledLeague`. Ese es el criterio para el redirect a `/admin`.

> **Alternativa (si se prefiere estado explícito):** agregar columna `organizations.arranque_completed_at TIMESTAMP NULL` vía **migración append-only** (§15) y marcarla al terminar el Paso 3. Más simple de leer, pero mete migración + escritura. **Recomendación: empezar con el estado derivado**; si el query se vuelve caro o ambiguo, migrar a la columna. No hacer ambas.

**Reanudación:** si el usuario abandona a media Parte 2 y vuelve, el `page.tsx` puede pasar `getArranqueState()` como `initialData` al hook para **abrir el wizard en el paso correcto** (si ya hay cancha pero no liga → Paso 2; si hay liga sin horario → Paso 3). Mantenerlo simple: como mínimo, no perder las canchas ya creadas.

---

## 7. Contratos de datos (DTO → ViewModel)

Por §7.4 y §19, cada respuesta de API es un **DTO nombrado en `entities/`** y la UI consume un **ViewModel** vía mapper puro.

- Reutiliza los tipos de salida que ya exponen los endpoints (`Venue`, la respuesta de `quick-create` `QuickCreatedLeague`, `LeagueVenue`, `VenueTimeWindow`). Si un endpoint hoy no exporta un DTO nombrado desde `entities`, créalo ahí (no en el route, no inline en el componente).
- Mappers en `features/arranque-onboarding/lib/map-*.ts` para lo que la UI muestre (ej. `mapVenueToChip`, `mapLeagueToSummary`). Aplica `titleCase()` (§5) en el mapper, nunca en el componente.
- Los componentes de `ui/` reciben **ViewModels + callbacks por props**. Cero `fetch`, cero mapeo, cero regla de negocio (§7.3).

---

## 8. Orden de implementación (para el agente)

Sigue el orden de §3.7 (Modelo → Queries → Lógica → Endpoint → UI). Aquí casi todo el backend ya existe, así que el trabajo es mayormente orquestación + UI + gating.

1. **Verificar los 4 endpoints** (paso 0 de §3): `POST /api/venues`, `POST /api/leagues/quick-create`, `POST /api/leagues/[id]/venues`, `POST /api/leagues/[id]/venues/[venueId]/windows`. Confirmar body y respuesta; ajustar si falta alguno (respetando §3.2/§7).
2. **Query de estado** `getArranqueState(organizationId)` en `entities/organization` (o feature) — con test unitario de los casos: sin nada, con cancha, con liga sin horario, completo.
3. **Feature `arranque-onboarding`**: `constants.ts`, `types.ts`, hooks de `model/` (mutations con TanStack Query + `apiFetch`, keys desde `@/shared/api/query-keys`), `useArranqueWizard` (estado del wizard).
4. **UI** `ui/` (orquestador + 4 pasos), copiando UX de la Parte 1 y tokens del sistema. Cada componente ≤ 150 líneas, orquestador ≤ 80 (§3.5).
5. **Ruta** `app/(shell)/onboarding/arranque/page.tsx` (Server Component con auth + gating + `getArranqueState`) + `ArranqueClient.tsx` (`"use client"`).
6. **Cambiar el redirect** en `OnboardingForm.handleCreate`: `/admin` → `/onboarding/arranque`.
7. **Ajustar gating** en `onboarding/page.tsx` si aplica (que un usuario con org pero Parte 2 incompleta no quede atrapado en `/admin`; decidir si `/admin` también invita a completar arranque o si solo el post-org redirige).
8. **Tests** (§20): mappers y funciones puras (unit), hooks de mutation (con `createQueryWrapper` + mock de `@/shared/api/client`), y componentes con estados loading/error/empty. Cubrir edge cases: cancha duplicada (409), liga existente (`LEAGUE_EXISTS`), ventana solapada (409), fallo de (2) tras éxito de (1) en el Paso 3.

---

## 9. Checklist de aceptación

- [ ] Tras crear la organización (Parte 1), el usuario aterriza en `/onboarding/arranque`, **no** en `/admin`.
- [ ] No se puede pasar del Paso 1 sin al menos **una cancha** creada; se pueden agregar varias.
- [ ] El Paso 2 crea la liga con `quickCreateLeague` y respeta el error `LEAGUE_EXISTS`.
- [ ] El Paso 3 asigna la cancha y crea **una ventana** con `dayOfWeek` heredado de la liga; muestra el error de solapamiento si aplica.
- [ ] El Paso 4 ofrece continuar al wizard de equipos/jugadores (`/admin/leagues/[id]/setup`) o ir al panel.
- [ ] Al volver con la Parte 2 completa, `/onboarding/arranque` redirige a `/admin`.
- [ ] Equipos y jugadores **no** aparecen en este flujo.
- [ ] Sin nueva librería; sin `fetch()` desnudo; sin lógica de negocio en componentes; sin CSS custom (§7.2, §11).
- [ ] FSD respetado: `app → features → entities → shared`; DTO baja de `entities`; UI consume `XView` (§3.1, §7.4, §19).
- [ ] Pruebas incluidas para hooks, mappers y componentes con casos de error/empty (§20).
- [ ] Si se optó por la columna `arranque_completed_at`: migración **append-only**, forward-only, aplicada con conexión directa (§15).

---

## 10. Fuera de alcance (Parte 2)

- Equipos y jugadores (viven en `/admin/leagues/[id]/setup`).
- Sorteo/calendario (se dispara después, ya con cancha + horario listos).
- Múltiples ventanas por cancha, rentas, calendario de canchas (`/admin/leagues/[id]/canchas`, `/admin/venues/calendar`).
- Subdominios / theming por liga (ver `docs/ORG-THEMING.md`).

```

```
