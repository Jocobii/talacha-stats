# Prompt para IA de diseño — Mockup del Hub de la organización

> Copiar/pegar este prompt en la IA de diseño (Figma AI, v0, Uizard, etc.).
> Basado en `docs/ORG-PROFILE-HUB.md`. La sección clave es **§4 — Qué tiene y
> qué NO tiene cada tab**, con los estados exactos que debe mostrar el mockup.

---

## PROMPT (copiar desde aquí)

Diseña el mockup de un módulo de administración web llamado **"Ajustes de la
organización"** para TalachaStats, una plataforma de gestión de ligas de fútbol
amateur en México. Es una pantalla de escritorio (dashboard admin), en español.

### 1. Sistema visual (obligatorio — es dark theme con acento verde)

Usa exactamente estos tokens:

- **Fondos:** app `#0a0a0a`; tarjetas/superficie `#141414`; superficie elevada
  `#1e1e1e`; input/hover `#262626`.
- **Líneas/bordes:** `#2a2a2a` (default), `#353535` (hover/activo).
- **Texto:** principal `#f5f5f5`; secundario/descripciones `#999999`;
  deshabilitado `#555555`.
- **Acento de marca (verde):** `#00e676` (activo, tab seleccionado, toggles ON,
  borde de tarjeta destacada); verde apagado `#00c853` para hover.
- **Estados/semáforo:** rojo `#f87171`, azul `#60a5fa`, ámbar `#fbbf24`.
- **Tipografía:** sans-serif condensada/deportiva para títulos, legible para
  cuerpo. Bordes redondeados medianos (8–12px). Sombras sutiles.

Tono visual de referencia: paneles tipo "ajustes" con **filas-tarjeta**, cada
una con ícono a la izquierda, título + descripción apagada debajo, y el control
(input numérico, toggle o botón) alineado a la derecha. Compacto, técnico,
oscuro.

### 2. Layout general

- **Header del módulo:** ícono de engrane verde + título "Ajustes de la
  organización" + subtítulo apagado "Administra los datos y valores por defecto
  de {NombreOrg}". Botón de cerrar (X) arriba a la derecha.
- **Barra de tabs horizontal** debajo del header, con ícono + label. Tab activo
  subrayado en verde `#00e676`. Tabs (en este orden):
  **General · Tema · Reglamento · Sorteo · Canchas · Miembros**.
- **Cuerpo:** el contenido del tab seleccionado. Muestra en el mockup
  principalmente los tabs **General** y **Sorteo** (los más representativos), y
  entrega los demás como frames secundarios.
- **Banner informativo** (franja con ícono ⓘ, fondo `#1e1e1e`, borde sutil) en
  los tabs marcados como "default": _"Estos valores se copian a cada liga nueva
  al crearla. No afectan ligas ya creadas."_

### 3. Componente base reutilizable: "fila de ajuste"

Tarjeta horizontal `#141414`, borde `#2a2a2a`, radio 10px, padding cómodo:
`[ícono cuadrado con fondo #262626] [título #f5f5f5 + descripción #999999] ⟶ [control a la derecha]`.
Cuando una fila está **activa/destacada**, su borde es verde `#00e676` y el
ícono toma tinte verde (como la tarjeta "Sin repetir rival en" del sistema
actual). El control puede ser: input numérico con unidad ("min", "jornadas"),
toggle (checkbox verde cuando ON), select, o botón.

### 4. Qué tiene y qué NO tiene cada tab (crítico — refleja el estado real)

Cada tab está en un estado de construcción distinto. El mockup debe comunicarlo
visualmente con **badges de estado** junto al título del tab o en su encabezado:
🟢 "Listo", 🟡 "Backend listo · falta pantalla", 🔴 "Por construir",
⚪ "Enlace externo".

#### Tab GENERAL — 🟡 backend listo, falta UI

**TIENE:**

- Campo "Nombre de la organización" (texto).
- Campo "URL única / slug" (input con prefijo fijo apagado `talachastats.com/`
  - validación de disponibilidad: check verde ✓ o error rojo).
- Campo "Ciudad" (texto).
- Bloque "Logo": preview circular/cuadrado del logo actual + botón "Subir
  logo" (dropzone).
- Botón primario verde "Guardar cambios" (abajo, sticky).

**NO TIENE (no dibujar):** nada de facturación, plan de suscripción, ni
gestión de dominios/subdominios (pospuesto).

#### Tab TEMA — ⚪ ya construido en otra pantalla

**TIENE:** solo un **estado de enlace**: una tarjeta que dice "El tema visual
(colores y tipografía) se administra en su propia pantalla" + botón "Abrir
editor de tema →". No rediseñar el editor de tema aquí.

**NO TIENE:** selector de colores ni fuentes embebido (vive en otra ruta).

#### Tab REGLAMENTO — 🟡 backend listo, falta UI

Banner "se copia a cada liga nueva". **TIENE**, como filas de ajuste:

- "Puntos por victoria" (numérico, default 3) y "Puntos por empate"
  (numérico, default 1).
