# Sello Talacha — Compartir liga V2 en redes (tabla + goleadores) con marca de agua

> **Estado:** Propuesta de diseño (borrador 2 — reorientado a V2) · **Fecha:** 2026-05-22
> **Prioridad de diseño:** Crecimiento / adopción (viral loop).
> **Enfoque vigente:** Gestión de liga **V2** (registro CURP, captura de partidos, sorteo, liguilla).
> **Fuera de alcance ahora:** Importación de Excel (V1). Se mantiene como fallback legacy, no como camino principal.
> **Cumple:** Regla 3 — _"Poner nuestra marca de agua para que sepan de nuestra app y lo que puede hacer."_

Este documento describe una idea y su arquitectura: que **al crear una liga nueva en V2 y capturar sus partidos, el organizador pueda compartir en un toque** —a WhatsApp y Facebook— la **tabla de posiciones** y los **goleadores**, en una imagen con un **Sello Talacha** co-branded, escaneable y rastreable que convierte a quien la ve en un visitante atribuible y, si es de otra liga, en un alta.

No es software de operación nuevo: es la **capa de contenido + identidad** montada sobre los módulos V2 que ya construimos.

---

## 0. Cambio de enfoque (qué cambió respecto al borrador 1)

El borrador 1 asumía el flujo V1: "el organizador sube el Excel del corte y de ahí salen las imágenes". **Eso se deja de lado.** Ahora la fuente de verdad es **V2**: los partidos se capturan en el módulo de Resolución (`features/match-resolution`), y la tabla y el goleo se calculan desde esos datos. El motor de compartir debe leer de V2, no del Excel.

| Dimensión                | Borrador 1 (V1 / Excel)                  | Borrador 2 (V2 — este doc)                            |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------- |
| Disparador del contenido | Subida de Excel semanal                  | Creación de liga + resolución de partidos             |
| Tabla de posiciones      | `teamStandingsSnapshot` (snapshot Excel) | `getLeagueStandings()` en vivo desde `matches`        |
| Goleadores               | `playerSeasonStats` (Excel)              | `match_player_stats` (captura V2) — **función nueva** |
| Identidad del jugador    | `players` (legacy)                       | `global_players` vía `inscriptions → league_members`  |
| Excel                    | Camino principal                         | Fallback legacy, no se invierte en él                 |

---

## 1. La idea en una frase

**Cada liga V2 tiene un botón "Compartir" que genera al instante una imagen de la tabla / goleadores con el Sello Talacha (deep-link + QR a la liga), lista para WhatsApp y Facebook — y cada imagen que circula es una invitación rastreable para la siguiente liga.**

```
Organizador crea liga V2 (equipos + sorteo)
        ↓
Captura los partidos de la jornada (match-resolution)
        ↓
Un toque "Compartir tabla / goleadores"
        ↓
TalachaStats genera la imagen con Sello Talacha (deep-link + QR + atribución)
        ↓
Se postea en WhatsApp / Facebook Live → jugadores la reenvían (presumen)
        ↓
Alguien de OTRA liga ve el QR → escanea → cae en la liga pública
        ↓
CTA: "¿Tu liga no está aquí? Pídela gratis" → alta de organizador
        ↓
Más ligas → más contenido en circulación → más altas
```

El jugador es el motor; el organizador es la puerta; el **Sello Talacha** es la chispa que llega a la siguiente puerta y la hace medible.

---

## 2. Estado del código (qué existe y qué falta)

### 2.1 Lo que ya funciona para V2

