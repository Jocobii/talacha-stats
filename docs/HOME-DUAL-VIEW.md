# Home dual: vista Jugador / vista Organizador

> Documento de diseño — julio 2026. Define la mecánica, el wireframe de secciones,
> el copy propuesto y el principio psicológico que sustenta cada bloque del home (`/`).
> Complementa `AGENTS.md §1.5` (posicionamiento) y el plan de marketing jul–ago 2026.

---

## 1. Contexto y objetivo

- **Situación:** el home actual está enfocado al jugador; el organizador solo tiene
  una sección a mitad de scroll (`OrganizerSection`) y un link pequeño en el hero.
- **Realidad de negocio (jul 2026):** 0 ligas activas. El organizador es **la puerta**
  (sin él no hay dato); el jugador es **el motor** (su ego alimenta el viral loop).
- **Objetivo:** que cada audiencia se auto-identifique en < 3 segundos y vea una
  narrativa completa para ella, sin degradar a la otra.

## 2. Mecánica elegida: Híbrido

1. **Toggle segmentado en `/`** — control "🥅 Juego / 📋 Organizo" arriba del hero.
   Cambia hero, CTAs y orden de secciones. La elección se persiste en `localStorage`.
2. **`/para-organizadores` se conserva** como landing de campaña (SEO propio +
   destino de ads/posts dirigidos a organizadores). Debe alinearse al mismo copy.
3. **Deep-link:** `/?vista=organizador` fuerza la vista (para campañas y para el
   link "¿Organizas una liga?" desde la vista jugador).

**Por qué el toggle en sí es psicología aplicada:** elegir "Organizo una liga" es un
micro-compromiso de auto-etiquetado (compromiso y coherencia, Cialdini). Quien se
declara organizador procesa el resto de la página desde ese rol y es más propenso a
actuar en coherencia con la etiqueta que él mismo eligió.

## 3. Principios psicológicos usados (referencia rápida)

| #   | Principio                              | Base                                                                                               | Dónde se aplica                                                             |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P1  | Auto-referencia / efecto cóctel        | Rogers et al. 1977; Cherry 1953 — el propio nombre y lo auto-relevante capturan atención y memoria | Buscador de nombre en hero jugador                                          |
| P2  | Prueba social                          | Cialdini — imitamos lo que otros como nosotros ya hacen                                            | StatsBar, LeaguesShowcase, testimonios **reales**                           |
| P3  | Aversión a la pérdida                  | Kahneman & Tversky (prospect theory) — perder pesa ~2x más que ganar                               | Copy organizador: jornadas sin capturar = contenido perdido                 |
| P4  | Efecto de dotación anticipada          | Thaler — valoramos más lo que sentimos nuestro                                                     | Preview de tarjeta "así se vería TU perfil"                                 |
| P5  | Efecto IKEA                            | Norton et al. 2012 — valoramos lo que construimos con esfuerzo                                     | Framing: TalachaStats amplifica el trabajo del organizador, no lo reemplaza |
| P6  | Comparación social                     | Festinger 1954 — nos evaluamos comparándonos con pares                                             | Ranking teaser                                                              |
| P7  | Superioridad de la imagen / concreción | Paivio — lo visual y concreto persuade más que lo abstracto                                        | Bloque antes/después de la cédula                                           |
| P8  | Reciprocidad                           | Cialdini — dar valor primero genera obligación de corresponder                                     | Demo abierta sin registro                                                   |
| P9  | Gradiente de meta / Zeigarnik          | Hull 1932; Zeigarnik 1927 — lo casi-completo empuja a completarse                                  | Pasos 1-2-3 con el paso 1 "ya casi hecho"                                   |
| P10 | Anclaje                                | Tversky & Kahneman 1974 — el primer número fija la referencia                                      | Pricing: costo de alternativas vs $0                                        |
| P11 | Von Restorff / aislamiento             | 1933 — lo distinto se recuerda                                                                     | Un solo CTA primario por vista, en color brand                              |
| P12 | Paradoja de la elección                | Schwartz; Iyengar & Lepper 2000 — más opciones, menos acción                                       | Máx. 1 CTA primario + 1 secundario por sección                              |
| P13 | Aversión al riesgo / reversión         | —                                                                                                  | FAQ + "gratis, sin tarjeta, tus datos son tuyos"                            |
| P14 | Unidad / identidad local               | Cialdini (Pre-Suasion) — "es de los nuestros"                                                      | Badge Tijuana, lenguaje de cancha local                                     |

