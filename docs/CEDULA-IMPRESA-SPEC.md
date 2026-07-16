# Cédula de partido impresa — spec para la IA diseñadora

> **Estado:** propuesta de diseño (jul 2026). Fuente de verdad de posicionamiento: `AGENTS.md`. Este doc describe **qué** debe contener y **cómo** se comporta la cédula impresa. Pásaselo tal cual a la IA diseñadora para que genere el HTML + estilos.

---

## 0. Para qué existe

Cuando se sortea la jornada, el organizador imprime **una cédula por partido**. El árbitro la lleva a la cancha para:

1. **Identificar rápido** a cada jugador por su **código de credencial** (número corto único por liga, ej. `0042`), sin depender del dorsal.
2. **Ver de un golpe qué jugadores NO pueden jugar** porque están sancionados, para no dejarlos entrar.
3. **Anotar a mano** goles y tarjetas durante el partido.
4. **Agregar a mano** jugadores que aún no están registrados (líneas en blanco).
5. **Firmar** al final: árbitro + capitán de cada equipo.

Después el organizador captura en la app lo que quedó escrito en el papel. La cédula es el **puente físico** entre la cancha y el sistema; no reemplaza la captura digital, la alimenta.

## 1. Conceptos y datos que se imprimen (no confundir)

| Dato                     | De dónde sale                     | Formato impreso                     | Rol                                                                              |
| ------------------------ | --------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| **Folio de cédula**      | `matches.cedula`                  | `LCN-0184` (`{CODIGO_LIGA}-{NNNN}`) | Identifica la hoja/partido. Va grande, arriba a la derecha.                      |
| **Código de credencial** | `league_members.credential_code`  | `0042` (`padStart(4)`)              | Columna `#` de cada jugador. Lo que el árbitro busca. Inmutable, único por liga. |
| **Dorsal**               | `league_members.dorsal`           | `10`                                | Solo informativo, chico. **No** es identificador.                                |
| **Sanción**              | `suspensions` (`status = active`) | Franja "NO JUEGA" + motivo          | Marca al jugador que no puede jugar.                                             |

El folio de cédula y el código de credencial son **cosas distintas**: uno identifica el partido, el otro al jugador.

## 2. Formato de hoja (decidido)

- **Tamaño:** Carta (Letter, 8.5×11 in) **vertical**.
- **Una sola hoja por partido**, con **los dos equipos** apilados: local arriba, visitante abajo.
- **Columnas de anotación a mano:** **Goles** y **Tarjetas** (amarilla / roja). _No_ hay columna de asistencia dedicada: la presencia se infiere de quién jugó/anotó y de las firmas. (Si más adelante se quiere palomita de asistencia, se agrega una columna angosta a la izquierda de Goles.)
- Optimizada para **impresión en blanco y negro** y fotocopia: nada del contenido crítico debe depender del color. El color es acento de pantalla, no información.

## 3. Anatomía de la hoja (de arriba a abajo)

### 3.1 Encabezado del partido (banda superior)

- **Izquierda:** nombre de la liga (`MiLigaTest2`) + chip del torneo/temporada (`Gandhi`, `Temporada Regular`).
- **Centro/título:** `CÉDULA DE PARTIDO`.
- **Derecha:** el **folio** grande y monoespaciado (`LCN-0184`).
- **Segunda fila (metadatos):** `Jornada N` · fecha (`Lun 27 jul 2026`) · hora (`07:00`) · cancha (`Cancha 1`). Etiquetas chicas en mayúsculas, valores en negritas.

### 3.2 Bloque de equipo (se repite 2 veces: LOCAL y VISITANTE)

Cada bloque **no se parte entre páginas** (`break-inside: avoid`).

**Cabecera del bloque:**

- Etiqueta `LOCAL` / `VISITANTE` (pill).
- Nombre del equipo, grande.
- **Casilla de marcador final** vacía (cuadro grande para escribir el número de goles del equipo).

**Tabla de jugadores** — columnas, en este orden:

| Col       | Ancho   | Contenido                                             | Notas                                                                                                                                                 |
| --------- | ------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#`       | angosta | Código de credencial `0042`                           | Mono, negritas, grande. Es la columna de búsqueda.                                                                                                    |
| `JUGADOR` | ancha   | **Nombre completo (obligatorio)**                     | Siempre impreso junto al código — es el identificador humano principal, el código solo acelera la búsqueda. En suspendidos, además el tag de sanción. |
| `DOR`     | mini    | Dorsal                                                | Chico, gris.                                                                                                                                          |
| `GOLES`   | media   | _(en blanco)_                                         | Espacio amplio para palitos/números a mano.                                                                                                           |
| `T`       | mini    | _(en blanco)_ dos casillas: `A` (amarilla) `R` (roja) | El árbitro marca.                                                                                                                                     |