| Pieza                       | Archivo                                         | Estado V2                                                                                                                                             |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabla de posiciones en vivo | `src/lib/standings.ts` → `getLeagueStandings()` | ✅ **Sirve.** Si no hay Excel, calcula desde `matches` con status `played`/`walkover_home`/`walkover_away`. W.O. = 3-0. Orden Pts → DG → GF → nombre. |
| Captura de partido          | `src/features/match-resolution/`                | ✅ Escribe `match_player_stats` (goles, asistencias, tarjetas) + actualiza `matches` (status `played`, score, bonus).                                 |
| Imagen de jornada (render)  | `src/app/api/content/jornada-image/route.tsx`   | ⚠️ Renderiza bien, **pero lee goleadores de `playerSeasonStats` (V1)**. Hay que cambiar la fuente.                                                    |
| OG / link preview           | `src/app/api/og/route.tsx`                      | ✅ Render genérico con marca de agua "inicial gigante".                                                                                               |
| Botón compartir             | `src/shared/ui/ShareButton.tsx`                 | ✅ Web Share API + fallback a clipboard.                                                                                                              |

### 2.2 El hueco crítico: goleadores en V2

`getLeagueTopScorers()` / `getLeagueTopAssists()` (`src/lib/stats.ts`) **no ven los datos de V2**:

1. Filtran `matches.status === "completed"` — pero la captura V2 deja los partidos en `"played"`.
2. Cuentan desde `match_events` — pero `resolveMatch()` (`features/match-resolution/resolve-match.ts`) **solo escribe `match_player_stats`**, nunca `match_events`.
3. Enriquecen con `players` + `player_registrations` (tablas legacy V1).

**Consecuencia:** una liga creada y capturada 100% en V2 devuelve **goleadores vacíos**. Justo la pieza que queremos compartir. Esto se resuelve en la Fase F1 (§9) con una función nueva que agrega desde `match_player_stats`.

> La tabla de posiciones no tiene este problema porque `getLeagueStandings()` ya cuenta el status `"played"` y lee de `matches`. El goleo sí, porque su fuente de jugador es otra.

---

## 3. El contrato del Sello Talacha (Regla 3)

Toda imagen pública que produzca la plataforma **debe** renderizar un Sello Talacha. Es contrato, no sugerencia.

### 3.1 Anatomía

```
┌───────────────────────────────────────────────┐
│  [tabla de posiciones / goleadores de la liga] │
│                                                 │
├───────────────────────────────────────────────┤
│  ● TALACHASTATS          ┌─────────┐           │  ← franja de sello
│  talachastats.com/<org>/<liga>  │ ▒ QR ▒ │  Escanea  │
│  "Tu liga, en serio."    └─────────┘  para ver │
└───────────────────────────────────────────────┘
```

Contiene **siempre** cinco elementos: (1) marca primaria `TALACHASTATS`, (2) co-branding de la liga (nombre + `logoUrl` si existe), (3) deep-link legible a la liga, (4) QR con atribución, (5) CTA de adopción.

### 3.2 Reglas del contrato

| #   | Regla                                                                       | Razón                                                                                                           |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| C1  | El sello aparece en el 100% de las imágenes, incluidas las de orgs `trial`. | El crecimiento viene de la circulación; nunca se apaga la marca.                                                |
| C2  | El QR siempre lleva atribución (`ref`, `a`, `t`).                           | Sin atribución no hay métrica del viral loop.                                                                   |
| C3  | El deep-link apunta a la liga (`/<org>/<liga>`), no a la raíz.              | Un link a la raíz no presume nada; a la liga sí.                                                                |
| C4  | Premium (futuro) puede **reducir** el sello, nunca eliminarlo.              | Monetización sin romper el loop.                                                                                |
| C5  | Marca y textos viven en `shared/brand/`, no hardcodeados en cada generador. | Hoy la paleta `C` y los textos están copiados en `og`, `jornada-image` y `narrator/export`. DRY de `CLAUDE.md`. |

---

## 4. Arquitectura

Respeta la regla de dependencias FSD: `app → features → entities → shared`.

