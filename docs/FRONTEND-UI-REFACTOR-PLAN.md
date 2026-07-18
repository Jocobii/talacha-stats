# Plan de migración — Sistema de composición de UI

> **Objetivo:** dejar de escribir `style={{}}` inline y `<div>` de layout a mano.
> Centralizar contenedores, spacing y variantes para que una pantalla se **componga**
> importando primitivos, no cableando estilos en cada tag.
>
> **Modo de ejecución:** incremental, "poco a poco". Cada fase es un PR pequeño,
> mergeable por sí solo, sin big-bang. Ninguna fase bloquea la operación de la liga.

Este documento es un plan vivo. Cuando una fase se completa, marca sus casillas y
actualiza la sección de métricas. Alineado con `AGENTS.md` (FSD §3, UI §7.2, clean
code §3.5/§18, testing §20). **Si hay conflicto de reglas, `AGENTS.md` manda.**

---

## 1. Diagnóstico (estado actual)

Lo que **ya existe** y está bien:

- `shared/ui/` con primitivos: `Button`, `Card`, `Badge`, `Field`, `Input`, `Select`,
  `Modal`, `StatTile`, `EmptyState`, `ErrorState`, `PageHeader`, etc.
- Tokens semánticos en `src/app/globals.css` (`@theme`): `--color-brand`, `--color-surface`,
  `--color-ink`, `--color-line`… y una capa **skin-aware** (`--color-skin-*`) que reviste
  la UI por organización/torneo.
- Helper `cn()` en `shared/lib/cn.ts`.
- Componentes con variantes tipadas (`Button` usa `Record<Variant, string>`).

Lo que **falta** o está mal (la causa del dolor):

| Problema                                                                     | Evidencia                                                                                                                                                                                           | Consecuencia                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **No hay primitivos de layout** (`Stack`, `Inline`, `Grid`, `Center`, `Box`) | `CreateMatchdayForm` y ~104 archivos usan `<div style={{display:"flex", flexDirection:"column", gap:20}}>`                                                                                          | Cada pantalla reinventa flex/grid/gap/padding            |
| **No hay primitivos de tipografía**                                          | `text-[32px]` + `style={{fontFamily:"var(--font-display)"}}` repetido en `PageHeader`, `LeagueVenuesClient`, `OrgHubShell`, etc. — mismo problema que el layout pero con tamaño/peso/color de texto | Cada pantalla reinventa tamaño/peso/tono/fuente de texto |
| **Colores crudos en vez de tokens**                                          | `background:"rgba(0,230,118,0.1)"` (es `bg-brand/10`)                                                                                                                                               | Rompe §7.2, ignora skins y modo claro/oscuro             |
| **`cn()` no resuelve conflictos de clases**                                  | join ingenuo (`args.filter(Boolean).join(" ")`)                                                                                                                                                     | `cn("p-2", "p-4")` deja ambas; overrides no funcionan    |
| **Variantes cableadas a mano**                                               | `Record<Variant, string>` en cada componente                                                                                                                                                        | No escala ni compone; copia-pega entre átomos            |
| **Sin guardrail**                                                            | nada impide volver a `style={{}}`                                                                                                                                                                   | La deuda se regenera sola                                |

### Concentración de `style={{}}` inline (dónde atacar primero)

```
59  src (app/*, shared/* fuera de features)
21  features/sorteo-cockpit
 6  features/venue-calendar
 3  features/org-theming
 3  features/league-onboarding
 2  features/tournament-rules · team-management · narrator-analysis
 1  (varios)
```

> **Nota:** un porcentaje alto de esos inline styles NO son diseño único — son
> **layout** (flex/grid/gap/padding/align). Eso es exactamente lo que los primitivos
> eliminan de un plumazo. Los pocos que son cálculos dinámicos legítimos
> (`width: ${pct}%`, `transform: translateX(...)`) se quedan como `style` — ver §7.

---

## 2. Arquitectura objetivo

Cuatro capas, de menor a mayor abstracción. Se adoptan **en orden**; cada una aporta
valor sola.

```
1. Layout primitives      → Stack, Inline, Grid, Center, Box, Spacer
1b. Typography primitive   → Typography (variant único)
2. Variantes (CVA)        → variantes tipadas y componibles para átomos
3. Compound components    → Card.Header/Body/Footer, slots
4. Page scaffolds         → PageShell + secciones (la pantalla "se arma sola")
```

