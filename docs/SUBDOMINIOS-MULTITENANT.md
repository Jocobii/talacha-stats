# SUBDOMINIOS — Multi-tenant por organización

> Design doc. Estado: **propuesta, pendiente de aprobación de Jocobi.**
> Depende de: `ORG-THEMING.md` (theming ya resuelto; §9 paso 7 reserva este
> trabajo), `ORG-PROFILE-HUB.md`, `HOME-DUAL-VIEW.md` (el home apex), `I18N-PLAN.md`
> (next-intl / `proxy.ts`). Complementa AGENTS.md §1.5 (posicionamiento).
>
> Decisiones ya tomadas por Jocobi (2026-07-22):
> - **Hosting:** Vercel (wildcard domain + cert automático).
> - **Canónica:** el subdominio `miliga.talachastats.com`. `/org/[slug]` hace **301**
>   al subdominio.
> - **Alcance del subdominio:** el mundo de esa org y nada más. Ranking, goleo,
>   jornadas y perfiles quedan **filtrados a esa org**. Las comparaciones
>   ciudad-vs-mundo viven solo en el apex `talachastats.com`.

---

## 0. La idea en una frase

Hoy ya existe `/org/[slug]` con el tema de la org aplicado en su layout. Lo único
que falta es que `miliga.talachastats.com` **reescriba internamente** a ese subárbol
(sin que el usuario vea `/org/miliga` en la URL) y que dentro de ese subárbol vivan
las páginas públicas —ranking, goleo, jornadas, perfil— pero **filtradas a esa org**.
El apex (`talachastats.com`) se queda como la casa de marketing y de las
comparaciones entre ligas de la ciudad.

```
talachastats.com                 → mundo TalachaStats: landing dual (HOME-DUAL-VIEW),
                                   ranking global de ciudad, vitrina de ligas,
                                   comparativos, /para-organizadores, /demo
app.talachastats.com  (opcional) → panel del organizador (/admin, /login, /onboarding)
miliga.talachastats.com          → el mundo de "miliga": SU hub, SUS ligas, SU tabla,
                                   SU goleo, SUS jornadas, SU tema — nada de otras ligas
```

---

## 1. Dos mundos, una sola base de código

No son dos apps. Es **la misma app Next** sirviendo dos "contextos" según el host.
El middleware (`proxy.ts`) decide el contexto una sola vez por request y reescribe.

| Superficie | Host | Vive hoy en | Contenido |
| --- | --- | --- | --- |
| **Apex / marketing** | `talachastats.com`, `www.` | `[locale]/(public)/*` (home, ranking, ligas, player, matchday) | Todo lo global de ciudad + landing |
| **Org (tenant)** | `{slug}.talachastats.com` | `[locale]/(public)/org/[slug]/*` | Solo el mundo de esa org |
| **Panel** | apex hoy; `app.` propuesto (§9) | `(shell)/admin`, `(shell)/login`, `(shell)/onboarding` | Gestión — nunca en un subdominio de org |

**Principio rector:** el subdominio no crea rutas nuevas de dominio de negocio; se
apoya en el subárbol `org/[slug]/*` que **ya es el lugar donde se monta el tema**
(`OrgThemeScope` en `org/[slug]/layout.tsx`). Reescribir el host a ese subárbol hace
que el theming, el fallback a paleta TalachaStats y los assets Satori funcionen
**sin tocar una línea del sistema de temas**. Es literalmente lo que anticipa
`ORG-THEMING.md §9 paso 7`.

---

## 2. Routing: rewrite por host en `proxy.ts`

### 2.1 Clasificación del host

Primer paso de cada request: mirar `request.headers.get("host")` y clasificarlo.