```
app/api/content/*           → controladores delgados (Zod → feature → ImageResponse)
        │
        ▼
features/share-assets/      → orquesta: junta datos V2 + arma el React-element del asset
   ├─ catalog.ts            → registro de tipos (standings, goleadores, lanzamiento…)
   ├─ data/                 → lectores V2 (standings, scorers) — reusan lib/ y entities/
   ├─ render/               → builders satori por tipo (solo flexbox, estilos inline)
   └─ deep-link.ts          → URL canónica + parámetros de atribución
        │
        ├──────────────► entities/content-asset/   → registro + tracking (share/scan)
        │                   ├─ model.ts             → ContentAssetSchema (Zod)
        │                   └─ queries.ts           → upsertAsset, recordShare, recordScan
        │
        ├──────────────► entities/match-player-stat/ → fuente del goleo V2 (ya existe)
        │
        ▼
shared/brand/               → FUENTE ÚNICA de marca de agua
   ├─ palette.ts            → la paleta `C` (hoy duplicada)
   ├─ tokens.ts             → wordmark, tagline, dominio, microcopys CTA
   ├─ Watermark.tsx         → componente satori del Sello Talacha
   └─ qr.ts                 → QR como SVG inline (sin servicio externo)
```

- **`shared/brand/`** no conoce ligas; recibe props (`leagueName`, `deepLink`, `qrSvg`, `orgLogoUrl?`, `brandColor?`) y dibuja el sello.
- **`features/share-assets/`** sabe qué datos pide cada asset, los lee de V2, arma el deep-link y compone el React-element con el `Watermark` incluido.
- **`entities/content-asset/`** persiste un registro por asset y por evento de share/scan (base de métricas).
- **`app/api/content/[tipo]/route.tsx`** solo valida (Zod), llama a la feature y devuelve `ImageResponse`. Controlador delgado (`CLAUDE.md`).
- Los tres generadores actuales (`jornada-image`, `og`, `narrator/export`) se **migran al tocarlos** para consumir `shared/brand/Watermark` y, en el caso de `jornada-image`, para leer goleadores de V2.

---

## 5. Fuente de datos V2 (el corazón del cambio)

### 5.1 Tabla de posiciones — reusar lo existente

`getLeagueStandings(leagueId)` ya devuelve la tabla correcta para una liga V2 (cálculo en vivo desde `matches`). El asset de tabla la consume tal cual. No hay trabajo de datos aquí, solo de render + sello.

### 5.2 Goleadores V2 — función nueva (entity-level)

Se agrega una lectura en `entities/match-player-stat/queries.ts` (o `features/share-assets/data/`) que agrega desde la fuente correcta:

```typescript
// entities/match-player-stat/queries.ts
// Goleadores de una liga V2: suma de goles capturados en match_player_stats
// de partidos jugados, atribuidos al jugador vía inscriptions → league_members → global_players.
export async function getLeagueTopScorersV2(leagueId: string, limit = 10): Promise<TopScorerV2[]> {
	// 1. matches de la liga con status que aporta goles de jugador (solo "played";
	//    walkover NO atribuye goles a jugador; bonus goals tampoco).
	// 2. SUM(match_player_stats.goals) GROUP BY inscription (player_registration_id).
	// 3. JOIN inscriptions → teams (equipo) e inscriptions → league_members → global_players (full_name).
	// 4. ORDER BY goals DESC LIMIT n. Empata por full_name canónico.
}
```

Reglas de negocio que el query **debe** respetar (confirmadas en memoria del módulo de resolución):

| Regla                                               | Efecto en el goleo                                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Bonus goals (`home_bonus_goals`/`away_bonus_goals`) | **No** se atribuyen a ningún jugador → no cuentan para goleo individual. Sí cuentan en la tabla (vía score).                 |
| Walkover 3-0                                        | **No** genera goleadores (no hubo jugadores). Solo afecta la tabla.                                                          |
| Marcador que no cuadra                              | `sum(player goals) != team score` es válido. El goleo se calcula desde `match_player_stats`, no desde el score.              |
| Jugadores ad-hoc "sin verificar"                    | Aparecen en el goleo (sus goles son reales), con la identidad que tengan; el badge de verificación es tema de otra pantalla. |
| Tarjeta azul                                        | No afecta goleo; relevante para futuros assets de disciplina.                                                                |

