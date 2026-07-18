# Prompt para IA de diseño — Mockup del flujo de credencial / pase del jugador

> Copiar/pegar este prompt en la IA de diseño (Figma AI, v0, Uizard, etc.).
> Basado en `docs/CREDENCIAL-PASE-JUGADOR.md` (modelo de datos) y en el sistema
> visual de `docs/ORG-PROFILE-HUB-DESIGN-PROMPT.md`. La sección clave es
> **§4 — Pantalla por pantalla: dónde, qué SÍ y qué NO**, con los estados
> exactos que debe mostrar el mockup.
>
> **Regla de oro para el diseñador:** este flujo cubre **solo la vigencia y el
> alcance** de la credencial (el derecho a jugar). **NO** cubre pago, cobro,
> pasarela, QR ni impresión. Ver §6.

---

## PROMPT (copiar desde aquí)

Diseña el mockup de un flujo de administración web llamado **"Credencial del
jugador"** para TalachaStats, una plataforma de gestión de ligas de fútbol
amateur en México. Escritorio (dashboard admin), en español. Lo opera el
oficinista/organizador en ventanilla, no el jugador.

### 0. Contexto de negocio (para que el diseño tenga sentido)

La **credencial** es el **pase que da derecho a jugar**. Hay dos tipos:

- **Desechable (por liga):** sirve solo para una liga/torneo. Al abrir nueva
  temporada, se vence y hay que sacar otra.
- **Anual (por organización):** sirve para **todas las ligas de esa
  organización** durante un año (ej. lunes, miércoles y viernes). Al año, se
  renueva.

Un mismo jugador (identidad global anclada a CURP) puede tener **varios pases a
la vez** en distintas organizaciones. La credencial **no es** el número que usa
el árbitro para pasar lista (eso es otra cosa, ya existe, no se toca).

### 1. Sistema visual (obligatorio — dark theme con acento verde)

Usa exactamente estos tokens (idénticos al resto del admin):

- **Fondos:** app `#0a0a0a`; tarjeta/superficie `#141414`; elevada `#1e1e1e`;
  input/hover `#262626`.
- **Bordes:** `#2a2a2a` (default), `#353535` (hover/activo).
- **Texto:** principal `#f5f5f5`; secundario `#999999`; deshabilitado `#555555`.
- **Acento marca (verde):** `#00e676` (activo, seleccionado, ON); hover
  `#00c853`.
- **Semáforo de estado:** verde `#00e676` (vigente), ámbar `#fbbf24`
  (pendiente/por vencer), rojo `#f87171` (vencida/bloqueada), azul `#60a5fa`
  (informativo).
- **Tipografía:** sans condensada/deportiva en títulos, legible en cuerpo.
  Radios 8–12px, sombras sutiles.

### 2. Alcance del mockup — qué pantallas SÍ y cuáles NO

Diseña **cuatro superficies** (frames). Todas viven **dentro del admin ya
existente**; no inventes navegación nueva ni un módulo aparte.

**SÍ diseñar:**

- **A. Paso de credencial dentro del flujo de registro** (`/admin/registro`) — el
  entregable principal.
- **B. Modal "Emitir / renovar credencial"** — se abre desde A y desde D.
- **C. Estado de credencial en el roster / miembros**
  (`/admin/organizacion/miembros` y roster de equipo) — badge por jugador.
- **D. Credenciales en el perfil del jugador** (`/admin/players/[id]`) — lista de
  pases del jugador.

**NO diseñar** (fuera de alcance, ver §6): pantalla de pago, carrito, cobro,
recibo, QR, credencial física imprimible, ni la pantalla de cotejo/árbitro.

### 3. Componentes base reutilizables

**3.1 Badge de estado de credencial** (chip pequeño, se usa en A, C y D):

- 🟢 **Vigente** — fondo `rgba(0,230,118,.12)`, texto/borde `#00e676`.
- 🟡 **Pendiente** (sin credencial aún / no ha pagado) — ámbar `#fbbf24`.
- 🟡 **Por vencer** (anual a <30 días) — ámbar con ícono de reloj.
- 🔴 **Vencida** — rojo `#f87171`.
- ⚪ **Suspendida** — gris `#999999`.