**Regla ética no negociable:** prueba social solo con datos reales. Con 0 ligas
activas, usamos _prueba de actividad_ (jugadores y goles reales del histórico V1 en
StatsBar/ranking) y **eliminamos el testimonio inventado** que hoy vive en
`OrganizerSection` ("Liga Domingos TJ") — un testimonio fabricado es riesgo legal y
los usuarios lo detectan. Se reemplaza cuando exista un organizador real citable.

---

## 4. Vista Jugador (default)

Orden de secciones y cambios vs. lo actual:

### J1 — Hero (evoluciona `HeroSection`)

- **Se conserva:** headline "Tus goles hablan por ti.", HeroCard, fondo de cancha.
- **Se agrega:** buscador de nombre directo en el hero, arriba de los CTAs.
  - Copy: **"¿Ya estás en el sistema? Búscate."** placeholder: `Escribe tu nombre…`
  - **P1:** el visitante que llega por un link compartido busca UNA cosa: él mismo.
    Nada compite con el propio nombre como gancho de atención.
- **CTA primario:** el buscador. **Secundario:** "Ver ranking". Se elimina "Buscar
  jugadores" como botón (redundante con el buscador) — **P12**.
- El link "¿Organizas una liga?" pasa a abrir la vista organizador (`?vista=organizador`)
  en vez de mandar directo a `/register` (primero narrativa, luego registro).

### J2 — StatsBar (se conserva)

- Números reales de plataforma (jugadores, goles, ligas históricas) con count-up.
- **P2 (prueba de actividad):** "aquí ya pasa algo" sin inventar nada.
- Copy de contexto: **"Goles reales, de canchas reales de Tijuana."** — **P14**.

### J3 — Tarjeta de perfil compartible (nuevo, o reencuadre del HeroCard)

- Mock de la tarjeta enmarcado como espejo: **"Así se vería tu perfil."**
  Sub: "Tu foto, tus goles, todas tus ligas. Un link que presume por ti."
- **P4:** hablar de "tu tarjeta" (no "la tarjeta") activa posesión anticipada.
- CTA suave: "Búscate y compártela" → ancla al buscador de J1.

### J4 — LeaderboardTeaser (se conserva)

- **P6:** ver nombres de pares en un top-10 dispara "¿y yo dónde quedaría?".
- Micro-copy bajo la tabla: **"¿Estás arriba de tus compas o abajo? Compruébalo."**

### J5 — LeaguesShowcase (se conserva, copy ajustado)

- **P2 + P14.** Título propuesto: **"Las ligas que ya están en el mapa."**

### J6 — Puerta al organizador / viral loop en reversa (nuevo cierre)

- Bloque final para el jugador cuya liga NO está:
  - **"¿Tu liga no aparece? No es tu culpa — es que tu organizador aún no la registra."**
  - CTA: **"Mándale esto por WhatsApp"** → comparte link a `/para-organizadores`.
- **P3 (en el jugador):** sus goles de cada domingo no están quedando registrados —
  está _perdiendo_ historial. Es el mecanismo literal del viral loop (§1.5 AGENTS:
  jugador presume → presiona al organizador).

---

## 5. Vista Organizador

### O1 — Hero organizador (nuevo)

- Headline: **"Tu liga ya funciona. Hazla ver tan en serio como es."**
  - **P5 (IKEA):** honra el trabajo que el organizador ya hace en Excel+WhatsApp.
    Nunca insinuar que su sistema actual es "un desastre" — es SU obra.
- Sub: "Captura la jornada en la cédula digital y TalachaStats te devuelve tabla de
  posiciones, goleadores, calendario y contenido listo para tu grupo de WhatsApp."
- **CTA primario único:** "Registra tu liga gratis" — **P11, P12**.
- **Secundario:** "Ver una liga de ejemplo" → `/demo` — **P8:** valor completo antes
  de pedir registro.

### O2 — Antes / después (nuevo, el bloque estrella)

- Split visual: izquierda, captura de una cédula en el teléfono; derecha, lo que se
  genera solo: tabla pública + goleadores + imagen de jornada para compartir.
