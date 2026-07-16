# Plan — Generación de cédulas imprimibles por jornada

> **Estado:** plan de trabajo (jul 2026). Fuente de verdad de posicionamiento y reglas: `AGENTS.md`. Diseño visual aprobado: `template.html` (raíz del repo) — este plan lo convierte en un template **dinámico** alimentado por datos reales. Spec de contenido: `docs/CEDULA-IMPRESA-SPEC.md`.

---

## 1. Objetivo

Que el sistema genere, para una jornada ya sorteada, la **cédula imprimible de cada partido**: encabezado del partido + roster de los dos equipos, con los **jugadores suspendidos marcados "NO JUEGA"** para que el árbitro lo vea. Debe poder **descargarse/imprimirse individual (un partido) o en lote (toda la jornada)**, rápido, y **cada partido cabe en una hoja Carta**.

Lo crítico, en orden: (1) lista de jugadores correcta y ordenada, (2) suspendidos remarcados, (3) impresión veloz de una o varias, (4) que quepa en una hoja.

## 2. Qué ya existe (se reutiliza, no se reinventa)

| Pieza                                                                      | Ubicación                                                                                                                    | Uso en la cédula                                                                   |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Roster por equipo (inscriptions→leagueMembers→globalPlayers, con `dorsal`) | `entities/match/queries.ts` → `getMatchForResolution` (fetchRoster)                                                          | Base de la lista. **Falta agregar `credentialCode`**.                              |
| `credential_code`                                                          | `league_members.credentialCode` (schema.ts:412)                                                                              | Columna `#` y **orden de la lista**.                                               |
| Suspensiones activas de la liga                                            | `entities/suspension/queries.ts` → `listActiveSuspensionsByLeague`                                                           | De dónde salen los suspendidos.                                                    |
| Vigencia real "hoy"                                                        | `entities/suspension/lib/is-suspension-active.ts` → `isSuspensionActive(susp, todayIso)`                                     | `status='active'` **no** basta para `time`; hay que filtrar por fecha del partido. |
| Texto del motivo/plazo                                                     | `features/discipline/lib/format-suspension`                                                                                  | El "por qué" que va junto a "NO JUEGA".                                            |
| Datos de jornada + lista de partidos                                       | `entities/match/queries.ts` → `listMatchesByRound`; page `app/(shell)/admin/ligas/[leagueId]/jornadas/[matchdayId]/page.tsx` | Dónde viven los botones y de dónde sale la lista de partidos.                      |
| Partido: `cedula` (folio), `kickoffAt`, `venueId`→venue, teams             | `matches` (schema.ts:492+)                                                                                                   | Encabezado (folio, hora, cancha).                                                  |
| Diseño visual print-ready                                                  | `template.html`                                                                                                              | Se porta a componente React (§5).                                                  |

## 3. Decisiones técnicas

### 3.1 Render: ruta HTML "print-first", no PDF en servidor

El `template.html` ya es HTML + `@page Letter` + botón imprimir. La vía más simple y rápida es una **ruta de Next que renderiza la(s) hoja(s) y el usuario imprime con Ctrl+P / botón** (o "Guardar como PDF" del navegador). Evita meter Puppeteer/Playwright (peso, cold-start, infra) en esta primera versión. Si más adelante se quiere descarga PDF server-side directa, se agrega sin cambiar el componente (misma vista → PDF). _Decisión abierta en §11._

### 3.2 Una vista, dos entradas

- **Individual:** por fila de partido en la jornada → abre la hoja de ese partido.
- **Lote (toda la jornada):** botón en el encabezado → renderiza **todas** las hojas, una por partido, con `page-break-after: always`. Un solo Ctrl+P imprime todas. Ese es el "imprimir rápido".

### 3.3 Que quepa en una hoja (el punto delicado)

El `template.html` usa dos tablas lado a lado con un número **fijo** de renglones en blanco. Con rosters reales (largo variable) eso puede desbordar o quedar corto. Regla dinámica:

- Renglones en blanco por equipo = `clamp(minBlank, targetRows − registrados, targetRows)`, donde `targetRows` iguala la altura de las dos columnas (se toma el roster más largo como referencia).
- **Densidad auto-ajustable:** si el equipo con más jugadores supera la capacidad cómoda de una hoja (~18–20 filas), se reduce alto de fila/tamaño de fuente por pasos hasta caber; si aun así no cabe, se permite fluir a una 2ª hoja repitiendo el encabezado del partido (los bloques de equipo no se parten a media tabla).
- Esto vive en una función **pura** de view-model (§5), testeable sin DOM.