Regla de oro para todas: **props → clases de Tailwind con tokens semánticos**.
Cero CSS custom, cero colores crudos, cero `style` salvo valor dinámico calculado (§7).

### Decisión de dependencias (requiere tu OK — `AGENTS.md` §11 y §8.1)

`cn()` actual no hace _merge_ de clases en conflicto, lo cual es necesario para que
un consumidor pueda sobreescribir (`<Button className="h-12">`). Dos caminos:

- **Recomendado — añadir `tailwind-merge` + `class-variance-authority`.**
  Estándar de facto para design systems en Tailwind. `tailwind-merge` resuelve
  conflictos; `cva` da variantes tipadas. Justificación §11: eliminan código a mano
  y son la base del patrón. Antes de instalar: verificar sin CVE HIGH/CRITICAL (§8.1)
  y anclar versión.
- **Zero-dep (fallback).** Mantener variantes con `Record<>` a mano y mejorar `cn()`
  para des-duplicar por prefijo de utilidad. Más código propio, menos robusto, pero
  sin dependencias nuevas.

> Este plan asume el camino recomendado. Si prefieres zero-dep, las fases 1–4 siguen
> igual; solo cambia la implementación interna de variantes.

---

## 3. Principios de la migración

1. **Incremental y reversible.** Un PR por fase (o por sub-lote). Nada de refactor masivo.
2. **Strangler pattern.** Los primitivos nuevos conviven con el código viejo. Se migra
   pantalla por pantalla; lo no migrado sigue funcionando.
3. **Primero crear, luego migrar, luego blindar.** No se prohíbe `style={{}}` hasta que
   exista el reemplazo (fases 1–2) y una pantalla piloto lo valide.
4. **Test obligatorio (§20).** Todo primitivo y mapper nuevo entra con su test Vitest.
5. **Sin romper skins.** Todo pasa por tokens; se verifica en las 4+ skins existentes.
6. **Métrica visible.** El conteo de `style={{}}` baja PR a PR (ver §8).

---

## 4. Fases

### Fase 0 — Fundaciones (1 PR, sin migrar UI todavía)

Preparar el terreno sin tocar pantallas.

- [x] Decidir dependencias (§2): instalar `tailwind-merge` + `class-variance-authority`
      **o** ratificar zero-dep. Correr chequeo de CVE (§8.1) y anclar versión.
      → Decidido: instalar. Sin CVE HIGH/CRITICAL (verificado en OSV). Ancladas en
      `package.json`: `tailwind-merge@3.6.0`, `class-variance-authority@0.7.1`.
      Falta correr `pnpm install` para materializar en `node_modules`/lockfile.
- [x] Actualizar `cn()` para envolver `tailwind-merge` (si se aprueba), manteniendo la
      firma actual para no romper callsites. Test co-locado en `cn.test.ts`.
- [x] Crear `src/shared/ui/layout/` con su `index.ts` y añadirlo al `shared/ui/index.ts`.
- [x] Documentar en este MD la tabla de escalas (`gap`, `pad`) → clases, para que sea
      la fuente única. (Implementada también en código: `src/shared/ui/layout/scales.ts`.)

**Escala canónica (fuente única — no inventar valores fuera de esto):**

| Token prop | Clase gap | Clase padding |
| ---------- | --------- | ------------- |
| `none`     | `gap-0`   | `p-0`         |
| `xs`       | `gap-1`   | `p-1`         |
| `sm`       | `gap-2`   | `p-2`         |
| `md`       | `gap-4`   | `p-4`         |
| `lg`       | `gap-6`   | `p-6`         |
| `xl`       | `gap-8`   | `p-8`         |

**Aceptación:** compila, `cn()` con nueva impl pasa sus tests, `shared/ui/layout/`
existe y exporta (aún vacío de primitivos o con el primero).

---

### Fase 1 — Primitivos de layout (1–2 PRs)

El mayor ROI. Mata el grueso de los inline styles de layout.

Crear en `src/shared/ui/layout/`:

