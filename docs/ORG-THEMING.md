# ORG-THEMING — Identidad visual por organización

> Design doc. Estado: **propuesta, pendiente de aprobación de Jocobi.**
> Relación con `TOURNAMENT-SKINS.md`: mismo patrón de tokens, distinto eje
> (organización en vez de torneo). Este sistema NO reemplaza los skins de
> torneo; conviven con una regla de precedencia (ver §7, decisión pendiente).

## 0. Objetivo de producto

Que cada organizador sienta que `/org/[slug]` (y después `su-liga.talachastats.com`)
es **su** sitio: paleta, tipografía y logo propios, configurados en el onboarding
y editables en Configuración de Organización. El tema se propaga a toda la
experiencia pública de la org **y a los assets compartibles** (tabla, goleo,
jornada). La paleta TalachaStats es siempre el fallback — nunca hay estado "sin tema".

Esto alimenta directo la capa 3 del producto (identidad de la liga, AGENTS.md §1.5)
y el viral loop: una imagen de tabla con los colores de la org presume más.

---

## 1. Principio rector: una sola fuente de verdad, dos consumidores

El hallazgo que define todo: los assets compartibles se generan con **Satori**
(`ImageResponse` en `/api/content/*-image`), y Satori **no lee CSS variables** —
consume objetos TS (hoy `BRAND_PALETTE` de `shared/brand/palette.ts`).

Por lo tanto el tema NO puede vivir "en CSS". Vive como **objeto de tokens TS**
resuelto en server, y de ahí se proyecta a dos destinos:

```
                DB (organization_themes)
                        │
            buildThemeTokens(row)          ← puro, testeable, con contraste
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
  CSS variables inline            props a Satori
  (layout de /org/[slug])         (/api/content/*-image, /api/og)
  → toda la UI pública            → tablas, goleo, jornada compartibles
```

Cero duplicación de lógica de estilos: si mañana cambia cómo se deriva un tint,
cambia en `buildThemeTokens` y ambos mundos se actualizan.

---

## 2. Modelo de datos

Tabla nueva 1:1 con `organizations` (no columnas sueltas: mantiene `organizations`
limpia y deja espacio a versionado/presets premium futuros). `logoUrl` ya existe
en `organizations` y se queda ahí.

```ts
// src/db/schema.ts
export const organizationThemes = pgTable(
	"organization_themes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.notNull()
			.unique() // 1:1
			.references(() => organizations.id, { onDelete: "cascade" }),

		// "preset"  → presetId apunta al catálogo en código
		// "custom"  → los 4 hex de abajo son la fuente
		mode: text("mode").notNull().default("preset"), // "preset" | "custom"
		presetId: text("preset_id"), // validado contra ORG_PRESETS en código

		// Solo mode="custom". Formato #RRGGBB validado por Zod Y por CHECK.
		colorPrimary: text("color_primary"),
		colorAccent: text("color_accent"),
		colorSurface: text("color_surface"),
		colorInk: text("color_ink"),

		// Catálogo cerrado en código (shared/org-theme/fonts.ts)
		fontId: text("font_id").notNull().default("brand"),

		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index("organization_themes_org_idx").on(t.organizationId)],
);
```

Reglas del modelo:

- **Se guardan 4 colores, no 20 tokens.** Todo lo derivado (tints, bordes,
  surface-2, ink sobre primario) se **calcula** en `buildThemeTokens`. Guardar
  derivados invita a inconsistencia entre CSS y Satori.
- **`presetId` y `fontId` NO son FK** — son ids del catálogo en código, igual
  que `skin_activations` valida contra `SKIN_IDS`. Type guard `isOrgPresetId()`.
- CHECK constraint (en la migración): `mode='custom'` exige los 4 hex no-null;
  `mode='preset'` exige `preset_id` no-null.
- Migración drizzle-kit la genera y corre **Jocobi** (regla del repo).

### Slug (onboarding)

`organizations.slug` ya existe y es unique. El onboarding agrega validación
explícita, futuro-compatible con subdominios:

- Regex DNS-safe: `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (sin `_`, sin
  acentos, sin puntos — un slug inválido como subdominio hoy es deuda mañana).
- Lista de reservados en `shared/org-theme/reserved-slugs.ts`: `www`, `admin`,
  `api`, `app`, `mail`, `staging`, `cdn`, `assets`, `blog`, `ayuda`…
- Check de disponibilidad server-side (endpoint delgado + debounce en UI).

---

## 3. Catálogos en código (presets, fuentes)

### 3.1 Paletas — catálogo curado, NO API externa

Decisión recomendada: **catálogo estático en código, curado a mano** (puede
inspirarse en ColorHunt al armarlo), en vez de consumir un API de paletas en
runtime.

|         | API externa (ColorHunt-style)                                                                                                                                                                                              | Catálogo curado en código                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pros    | Miles de paletas, novedad infinita                                                                                                                                                                                         | Cero latencia/dependencia, contraste pre-validado, cada paleta probada contra la UI real, type-safe, sin costo |
| Contras | ColorHunt no tiene API oficial (scraping frágil); paletas de 4 colores arbitrarios NO mapean solas a un sistema de UI (¿cuál es surface? ¿cuál ink?); contraste no garantizado; dependencia y punto de falla en onboarding | Hay que curar ~10-16 paletas a mano; crecer el catálogo es un PR                                               |

El riesgo real del API: una paleta bonita en un swatch no es un tema usable —
alguien tiene que decidir qué hex es fondo y cuál es texto. Ese mapeo es trabajo
de diseño, no de fetch. La válvula de escape para quien quiere algo único es
`mode="custom"`.

```ts
// src/shared/org-theme/presets.ts — puro, client-safe, mismo espíritu que skins/registry.ts
export const ORG_PRESET_IDS = ["verde-selva", "azul-rey", "rojinegro" /* … 10-16 */] as const;

export type OrgPresetId = (typeof ORG_PRESET_IDS)[number];

export type OrgPresetDefinition = {
	id: OrgPresetId;
	label: string; // "Azul Rey"
	colors: ThemeInput; // { primary, accent, surface, ink } — mismos 4 que custom
};
```

Un preset ES un `ThemeInput` pre-curado: presets y custom pasan por el mismo
`buildThemeTokens`. Un solo camino de código.

### 3.2 Tipografías — catálogo cerrado con `next/font`

Catálogo cerrado de 4-6 fuentes deportivas/legibles (ej. estilo: una condensed
tipo marcador, una geométrica moderna, una slab con carácter, la brand default).
No fuentes arbitrarias: cada fuente por tenant costaría performance y Satori
necesita el **buffer** del archivo de fuente para renderizar imágenes.

```ts
// src/shared/org-theme/fonts.ts
export const ORG_FONT_IDS = ["brand", "marcador", "moderna", "slab"] as const;

export type OrgFontDefinition = {
	id: OrgFontId;
	label: string;
	cssVariable: string; // "--font-org-marcador" (declarada vía next/font en root layout)
	files: { regular: string; bold: string }; // paths para Satori (fs.readFile)
};
```

- Todas se declaran con `next/font` en el root layout con `variable:` (solo
  pesos 400/700, `subset: latin`) — el costo de cargar 4 fuentes subseteadas
  es bajo y evita FOUT por tenant.
- Los mismos archivos `.ttf`/`.otf` viven en el repo y los leen las rutas de
  imagen para pasárselos a `ImageResponse` en `fonts: [...]`. **La decisión de
  catálogo cerrado es lo que hace posible tematizar los assets.**

---

## 4. Resolución de tokens y contraste

```ts
// src/shared/org-theme/contrast.ts — matemática pura, 100% unit-testeable
export function relativeLuminance(hex: string): number; // WCAG 2.x
export function contrastRatio(a: string, b: string): number; // 1..21
export function inkOn(bg: string): string; // → ink claro u oscuro según luminancia
export function ensureContrast(fg: string, bg: string, min = 4.5): string;
// si ratio < min, ajusta lightness de fg hasta cumplir AA — determinista
```

```ts
// src/shared/org-theme/build-tokens.ts — puro
export type ThemeInput = { primary: string; accent: string; surface: string; ink: string };

export type OrgThemeTokens = {
	primary: string;
	primaryInk: string; // primaryInk = inkOn(primary) — texto sobre botones
	accent: string;
	accentInk: string;
	surface: string;
	surface2: string; // surface2/line derivados por mezcla con ink
	ink: string;
	inkDim: string;
	line: string;
	tint: string;
	tintBd: string; // rgba derivados del primary
};

export function buildThemeTokens(input: ThemeInput): OrgThemeTokens;
```

Dónde corre el contraste:

- **Server, siempre** — al resolver el tema para render (CSS e imágenes usan el
  mismo resultado).
- **Cliente, en el form de custom** — el preview del onboarding reusa las mismas
  funciones (son puras y client-safe) para avisar en vivo: "este texto no cumple
  AA sobre este fondo" y mostrar el color auto-corregido. El usuario ve lo que
  va a quedar; nunca se guarda un tema ilegible.

Zod (`theme-form-schema.ts`): hex `#RRGGBB` estricto + refine que exige
`contrastRatio(ink, surface) >= 4.5`.