- "Criterios de desempate": lista **reordenable** (drag) de 4 chips —
  Puntos · Head-to-head · Diferencia de goles · Goles a favor. (El desempate
  técnico final por nombre NO se muestra.)
- "Amarillas para 1 fecha de suspensión" (numérico, default 5).
- "Fechas de suspensión por roja directa" (numérico, default 1).
- "Tarjeta azul": selector con 3 opciones — Expulsión temporal / Cuenta como
  amarilla / No se usa.
- "Límite de refuerzos" (numérico, con opción "Sin límite").
- "Nivel de finanzas": segmentado 0 / 1 / 2 (Sin finanzas / Liga formal / Liga
  fuerte).
- Botón "Guardar cambios".

**NO TIENE:** candado de "config bloqueada" (`locked_at`) — eso es solo a nivel
liga, aquí NUNCA se congela. No mostrar ningún estado de "solo lectura".

#### Tab SORTEO — 🔴 por construir (es el hueco principal, dale protagonismo)

Réplica del panel "Parámetros del sorteo" del sistema actual, pero a nivel
organización. Banner "se copia a cada liga nueva". **TIENE**, como filas de
ajuste (usa este tab como el frame más pulido del mockup):

- "Duración del partido" — numérico, unidad "min", default 50. Descripción:
  "Tiempo total del partido, incluyendo medio tiempo."
- "Buffer entre partidos" — numérico, "min", default 0. "Tiempo de transición
  entre dos partidos en la misma cancha."
- "Sin repetir rival en" — numérico, "jornadas", default 3. **Fila destacada
  con borde verde.** "El sorteo evitará enfrentar a los mismos dos equipos
  dentro de esta ventana."
- "Jornadas regulares" — numérico, "jornadas", con placeholder "Automático por
  nº de equipos" cuando está vacío. "Cuántas jornadas tiene la temporada antes
  de playoffs."
- "Permitir rivales repetidos" — toggle (checkbox), default OFF. "Ignora el
  límite de jornadas según el número de equipos."
- Botón "Guardar cambios".

**NO TIENE (importante, NO dibujar en este tab):** sub-tabs de "Canchas",
"Descansos" ni "Slots fijos" (esos son por liga/equipo, viven en el sorteo de
cada liga, no aquí). Solo parámetros numéricos globales.

#### Tab CANCHAS — 🟡 backend listo, decisión de ubicación pendiente

**TIENE:** una **tabla/lista del inventario de canchas de la organización**.
Cada fila: swatch de color de la cancha + nombre + ciudad + dirección +
"capacidad: N canchas paralelas" + menú de acciones (editar/eliminar). Botón
"+ Agregar cancha". Estado vacío ilustrado: "Aún no registras canchas" + CTA.

**NO TIENE:** bandas horarias ni prioridad por liga (eso es config de cada liga
cuando elige de este inventario). Marca esta pantalla con una nota apagada:
"Las ligas eligen de este inventario y les asignan horario aparte."

#### Tab MIEMBROS — 🟡 parcial, decisión de producto abierta

**TIENE:** lista de miembros de la organización (avatar + nombre + email + rol

- badge). Muestra un **estado "en evaluación"**: un aviso apagado arriba —
  "La gestión de miembros hoy es solo para el dueño (owner). Pendiente de decidir
  si el organizador la administra desde aquí." Dibuja la lista como read-only /
  atenuada para comunicar que es tentativa.

**NO TIENE:** invitación por email ni edición de permisos finos todavía.

### 5. Estados a incluir explícitamente en el mockup

- **Estado por defecto** (campos con sus valores default arriba).
- **Estado de validación** en slug: un ejemplo con ✓ verde "disponible" y otro
  con ✗ rojo "ya está en uso".
- **Estado vacío** del tab Canchas.
- **Feedback de guardado:** un toast/notificación verde "Cambios guardados" en
  una esquina (toda mutación da feedback).
- **Badges de estado por tab** (🟢🟡🔴⚪) visibles.

### 6. Entregables

- Frame principal ancho (desktop, ~1200px) mostrando el tab **Sorteo**
  completo (el más representativo del pedido).
- Frames de los tabs **General**, **Reglamento** y **Canchas (con estado
  vacío)**.
- Un frame chico mostrando el **toast de guardado** y el **estado de
  validación del slug**.
- Todo en dark theme con los tokens de §1. Español. Sin datos reales
  sensibles — usa "Liga MiLigaTest", "Cancha El Llano", etc.

## (fin del prompt)

---

### Notas para Jocobi (no pegar en la IA)

- El prompt pinta **6 tabs** con su estado real de build para que el diseño no
  prometa lo que no existe. Si prefieres esconder Miembros/Canchas del primer
  mockup, quita esos dos bloques del §4 antes de pegarlo.
- Los defaults numéricos (50 min, buffer 0, no-repetir 3, 15 jornadas) salen
  del schema y del screenshot que compartiste.
- Cuando tengas el mockup, aplica el gate de §8: recién ahí arrancamos la UI
  (Épica O → P → Q de `ORG-PROFILE-HUB.md`).