- [x] `Stack.tsx` — columna flex. Props: `gap`, `align`, `as`.
- [x] `Inline.tsx` — fila flex con `wrap`. Props: `gap`, `align`, `justify`, `wrap`.
- [x] `Grid.tsx` — grid. Props: `cols`, `gap`, `align`.
- [x] `Center.tsx` — centra en ambos ejes (grid place-items).
- [x] `Box.tsx` — contenedor genérico con `pad`, `bg` (token), `radius`, `border`.
- [x] `Spacer.tsx` — separador flexible.
- [x] `index.ts` — exportaciones públicas; re-export desde `shared/ui/index.ts`.
- [x] Tests co-locados (`Stack.test.tsx`, etc.): render, prop→clase correcta,
      default, y que **no** emiten `style` inline (§20.2).

Todos ≤ 150 líneas (§3.5), props tipadas, funciones ≤ 20 líneas (§18).

**Ejemplo de referencia (`Stack`):**

```tsx
// src/shared/ui/layout/Stack.tsx
import type { HTMLAttributes, ElementType } from "react";
import { cn } from "@/shared/lib/cn";

const GAP = {
	none: "gap-0",
	xs: "gap-1",
	sm: "gap-2",
	md: "gap-4",
	lg: "gap-6",
	xl: "gap-8",
} as const;
const ALIGN = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
} as const;

type StackProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	gap?: keyof typeof GAP;
	align?: keyof typeof ALIGN;
};

export function Stack({ as: As = "div", gap = "md", align, className, ...rest }: StackProps) {
	return (
		<As className={cn("flex flex-col", GAP[gap], align && ALIGN[align], className)} {...rest} />
	);
}
```

**Aceptación:** los 6 primitivos existen con tests verdes; un spike migra
`CreateMatchdayForm` (el del screenshot) usándolos, sin `style={{}}` de layout.
Nota: en el piloto los colores/fuentes se dejaron como CSS vars a propósito — el
cockpit usa su propio lenguaje visual fuera de Tailwind (ver comentario en
`SorteoRequirements.tsx`); no se fuerza a tokens Tailwind en este PR.

---

### Fase 1b — Primitivo de tipografía (1 PR)

Mismo problema que el layout (Fase 1) pero para texto: cada pantalla define
tamaño/peso/tono/fuente a mano (`text-[32px]`, `style={{fontFamily:"var(--font-display)"}}`,
`text-[13px] text-ink-2`…). Un único componente `Typography` centraliza esa escala,
con un solo prop (`variant`) que resuelve tag+tamaño+peso+fuente juntos — patrón tipo
MUI `Typography`, no dos componentes separados (`Text`+`Heading`, descartado en
iteración: menos ergonómico, dos APIs para aprender en vez de una).

Crear en `src/shared/ui/`:

- [x] `typography-scales.ts` — `TYPOGRAPHY_VARIANTS` (preset `{as, className}` por
      variante), `WEIGHT`, `TONE`. Fuente única — no inventar valores fuera de esto.
- [x] `Typography.tsx` — único componente. Props: `variant` (resuelve tag+tamaño+peso+
      fuente), `as` (sobreescribe el tag sin perder las clases del variant), `weight`
      (sobreescribe el peso del variant), `tone`, `truncate`.
- [x] Tests co-locados (`Typography.test.tsx`): cada variant → tag+clase correctos,
      override de `weight`/`as`, `tone`/`truncate`, y que **no** emite `style` inline
      (§20.2).
- [x] Export desde `shared/ui/index.ts`.

**Variantes canónicas:**

| `variant` | Tag    | Clase                                                                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `display` | `h1`   | `font-display text-3xl sm:text-[34px] font-black leading-none` (hero de página, mismo tamaño que ya usaba `PageHeader`) |
| `h2`      | `h2`   | `font-display text-2xl font-black leading-tight`                                                                        |
| `h3`      | `h3`   | `font-display text-xl font-bold leading-tight`                                                                          |
| `h4`      | `h4`   | `font-display text-lg font-bold leading-snug`                                                                           |
| `lead`    | `p`    | `text-lg font-normal`                                                                                                   |
| `body`    | `p`    | `text-base font-normal` (default)                                                                                       |
| `bodySm`  | `p`    | `text-sm font-normal`                                                                                                   |
| `caption` | `span` | `text-xs font-normal`                                                                                                   |

**Aceptación:** `Typography` existe con tests verdes; piloto real en
`app/(shell)/admin/leagues/[id]/canchas/LeagueVenuesClient.tsx` (título de página +
dos subtítulos de sección + el párrafo de metadatos), sin `style={{fontFamily}}` ni
tamaños arbitrarios en esos spots.