Reglas de la tabla:

- **Orden:** jugadores registrados **ascendente por código de credencial**. Filas alternadas con zebra suave para seguir el renglón.
- **Altura de fila cómoda** para escribir a mano (mín. ~7–8 mm).

**Filas de suspendido (lo más importante):**

- La fila entera va **marcada como "NO JUEGA"**: fondo con **tramado diagonal** (hachure) que sobrevive a fotocopia + borde izquierdo grueso.
- Tag rojo/negro `SUSPENDIDO` junto al nombre y el **motivo/plazo** en texto chico:
  - `matches`: `1/2 jornadas` (servidas/total).
  - `time`: `hasta 30 jul`.
  - `permanent`: `PERMANENTE`.
- Las celdas de **Goles y Tarjetas van tachadas/bloqueadas** (no se puede registrar que jugó).
- Objetivo: que el árbitro **no lo pueda pasar por alto** al hojear la lista.

**Filas en blanco (jugadores no registrados):**

- 5–6 renglones vacíos al final del roster con:
  - Celda `#` vacía (para anotar credencial si la trae, o dejar en blanco).
  - Línea para **escribir el nombre a mano**.
  - Mismas columnas de Goles y T.
- Encabezadas con una etiqueta chica: `Refuerzos / no registrados`.

### 3.3 Pie de firmas

Tres columnas con línea de firma + nombre debajo:

- `ÁRBITRO`
- `CAPITÁN — {Equipo local}`
- `CAPITÁN — {Equipo visitante}`

Debajo, una **leyenda** chica que explica el marcado: `▨ NO JUEGA = jugador suspendido, no puede alinear` y `Los renglones en blanco son para jugadores no registrados`.

## 4. Estados y reglas visuales

- **Jugador normal:** fila limpia, código legible, celdas de anotación abiertas.
- **Jugador suspendido:** fila con tramado + tag + motivo + celdas bloqueadas. **Nunca** se omite de la lista (tiene que verse que existe pero no juega).
- **Sin código de credencial** (`null`, caso de migración): **se oculta** de la cédula (decisión de Jocobi, ver `PLAN-CEDULA-IMPRESA.md` §12.2). No se lista con `—`.
- **Sin dorsal:** columna `DOR` vacía.

## 5. Comportamiento de impresión

- `@page { size: Letter portrait; margin: 12mm; }`.
- Todo debe caber en **una hoja** para rosters típicos (~12–16 por equipo). Si un roster es enorme, que fluya a segunda hoja **repitiendo el encabezado del partido**; los bloques de equipo no se parten a media tabla.
- Botón "Imprimir" visible en pantalla, **oculto al imprimir** (`@media print`).
- Sin fondos oscuros ni gastar tinta: papel blanco, texto negro, líneas finas.

## 6. Datos de ejemplo para la maqueta

Partido tomado del sorteo de `MiLigaTest2`, Jornada 2:

- **Local:** Los Charros FC — **Visitante:** Los Valientes.
- Cancha 1, 07:00, Lun 27 jul 2026, folio `MLT-0009`.
- Incluir al menos **2 suspendidos** (uno por `matches`, uno por `time`) para mostrar el marcado.

## 7. Fuera de alcance

- **QR / escaneo:** descartado (ligas amateur no lo usan). El código es puramente visual.
- **Captura digital:** no la hace esta hoja; la cédula solo se imprime y se llena a mano.
- **Tema por torneo:** la maqueta usa la paleta neutra TalachaStats; los skins por torneo se aplican después sin cambiar la estructura.

## 8. Gancho de implementación (cuando se programe)

- El botón "Imprimir cédulas" vive en la vista de **sorteo/jornada** (`app/(shell)/admin/ligas/[leagueId]/jornadas/[matchdayId]`).
- Data por partido: `matches.cedula`, equipos, roster con `credential_code` + `dorsal`, y `suspensions` activas del jugador en esa liga a la fecha del partido.
- La marca "suspendido" se deriva de `is-suspension-active` + el plazo formateado con el helper de `features/discipline/lib/format-suspension`.