## 4. Datos — nueva capa de lectura (server-only)

En `entities/match/queries.ts` (o un `entities/match/lib/cedula.ts` server-only), dos funciones:

- `getCedulaDataForMatch(matchId)`: reusa el patrón de `getMatchForResolution` pero
  - añade `credentialCode: leagueMembers.credentialCode` al `select` del roster,
  - **ordena el roster por `credentialCode` asc** (jugadores sin código, `null`, al final; mostrar `—`),
  - trae `cedula`, `kickoffAt`, `venue.name` (cancha), `matchday.number`, `scheduledDate`, nombres/colores de equipos.
- `getCedulaDataForMatchday(matchdayId)`: para el lote — resuelve todos los partidos de la jornada (una query de rosters batched por liga, no N+1) + **una** carga de suspensiones activas de la liga.

**Marcado de suspendidos** (se calcula una vez por liga, no por partido):

1. `listActiveSuspensionsByLeague(leagueId)`.
2. Filtrar con `isSuspensionActive(s, matchDateIso)` usando la **fecha del partido** (no "hoy"), para que la cédula refleje quién estará suspendido ese día.
3. Indexar `Map<globalPlayerId, { label, why }>` con `format-suspension`.
4. Al construir cada fila del roster, si el `globalPlayerId` está en el Map → fila `susp` con tag "NO JUEGA" + motivo, y celdas de goles/tarjetas bloqueadas.

> Regla de barrel (memoria/AGENTS §7): `queries.ts` importa `@/db` → **no** se re-exporta desde `entities/match/index.ts`. La ruta de impresión (server component) importa la función directo desde el archivo, no desde el barrel.

## 5. Feature `features/cedula`

- `lib/build-cedula-view-model.ts` — **puro, client-safe** (sin `@/db`): recibe la data cruda del partido + el Map de suspendidos y devuelve el view-model de una hoja (filas ordenadas por credencial, marca de suspendido, número de renglones en blanco calculado, densidad). Con test unitario del cálculo de blanks/densidad.
- `ui/CedulaSheet.tsx` — componente presentacional (client-safe) que pinta **una** hoja a partir del view-model. Es `template.html` portado a JSX + estilos (CSS module o el sistema del proyecto). Sin fetching.
- `ui/CedulaBatch.tsx` — mapea N view-models a N `CedulaSheet` con salto de página.
- `index.ts` — barrel: exporta **solo** lo client-safe (componentes + tipos del view-model). El data-fetcher de §4 vive en `entities/match` y no entra aquí (regla de split cliente/servidor de features).

## 6. Rutas y botones (app)

- **Vista de impresión, sin shell** (layout limpio para imprimir), server components:
  - `app/(print)/cedula/partido/[matchId]/page.tsx` → una hoja.
  - `app/(print)/cedula/jornada/[matchdayId]/page.tsx` → todas las hojas de la jornada.
  - Ambas resuelven permisos igual que la page de jornada (`canManage`: owner, u organizer de la organización de la liga) antes de renderizar.
  - **`src/proxy.ts`:** `/cedula` debe estar en `PROTECTED_PREFIXES` (junto a `/admin`, `/onboarding`) para que el middleware la desvíe a `guardSession` y no a `handleI18nRouting` de next-intl — de lo contrario next-intl intenta reescribirla a `/[locale]/cedula/...` (no existe, vive en `app/(print)`) y da 404 antes de llegar a la página. Bug real encontrado y corregido jul 2026.
- **Entradas en la jornada** (`.../jornadas/[matchdayId]/page.tsx`):
  - Botón en el bloque de **Acciones** del encabezado: "Imprimir cédulas" → abre `/cedula/jornada/[matchdayId]` en pestaña nueva.
  - Acción por fila (junto a "Capturar/Editar", o sobre la celda "Cédula"): "Imprimir" → `/cedula/partido/[matchId]`.
  - _Gate de diseño ya cubierto:_ el look está aprobado en `template.html`; estas entradas son botones/links dentro del layout existente.

## 7. Impresión / CSS

Portar del `template.html`: `@page { size: Letter portrait }`, `.sheet` con `page-break-after: always` en modo lote, `break-inside: avoid` en bloques de equipo y pie, `thead { display: table-header-group }`, y `print-color-adjust: exact` para que el tramado del suspendido y la barra negra del header salgan en impresión. Botón "Imprimir" oculto en `@media print`.

