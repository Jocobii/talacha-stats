# Nueva Temporada v2 — Especificación de diseño para IA

> Complemento de `docs/NUEVA-TEMPORADA-V2.md` (plan técnico). Este documento es
> el **contrato de UI**: qué pantallas existen, con qué primitivos se arman, qué
> estados tienen y qué copy exacto llevan. Un agente debe poder implementar sin
> inventar nada.
>
> Reglas que aplican sin excepción: `AGENTS.md` §7.2a (sistema de composición),
> §7.2b (feedback obligatorio), §7.3 (5 capas de datos), §3.5 (≤150 líneas por
> componente, ≤80 el orquestador), §19 (mapper → ViewModel), §20 (tests).

---

## 0. Reglas de estilo — leer antes de escribir JSX

**Prohibido en este módulo:**

- `style={{}}` para layout o tipografía → usa `Stack`/`Inline`/`Grid`/`Center`/`Box`.
- `<h2>`/`<p>` con clases de tamaño a mano → usa `Typography variant=...`.
- `text-[14px]`, `gap-[18px]`, colores hex literales → usa la escala y los tokens.
- `useState` para loading/error de red → TanStack Query (`isPending`/`isError`).
- Mutación sin `notify.success` / `notify.error`.

**Tokens disponibles** (`src/app/globals.css`, admin en modo claro forzado):

| Uso                                    | Token Tailwind                               |
| -------------------------------------- | -------------------------------------------- |
| Fondo de página                        | `bg-pitch`                                   |
| Tarjeta                                | `bg-surface`                                 |
| Superficie elevada / fila              | `bg-surface-2`, `bg-surface-3`               |
| Bordes                                 | `border-line`, `border-line-2`               |
| Texto principal / secundario / apagado | `text-ink`, `text-ink-2`, `text-ink-3`       |
| Marca (acción primaria, activo)        | `bg-brand`, `text-brand-ink`, `border-brand` |
| Advertencia                            | `text-amber`, `tint-amber`                   |
| Destructivo                            | `text-rose`, `tint-rose`                     |

**Escalas:** `gap`/`pad` solo `none|xs|sm|md|lg|xl`. `Typography variant` solo
`display|h2|h3|h4|lead|body|bodySm|caption`.

**Iconografía:** `lucide-react`, `size={14}` en filas y `size={16}` en botones.
Set del módulo: `CalendarPlus` (nueva temporada), `Users` (equipos),
`UserPlus` (activar), `Archive` (banca), `Trophy` (torneo terminado),
`AlertTriangle` (advertencia de sorteo), `Check`, `Search`.

---

## 1. Inventario de pantallas

| #   | Pantalla                  | Ruta                                        | Componente raíz        | Prioridad |
| --- | ------------------------- | ------------------------------------------- | ---------------------- | --------- |
| A   | Banner de fin de torneo   | `/admin/leagues/[id]/posiciones` + `/admin` | `SeasonEndBanner`      | Alta      |
| B   | Wizard de nueva temporada | `/admin/leagues/[id]/nueva-temporada`       | `SeasonRolloverWizard` | Alta      |
| C   | Banca en Configuración    | `/admin/leagues/[id]/configuracion`         | `TeamBenchSection`     | Alta      |
| D   | Aviso de banca en Sorteo  | `/admin/leagues/[id]/sorteo`                | `BenchHintCard`        | Media     |
| E   | Modal de activación       | (overlay, desde C y D)                      | `ActivateTeamModal`    | Alta      |

> El wizard pasa de ser un formulario inline dentro de Configuración a **ruta
> propia**. Razón: son 3 pasos con una lista de 30 filas; embebido en una tarjeta
> de ajustes no cabe y compite con el resto de la pantalla.

---

## 2. Pantalla A — `SeasonEndBanner`

### Cuándo aparece

`completion.isComplete === true && league.status === 'active'`. Consulta:
`useLeagueCompletion(leagueId)`. Mientras `isPending`, **no renderiza nada**
(sin skeleton — es contenido opcional, un skeleton ahí genera parpadeo).