---

## 5. Inyección de estilos — sin FOUC, sin JS de tema

**Reutilizamos el contrato de tokens skin existente** (`--color-skin-*`).
Los componentes públicos que ya usan `bg-skin-surface`, `text-skin-primary-ink`,
etc. se tematizan **sin tocarlos**. Es la misma jugada que tournament-skin,
aplicada en el layout de la org.

```tsx
// src/app/(public)/org/[slug]/layout.tsx  (Server Component)
import { getOrgTheme } from "@/entities/organization"; // React.cache — 1 query por request
import { buildThemeTokens, tokensToCssVars } from "@/shared/org-theme";
import { OrgThemeScope } from "@/features/org-theming";

export default async function OrgLayout({ params, children }) {
	const theme = await getOrgTheme(params.slug); // null → sin scope → brand
	return (
		<OrgThemeScope theme={theme} fontId={theme?.fontId}>
			{children}
		</OrgThemeScope>
	);
}
```

`OrgThemeScope` (server-safe, sin `"use client"`, gemelo de `SkinScope`):

- **Presets y custom van por el MISMO camino** (decisión de implementación,
  2026-07-02): vars inline generadas de `buildThemeTokens` en SSR. Se descartó
  el plan original de bloques CSS por preset en `globals.css` — mantener 12
  bloques generados sincronizados con `presets.ts` es duplicación que puede
  divergir en silencio; el costo de ~700 bytes de inline style por página es
  despreciable frente a ese riesgo.
- El scope sobreescribe DOS contratos vía `tokensToScopeCssVars`: los tokens
  skin (`--color-skin-*`) y los TOKENS BASE (`--color-pitch`, `--color-surface`,
  `--color-ink`, `--color-brand`…). Las páginas públicas existentes usan tokens
  base (`bg-pitch`, `text-ink`) — sobreescribirlos retematiza todo sin tocar
  un solo componente.
- `theme == null` → `OrgThemeScope` es transparente (no emite wrapper con
  estilos) → paleta TalachaStats.
- El wrapper usa `display: contents`: neutro para flex/grid de las páginas;
  las custom properties se heredan igual.

**Por qué no hay FOUC:** todo se resuelve en SSR — el HTML ya llega con el
`data-attribute` / `style` puesto. No hay `useEffect`, no hay lectura de
localStorage, no hay JS de theming en el cliente. El tema no puede parpadear
porque nunca existe un frame sin él.

**Costo por request:** una query (`React.cache` + posible
`unstable_cache`/tag por org para invalidar al guardar cambios). El cálculo de
tokens es aritmética pura, despreciable.

---

## 6. Estructura FSD

```
src/shared/org-theme/            ← PURO, client-safe, sin @/db ni React
  presets.ts                     catálogo de paletas (ORG_PRESETS)
  fonts.ts                       catálogo de tipografías
  reserved-slugs.ts              slugs prohibidos
  contrast.ts                    luminancia / ratio / ensureContrast (+ tests)
  build-tokens.ts                ThemeInput → OrgThemeTokens (+ tests)
  css-vars.ts                    tokensToCssVars(tokens) → Record<string,string>
  index.ts

src/entities/organization/       ← data access
  theme-queries.ts               getOrgTheme(slug) con React.cache; upsertOrgTheme
  (schema/tipos derivados de db)

src/features/org-theming/        ← el slice de la feature
  model/
    theme-form-schema.ts         Zod: hex, mode, presetId, fontId, refine contraste
    useOrgTheme.ts               query hook (admin)
    useThemeMutations.ts         save/update con invalidación
  lib/
    map-theme-view.ts            row ↔ form values (+ tests)
  ui/                            ← TODOS tontos: props in, callbacks out
    OrgThemeScope.tsx            server-safe, solo pone data-attr/style/font class
    PalettePickerGrid.tsx        recibe presets[] + value + onChange — no fetch
    PaletteSwatch.tsx            pinta 4 hex — no sabe qué es un "tema"
    CustomColorFields.tsx        4 inputs hex + warnings de contraste (recibe ratios ya calculados)
    FontPicker.tsx               recibe fonts[] + value + onChange
    ThemePreviewCard.tsx         mini-mock (tabla + botón + badge) pintado con tokens recibidos
  update-theme.ts                server action delgada: auth → zod → entities → revalidateTag
  index.ts

src/app/
  onboarding/                    wizard: 1) nombre+slug 2) logo+fuente 3) paleta 4) preview
  admin/organizacion/tema/       misma feature UI reutilizada (editar después)
  api/organizations/slug-check/  controlador delgado (disponibilidad + reservados)
```

