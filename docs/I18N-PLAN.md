# Plan de internacionalización (i18n) — TalachaStats

> **Estado:** propuesta lista para codificar. Este documento es el contrato de
> implementación para la IA/dev que agregue soporte multi-idioma. Sigue
> `AGENTS.md` como fuente de verdad; donde este plan y `AGENTS.md` choquen, manda
> `AGENTS.md`.

---

## 0. Contexto y motivación (leer antes de tocar código)

Analytics muestra tráfico anglo incidental (US ~38%, UK/PL con 1 visitante) sobre
una muestra diminuta (~10 visitantes en `/`). **No hay demanda anglo comprobada
todavía.** Por eso el objetivo de este trabajo **NO es traducir la app**, sino
**dejar la arquitectura lista** para poder activar inglés (u otro idioma) sin
dolor cuando aparezca una señal real (un organizador que lo pida, o tráfico anglo
sostenido que navegue y no rebote).

Decisión estratégica que enmarca todo el alcance:

- **Español (`es`) es y sigue siendo el default.** Ni una URL indexada actual
  cambia.
- **Solo se internacionaliza la superficie pública** (`app/(public)/*`): home,
  `/ligas`, `/ranking`, `/player/[id]`, `/matchday`, `/org/*`, landing de
  organizadores, `/about`. Es la única superficie con valor SEO anglo.
- **El panel admin (`app/admin/*`) queda en español, sin i18n.** Los
  organizadores y el narrador son locales; `AGENTS.md §7.2` ya fuerza el admin a
  un solo modo. Internacionalizar el admin sería esfuerzo sin retorno.
- **Las API (`app/api/*`) no se internacionalizan.** Devuelven datos, no copy de
  UI. Los mensajes de error de `apiError()` se mantienen en español (los consume
  la UI, que decide cómo mostrarlos); si en el futuro se quiere traducir errores,
  se hace con códigos de error + diccionario en el cliente, no cambiando la API.

**Regla de oro de este plan:** la infraestructura se implementa completa, pero la
**traducción de contenido al inglés se deja como trabajo posterior, opt-in**. Se
entregan los diccionarios `es` completos y un `en` mínimo (o copia de `es` como
placeholder) para probar el switch, no una traducción profesional terminada.

---

## 1. Decisiones de arquitectura (ya tomadas — no re-litigar)

| Decisión                   | Elección                                                            | Motivo                                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Librería                   | **`next-intl`** (última estable compatible con Next 16 / React 19)  | Estándar de facto para App Router; da routing por locale, `hreflang`, formateo ICU y pluralización sin reinventarlos. Se justifica la dep nueva aquí mismo (ver §2).                                              |
| Estrategia de URL          | **Prefijo de locale con `localePrefix: 'as-needed'`**               | `es` (default) se queda **sin prefijo** → `/ligas` sigue igual, cero ruptura de SEO indexado. `en` vive en `/en/ligas` con `hreflang`, indexable como página aparte. Es lo único que capitaliza el tráfico anglo. |
| Alcance                    | **Solo `app/(public)/*`**                                           | Único lugar con valor SEO; mantiene el trabajo acotado.                                                                                                                                                           |
| Locales iniciales          | **`es` (default, completo) + `en` (placeholder)**                   | Probar el mecanismo sin comprometer traducción profesional prematura.                                                                                                                                             |
| Fuente de las traducciones | **Diccionarios JSON en `src/shared/i18n/messages/{locale}/*.json`** | Namespaced por dominio de UI (no por feature técnica) para que traducir sea legible.                                                                                                                              |