### Anatomía

```
┌────────────────────────────────────────────────────────────────────┐
│ 🏆  Clausura 2025 terminó                                          │
│     Deportivo Roble campeón · 30 equipos · 15 jornadas             │
│     Inicia la siguiente temporada y decide qué equipos continúan.  │
│                                     [ Iniciar temporada ]  [ ✕ ]   │
└────────────────────────────────────────────────────────────────────┘
```

- Contenedor: `Card` con `className="border-brand/30 bg-brand/5"`.
- Ícono `Trophy` en cuadro `bg-brand/10 rounded-lg p-2`, `text-brand-ink`.
- Título: `Typography variant="h4"`.
- Metadatos: `Typography variant="caption" tone="muted"`, separados por `·`.
- Cuerpo: `Typography variant="bodySm" tone="muted"`.
- Acción: `Button variant="primary" size="sm" icon={CalendarPlus}` →
  `/admin/leagues/[id]/nueva-temporada`.
- Cerrar: `Button variant="ghost" size="sm"`. El dismiss es **por sesión y por
  liga**, guardado en `localStorage` con key `season-end-dismissed:{leagueId}`,
  leído con **lazy initializer** de `useState` y guarda `typeof window` (§7.2).
  En `/admin` **ignora el dismiss** — ahí siempre se ve.

### Variante dashboard (`/admin`)

Misma tarjeta, más compacta: una fila por liga terminada sin sucesora, dentro de
una `Section title="Torneos terminados"`. Sin botón de cerrar.

### Estados

| Estado                   | Render                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `isPending`              | nada                                                           |
| `isError`                | nada (fallo silencioso a nivel UI, `console.error` en el hook) |
| `!isComplete`            | nada                                                           |
| `isComplete` + dismissed | nada (solo en la liga; en dashboard sí se ve)                  |
| `isComplete`             | banner completo                                                |

---

## 3. Pantalla B — `SeasonRolloverWizard`

Ruta nueva `/admin/leagues/[id]/nueva-temporada`, dentro del `LeagueLayout`
existente (hereda breadcrumb + header + tab bar). Contenido en `Card`, ancho
máximo `max-w-3xl`.

Encabezado fijo arriba del paso: `Stepper` con 3 pasos —
**Temporada · Equipos · Confirmar**.

### 3.1 Paso 1 — Temporada

```
┌──────────────────────────────────────────────────────┐
│  ①━━━━━② ─────③                                      │
│                                                       │
│  Nueva temporada de Liga Centenario                  │
│  Clausura 2025 quedará archivada al terminar.        │
│                                                       │
│  Nombre de la temporada *                             │
│  ┌─────────────────────────────────────────────┐     │
│  │ Apertura 2026                                │     │
│  └─────────────────────────────────────────────┘     │
│  Se usará en la URL y en la cédula: LCN2-0001        │
│                                                       │
│  Cierre de inscripciones (opcional)                  │
│  ┌──────────┐ jornada                                 │
│  │    4     │  Después de esta jornada la app avisa   │
│  └──────────┘  al dar de alta un equipo.              │
│                                                       │
│                          [ Cancelar ]  [ Siguiente ] │
└──────────────────────────────────────────────────────┘
```

- `Field` + `Input` (RHF con `zodResolver` sobre
  `model/season-rollover-form-schema.ts`, client-safe, reusado por el route §7.2).
- Preview del código de liga en `Typography variant="caption" tone="muted"`;
  se calcula en cliente con la misma función `generateLeagueCode` — es puro.
- `Siguiente` deshabilitado si el nombre está vacío.
- Sugerencia de nombre: placeholder derivado de la temporada actual
  (`Apertura 2025` → `Clausura 2026`), **como placeholder, nunca prellenado**.

### 3.2 Paso 2 — Equipos (pantalla central del módulo)

