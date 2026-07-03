# Temas por torneo (tournament skins)

Sistema para "vestir" módulos públicos con el tema del torneo del momento (Mundial,
Copa América, Champions, Liga MX…) sin tocar la paleta base de TalachaStats.

## Diseño en una línea

**El catálogo visual vive en código (CSS variables + registry); la DB solo guarda
activaciones (nombre + rango de fechas + toggle), administradas por el owner en
`/admin/temas`. Sin activación vigente → paleta TalachaStats de siempre.**

## Piezas

| Pieza                    | Archivo                                                    | Qué hace                                                    |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| Tokens skin              | `src/app/globals.css` (`@theme`)                           | `--color-skin-*` / `--tint-skin-*` con default = brand      |
| Bloque visual por torneo | `src/app/globals.css` (`[data-skin="…"]`)                  | Sobreescribe los tokens dentro del scope                    |
| Registry                 | `src/shared/skins/registry.ts`                             | Ids válidos + metadata. Fuente única                        |
| Tabla                    | `skin_activations` (schema Drizzle)                        | Activaciones: skin_id, name, starts_on, ends_on, is_enabled |
| Resolución               | `features/tournament-skin/get-active-skin.ts`              | Activación vigente hoy (TZ Tijuana) → `SkinId \| null`      |
| Frontera visual          | `features/tournament-skin/ui/SkinScope.tsx`                | `<div data-skin=…>` opt-in por módulo                       |
| Admin                    | `/admin/temas` (solo owner)                                | Programar / encender / apagar / borrar                      |
| API                      | `GET /api/skin` (público), `/api/skin-activations` (owner) | Contratos en `entities/skin-activation`                     |

## Por qué es ligero y rápido

- Cada skin es **solo un bloque de CSS variables** — cero JS por skin, cero peso
  extra en el bundle, sin recomputar estilos en runtime ni FOUC.
- Los Server Components llaman `getActiveSkinId()` directo (sin hop HTTP); está
  envuelto en `React.cache()` → una sola query indexada por request aunque haya
  varios `<SkinScope>` en la página.
- Si una fila de DB apunta a un skin que ya no existe en código, `resolveSkinId`
  degrada a `null` (paleta base). Nunca truena la página pública.

## Cómo tematizar un módulo público

```tsx
// app/(public)/lo-que-sea/page.tsx (Server Component)
import { SkinScope } from "@/features/tournament-skin";
import { getActiveSkinId } from "@/features/tournament-skin/get-active-skin";

export default async function Page() {
	const skinId = await getActiveSkinId();
	return (
		<SkinScope skinId={skinId}>
			<PlayerHeroCard … />
		</SkinScope>
	);
}
```

Dentro del scope, los componentes tematizables usan las utilidades skin en lugar
de las de brand: `bg-skin-surface`, `bg-skin-surface-2`, `text-skin-primary`,
`text-skin-primary-ink`, `border-skin-line`, `text-skin-accent`, y
`var(--tint-skin)` / `var(--tint-skin-bd)` para chips. Sin torneo activo esos
tokens SON la paleta TalachaStats — el componente se ve normal.

**Regla de marca:** el skin cambia acentos y superficies de módulos concretos;
el wordmark, el verde de marca en navegación y el resto de la app no se tocan.

## Cómo agregar un torneo nuevo (2 pasos + datos)

1. **Registry** — agrega el id en `SKIN_IDS` y su entrada en `SKINS`
   (`src/shared/skins/registry.ts`).
2. **CSS** — agrega el par de bloques en `globals.css`:
   `[data-skin="tu-torneo"] { … }` (dark) y
   `html[data-theme="light"] [data-skin="tu-torneo"] { … }` (ajustes AA para claro).
3. **Datos** — en `/admin/temas` programa la activación con nombre y fechas.
   El toggle permite apagarla sin borrar la programación.

No copiar identidad de terceros: paletas genéricas inspiradas en el torneo,
nunca logos, wordmarks ni trade dress (FIFA, UEFA, Liga MX…).

## Resolución del skin activo

- "Hoy" se calcula en `America/Tijuana` (`lib/today-iso.ts`) — el server corre en UTC.
- Vigente = `is_enabled AND starts_on <= hoy <= ends_on` (filtro en DB, §17).
- Overlap: gana la activación con `starts_on` más reciente.
- La respuesta cruda de DB se valida contra el registry (`lib/resolve-skin-id.ts`).

## Testing

Puros en `features/tournament-skin/lib/*.test.ts` (resolve, mapper, timezone),
componente en `ui/SkinScope.test.tsx`, hook RQ en `model/useSkinActivations.test.tsx`
(apiFetch mockeado). Correr con `pnpm test`.

## Pendientes conocidos

- Migración: generar con drizzle-kit (append-only, §15) tras el cambio de schema.
- Wiring de los módulos públicos que se van a tematizar (perfil de jugador,
  ranking, tarjetas tipo FIFA) — cada módulo se envuelve en `<SkinScope>` cuando
  su diseño skin-aware esté listo.
- Assets decorativos por skin (patrones SVG) — cargarlos lazy solo dentro del scope.