> Nota de display: en V2 el nombre sale de `global_players.full_name`; se muestra con `titleCase()` (sin reimplementar normalización — `shared/lib/normalize.ts`).

### 5.3 Asistencias / otros

Mismo patrón sobre `match_player_stats.assists`. Disponible para un asset secundario, no prioritario.

---

## 6. Catálogo de assets (todos heredan el Sello Talacha)

| Asset                          | Tamaño    | Fuente V2                                  | Momento de uso                                            |
| ------------------------------ | --------- | ------------------------------------------ | --------------------------------------------------------- |
| **Tabla de posiciones**        | 1080×1350 | `getLeagueStandings()`                     | Tras cerrar la jornada                                    |
| **Goleadores**                 | 1080×1350 | `getLeagueTopScorersV2()` (nuevo)          | Tras cerrar la jornada                                    |
| **Tabla + goleadores (combo)** | 1080×1920 | ambas                                      | Resumen de jornada para Stories                           |
| **Lanzamiento de liga**        | 1080×1350 | `leagues` + `teams` (sin partidos aún)     | Al **crear la liga** — anuncia nombre, temporada, equipos |
| **Tarjeta de jugador**         | 1080×1350 | `match_player_stats` agregadas por jugador | El jugador presume su goleo (motor del loop)              |
| **OG link preview**            | 1200×630  | snapshot de liga                           | Al pegar el link de la liga                               |

El asset de **lanzamiento** es el que responde literal al pedido "cuando hacemos una nueva liga poder compartir rápidamente": en cuanto la liga existe (aún sin partidos), hay algo presumible que postear. Los de **tabla/goleadores** entran en cuanto se captura la primera jornada.

Agregar un asset = una entrada en `catalog.ts` + un builder en `render/`. Nada más; el sello es automático.

---

## 7. El flujo "crear liga → compartir rápido" (UX)

Dos momentos, ambos a un toque, sin trabajo manual de diseño:

1. **Al crear la liga** (`features/league-onboarding` / `league-management`): tras guardar, la pantalla ofrece _"Compartir lanzamiento"_ → genera el asset de lanzamiento (nombre, temporada, N equipos) con deep-link a la liga pública. El organizador lo manda al grupo de WhatsApp el mismo día.
2. **Tras capturar una jornada** (`features/match-resolution`, pantalla de resumen al terminar la jornada): botón _"Compartir tabla y goleadores"_ → genera el combo. Un toque, a WhatsApp/Facebook.

En ambos, el componente cliente usa `ShareButton` (ya existe) con la URL del asset; el Web Share API abre el selector nativo en celular. La imagen se descarga/comparte con `Content-Disposition: attachment` (patrón ya usado en `jornada-image`).

---

## 8. Atribución y crecimiento

El QR y el deep-link llevan parámetros que cierran la medición:

```typescript
// features/share-assets/deep-link.ts
function buildDeepLink(orgSlug: string, leagueSlug: string, assetId: string): string {
	const base = `${BRAND.domain}/${orgSlug}/${leagueSlug}`;
	const params = new URLSearchParams({ ref: "asset", a: assetId, t: "qr" });
	return `${base}?${params.toString()}`;
}
```

La página pública (que ya registra visitas vía `TrackVisit` → `POST /api/analytics/visit` → `page_views`) detecta `?ref=asset&a=<id>` e incrementa `content_assets.scan_count`. Con eso se calculan, sin instrumentación extra:

- Piezas generadas y compartidas por liga (métrica de adopción).
- % de jugadores que comparten su tarjeta.
- K-factor por formato de asset (cuál viraliza).

El **CTA de alta** se muestra a visitantes que llegan con `ref=asset`: _"¿Organizas otra liga? Pide la tuya gratis."_ — el punto donde el loop salta a una puerta nueva.

---

## 9. Escalabilidad multi-tenant y mínimo error