**3.2 Chip de pase** (tarjeta compacta que representa un pase concreto):
`[ícono escudo] [tipo: "Anual · Organización" | "Por liga · {NombreLiga}"] [badge de estado] [vigencia: "Vence 12 jul 2027" o "Temporada Apertura 2025"]`.
Borde verde `#00e676` si es el pase que autoriza el contexto actual; borde
`#2a2a2a` si es solo informativo.

**3.3 Fila-tarjeta** (reusa el patrón del admin): superficie `#141414`, borde
`#2a2a2a`, ícono cuadrado a la izquierda `#262626`, título `#f5f5f5` +
descripción `#999999`, control a la derecha.

### 4. Pantalla por pantalla — dónde, qué SÍ y qué NO

> Marca cada frame con un badge de construcción como en el resto de docs:
> 🔴 "Por construir" (todo este flujo es nuevo).

#### A. Paso de credencial en el flujo de registro — 🔴 Por construir

**DÓNDE:** el flujo de registro hoy tiene 3 pasos (dots arriba):
**Buscar CURP → Revisar jugador → Liga y equipo**. Este paso se **inserta dentro
del tercer paso ("Liga y equipo")**, justo **después** de elegir la liga y
**antes** de confirmar la inscripción. No agregues un cuarto dot; es una sección
dentro del paso existente.

**QUÉ TIENE (dibuja los 3 estados en frames apilados):**

- Encabezado de sección: "Credencial para esta liga" + subtítulo apagado
  "Un jugador necesita una credencial vigente que cubra esta liga para poder
  jugar."
- **Estado A1 — Ya cubierto por pase anual:** banner verde con ⓘ:
  _"{Nombre} tiene credencial anual de {NombreOrg}, vigente hasta {fecha}. Cubre
  esta liga."_ + chip de pase (3.2) con borde verde. Botón primario **"Inscribir
  a la liga"** habilitado.
- **Estado A2 — Sin credencial (pendiente):** fila-tarjeta ámbar:
  _"Este jugador aún no tiene credencial para {NombreLiga}."_ con dos opciones
  como botones: **"Emitir credencial por liga"** y **"Emitir credencial anual"**
  (abren el modal B). El botón **"Inscribir a la liga"** está **deshabilitado**
  (gris `#555555`) con tooltip: _"Necesita una credencial vigente."_
- **Estado A3 — Recién emitida:** tras volver del modal, el chip de pase aparece
  con badge 🟢 Vigente y el botón "Inscribir a la liga" se habilita en verde.

**QUÉ NO TIENE:** ningún campo de precio, monto, "pagar", método de pago, ni
referencia bancaria. El paso decide **cobertura y vigencia**, no dinero.

#### B. Modal "Emitir / renovar credencial" — 🔴 Por construir

**DÓNDE:** overlay modal centrado (superficie `#1e1e1e`, ancho ~460px) sobre A o
D. No es página aparte.

**QUÉ TIENE:**

- Título "Emitir credencial" + nombre del jugador y su CURP enmascarado
  (`GOMJ8501...`).
- **Selector de tipo** (dos tarjetas seleccionables, radio-card, la activa con
  borde `#00e676`):
  - **"Por liga (desechable)"** → debajo, texto apagado: _"Válida solo para
    {NombreLiga}. Se vence al abrir la siguiente temporada."_
  - **"Anual (organización)"** → texto apagado: _"Válida en todas las ligas de
    {NombreOrg} por un año."_ + una línea de vigencia calculada, solo lectura:
    _"Vigencia: {hoy} → {hoy + 1 año}"_.
- Botones: **"Emitir"** (primario verde) y **"Cancelar"** (secundario).

**QUÉ NO TIENE:** campos de fecha editables (la vigencia la calcula el sistema,
es solo-lectura), precio, cobro, ni comprobante. Para el modal de **renovación**
(mismo componente, título "Renovar credencial anual"), muestra arriba un aviso
azul: _"La credencial actual venció el {fecha}. Se creará una nueva vigente
hasta {fecha+1año}."_