> **§11 de `AGENTS.md` ("no instales librerías nuevas sin justificación
> explícita") — justificación formal de `next-intl`:** reimplementar routing por
> locale, negociación de idioma, `hreflang`, `setRequestLocale` para SSR estático
> y formateo ICU a mano es superficie de bug considerable y mantenimiento
> perpetuo. `next-intl` es la opción canónica para App Router, sin CVEs
> HIGH/CRITICAL activos (verificar en el PR, §8.1), tree-shakeable y con soporte
> nativo de Server Components. La dep se agrega **solo** para esto. Documentar la
> decisión en el PR y en `README.md` (§8.4 pide documentar config nueva).

---

## 2. Preparación: dependencia y verificación de seguridad

1. Instalar `next-intl` (versión compatible con Next 16 — verificar en
   `node_modules/next-intl/package.json` los peerDeps tras instalar; leer
   `node_modules/next-intl/README.md` **antes** de escribir código, por §2 del
   AGENTS: no asumir API desde training data).
2. Correr el escaneo de seguridad del proyecto (Trivy/pnpm audit). Si `next-intl`
   arrastra una transitiva vulnerable:
   - Preferir `pnpm.overrides` si el salto es compatible (§8.2).
   - Si no, `.trivyignore` **con comentario justificado** y fecha de revisión
     (§8.3). Sin comentario, el PR se rechaza.
3. **No** tocar `package.json` scripts ni el pipeline; solo agregar la dep.

> Jocobi corre la instalación, los tests, el build y el git (memoria del
> proyecto: el agente solo codifica). La IA deja los cambios de archivos listos y
> **entrega el comando de instalación y el mensaje de commit**, no los ejecuta.

---

## 3. Estructura de archivos (FSD — dónde vive cada cosa)

La configuración i18n es infraestructura transversal → vive en `shared/`
(`AGENTS.md §3.1`: `app → features → entities → shared`). Nada de esto importa
hacia arriba.

```
src/
├── shared/
│   └── i18n/
│       ├── config.ts            # locales, defaultLocale, localePrefix (constantes, §3.5)
│       ├── routing.ts           # defineRouting() de next-intl (usa config.ts)
│       ├── request.ts           # getRequestConfig() — carga los messages del locale activo
│       ├── navigation.ts        # Link, redirect, usePathname, useRouter locale-aware (re-export tipado)
│       ├── locale-cookie.ts     # helper puro para leer/escribir la preferencia de idioma
│       └── messages/
│           ├── es/
│           │   ├── common.json      # nav, footer, botones, CTA globales
│           │   ├── home.json
│           │   ├── ligas.json
│           │   ├── ranking.json
│           │   ├── player.json
│           │   ├── matchday.json
│           │   └── org.json
│           └── en/
│               └── (misma estructura; placeholder = copia de es al inicio)
│
├── app/
│   ├── [locale]/                 # NUEVO segmento — envuelve SOLO lo público
│   │   ├── layout.tsx            # <html lang={locale}>, NextIntlClientProvider, setRequestLocale
│   │   └── (public)/             # ← se MUEVE aquí el árbol público actual
│   │       ├── layout.tsx        # (el layout público actual, si existe)
│   │       ├── page.tsx          # home
│   │       ├── ligas/…
│   │       ├── ranking/…
│   │       ├── player/[id]/…
│   │       ├── matchday/…
│   │       ├── org/…
│   │       ├── para-organizadores/…
│   │       └── about/…
│   ├── admin/                    # SIN CAMBIOS — español, fuera de [locale]
│   ├── api/                      # SIN CAMBIOS
│   ├── robots.ts                 # actualizar (§7)
│   ├── sitemap.ts                # NUEVO o actualizar — entradas por locale (§7)
│   └── layout.tsx                # root: se adelgaza — deja de fijar lang="es" (§4)
│
└── proxy.ts                      # componer middleware de next-intl + guard de auth (§5)
```

> **Nota FSD sobre strings de features:** el copy que hoy vive hardcodeado dentro
> de componentes de `features/*/ui/` se extrae a los JSON de
> `shared/i18n/messages/`. El componente sigue siendo tonto (§17): recibe texto
> vía el hook `useTranslations`/`getTranslations`, no lo arma. No se crea un
> diccionario por feature técnica; se agrupa por superficie de UI para que el
> traductor humano lo lea con sentido.

---

## 4. Cambios en el layout raíz y el layout de `[locale]`

### 4.1 `app/layout.tsx` (root) — adelgazar

- Hoy fija `<html lang="es" className="h-full">` de forma dura. El `lang` correcto
  ahora depende del locale, así que **el `<html>` se mueve al layout de
  `[locale]`** para las rutas públicas.
- El admin y demás rutas fuera de `[locale]` necesitan su propio `<html lang="es">`.
  Dos caminos válidos; elegir el que menos duplique:
  - **A (recomendado):** el root layout se queda con `<html lang="es">` como
    fallback para admin/auth, y el layout de `[locale]` **no** re-declara `<html>`
    sino que usa el mecanismo de next-intl para setear `lang` en el segmento
    público. Verificar en el README de next-intl el patrón oficial para Next 16
    (puede requerir que `<html>` viva en `[locale]/layout.tsx`).
  - **B:** mover `<html>` a cada rama (`[locale]/layout.tsx` con `lang={locale}` y
    un layout para el grupo admin con `lang="es"`). Más explícito, más duplicación.
- **Mantener intactos** los providers globales ya montados en el root: `ThemeProvider`,
  `QueryProvider`, `Toaster`, `TrackVisit`, `Analytics`, y las variables de fuente
  del org-theme. No romper el orden de montaje (`QueryClientProvider` se monta una
  sola vez, §7.2).

### 4.2 `app/[locale]/layout.tsx` (nuevo)

Responsabilidades (mantener ≤ el límite de líneas de §3.5; si crece, extraer):

1. Validar que `locale` ∈ locales soportados; si no, `notFound()`.
2. Llamar `setRequestLocale(locale)` (habilita render estático de las páginas
   públicas — clave para SEO/performance).
3. Cargar los messages del locale y envolver en `<NextIntlClientProvider>`.
4. Setear `lang={locale}` en el `<html>` (según el patrón A/B elegido).
5. `generateStaticParams()` devolviendo los locales para prerender.

---

## 5. Middleware — componer next-intl dentro de `proxy.ts`

El proyecto usa `proxy.ts` (convención de Next 16) con un `matcher` que hoy cubre
`/admin`, `/onboarding` y páginas de auth, e implementa el guard de sesión. **No
se reemplaza; se compone.**

Requisitos:

1. Crear el middleware de next-intl con `createMiddleware(routing)` desde
   `shared/i18n/routing.ts`.
2. En `proxy.ts`:
   - **Rutas públicas** (todo lo que no sea `/admin`, `/onboarding`, `/api`,
     `/login`, `/register`, `/verify-email`, ni assets internos): delegar en el
     middleware de next-intl (negociación de locale + rewrite al segmento).
   - **Rutas protegidas / auth:** conservar **exactamente** la lógica actual del
     guard de sesión (redirect a `/login?from=…`, redirect de auth pages a
     `/admin`). El guard corre **antes** o de forma independiente al i18n; el
     admin no pasa por la negociación de locale.
3. Actualizar `config.matcher` para que cubra las rutas públicas además de las que
   ya cubre, **excluyendo** `api`, `_next`, archivos estáticos y assets. Usar el
   patrón de matcher recomendado en el README de next-intl y combinarlo con los
   prefijos protegidos existentes.
4. **Prueba manual obligatoria** tras el cambio: `/ligas` (es, sin prefijo)
   responde igual que hoy; `/en/ligas` responde en inglés; `/admin` sigue
   protegido y en español; `/api/*` intacto.

> Ojo: `localePrefix: 'as-needed'` significa que `es` **no** lleva prefijo. El
> middleware NO debe redirigir `/ligas` → `/es/ligas`. Verificar que no se
> introduzcan redirects que rompan URLs indexadas (revisar con `curl -I`).

---

## 6. Uso en componentes (patrón obligatorio)

### 6.1 Server Components (default, §3.3)

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function LigasPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("ligas");
	return <LigasView title={t("title")} /* …view model… */ />;
}
```

### 6.2 Client Components (solo con estado/interacción)

```tsx
"use client";
import { useTranslations } from "next-intl";