### 9.1 Caché por versión de stats (no por snapshot de Excel)

Como en V2 la tabla/goleo se calculan en vivo, la clave de caché se deriva del estado de los partidos, no de un snapshot fijo:

```
statsVersion = `${countResolved}-${maxResolvedAtEpoch}`   // por liga
content_hash = sha256(assetType + leagueId + params + statsVersion + brandVersion)
```

- Mientras no se resuelva un partido nuevo, `statsVersion` no cambia ⇒ misma imagen ⇒ `Cache-Control: public, max-age=31536000, immutable`.
- Al resolver/re-editar un partido, cambia `maxResolvedAtEpoch` ⇒ hash nuevo ⇒ URL nueva. Sin invalidación manual.
- `brandVersion` permite refrescar todas las imágenes si cambia el diseño del sello.

Así el render caro de `next/og` (~100–300 ms) ocurre **una vez por jornada por liga**, no por visita. Escala a miles de ligas: trabajo O(jornadas), no O(vistas).

### 9.2 Aislamiento por tenant

Todo asset está scoped por `org_id` + `league_id`. Deep-link y QR se construyen desde `organizations.slug` (constraint `unique` en DB) y el slug de la liga (`leagues.slug`, único por organización por convención — conviene reforzarlo con `unique(organization_id, slug)` al implementar). Orgs `trial` generan con sello pero no entran a vistas cross-org.

### 9.3 Mínimo error

| Frente              | Medida                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validación          | Cada route valida query con Zod (`leagueId: uuid`, `type: enum`, `limit: coerce.number`) → `apiError` legible. Hoy `jornada-image` valida a mano; estandarizar. |
| Datos incompletos   | Liga sin partidos → tabla en ceros / "Sin datos aún", sello presente. Sin goleadores → sección vacía, no excepción. Liga inexistente → 404 claro.               |
| Cuadre del marcador | El goleo se lee de `match_player_stats`, no del score; assets que muestran ambos no asumen `sum(goles) == score` (puede haber gap legítimo).                    |
| Walkover / bonus    | El goleo excluye W.O. y bonus goals; la tabla los incluye vía `getLeagueStandings()`.                                                                           |
| Render              | QR inline (cero red en el render); fuente con fallback `sans-serif`; tamaño de fuente adaptativo por largo de nombre (patrón ya usado).                         |
| Idempotencia        | `content_assets.content_hash` con `unique`; upsert (insert … on conflict do nothing). Contadores con `UPDATE x = x + 1` atómico.                                |
| Tipos               | Sin `any`; retornos explícitos en `features/` y `entities/` (TS estricto, `CLAUDE.md`).                                                                         |

---

## 10. Modelo de datos (cambios mínimos)

### 10.1 Co-branding por organización (`organizations`)

`organizations` ya tiene `logoUrl`. Se agregan dos columnas opcionales (display, no buscables → sin `*_canonical`):

```typescript
brandColor: text("brand_color"),                                   // hex; default → verde de marca
watermarkTier: text("watermark_tier").notNull().default("standard"),// "standard" | "compact" (premium)
```

### 10.2 Registro de assets (`content_assets`, nueva)

| Columna          | Tipo                    | Propósito                                                                       |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `id`             | uuid PK                 | —                                                                               |
| `org_id`         | uuid FK → organizations | Scope multi-tenant                                                              |
| `league_id`      | uuid FK → leagues       | Liga de la pieza                                                                |
| `asset_type`     | text                    | `standings` \| `scorers` \| `combo` \| `league_launch` \| `player_card` \| `og` |
| `content_hash`   | text `unique`           | Caché + idempotencia (§9.1)                                                     |
| `deep_link_slug` | text                    | `<org>/<liga>` destino del QR                                                   |
| `params`         | jsonb                   | Inputs (jornada, playerId…)                                                     |
| `share_count`    | integer default 0       | Veces compartido                                                                |
| `scan_count`     | integer default 0       | Visitas atribuidas                                                              |
| `created_at`     | timestamptz             | —                                                                               |