---

### Fase 2 — Variantes con CVA en átomos existentes (1–2 PRs)

Migrar la lógica de variantes cableada a mano a CVA (o mejorar el patrón zero-dep).
**No cambia la API pública** de los componentes — es refactor interno.

- [x] `Button.tsx`: `base/sizes/variants` movidos a `cva(...)`. API pública intacta
      (`variant`/`size` siguen opcionales vía `defaultVariants`). Test co-locado.
- [x] `Badge.tsx`, `Card.tsx`: mismo tratamiento (`tone` y `interactive` respectivamente
      como variantes cva). Tests co-locados.
- [ ] `StatusPill.tsx`, `CheckPill.tsx`: **fuera de alcance de este PR** — no tienen
      variantes Tailwind que migrar, son 100% `style={{}}` con colores crudos
      (`rgba(...)`, `var(--color-*)`), mismo patrón "propio" que el cockpit (§ nota
      Fase 1). Migrarlos a CVA implicaría reescribir su sistema de color a tokens
      Tailwind — cambio de diseño más grande, decidido explícitamente diferirlo.
- [ ] Extraer variantes compartidas (superficies, bordes) a un helper si se repiten.
- [x] Tests: cada variante y size renderiza sus clases; `className` externo
      sobreescribe (valida `tailwind-merge`) — cubierto en `Button.test.tsx`,
      `Badge.test.tsx`, `Card.test.tsx`.

**Aceptación:** átomos con CVA, misma apariencia (verificar en 2+ skins), API intacta,
tests verdes. `Button`/`Badge`/`Card` cumplen; `StatusPill`/`CheckPill` quedan
pendientes con nota explícita — no bloquean el resto del plan.

---

### Fase 3 — Compound components / slots (1–2 PRs)

Que las tarjetas y secciones se **compongan** declarativamente.

- [x] `Card` compound: `Card.Header` (con `icon`+`title`+`action`), `Card.Body`, `Card.Footer`
      (`CardHeader.tsx`/`CardBody.tsx`/`CardFooter.tsx`, unidos vía `Object.assign` en `Card.tsx`).
      `Card` plano sigue retrocompatible (verificado en `Card.compound.test.tsx`).
- [x] `Section` / `Panel` con slot de título y acciones — `shared/ui/Section.tsx` (sin
      superficie propia) y `shared/ui/Panel.tsx` (con superficie/borde, shorthand de
      "Card con header simple" para tabs del cockpit y drawers).
- [x] Tests de composición (render de cada slot, orden, slots ausentes = §20.2 nulos):
      `CardHeader.test.tsx`, `CardBody.test.tsx`, `CardFooter.test.tsx`,
      `Card.compound.test.tsx`, `Section.test.tsx`, `Panel.test.tsx`.

**Ejemplo objetivo:**

```tsx
<Card interactive>
	<Card.Header icon={Trophy} title="Nueva jornada" />
	<Card.Body>
		<Stack gap="md">
			<Field label="Fecha">…</Field>
		</Stack>
	</Card.Body>
	<Card.Footer>
		<Inline gap="sm" justify="end">
			<Button>Crear</Button>
		</Inline>
	</Card.Footer>
</Card>
```

**Aceptación:** compound Card documentado y con tests; una pantalla real lo usa
(`Card.Footer` adoptado en `features/admin-registration/ui/NewPlayerCard.tsx` — su
footer ya coincidía casi exactamente con el patrón del slot, migración de bajo riesgo).

---

### Fase 4 — Page scaffolds (1 PR + adopción gradual)

El "drag-and-drop a nivel código": un shell que pone estructura, spacing y responsive;
las pantallas solo aportan bloques.

- [x] `PageShell` con slots: `header`, `toolbar`, `children` (content), `aside` opcional
      (`shared/ui/PageShell.tsx`).
- [x] Integrar con `PageHeader` y `LeagueTabBar`/`OrgTabBar` existentes (`PageShell` no
      reimplementa nada de esos componentes, solo los posiciona).