export function LocaleSwitcher() {
	const t = useTranslations("common");
	// usar Link/useRouter de shared/i18n/navigation.ts (locale-aware), NO next/link crudo
}
```

### 6.3 Reglas duras

- **El componente sigue siendo tonto (§17, §19).** El texto llega vía `t()` o por
  props del ViewModel; el componente no concatena copy con lógica de negocio.
- **`titleCase()` / `sanitizeName()` (§5) no cambian.** Son normalización de datos
  (nombres de jugadores/equipos), no copy de UI. Nunca se traducen.
- **Navegación locale-aware:** usar los `Link`, `redirect`, `useRouter`,
  `usePathname` re-exportados desde `shared/i18n/navigation.ts`. Prohibido
  `next/link` crudo en rutas públicas (rompería el prefijo de locale).
- **Nada de magic strings de locale** dispersos: `locales`, `defaultLocale` y
  claves de namespace viven en `shared/i18n/config.ts` (§3.5 DRY).
- **Formateo de fecha/número/moneda:** usar los formatters de next-intl
  (`useFormatter` / `getFormatter`), no `toLocaleString` suelto, para que respete
  el locale activo de forma centralizada.

---

## 7. SEO — la razón de ser de este trabajo

1. **`hreflang` + canonical por página:** en cada página pública, usar
   `generateMetadata` con `alternates.languages` apuntando a la variante `es` y
   `en` (y `x-default` → `es`). next-intl documenta el helper; seguirlo.
2. **`sitemap.ts`:** generar (o extender) el sitemap con **una entrada por locale
   por URL pública**, usando las URLs con/sin prefijo correctas (`/ligas` y
   `/en/ligas`). No incluir rutas admin ni API.
3. **`robots.ts`:** verificar que no bloquee `/en/*`. Mantener admin fuera del
   indexado como esté hoy.
4. **`<html lang>` correcto por locale** (§4) — señal básica para Google.
5. **No romper URLs `es` existentes:** con `as-needed`, `/ligas` no cambia. Validar
   con `curl -I https://<host>/ligas` que responde `200`, no `301` a `/es/ligas`.
6. **`og:locale`** en OpenGraph por idioma (`es_MX` / `en_US`) en `generateMetadata`.

---

## 8. Contenido: qué se traduce y qué NO

**Se extrae a diccionarios y se traduce (empezando por `es`, `en` como placeholder):**

- Copy estático de UI pública: navegación, footer, botones, CTA, encabezados,
  textos de landing, estados vacíos, mensajes de "no hay datos", tooltips.
- `generateMetadata` de páginas públicas: `title`, `description`, keywords por
  idioma (el `en` querrá su propia investigación de keywords después — marcar como
  TODO, no inventar keywords anglo a ciegas).

**NO se traduce (queda en español / datos crudos):**

- Nombres de jugadores, equipos, ligas, canchas → son **datos**, pasan por
  `titleCase()` (§5), nunca por i18n.
- Panel admin completo (`app/admin/*`).
- Mensajes de la API (`apiError()`), logs, `console.error`.
- Contenido generado por el narrador / píldoras (`post-import-content`,
  `org-hub`) → es contenido en español para audiencia local; fuera de alcance de
  este plan.

**Placeholder de `en`:** al inicio, `messages/en/*.json` puede ser copia literal de
`es` (para que el switch funcione y se vea el idioma cambiar en desarrollo). Marcar
cada archivo con un `"_status": "placeholder-untranslated"` o similar para saber
qué falta. La traducción real es trabajo posterior, opt-in.

---

## 9. Testing (obligatorio — §20, el código no está completo sin pruebas)

Stack del proyecto: **Vitest + @testing-library/react + jsdom** (unit/componente),
**Playwright** (e2e). No introducir otro runner.

Cobertura mínima de este trabajo:

1. **`shared/i18n/config.ts` y `routing.ts`** → test unitario: locales esperados,
   default correcto, `localePrefix` = `as-needed`.
2. **`locale-cookie.ts`** y cualquier helper puro → test entrada→salida, incluyendo
   locale inválido / ausente (edge case, §20.2).
3. **`LocaleSwitcher`** (componente con estado) → test con Testing Library:
   estado inicial, cambio de idioma, que use la navegación locale-aware. Declarar
   `// @vitest-environment jsdom` en la primera línea (§20.4).
4. **Un mapper/ViewModel que consuma `t()`** → verificar que el componente recibe
   el texto por props/hook y no lo arma (coherente con §19).
5. **e2e Playwright (smoke):**
   - `/ligas` renderiza en español y responde `200` sin redirect.
   - `/en/ligas` renderiza en inglés.
   - El `LocaleSwitcher` navega es↔en preservando la ruta.
   - `/admin` sigue protegido (redirect a login sin sesión) y en español.
6. **Cobertura de casos, no solo happy path (§20.2):** locale no soportado →
   `notFound()`; ruta pública sin traducción para una clave → fallback razonable
   (no crash); cookie de locale corrupta.

Mockear la red donde aplique (§20.3): nunca pegar a DB/red en unit tests.

---

## 10. Orden de implementación (para el que codifique)

Seguir el orden de capas de `AGENTS.md §3.7`, adaptado:

1. **Infra shared:** `shared/i18n/config.ts` → `routing.ts` → `request.ts` →
   `navigation.ts` → `locale-cookie.ts`. Con sus tests.
2. **Messages:** crear `messages/es/*.json` extrayendo copy real (empezar por
   `common.json` + `home.json`). `messages/en/*` = copia placeholder.
3. **Middleware:** componer next-intl en `proxy.ts` (§5) + prueba manual de rutas.
4. **Segmento `[locale]`:** crear `app/[locale]/layout.tsx`; **mover** el árbol
   `(public)` dentro. Ajustar imports/paths rotos por el move. Adelgazar el root
   layout (§4).
5. **Migrar páginas públicas una por una** a `getTranslations`/`setRequestLocale`,
   extrayendo su copy al JSON correspondiente. Empezar por la home (mayor tráfico),
   luego `/ligas`, `/ranking`, resto. Cada página = un commit (memoria: commit por
   paso).
6. **SEO:** `generateMetadata` con `hreflang` por página + `sitemap.ts` +
   verificar `robots.ts` (§7).
7. **`LocaleSwitcher`** en el header público + persistencia de preferencia
   (cookie).
8. **e2e Playwright** (§9.5).
9. **README:** documentar la config i18n, cómo agregar un locale y cómo agregar una
   clave de traducción (§8.4 del AGENTS pide documentar config nueva).

> Cada paso cierra con un mensaje de commit en formato conventional-commits para
> que Jocobi lo ejecute (memoria del proyecto). Sugerencia de rama: `feat/i18n`.

---

## 11. Checklist antes de commit (además del general de `AGENTS.md §12`)

- [ ] `next-intl` justificado en el PR y sin CVE HIGH/CRITICAL sin fix (§8.1).
- [ ] `es` sigue **sin** prefijo: `/ligas` responde `200`, no `301` a `/es/ligas`.
- [ ] `/admin/*` intacto: protegido, en español, fuera del segmento `[locale]`.
- [ ] `/api/*` sin cambios.
- [ ] Ningún componente arma copy con lógica; texto vía `t()` o ViewModel (§17/§19).
- [ ] Nombres de jugador/equipo pasan por `titleCase()`, no por i18n (§5).
- [ ] Navegación pública usa `Link` locale-aware de `shared/i18n`, no `next/link` crudo.
- [ ] `hreflang` + canonical + `og:locale` correctos por página; sitemap con ambos locales.
- [ ] `<html lang>` refleja el locale activo.
- [ ] Pruebas Vitest (config, helpers, switcher) + smoke Playwright, cubriendo edge cases (§20).
- [ ] `en` marcado como placeholder; no se afirma traducción terminada.
- [ ] README actualizado con la guía de i18n.

---

## 12. Fuera de alcance (explícito, para no sobre-construir)

- Traducción profesional del inglés (keywords anglo, copy pulido) → posterior,
  opt-in, cuando haya señal de demanda.
- i18n del panel admin, del narrador y del contenido generado.
- Traducción de mensajes de API / errores de backend.
- Subdominios por idioma / por org (ver decisiones pendientes en `docs/ORG-THEMING.md`).
- Detección automática por geolocalización que fuerce el idioma (arriesgado para
  SEO y UX; el usuario elige, Google indexa ambos por `hreflang`).

---

## 13. Riesgos y cómo mitigarlos

| Riesgo                                                                | Mitigación                                                                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Romper URLs `es` indexadas al introducir el segmento `[locale]`       | `localePrefix: 'as-needed'` (sin prefijo para default) + verificación `curl -I` de rutas clave antes de merge.       |
| Middleware de next-intl choca con el guard de auth de `proxy.ts`      | Componer, no reemplazar (§5); el admin no pasa por negociación de locale; matcher excluye `/admin`, `/api`, `_next`. |
| API de next-intl distinta a training data (Next 16)                   | Leer `node_modules/next-intl/README.md` antes de codificar (§2 AGENTS).                                              |
| Duplicación de `<html>` entre admin y público                         | Elegir patrón A o B de §4 y documentarlo; no dejar dos `<html>` compitiendo.                                         |
| Traducción `en` incompleta llega a producción como si estuviera lista | `en` marcado como placeholder; `noindex` opcional en `/en/*` hasta tener traducción real (decidir en el PR).         |

---

**Fin del plan.** Cualquier desviación de `AGENTS.md` debe justificarse en el PR.