No se guarda el binario; la imagen se cachea por `content_hash`.

---

## 11. Plan de implementación por fases

| Fase                              | Entregable                                                                                     | Por qué primero                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **F1 — Goleadores V2**            | `getLeagueTopScorersV2()` desde `match_player_stats` + cambiar `jornada-image` a esa fuente    | Sin esto, compartir goleadores de una liga V2 sale vacío. Es el bloqueo real. |
| **F2 — Unificar branding**        | `shared/brand/` (palette, tokens, `Watermark.tsx`) + refactor de los 3 generadores             | DRY; base para el sello escaneable.                                           |
| **F3 — Sello con deep-link + QR** | `qr.ts` + `deep-link.ts` + Watermark v2                                                        | Materializa la Regla 3 de verdad (hoy el footer es plano, sin QR).            |
| **F4 — Compartir en flujo**       | Botón "Compartir lanzamiento" al crear liga + "Compartir tabla y goleadores" al cerrar jornada | El pedido literal: liga nueva → compartir rápido.                             |
| **F5 — Atribución**               | tabla `content_assets` + tracking en página pública + caché por `statsVersion`                 | Activa métricas y la escala por caché.                                        |
| **F6 — Cobranding + tiers**       | `brandColor`, `watermark_tier`                                                                 | Prepara monetización sin romper el loop.                                      |

F1–F4 entregan el valor pedido. F5–F6 lo vuelven medible y escalable.

---

## 12. Checklist de cumplimiento (`CLAUDE.md`)

- [ ] Goleadores V2 leen de `match_player_stats` (status `played`), no de `match_events`/`playerSeasonStats`.
- [ ] Bonus goals y W.O. **no** entran al goleo individual; la tabla sí los refleja (vía `getLeagueStandings`).
- [ ] Marca y textos desde `shared/brand/` — cero strings de marca hardcodeados.
- [ ] `route.tsx` controlador delgado: Zod → feature → respuesta.
- [ ] Imports respetan FSD; sin imports entre features hermanas.
- [ ] Sin `any`; retornos explícitos en `features/`/`entities/`.
- [ ] Funciones ≤ 20 líneas; componentes ≤ 150 líneas; builders satori divididos.
- [ ] `content_assets.content_hash` `unique`; contadores atómicos.
- [ ] Orgs `trial` generan con sello pero no entran a vistas cross-org.
- [ ] Nombres con `titleCase()` (display); sin reimplementar normalización.

---

## 13. Lo que NO hace esta propuesta

- **No** gestiona operación nueva (sorteo, calendario, pagos) — eso ya vive en `features/scheduling`, `match-resolution`, `playoffs`. Esto es contenido + identidad encima.
- **No** invierte en el flujo Excel (V1); lo deja como fallback legacy.
- **No** es un editor tipo Canva; los assets son plantillas, no lienzos libres.
- **No** guarda binarios de imagen en DB (se cachean por hash).
- **No** apaga la marca de agua para nadie (premium la reduce, no la elimina).
- **No** depende de servicios externos de QR/imagen en el path de render.

---

## 14. Resumen para decidir

El enfoque V2 ya nos da la tabla de posiciones en vivo (`getLeagueStandings`); falta el goleo (hoy vacío porque consulta tablas V1). La propuesta: (1) **arreglar el goleo V2** leyendo de `match_player_stats`, (2) **unificar y volver escaneable la marca de agua** (Regla 3), y (3) **poner el botón de compartir en los dos momentos clave** —crear liga y cerrar jornada—. Resultado: una liga nueva puede presumir su tabla y goleadores en redes desde el día uno, y cada imagen que un jugador reenvía es una invitación rastreable para la siguiente liga.

> Siguiente paso sugerido: aprobar **F1 (goleadores V2) + F4 (botón compartir)**, que es el mínimo para que una liga nueva comparta tabla y goleo, y medir scans antes de invertir en cobranding/tiers.