- Título: **"Capturas una vez. Se publica todo."**
- **P7:** una imagen del resultado vale más que 6 bullets de features.

### O3 — El costo de no hacerlo (nuevo, breve)

- **P3 (aversión a la pérdida), el ángulo más fuerte para esta audiencia:**
  - **"Cada jornada que no se captura es una jornada que desaparece. Los goles de tus
    jugadores, el título de la temporada pasada — si no están registrados, no existen."**
- Cierre positivo: "Todo lo que captures desde hoy queda para siempre." (identidad
  CURP = dato incorruptible → toque de autoridad/credibilidad).
- Mantener corto (2-3 líneas): el miedo prolongado repele; la pérdida concreta motiva.

### O4 — Cómo funciona en 3 pasos (nuevo, sustituye lista de features)

1. **Registra tu liga** (2 min) — "ya diste el paso más difícil"
2. **Sube tus equipos y jugadores**
3. **Captura tu primera jornada → tu liga ya es pública**

- **P9:** presentar el paso 1 como casi-trivial y el progreso como ya-iniciado
  (gradiente de meta). Barra de progreso visual 1→2→3.

### O5 — Lo que tu liga obtiene (reemplaza `VALUE_PROPS` actuales)

- Página pública con tu branding (conecta con temas por torneo), ranking de ciudad,
  contenido post-jornada (píldoras, imágenes), sorteo/calendario, liguilla.
- **Corrección obligatoria:** eliminar todo copy de "sube tu Excel" — el flujo de
  importación ya no existe; la captura es en-app vía cédula.

### O6 — Precio con anclaje (nuevo, una línea)

- **"Los sistemas de gestión de ligas cobran por equipo o por jugador. TalachaStats:
  $0. Sin tarjeta, sin límite de equipos."** — **P10 + P13**.
  (Verificar el claim del anclaje contra competidores reales antes de publicar.)

### O7 — FAQ (traer de `/para-organizadores`, actualizada)

- **P13:** cada respuesta elimina un riesgo percibido (¿tarjeta? no; ¿tiempo? 10 min;
  ¿mis jugadores necesitan cuenta? no; ¿ligas chicas? sí).

### O8 — CTA final

- Repetir el CTA primario. Cierre: **"Gratis mientras construimos las primeras ligas
  de Tijuana."** — honesto, y enmarca la etapa temprana como acceso, no como vacío.

---

## 6. Reglas de implementación

- **Toggle:** Client Component; estado inicial con **lazy initializer** desde
  `localStorage` + guarda SSR (`typeof window === "undefined"`). Prohibido
  `setState` dentro de `useEffect` (AGENTS §7.2). `?vista=` tiene prioridad sobre
  lo persistido.
- **SEO:** ambas vistas se renderizan en el server; el toggle alterna visibilidad
  (CSS/estado), no hace fetch. El contenido organizador debe existir en el HTML.
- **FSD:** los componentes de sección viven junto a `app/(public)/page.tsx` (son
  page-specific). Si la lógica del toggle supera 20 líneas → `useHomeView.ts`.
  Límites §3.5: componentes ≤ 150 líneas, orquestador ≤ 80.
- **Tests (§20):** hook del toggle (persistencia, `?vista=`, SSR), y render
  condicional de secciones por vista.
- **Sincronizar `/para-organizadores`:** mismo copy que O1–O8 (hoy dice "sube tu
  Excel" y FAQs desactualizadas).
- **Quitar el testimonio inventado** de `OrganizerSection` (ver §3, regla ética).

## 7. Medición

- Evento por cambio de toggle (elección de rol) y por CTA primario de cada vista.
- Métricas objetivo: % de visitantes que usan el buscador (J1), CTR a `/register`
  desde vista organizador, shares del bloque J6 (viral loop).

## 8. Fases sugeridas

1. **Fase 1:** toggle + hero organizador (O1) + corrección de copy Excel + quitar
   testimonio falso. Lo mínimo que cambia la conversión.
2. **Fase 2:** buscador en hero jugador (J1) + antes/después (O2) + 3 pasos (O4).
3. **Fase 3:** tarjeta espejo (J3), bloque de pérdida (O3), anclaje de precio (O6),
   FAQ en home (O7), medición completa.