```
┌────────────────────────────────────────────────────────────────┐
│  ①━━━━━●━━━━━③                                                 │
│                                                                 │
│  ¿Qué equipos continúan en Apertura 2026?                      │
│  De Clausura 2025 siguen registrados 30 equipos. Marca solo    │
│  los que ya confirmaron. Los demás quedan en la banca y los    │
│  puedes activar cuando se inscriban, en cualquier jornada.     │
│                                                                 │
│  ┌ 🔍 Buscar equipo…                    ┐  3 de 30 marcados    │
│  └────────────────────────────────────  ┘  [Todos] [Ninguno]   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑  ▉ Deportivo Roble      1°   18 jug.   15 PJ            │ │
│  │ ☑  ▉ Atlético Sur         4°   15 jug.   15 PJ            │ │
│  │ ☑  ▉ Real Otay            7°   21 jug.   14 PJ            │ │
│  │ ☐  ▉ Juventud FC         11°   12 jug.   15 PJ            │ │
│  │ ☐  ▉ Los Compas          19°   14 jug.    9 PJ   ⚠ irregular│
│  │ …                                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ☑ Traer el roster de cada equipo marcado (54 jugadores)       │
│                                                                 │
│                            [ Atrás ]  [ Siguiente ]            │
└────────────────────────────────────────────────────────────────┘
```

**Fila de equipo** (`RolloverTeamRow`, ≤ 80 líneas):

- Contenedor: `Inline gap="md" align="center"` con
  `className="px-3 py-2.5 border-b border-line last:border-0 hover:bg-surface-2 cursor-pointer"`.
- Toda la fila es el label del checkbox (target grande, ~44px de alto).
- `TeamBadge` (`size="sm"`, con color del equipo) + nombre en
  `Typography variant="bodySm" weight="medium"`.
- Métricas a la derecha, en `Typography variant="caption" tone="muted"`,
  ancho fijo por columna para que aliñen: posición final, jugadores, PJ.
- `Badge tone="warn"` con texto `Irregular` si el equipo jugó < 60% de las
  jornadas — señal honesta de "este probablemente no vuelve".
- Fila marcada: `bg-brand/5 border-l-2 border-brand`.

**Reglas de comportamiento:**

- Default: **todos desmarcados**. No hay preselección de ningún tipo.
- Búsqueda: aparece solo si hay > 12 equipos. Filtra en cliente sobre la lista ya
  cargada (dataset chico y ya en memoria — permitido por §17.3, no es una nueva
  petición). Debounce no necesario.
- `Todos` / `Ninguno` afectan solo a las filas visibles tras el filtro.
- Contador `N de M marcados` en vivo, `Typography variant="caption"`.
- Toggle de roster: si se desmarca, `copyRosters: false` y el texto de conteo de
  jugadores se atenúa.
- **Se permite continuar con 0 marcados.** El botón dice entonces
  `Siguiente` igual, y el paso 3 lo explica. No bloquear, no advertir aquí.
- Ordenamiento default: posición final ascendente. El campeón primero es lo que
  el organizador espera ver.

**Estados:**

| Estado                          | Render                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cargando                        | `ListSkeleton` con 6 filas                                                                                                                                                                        |
| Error                           | `ErrorState` + `Button` "Reintentar" (`refetch`)                                                                                                                                                  |
| Liga origen sin equipos activos | `EmptyState` icon=`Users`, title "Esta liga no tiene equipos activos", description "La temporada nueva arrancará vacía. Podrás dar de alta equipos desde Configuración." + `Siguiente` habilitado |

### 3.3 Paso 3 — Confirmar

```
┌────────────────────────────────────────────────────────────────┐
│  ①━━━━━②━━━━━●                                                 │
│                                                                 │
│  Apertura 2026 — resumen                                        │
│                                                                 │
│  ✓  3 equipos activos, con su roster (54 jugadores)            │
│  ⏸  27 equipos en banca, activables cuando se inscriban        │
│  ✓  4 canchas · 2 zonas de clasificación · reglamento          │
│  ✓  Clausura 2025 queda archivada como temporada terminada     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚠  El sorteo se calculará sobre 3 equipos. Si esperas     │  │
│  │    más inscripciones, corre el sorteo cuando cierres.     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                     [ Atrás ]  [ Crear Apertura 2026 ]         │
└────────────────────────────────────────────────────────────────┘
```