Anti-god-component, responsabilidades:

| Responsabilidad         | Vive en                            | NO vive en          |
| ----------------------- | ---------------------------------- | ------------------- |
| Fetch del tema          | `entities/organization`            | UI                  |
| Matemática de contraste | `shared/org-theme/contrast.ts`     | componentes / rutas |
| Derivación de tokens    | `shared/org-theme/build-tokens.ts` | CSS, Satori routes  |
| Estado del form         | `features/org-theming/model`       | UI                  |
| Render                  | `features/org-theming/ui` (tontos) | —                   |

El wizard de onboarding es composición de los mismos componentes tontos que usa
`/admin/organizacion/tema` — una sola implementación, dos entradas.

---

## 7. Assets compartibles (Satori) — el mismo tema en las imágenes

Estado actual: `/api/content/{standings,scorers,jornada,league-launch}-image` y
`/api/og` importan `BRAND_PALETTE` directo. Cambio:

```ts
// ANTES (hoy)
import { BRAND_PALETTE as C } from "@/shared/brand/palette";

// DESPUÉS
const C = await getOrgImagePalette(orgId);
// entities/organization/image-palette.ts:
//   tema de la org → buildThemeTokens → mapeo a la MISMA forma que BRAND_PALETTE
//   sin tema → devuelve BRAND_PALETTE (fallback, cero cambio visual)
```

- Los JSX de las imágenes ya son "tontos" respecto al color (usan `C.brand`,
  `C.surface`…): el diff es cambiar el origen de `C`, no reescribir layouts.
- La forma de `BrandPalette` se mantiene como **contrato** (`bg`, `surface`,
  `brand`, `ink`, `inkDim`, `gold`…) — `getOrgImagePalette` mapea tokens de org
  a ese contrato. Gold/silver/bronce del podio se quedan fijos (son semánticos,
  no de marca).
- Tipografía: la ruta lee `fontId` de la org y carga el buffer del catálogo
  (`fonts.ts` → `fs.readFile`) para `ImageResponse({ fonts })`.
- Logo de la org (`organizations.logoUrl`) entra como `<img>` en el render —
  watermark dual: logo de la org grande, "hecho con TalachaStats" discreto
  (el viral loop no se negocia; ver `viral-content-watermark.md`).
- Cache: las rutas de imagen deben incluir el `updatedAt` del tema (o un hash)
  en la cache key para invalidar al cambiar tema.

---

## 8. Decisiones pendientes (Jocobi)

1. **Precedencia org-theme vs tournament-skin** en páginas de org.
   Propuesta: dentro de `/org/[slug]` gana el tema de la org (no montar
   `SkinScope` de torneo ahí); el skin de torneo vive en el portal global.
2. **¿Custom colors desde el día 1 o solo presets en fase 1?**
   Propuesta: onboarding fase 1 solo presets + logo + fuente (rápido, imposible
   que quede feo); campo custom entra en fase 2 en `/admin/organizacion/tema`.
3. **¿Tema editable en trial o solo verified?** (¿es candy de verificación / futuro premium?)
4. **Curaduría inicial**: cuántas paletas (10-16 sugerido) y cuáles fuentes
   exactas (afecta licencias — usar solo fuentes con licencia libre, ej. OFL).
5. **Light/dark**: los temas de org ¿definen un solo modo o respetan el toggle
   light/dark actual? Propuesta fase 1: el tema define surfaces propias y se
   ignora el toggle dentro del scope de la org (menos matriz de casos).

## 9. Orden de implementación

1. `shared/org-theme/` completo (presets, fonts, contrast, build-tokens) + tests — sin tocar UI.
2. Schema + migración (`organization_themes`) — Jocobi genera/corre drizzle-kit. ✅
3. `OrgThemeScope` + `getOrgTheme` + layout de `/org/[slug]` con override de
   tokens base vía `tokensToScopeCssVars` → temas visibles (presets y custom
   por el mismo camino inline, ver §5). ✅
4. Feature UI (`PalettePickerGrid`, `FontPicker`, preview) montada en `/admin/organizacion/tema`.
5. Onboarding wizard (reusa la UI del paso 4) + validación de slug con reservados.
6. `getOrgImagePalette` + swap en las 5 rutas de imagen + fuentes en Satori.
7. (Futuro) subdominios: rewrite por host en `proxy.ts` — el tema ya estará listo.