## 8. i18n

**No aplica.** Toda esta feature vive fuera de `app/[locale]` (rutas `app/(shell)/admin/...` y la nueva `app/(print)/cedula/...`, hermana de `(shell)`) — el admin es español-only, sin i18n (ver comentario en `app/(shell)/layout.tsx` y `docs/I18N-PLAN.md` §0/§4). Los textos van hardcodeados en español en `CedulaSheet.tsx`/`PrintCedulaButton.tsx`, igual que el resto del panel admin. Corrección sobre la redacción original de este doc, que asumía namespaces es/en.

## 9. Plan por pasos (un commit por paso)

> Jocobi ejecuta migraciones/tests/commits; el agente solo escribe código.

**Paso 1 — Data.** Añadir `credentialCode` + orden por credencial al roster y crear `getCedulaDataForMatch` / `getCedulaDataForMatchday` en `entities/match`.
`feat(match): add credential-ordered roster query for match cédula`

**Paso 2 — Marca de suspendidos.** Helper que cruza `listActiveSuspensionsByLeague` + `isSuspensionActive(matchDate)` + `format-suspension` en un `Map<globalPlayerId, motivo>`.
`feat(cedula): resolve active suspensions per match date for the sheet`

**Paso 3 — View-model puro.** `build-cedula-view-model.ts` (orden, marca, renglones en blanco dinámicos, densidad) + test.
`feat(cedula): pure view-model with one-page fit logic`

**Paso 4 — Componente de hoja.** `CedulaSheet.tsx` portando `template.html` a JSX + estilos.
`feat(cedula): printable CedulaSheet component from approved template`

**Paso 5 — Rutas de impresión.** `(print)/cedula/partido/[matchId]` y `(print)/cedula/jornada/[matchdayId]` con guard de permisos + `CedulaBatch` para el lote.
`feat(cedula): print routes for single match and full matchday`

**Paso 6 — Botones en la jornada.** "Imprimir cédulas" en encabezado + acción por fila.
`feat(jornada): add print-cédula entry points (single and batch)`

**Paso 7 — Pulido de impresión.** Sin i18n (§8, corregido). Verificación de salto de página en lote, `break-inside: avoid` en bloques de equipo/pie, y ajuste de densidad con rosters reales.
`chore(cedula): print polish and page-break verification`

## 10. Verificación

- Test unitario del view-model (blanks/densidad/orden por credencial/marca de suspendido).
- Prueba manual de impresión: 1 partido (una hoja), jornada de 7 partidos (7 hojas, un solo Ctrl+P), roster grande (que no desborde), suspendido visible en B/N.

## 11. Fuera de alcance / decisiones abiertas

- **PDF server-side:** por ahora impresión del navegador. Evaluar Puppeteer si se pide descarga directa .pdf.
- **QR / escaneo:** descartado (el código es visual).
- **Asistencia:** la hoja captura goles/tarjetas a mano; la presencia se infiere. Si se quiere palomita de asistencia, es una columna extra (no en esta versión).
- **Tema por torneo:** la hoja usa la paleta neutra de `template.html`; los skins se aplican después sin tocar la estructura.
- **Confirmar:** ¿la "Cancha" sale de `venue.name` del partido? Si un partido no tiene venue, mostrar en blanco.

## 12. Decisiones de Jocobi (resueltas jul 2026)

1. **Lote con selección:** el botón de impresión por jornada abre un picker con checkboxes por partido (no "todos" implícito). Impacta §6 y §9 (Paso 5/6): la ruta de lote recibe una lista de `matchId`s, no solo el `matchdayId`.
2. **Sin `credential_code` → se oculta.** Contradice lo escrito en `CEDULA-IMPRESA-SPEC.md` §4 ("mostrar `—`"); prevalece esta decisión. Un jugador sin credencial asignada **no aparece** en la cédula hasta tener backfill. Impacta §4 (marcado de suspendidos/roster) y el view-model de §5: filtrar antes de construir filas, no solo mostrar placeholder.
3. **Botón de lote solo con jornada publicada.** La entrada "Imprimir cédulas" en el encabezado de la jornada se gatea igual que el resto de acciones post-publicación; la impresión individual por partido puede quedar disponible desde antes (no se preguntó explícitamente, se asume igual a hoy).