- Cada línea del resumen: `Inline gap="sm"` con ícono `Check` (`text-brand-ink`),
  `Pause` (`text-ink-2`) o `AlertTriangle` (`text-amber`).
- Caja de advertencia: `bg-tint-amber border border-tint-amber-bd rounded-lg p-3`.
  Aparece si `confirmedTeamIds.length < 6`. Copy cambia si son 0:
  _"La temporada arrancará sin equipos. Actívalos desde la banca conforme se
  inscriban."_
- Botón primario con el nombre real de la temporada, no "Crear". Reduce el error
  de crear la temporada equivocada.
- `loading` durante la mutación; texto `Creando temporada…`.
- Éxito: `notify.success("Apertura 2026 creada con 3 equipos")` →
  `router.push('/admin/leagues/{nuevoId}')`.
- Error: `notify.error(res.error)` **y** mensaje inline bajo el botón. El toast
  es obligatorio (§7.2b), el inline es complemento porque el usuario está
  mirando el botón.

### 3.4 Navegación y pérdida de datos

- `Atrás` conserva el estado de los pasos anteriores (estado del wizard vive en
  el orquestador, no en cada paso).
- Salir del wizard con selección hecha → `Modal` de confirmación
  _"¿Salir sin crear la temporada? Perderás la selección de equipos."_

---

## 4. Pantalla C — `TeamBenchSection` (Configuración → Equipos)

Sección nueva debajo de `TeamsSection`, plegada por default.

```
┌────────────────────────────────────────────────────────────────┐
│ 🗄  Banca — equipos de Clausura 2025            27 equipos  ▾  │
│    No se inscribieron todavía. Actívalos cuando lleguen.       │
├────────────────────────────────────────────────────────────────┤
│  ▉ Juventud FC          12 jugadores en Clausura 2025 [Activar]│
│  ▉ Los Compas           14 jugadores en Clausura 2025 [Activar]│
│  ▉ Halcones             — sin roster registrado       [Activar]│
│  …                                                              │
└────────────────────────────────────────────────────────────────┘
```

- `Section` con `title` + `actions` (contador en `Badge tone="neutral"`).
- Plegado con `<details>`/`<summary>` nativo o estado local — **no** `useEffect`.
- Fila: `Inline justify="between" align="center"`, `TeamBadge` + nombre +
  `Typography variant="caption" tone="muted"` con el roster disponible +
  `Button variant="secondary" size="sm" icon={UserPlus}`.
- Sin `sourceTeamId` o sin roster → texto "— sin roster registrado" y el modal
  omite el toggle de roster.
- Si la banca está vacía, la sección **no se renderiza**.
- Búsqueda si hay > 12 filas, mismo patrón que el paso 2.

---

## 5. Pantalla D — `BenchHintCard` (tab Sorteo)

Antes del panel de parámetros, si hay equipos en banca y aún no se ha confirmado
el sorteo:

```
┌────────────────────────────────────────────────────────────────┐
│ ⓘ  El sorteo se correrá sobre 8 equipos activos.               │
│    Hay 22 equipos en banca de la temporada anterior.           │
│                                        [ Ver banca → ]         │
└────────────────────────────────────────────────────────────────┘
```

- `Card` con `border-line`, ícono `Info` en `text-ink-2`.
- Acción abre la banca en Configuración (`?section=banca`, con scroll al ancla).
- Tono **informativo, no de alarma**: es una situación normal, no un error.

---

## 6. Pantalla E — `ActivateTeamModal`

`Modal size="sm"` con `title="Activar Juventud FC"`.

```
┌──────────────────────────────────────────────┐
│  Activar Juventud FC                     ✕   │
│                                               │
│  ¿En qué jornada se incorpora?               │
│  ┌──────────┐  Jornada actual: 3             │
│  │    3     │                                 │
│  └──────────┘                                 │
│                                               │
│  ☑ Traer el roster de Clausura 2025          │
│     12 jugadores. Podrás editarlo después.   │
│                                               │
│  ⚠ Ya hay 4 jornadas generadas. Tendrás que  │
│    agregar jornadas makeup o regenerar.      │
│                                               │
│              [ Cancelar ]  [ Activar equipo ]│
└──────────────────────────────────────────────┘
```