```ts
// src/shared/tenant/host.ts — puro, testeable, sin Next
const ROOT_DOMAIN = "talachastats.com";
const APP_SUBDOMAINS = new Set(["www", "app", "api", "admin", "cdn", "assets", "staging"]);
// reutiliza shared/org-theme/reserved-slugs.ts — misma lista

export type HostContext =
  | { kind: "apex" }                       // talachastats.com / www
  | { kind: "reserved"; sub: string }      // app., api., staging.
  | { kind: "org"; slug: string };         // miliga.talachastats.com

export function classifyHost(host: string | null): HostContext {
  const hostname = (host ?? "").split(":")[0].toLowerCase(); // sin puerto

  // Dev: *.localhost / *.lvh.me (ver §7)
  const bare = hostname
    .replace(/\.localhost$/, "")
    .replace(/\.lvh\.me$/, "")
    .replace(new RegExp(`\\.${ROOT_DOMAIN.replace(".", "\\.")}$`), "");

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}` || bare === "" || bare === hostname) {
    return { kind: "apex" };
  }
  const sub = bare.split(".")[0];
  if (APP_SUBDOMAINS.has(sub)) return { kind: "reserved", sub };
  return { kind: "org", slug: sub };
}
```

> El slug ya es DNS-safe por diseño (`ORG-THEMING.md §2`: regex `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$`),
> así que un subdominio siempre es un slug válido. No hay que sanear otra vez.

### 2.2 Composición dentro de `proxy.ts`

El orden importa. El host se resuelve **antes** que i18n; para hosts de org se
prepende `/org/{slug}` al pathname y **luego** se delega al middleware de next-intl
existente (que agrega el `[locale]`). Así `miliga.talachastats.com/ranking` termina
en `/{locale}/org/miliga/ranking` internamente, pero el navegador sigue mostrando
`miliga.talachastats.com/ranking`.

```ts
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ctx = classifyHost(request.headers.get("host"));

  // 1. Subdominio reservado que aún no usamos (api., cdn.) → 404 o passthrough
  if (ctx.kind === "reserved" && ctx.sub !== "app") {
    return NextResponse.next();
  }

  // 2. HOST DE ORG: el subdominio es un mundo PÚBLICO. El panel no vive aquí.
  if (ctx.kind === "org") {
    // 2a. Bloquea superficies de gestión/auth en subdominios de org →
    //     manda al apex (o a app.) para no fragmentar la sesión.
    if (isProtectedRoute(pathname) || isAuthPage(pathname)) {
      return NextResponse.redirect(new URL(pathname, `https://${ROOT_DOMAIN}`));
    }
    // 2b. Canónica: si alguien entra al subdominio con /org/otra en el path,
    //     es ruido — lo tratamos como raíz del tenant.
    // 2c. Reescribe /ranking → /org/miliga/ranking y deja que i18n agregue locale.
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = `/org/${ctx.slug}${pathname === "/" ? "" : pathname}`;
    const req = new NextRequest(rewritten, request);
    return handleI18nRouting(req); // next-intl agrega [locale] sobre la ruta ya prefijada
  }

  // 3. APEX / app.: comportamiento actual sin cambios.
  if (isProtectedRoute(pathname) || isAuthPage(pathname)) {
    return guardSession(request);
  }
  return handleI18nRouting(request);
}
```

Puntos finos:

- **No se rompe i18n.** next-intl sigue recibiendo un pathname "normal"
  (`/org/miliga/ranking`) y lo reescribe a `/es/org/miliga/ranking`. El matcher del
  `config` no cambia.
- **El slug del subdominio reemplaza al `params.slug`.** Las páginas bajo
  `org/[slug]/*` leen `params.slug` igual que hoy; no saben si vino del path o del
  host. Cero acoplamiento al host en las páginas.
- **El tema ya aplica solo.** El request cae en `org/[slug]/layout.tsx` →
  `OrgThemeScope` → paleta de la org (o fallback TalachaStats). No se toca theming.

### 2.3 Alternativa considerada (y por qué no)

*Contexto por header en las páginas actuales* (middleware setea `x-org-slug`, y
`/ranking`, `/player` leen ese header para filtrar). Se descarta: el theming está
montado en el layout de `/org/[slug]`, no en el layout público raíz. Ir por header
obligaría a duplicar el `OrgThemeScope` en el árbol público y a meter `if (tenant)`
en cada query pública. La reescritura a `/org/[slug]/*` reutiliza el subárbol que ya
está tematizado. Un solo lugar donde vive "el mundo de la org".

---

## 3. Construir el subárbol público de la org

Hoy bajo `org/[slug]/` solo existen `page.tsx` (hub) y `[leagueSlug]/page.tsx`. Para
que el subdominio sea un mundo completo hay que portar —**filtradas a la org**— las
superficies públicas que hoy son globales:

```
app/[locale]/(public)/org/[slug]/
  layout.tsx            ✅ existe (OrgThemeScope) — aquí también va el NAV de la org (§4)
  page.tsx              ✅ hub de la org (ORG-PROFILE-HUB)
  [leagueSlug]/         ✅ liga individual
  ranking/page.tsx      ← NUEVO: goleo/ranking SOLO de esta org
  jornada/page.tsx      ← NUEVO: última jornada / calendario de la org (o por liga)
  player/[id]/page.tsx  ← NUEVO: perfil scoped — stats del jugador EN ESTA ORG
  equipos/…             ← opcional
```

**Regla de scoping (crítica, alcance decidido):** cada query de estas páginas se
filtra por `organizationId`. El mismo jugador puede existir en varias orgs (identidad
CURP global), pero en `miliga.talachastats.com/player/[id]` solo se ven sus números
**de esa org**. El comparativo entre ligas / lugar en la ciudad **no aparece en el
subdominio** — vive en el apex.

Cómo reutilizar sin duplicar lógica:

- Las funciones de datos ya existentes (p. ej. `getMergedLeagueStatsRows`,
  standings, top scorers — AGENTS.md §1.7) reciben o pueden recibir un scope. Se
  agrega un parámetro `organizationId` y las páginas de org lo pasan; las páginas
  del apex pasan "todas". La lógica de merge Excel/vivo no se toca, solo el `WHERE`.
- Los componentes de presentación (tabla, tarjeta de goleador) son los mismos; solo
  cambia el origen de datos. Igual espíritu que theming: dato scoped in, componente
  tonto out.

> Consecuencia de la canónica = subdominio: conviene que **estas** rutas scoped sean
> las canónicas de una liga, y que las globales del apex enlacen hacia el subdominio.

---

## 4. El menú / shell de la organización

El `org/[slug]/layout.tsx` es el lugar natural para el **nav propio de la org**
(hoy solo monta el tema). Es lo que hace que el subdominio "se sienta como una parte
única de la liga".

```tsx
// org/[slug]/layout.tsx  (extendido)
export default async function OrgLayout({ params, children }) {
  const { slug } = await params;
  const [theme, org] = await Promise.all([getOrgTheme(slug), getOrgPublicProfile(slug)]);
  if (!org) notFound(); // subdominio de org inexistente → 404 (o landing "reclama tu liga")

  return (
    <OrgThemeScope tokens={theme?.tokens ?? null} fontId={theme?.fontId}>
      <OrgPublicNav org={org} />       {/* logo + nombre + tabs de la org */}
      {children}
      <OrgPublicFooter org={org} />    {/* "hecho con TalachaStats" — viral loop, §7 theming */}
    </OrgThemeScope>
  );
}
```

`OrgPublicNav` (componente tonto, props in):

- **Marca:** `org.logoUrl` + nombre, con los colores del tema ya heredados por CSS vars.
- **Tabs:** Inicio · Ligas · Tabla · Goleo · Jornada · (Reglamento, si público). Se
  arman desde las ligas/superficies reales de la org, no hardcodeadas. Espeja la
  estructura del hub de gestión (`/admin/organizacion`) pero en versión pública.
- **Enlace de retorno discreto** a `talachastats.com` ("Ver todas las ligas de la
  ciudad") — el puente al mundo global, sin robar protagonismo a la org.
- El nav del apex (`(public)/layout.tsx`) **no** se monta aquí: son dos shells
  distintos. Apex = nav TalachaStats; subdominio = nav de la org.

> Diseño de UI: por la regla del proyecto (gate de diseño antes de programar UI),
> el layout visual del nav/tabs se define contigo antes de codificar los componentes.

---

## 5. Canónica y redirección `/org/[slug]` → subdominio

Decidido: la URL pública de una org es el subdominio. Entonces:

1. **Redirect 301** de `talachastats.com/org/{slug}` (y `/org/{slug}/*`) a
   `https://{slug}.talachastats.com/*`. Se hace en `proxy.ts` cuando `ctx.kind==="apex"`
   y `pathname` empieza con `/org/`. Preserva subruta y query.
2. **`<link rel="canonical">`** de cada página de org apunta a la URL de subdominio
   (via `generateMetadata` leyendo el host/slug).
3. **Sitemap y og:url** de contenido de org usan el subdominio.
4. Los **assets Satori** (`/api/content/*-image`, `ORG-THEMING §7`) y los share-links
   (`share-assets`) generan URLs de subdominio. Una liga se comparte siempre como
   `miliga.talachastats.com/...`.

Así no hay contenido duplicado: una sola URL pública por recurso de org.

---

## 6. Configuración en Vercel

1. **Dominio wildcard:** agregar `*.talachastats.com` al proyecto (Settings →
   Domains). Vercel emite y renueva el cert wildcard automáticamente. Mantener
   `talachastats.com` y `www.talachastats.com` como dominios primarios.
2. **DNS:** un registro `CNAME *` (o `A`/`ALIAS` según el proveedor de DNS) apuntando
   a Vercel, además del apex. Con el DNS de Vercel, el wildcard se resuelve solo.
3. **No hay allowlist de subdominios en Vercel:** cualquier `*.talachastats.com`
   llega al mismo deployment; es `proxy.ts` quien decide si el slug corresponde a una
   org real (si no, `notFound()` en el layout, §4).
4. **Middleware:** el `proxy.ts` corre en el edge en cada request de subdominio — es
   barato (una clasificación de string + la query de tema que ya existía).
5. **Variable de entorno** `NEXT_PUBLIC_ROOT_DOMAIN=talachastats.com` para no
   hardcodear el dominio (dev/preview/prod difieren). Los previews de Vercel usan
   `*.vercel.app`, que `classifyHost` trata como apex por defecto (los subdominios de
   org no se prueban en el dominio de preview; ver §7 para el dev local).

---

## 7. Desarrollo local

Los subdominios necesitan resolver en local. Dos rutas sin tocar `/etc/hosts`:

- **`*.localhost`** — los navegadores modernos resuelven `miliga.localhost:3000`
  a 127.0.0.1 sin configuración. Ruta recomendada.
- **`lvh.me`** — `miliga.lvh.me:3000` resuelve a 127.0.0.1 (útil si algún navegador
  se resiste con `.localhost`).

`classifyHost` ya contempla ambos sufijos (§2.1). Test manual:

```
http://talachastats.localhost:3000     → apex (o usa localhost:3000 a secas)
http://miliga.localhost:3000/ranking   → org "miliga", ranking scoped
http://app.localhost:3000/admin        → reservado → panel
```

`NEXT_PUBLIC_ROOT_DOMAIN=localhost` en `.env.local`.

---

## 8. SEO y consideraciones transversales

- **robots / sitemap:** un sitemap índice en el apex + un sitemap por org servido
  desde el subdominio (`{slug}.talachastats.com/sitemap.xml`). Cada org es un sitio
  indexable propio → mejor para búsquedas del nombre de la liga.
- **Cookies de sesión:** hoy la cookie `ts_session` es host-only. **No** ampliarla a
  `.talachastats.com` (dominio wildcard): el panel vive en apex/`app.` y los
  subdominios de org son públicos sin sesión. Mantener el scope estrecho evita que
  una sesión "viaje" a subdominios públicos. (Si algún día el organizador edita desde
  su subdominio, se revisa aquí.)
- **Analítica:** incluir el host/slug de org como dimensión para medir tráfico por
  tenant vs apex.
- **404 de subdominio inexistente:** `foo.talachastats.com` donde `foo` no es una org
  → página "esta liga aún no existe / ¿organizas una liga?" que empuja al viral loop
  (enlaza a `/para-organizadores` del apex). Mejor que un 404 seco.

---

## 9. Decisiones pendientes (Jocobi)

1. **¿El panel se muda a `app.talachastats.com` o se queda en el apex?**
   Propuesta: dejarlo en apex por ahora (cero trabajo); reservar `app.` y migrar
   cuando el apex de marketing y el panel compitan por la home. El bloqueo de
   `/admin` en subdominios de org (§2.2) ya deja lista la mudanza futura.
2. **`notFound` vs landing de captación** para subdominio de org inexistente (§8).
   Propuesta: landing de captación (viral loop) en vez de 404.
3. **Precedencia tema org vs tournament-skin en el subdominio.** Ya resuelto en
   `ORG-THEMING §8.1` (gana el tema de la org dentro de `/org/[slug]`); el subdominio
   hereda esa decisión sin cambios.
4. **¿Rutas scoped mínimas de la fase 1?** Propuesta: `hub` (existe) + `tabla/goleo`
   por liga (existe en `[leagueSlug]`) primero; `ranking` agregado de la org y
   `player` scoped en fase 2.
5. **Perfil de jugador:** alcance decidido = solo esta org en el subdominio. Falta
   decidir si el subdominio muestra un enlace discreto "ver perfil global en
   talachastats.com" (puente al ego de ciudad) o nada. Propuesta: enlace discreto.

---

## 10. Orden de implementación (fases)

1. **`shared/tenant/host.ts`** (`classifyHost`) + tests puros — sin tocar routing.
2. **`proxy.ts`**: rama de host de org (rewrite a `/org/{slug}`), bloqueo de
   admin/auth en subdominios, y redirect 301 `/org/{slug}` → subdominio en apex.
   Probar con `*.localhost` (§7). *No requiere Vercel todavía.*
3. **Vercel**: alta del wildcard `*.talachastats.com` + DNS + env `ROOT_DOMAIN`
   (lo corre Jocobi).
4. **Nav/shell de org** en `org/[slug]/layout.tsx` (`OrgPublicNav`, footer con
   watermark) — **con gate de diseño previo contigo**.
5. **Canónica**: `generateMetadata` con canonical a subdominio + og:url + ajuste de
   share-assets y rutas Satori para emitir URLs de subdominio.
6. **Rutas scoped**: `ranking`, `player/[id]`, `jornada` bajo `org/[slug]/*`,
   pasando `organizationId` a las funciones de datos existentes (parámetro de scope,
   sin duplicar lógica de stats — AGENTS §1.7).
7. **404/landing** de subdominio inexistente + sitemap por org.
8. (Pulido) mudanza opcional del panel a `app.` (decisión §9.1).

Cada paso cierra con su mensaje conventional-commits para que Jocobi lo ejecute.
```