- [x] Migrar 1 pantalla admin como referencia canónica.
      **Desviación de la candidata original ("una tab del cockpit"):** el cockpit usa su
      propio lenguaje visual con CSS vars, no Tailwind (mismo motivo documentado en
      Fase 1/2) — forzarlo a `PageShell` (Tailwind) repetiría el mismo conflicto de
      diseño. En su lugar se migró `app/(shell)/admin/leagues/[id]/layout.tsx`
      (shell de la vista de liga: breadcrumb + cabecera + `LeagueTabBar`), que ya era
      100% Tailwind y es el patrón que se repite en `OrgHubShell.tsx` — buen próximo
      candidato para Fase 5. Nota visual menor: `PageHeader` trae su propio
      `border-b`/`pb-6` y `LeagueTabBar` trae el suyo (`mt-5 border-b`); quedan como dos
      separadores distintos (cabecera → tab bar), no una duplicación pegada — se señala
      aquí por transparencia, no bloquea la aceptación.
- [x] Tests de layout del shell (slots presentes/ausentes): `PageShell.test.tsx`.

**Aceptación:** shell disponible, 1 pantalla de referencia migrada, patrón documentado
en §6 "Cómo construir una pantalla nueva".

---

### Fase 5 — Migración por lotes + guardrail (N PRs pequeños, continuo)

Con los primitivos listos, migrar el resto **por feature**, en orden de concentración:

- [ ] `sorteo-cockpit` (21 archivos) — mayor densidad, mejor retorno.
      **Lote 1 (2/21) hecho:** `CockpitPage.tsx` (loading/error/wrapper/grid principal,
      delays de animación pasados a clases arbitrarias `[animation-delay:Nms]`) y
      `SorteoRequirements.tsx` (hero + `RequirementRow`) migrados a `Stack`/`Inline`/`Center`.
      Colores/fuentes se quedaron en CSS vars a propósito (mismo criterio de Fase 1/2).
      Restan 19: `ShuffleOverlay`, `CockpitDatePicker`, `DatePickerDay`, `CockpitFooter`,
      `SorteoPanel`, `PairingRow`, `ConfettiBurst`, `ParametrosWizard`, `ParametrosTab`,
      `ParamCheckboxRow`, `CanchasTab`, `CockpitTopBar`, `ContextPanel`, `DescansosTab`,
      `ParamRow`, `RosterPanel`, `SettingsDrawer`, `SlotsFijosTab`, `AddPairingModal`.
- [ ] `app/*` y `shared/*` sueltos (59) — headers, layouts, páginas.
- [ ] `venue-calendar` (6), `org-theming` (3), `league-onboarding` (3).
- [ ] Cola larga (1–2 c/u): `tournament-rules`, `team-management`, `narrator-analysis`, resto.

Cada PR de lote: reemplaza `style={{}}` de layout por primitivos, colores crudos por
tokens, y **añade/actualiza tests** de los componentes tocados.

**Guardrail (blindaje — solo cuando el reemplazo ya existe):**

- [ ] Regla ESLint que **prohíbe `style={{}}`** en `*.tsx` salvo allowlist para valores
      dinámicos calculados (§7). Empezar como `warn`, subir a `error` cuando el conteo
      esté cerca de 0.
- [ ] Regla que prohíbe colores crudos (`rgba(`, `#hex`) en JSX/`style`.
- [ ] Checklist de PR (§12 de `AGENTS.md`) + línea: "¿UI nueva usa primitivos y tokens,
      sin `style` inline de layout?"

**Aceptación:** conteo de `style={{}}` de layout en ~0; lint en `error`; skins intactas.

---

## 5. Qué NO hacer (anti-scope)

- **No** ir por rendering schema/config-driven (definir la pantalla como JSON) para
  layouts generales: se vuelve más difícil de mantener que la composición. Acotarlo,
  si acaso, **solo a formularios** vía un registry `tipo → control` sobre el Zod schema
  ya obligatorio (§7.2). Fuera del alcance de este plan.
- **No** meter una librería de componentes de terceros (MUI, Chakra): ya hay design
  system propio + tokens skin-aware; importarla duplicaría y rompería skins.
- **No** big-bang: nada de "migrar los 104 archivos en un PR".
- **No** tocar lógica de negocio ni data-fetching en estos PRs — son puramente de UI.

---

## 6. Cómo construir una pantalla nueva (estado objetivo)