- Input numérico de jornada, default = jornada actual de la liga.
- Advertencia de calendario solo si ya hay jornadas generadas; se resuelve con el
  `requiresRescheduling` de la respuesta o con un dato ya cargado en la página.
- Éxito: `notify.success("Juventud FC activado con 12 jugadores")`, cierra el
  modal, invalida `queryKeys.leagueTeams(leagueId)` y
  `queryKeys.leagueStandings(leagueId)`.
- Error: `notify.error(res.error)`, modal permanece abierto.
- Si el equipo ya fue activado en otra pestaña (409): `notify.error` + cierra +
  invalida, para que la lista se corrija sola.

---

## 7. ViewModels (§19)

Los componentes reciben **solo** estos tipos. Nada de DTOs crudos ni entidades
Drizzle en el JSX.

```ts
// features/season-rollover/types.ts

export type RolloverTeamView = {
	id: string;
	displayName: string; // titleCase aplicado en el mapper
	color: string | null;
	finalPosition: number | null;
	rosterCount: number;
	matchesPlayed: number;
	/** matchesPlayed / totalMatchdays < 0.6 → badge "Irregular" */
	isIrregular: boolean;
};

export type BenchTeamView = {
	id: string;
	displayName: string;
	color: string | null;
	sourceSeasonLabel: string | null; // "Clausura 2025"
	availableRosterCount: number | null; // null = sin roster clonable
};

export type SeasonCompletionView = {
	isComplete: boolean;
	headline: string; // "Clausura 2025 terminó"
	championName: string | null;
	teamCount: number;
	matchdayCount: number;
};
```

Mappers puros en `features/season-rollover/lib/map-*.ts`, cada uno con su test.
Ahí vive `titleCase()` (§5), el cálculo de `isIrregular` y el armado de
`headline` — **nunca en el componente**.

---

## 8. Estructura de archivos

```
features/season-rollover/
├── constants.ts                  # IRREGULAR_THRESHOLD = 0.6, SEARCH_MIN_TEAMS = 12
├── types.ts                      # los tres *View de §7
├── index.ts
├── lib/
│   ├── map-rollover-team-view.ts   + .test.ts
│   ├── map-bench-team-view.ts      + .test.ts
│   └── map-season-completion.ts    + .test.ts
├── model/
│   ├── season-rollover-form-schema.ts   # client-safe, sin @/db
│   ├── useRolloverTeams.ts             # useQuery
│   ├── useSeasonRollover.ts            # useMutation
│   ├── useLeagueCompletion.ts          # useQuery
│   ├── useBenchTeams.ts                # useQuery
│   ├── useActivateTeam.ts              # useMutation
│   └── useTeamSelection.ts             # estado del paso 2 (marcados + búsqueda)
└── ui/
    ├── SeasonRolloverWizard.tsx   # orquestador, ≤ 80 líneas
    ├── StepSeasonName.tsx
    ├── StepTeamPicker.tsx
    ├── RolloverTeamRow.tsx
    ├── StepConfirm.tsx
    ├── SeasonEndBanner.tsx
    ├── TeamBenchSection.tsx
    ├── BenchTeamRow.tsx
    ├── ActivateTeamModal.tsx
    └── BenchHintCard.tsx
```

`useTeamSelection` sigue el patrón de dos hooks de §7.3b: es el **hook de
filtro/estado**, separado de `useRolloverTeams` que es el **hook de query**.

---

## 9. Copy — texto exacto en español