#### C. Estado de credencial en roster / miembros — 🔴 Por construir

**DÓNDE:** en la lista de miembros/roster ya existente, **como una columna o
badge nuevo por fila** — no rediseñes la tabla, solo añade el indicador.

**QUÉ TIENE:**

- Badge de estado (3.1) en cada fila de jugador: 🟢 Vigente / 🟡 Pendiente /
  🟡 Por vencer / 🔴 Vencida.
- Al pasar el cursor (tooltip): el tipo y la vigencia (_"Anual · vence 12 jul
  2027"_ o _"Por liga · Apertura 2025"_).
- **Filtro/segmento** arriba de la lista: "Todas · Vigentes · Pendientes ·
  Vencidas", con el conteo entre paréntesis. Dibuja la lista con **al menos un
  jugador de cada estado** para que se vea el contraste.
- En una fila 🔴/🟡, un botón discreto **"Emitir"** al final de la fila (abre B).

**QUÉ NO TIENE:** edición inline de vigencia, ni acciones de pago. El badge es de
lectura + acción de emitir.

#### D. Credenciales en el perfil del jugador — 🔴 Por construir

**DÓNDE:** una **sección nueva** dentro del perfil de jugador que ya existe
(`/admin/players/[id]`), debajo de sus datos. Título de sección:
**"Credenciales"**.

**QUÉ TIENE:**

- Lista de **chips de pase** (3.2), uno por pase, agrupados por organización.
  Muestra el caso realista de Tijuana a escala: **el mismo jugador con un pase
  anual en "Novofut" (🟢 vigente) y un pase por liga en otra organización**
  (🟢 o 🔴). Esto comunica que la identidad global agrupa pases de varias orgs.
- Botón **"Emitir credencial"** (abre B) y, en un pase anual vencido, botón
  **"Renovar"**.
- Un pase histórico vencido se muestra **atenuado** (texto `#555555`), no se
  borra.

**QUÉ NO TIENE:** historial de pagos, montos, ni recibos.

### 5. Estados exactos que el mockup debe incluir (checklist)

Entrega frames que muestren **todos** estos estados (no solo el feliz):

1. Registro — jugador **cubierto por anual** (A1, botón habilitado).
2. Registro — jugador **sin credencial** (A2, botón bloqueado + tooltip).
3. Registro — **recién emitida** (A3, chip verde + botón habilitado).
4. Modal — tipo **"Por liga"** seleccionado.
5. Modal — tipo **"Anual"** seleccionado (con vigencia calculada).
6. Modal — **renovación** (aviso azul de vencida).
7. Roster — lista con **mezcla** de vigente / pendiente / vencida + filtros.
8. Perfil — jugador con **pases en 2 organizaciones** (uno vigente, uno vencido
   atenuado).

### 6. Qué NO diseñar (no-gos globales — importante)

- ❌ **Nada de pago:** ni precio, ni "pagar", ni carrito, ni pasarela, ni
  recibo/comprobante. El pase modela **solo alcance y vigencia**. (El cobro se
  conectará después, fuera de este flujo.)
- ❌ **Nada de QR ni escaneo:** las ligas amateur no usan pistolas QR.
- ❌ **Credencial física imprimible:** no es este entregable.
- ❌ **Pantalla de cotejo/árbitro:** la validación "puede jugar" se consume en
  ese flujo, pero **no** lo diseñes aquí.
- ❌ **Número de credencial para asistencia** (`credential_code`): ya existe y es
  otra cosa; **no** lo mezcles con el pase.
- ❌ **Fechas editables a mano:** la vigencia la calcula el sistema.
- ❌ **Onboarding/tour, ilustraciones vacías elaboradas, ni light theme.**

### 7. Entregables esperados

- **Frame principal:** A (los 3 estados apilados) — es lo más importante.
- **Frames secundarios:** B (3 variantes), C (lista con filtros), D (perfil).
- Todo en **dark theme** con los tokens de §1, en **español**, escritorio.
- Reusa componentes existentes (fila-tarjeta, tabs, badges) — esto **extiende** el
  admin actual, no lo reinventa.

## FIN DEL PROMPT