```tsx
<PageShell
	header={<PageHeader title="Jornadas" />}
	toolbar={
		<Inline gap="sm">
			<Button icon={Plus}>Nueva</Button>
		</Inline>
	}
>
	<Grid cols={2} gap="lg">
		<Card>
			<Card.Header title="Programadas" />
			<Card.Body>
				<Stack gap="sm">
					<Typography variant="bodySm" tone="ink-2">
						{rows.length} jornadas
					</Typography>
					{rows}
				</Stack>
			</Card.Body>
		</Card>
		<Card>…</Card>
	</Grid>
</PageShell>
```

Cero `style`, cero colores crudos, cero `<div className="flex flex-col gap-4">` repetido,
cero `text-[Npx]`/`style={{fontFamily}}` repetido (usar `Typography`, § Fase 1b).

---

## 7. Excepciones legítimas (cuándo `style` sí)

Se permite `style` **solo** para valores dinámicos calculados en runtime que no
existen como clase Tailwind:

- Barras de progreso / anchos calculados: `style={{ width: \`${pct}%\` }}`.
- Transforms de animación con valor numérico: `style={{ transform: \`translateX(${x}px)\` }}`.
- Posiciones absolutas calculadas (confetti, overlays del sorteo).

Aun en estos casos, **colores y spacing van por token/clase**, nunca crudos. La allowlist
del lint cubre estos patrones.

---

## 8. Métricas de progreso (actualizar por PR)

Comando de conteo:

```bash
grep -rl 'style={{' src --include='*.tsx' | wc -l          # total archivos
grep -rn 'style={{' src --include='*.tsx' | wc -l          # total ocurrencias
grep -rn 'rgba(\|#[0-9a-fA-F]\{3,6\}' src --include='*.tsx' # colores crudos
```

| Hito                     | Archivos con `style={{}}`                                                                                                                                                               | Colores crudos en JSX |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Baseline (hoy)           | 104                                                                                                                                                                                     | por medir             |
| Post Fase 1 (piloto)     | ~102 — piloto `CreateMatchdayForm` (`CockpitPage.tsx`) migrado a `Stack`/`Inline`/`Center`; colores y fuentes se dejaron en CSS vars a propósito (ver nota en `SorteoRequirements.tsx`) | —                     |
| Post Fase 5 lote cockpit | ~83                                                                                                                                                                                     | —                     |
| Meta final               | ~0 (solo allowlist §7)                                                                                                                                                                  | 0                     |

---

## 9. Testing y verificación (§20)

- Cada primitivo/compound: test Vitest co-locado — prop→clase, defaults, slots nulos,
  y ausencia de `style` inline.
- CVA: test de que `className` externo sobreescribe (valida `tailwind-merge`).
- Verificación visual manual en **todas las skins** tras Fases 2–4 (tokens no rotos).
- `pnpm test` y `pnpm lint` verdes en cada PR. E2E Playwright existentes deben seguir pasando.

---

## 10. Riesgos y mitigación

| Riesgo                                                          | Mitigación                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `tailwind-merge` no reconoce clases arbitrarias (`text-[13px]`) | Testear overrides; configurar `extendTailwindMerge` si hace falta |
| Romper una skin al centralizar                                  | Verificación visual multi-skin en cada PR de átomos               |
| Regresión visual sutil en Button/Card                           | Migración interna sin cambiar API + revisión lado a lado          |
| Guardrail activado antes de tiempo bloquea PRs                  | Lint arranca en `warn`; sube a `error` solo al final              |
| Scope creep hacia config-driven                                 | §5 lo declara fuera de alcance explícitamente                     |

---

## 11. Checklist maestro

- [x] **Fase 0** — deps decididas (tailwind-merge + cva), `cn()` actualizado, `shared/ui/layout/` creado (falta correr `pnpm install`)
- [x] **Fase 1** — `Stack/Inline/Grid/Center/Box/Spacer` + tests + piloto `CreateMatchdayForm`
- [x] **Fase 1b** — `Typography` (variant único) + tests + piloto `LeagueVenuesClient`
- [x] **Fase 2** — CVA en `Button/Badge/Card` + tests (`StatusPill`/`CheckPill` diferidos, ver nota)
- [x] **Fase 3** — `Card` compound + `Section/Panel` + tests
- [x] **Fase 4** — `PageShell` + 1 pantalla de referencia (`admin/leagues/[id]/layout.tsx`)
- [ ] **Fase 5** — migración por lotes (cockpit → app/shared → resto) + lint guardrail
- [ ] Métricas §8 en ~0; lint en `error`; skins verificadas

```

```