| Contexto                  | Texto                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banner título             | `{Temporada} terminó`                                                                                                                                                                    |
| Banner cuerpo             | `Inicia la siguiente temporada y decide qué equipos continúan.`                                                                                                                          |
| Banner CTA                | `Iniciar temporada`                                                                                                                                                                      |
| Wizard paso 2 título      | `¿Qué equipos continúan en {NuevaTemporada}?`                                                                                                                                            |
| Wizard paso 2 ayuda       | `De {TemporadaAnterior} siguen registrados {N} equipos. Marca solo los que ya confirmaron. Los demás quedan en la banca y los puedes activar cuando se inscriban, en cualquier jornada.` |
| Toggle roster             | `Traer el roster de cada equipo marcado ({N} jugadores)`                                                                                                                                 |
| Badge irregular           | `Irregular`                                                                                                                                                                              |
| Advertencia pocos equipos | `El sorteo se calculará sobre {N} equipos. Si esperas más inscripciones, corre el sorteo cuando cierres.`                                                                                |
| Advertencia cero equipos  | `La temporada arrancará sin equipos. Actívalos desde la banca conforme se inscriban.`                                                                                                    |
| Botón crear               | `Crear {NuevaTemporada}`                                                                                                                                                                 |
| Éxito rollover            | `{NuevaTemporada} creada con {N} equipos`                                                                                                                                                |
| Sección banca             | `Banca — equipos de {TemporadaAnterior}`                                                                                                                                                 |
| Ayuda banca               | `No se inscribieron todavía. Actívalos cuando lleguen.`                                                                                                                                  |
| Sin roster                | `— sin roster registrado`                                                                                                                                                                |
| Modal activar             | `Activar {Equipo}`                                                                                                                                                                       |
| Éxito activación          | `{Equipo} activado con {N} jugadores`                                                                                                                                                    |
| Aviso calendario          | `Ya hay {N} jornadas generadas. Tendrás que agregar jornadas makeup o regenerar el calendario.`                                                                                          |
| Salir del wizard          | `¿Salir sin crear la temporada? Perderás la selección de equipos.`                                                                                                                       |

Tono: segunda persona, directo, sin tecnicismos. "Equipos en banca", no
"equipos con status pending". El organizador no conoce el schema.

---

## 10. Responsive

El panel admin es desktop-first, pero el organizador registra equipos **desde la
cancha, en el teléfono**. Mínimo obligatorio:

- Filas de equipo: en `< 640px` colapsan las métricas a una segunda línea
  (`Stack` en vez de `Inline`), checkbox y nombre siempre visibles.
- Botones del wizard: full-width apilados en móvil (`Stack` con `gap="sm"`).
- Modal de activación: `size="sm"` ya es usable; verificar que el input numérico
  dispare teclado numérico (`inputMode="numeric"`).
- Target táctil mínimo 44×44px en checkbox de fila y botón `Activar`.

---

## 11. Accesibilidad

- El checkbox de fila es un `<input type="checkbox">` real dentro de un
  `<label>` que envuelve la fila. Nada de `div` con `onClick`.
- `aria-live="polite"` en el contador `N de M marcados`.
- El `Stepper` marca el paso actual con `aria-current="step"`.
- Contraste: `text-ink-2` sobre `bg-surface` cumple AA; `text-ink-3` solo para
  texto no esencial (nunca para el nombre de un equipo).
- Foco visible en todas las filas y botones — no remover el outline.
- `Modal` ya trapea foco y cierra con `Esc`; no reimplementar.

---

## 12. Checklist de entrega

- [ ] Ningún `style={{}}` de layout o tipografía en el módulo (§7.2a)
- [ ] Ningún componente > 150 líneas; `SeasonRolloverWizard` ≤ 80 (§3.5)
- [ ] Toda mutación llama `notify.success` / `notify.error` (§7.2b)
- [ ] Keys de query desde `queryKeys.*`, invalidación explícita tras activar (§7.3)
- [ ] Componentes reciben `*View` + callbacks; cero `fetch` y cero reglas en el JSX (§19)
- [ ] Tests de mappers + `RolloverTeamRow` + `StepTeamPicker` (loading/error/vacío/0 marcados) + `SeasonEndBanner` (§20)
- [ ] Sin `setState` dentro de `useEffect`; dismiss del banner con lazy initializer (§7.2)
- [ ] Copy exactamente el de §9
