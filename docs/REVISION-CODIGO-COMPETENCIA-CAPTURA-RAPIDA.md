# Plan para empezar a vender TalachaStats — enfoque en adopción, facilidad y publicidad

> **Fecha:** 2026-06-25
> **Audiencia:** Founder y devs/agentes que construyen TalachaStats.
> **Enfoque (según lo pedido):** **empezar a vender YA** y publicitarlo. Que clientes reales lo usen. Para eso, la app tiene que ser **fácil y útil para organizadores NO técnicos** ("el tío de un amigo que lleva la liga"). El módulo de captura en cancha en tiempo real está bien, pero **no es prioridad ahora**.
> **Regla del documento:** toda recomendación de UX/adopción lleva **fuente verificable** (enlazada). Donde la evidencia es de benchmark de industria y no estudio controlado, se dice explícitamente.
> **Cierre:** la sección 8 es el **listado accionable** (cambiar / eliminar / agregar) priorizado para desarrollar a la brevedad.

---

## 0. TL;DR

1. **El producto ya tiene de sobra para empezar a vender.** Lo vendible hoy es lo emocional y de bajo esfuerzo: **perfil público del jugador + página de la liga + tabla/goleo + contenido para postear**. Eso enciende el viral loop (el jugador presume → presiona al organizador). La gestión compleja (sorteo, cédulas, canchas, playoffs) existe pero **no es el gancho de venta**: para el tío no técnico es fricción, no valor.
2. **Tu cliente inicial NO es técnico.** Hoy lleva su liga con WhatsApp + Excel + Facebook Live. Si TalachaStats no le da valor en **2-5 minutos** sin manual, no lo adopta. La investigación de onboarding es clara: el valor temprano predice retención (ver §3).
3. **La estrategia de "ganar fama primero" es correcta y está respaldada por tu propio modelo:** los no técnicos son muchos y mueven el boca a boca; las ligas con organización detrás son pocas y son el objetivo final, pero llegan **después** de la fama. Por eso el camino es: facilidad extrema → casos visibles → reputación → ligas "serias".
4. **Lo que falta para vender no es más software, es:** (a) cerrar el **generador de contenido** (la "cuña" que ahorra las 1-2 h de Canva del lunes), (b) un **onboarding sin fricción / modo demo**, y (c) **material y proceso de venta** (página para organizadores, casos piloto). El módulo de captura en vivo se pospone.

---

## 1. A quién le vendemos: la realidad del cliente

Hay dos perfiles, y el orden importa.

**El organizador no técnico ("el tío") — el cliente de AHORA.**
Lleva una liga de 8-16 equipos como hobby o negocio chico. No usa software complejo; usa lo que ya domina (WhatsApp, Excel, Facebook). Es desconfiado de "apps complicadas" y mide en minutos si algo le sirve. **Es mayoría y mueve el boca a boca.** Si la app es fácil y lo hace verse profesional frente al compa de la otra colonia, la usa y la presume. Este perfil es la **fábrica de fama**.

**La liga con organización detrás — el objetivo de DESPUÉS.**
Pocas, más exigentes, con presupuesto. Son el premio, pero **no compran a un desconocido**: necesitan ver que ya hay ligas usándolo y contenido circulando. Llegamos a ellas cuando tengamos reputación, no antes.

**Implicación de diseño y venta:** todo lo que el tío vea primero debe ser **trivial de usar y emocionalmente atractivo**. La complejidad (sorteo, cédula, canchas) debe estar **escondida hasta que la pida**, no en la portada del producto. Esto coincide con tu `docs/PRODUCT-STRATEGY.md`: "el jugador es el motor, el organizador es la puerta" y "darle al organizador razones **emocionales y de contenido** para entrar, no operativas".

> **Nota de consistencia:** `AGENTS.md` (fuente de verdad) dice que la gestión completa SÍ se construye, como **medio** para capturar dato. No contradice este plan: construir gestión está bien, pero **no se lidera la venta con ella**. Para no confundir a futuros agentes, conviene anotar en `PRODUCT-STRATEGY.md` que la gestión existe pero **no es el gancho comercial**.

---

## 2. Qué vendemos YA (el gancho) vs. qué escondemos

Inventario real del código, clasificado por su rol en la venta.

### 2.1 Vendible hoy (poner al frente)

- **Perfil público del jugador** (`/player/[id]`) — la identidad presumible. Es el motor del viral loop.
- **Página pública de la liga** (`/org/[slug]/[leagueSlug]`) con branding — "tu liga con presencia digital, mándalo en un link".
- **Tabla de posiciones y goleo** siempre al día.
- **Importación desde Excel** (`import-excel`) — el organizador sigue usando SU Excel; no le cambiamos el hábito, solo lo convertimos en algo bonito. Esto es clave para el no técnico.
- **Píldoras post-jornada** (`post-import-content`) — base del contenido para postear (hoy devuelve datos; falta render a imagen, ver §8).
- **Análisis del narrador** (`narrator-analysis`) — hace que el Facebook Live se vea "en serio"; el narrador es evangelizador interno.

### 2.2 Existe, pero NO es gancho de venta (esconder hasta que lo pidan)

- `scheduling` / `sorteo-cockpit` (sorteo y calendario), `venue-management` / `venue-calendar` (canchas), `match-resolution` (cédula), `playoffs`. Son potentes y útiles para ligas más maduras, pero para el tío son **fricción**. Mantenerlos como **opt-in** (ya lo son por liga) y fuera del flujo de primer uso.

### 2.3 Posponer (no ahora)

- **Captura en cancha en tiempo real (PWA del capturista/árbitro).** Buen diferenciador a futuro, pero no ayuda a vender hoy y compite por foco con la cuña de contenido. **Congelado hasta tener tracción.**

---

## 3. Facilidad para no técnicos — principios con fuente

El factor decisivo de adopción para tu cliente es **time-to-value**: cuánto tarda en ver algo que le sirva. La evidencia:

- Los usuarios forman su modelo mental en las **primeras 5-7 interacciones**; quienes ven el valor central en **5-15 min** retienen mucho mejor que quienes tardan 30+ min. (Benchmarks de industria SaaS, no estudio controlado — tómalo como dirección, no como ley.) Fuentes: [Time to Value: SaaS Onboarding Framework](https://www.digitalapplied.com/blog/customer-onboarding-time-to-value-2026-saas-metrics-framework) · [The Science of SaaS Onboarding (saasfactor)](https://www.saasfactor.co/blogs/the-science-of-saas-onboarding-a-comprehensive-framework-for-reducing-friction-improving-activation-and-preventing-churn).
- **Saltarse el onboarding cuando se pueda.** NN/g: los tutoriales interrumpen, no se recuerdan y no mejoran el desempeño; es mejor gastar el esfuerzo en hacer la UI usable que en explicar una UI confusa. Fuentes: [NN/g — Onboarding: Skip It When Possible](https://www.nngroup.com/videos/onboarding-skip-it-when-possible/) · [NN/g — Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/).
- **Aprendibilidad como métrica.** Para un público no técnico, minimizar el esfuerzo/tiempo de aprender a usar el producto es diseño, no extra. Fuente: [NN/g — How to Measure Learnability](https://www.nngroup.com/articles/measure-learnability/).
- **Menos campos = más completado.** Pide solo lo esencial; automatiza y simplifica el resto (marco EAS). Fuentes: [NN/g — EAS Framework](https://www.nngroup.com/articles/eas-framework-simplify-forms/) · [NN/g — Web Form Design, Top 10](https://www.nngroup.com/articles/web-form-design/).
- **Reducir carga cognitiva con defaults inteligentes y agrupación.** Fuente: [NN/g — 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/).

**Traducción a TalachaStats:** el primer uso del tío debería ser literalmente _"sube tu Excel y mira tu liga bonita en un link"_ — sin configurar sorteo, canchas ni cédulas. Ese es el "momento de valor" en 2-5 minutos. Todo lo demás se ofrece después.

---

## 4. La captura tiene que ser fácil (no para power users)

Reorientación respecto a la versión anterior: las técnicas valen, pero el criterio ahora es **simplicidad para no técnicos**, no velocidad para un capturista experto.

### 4.1 Lo que ya está bien y sirve al no técnico

En `admin-registration`: autocompletado de fecha de nacimiento desde el CURP, lookup con debounce, autofocus al resetear. Menos que teclear = menos que equivocarse. Estas decisiones son correctas y de bajo riesgo. (Base: [NN/g EAS](https://www.nngroup.com/articles/eas-framework-simplify-forms/)).

### 4.2 Ajustes de facilidad (con fuente)

- **Una sola columna en formularios de alta** — se completan más rápido y se entienden mejor. Fuente: [NN/g — Web Form Design](https://www.nngroup.com/articles/web-form-design/).
- **Botones/segmented control en vez de dropdown para 2-4 opciones** (p. ej. estado de partido) — un toque vs. abrir/buscar/cerrar; menos error para el no técnico. Fuente: [NN/g — Listboxes vs. Dropdown Lists](https://www.nngroup.com/articles/listbox-dropdown/).
- **Validación inline al salir del campo (no en cada tecla)**, con mensaje claro — previene errores sin "regañar" mientras teclea. Fuentes: [NN/g — Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/) · [NN/g — Hostile Error Messages](https://www.nngroup.com/articles/hostile-error-messages/).
- **Teclado correcto en móvil (`inputmode`/`type`)** — el tío captura desde el celular; teclado numérico para números reduce errores. Fuente: [Baymard — Touch Keyboard Types](https://baymard.com/labs/touch-keyboard-types).
- **Autosave con indicador "Guardado ✓"** — quita el miedo a "perder lo capturado", típico del usuario no técnico. Fuentes: [GitLab Pajamas — Saving & feedback](https://design.gitlab.com/patterns/saving-and-feedback/) · [UI-Patterns — Autosave](https://ui-patterns.com/patterns/autosave).

### 4.3 Lo que se BAJA de prioridad

- **Atajos de teclado avanzados** (`Mod+Shift+H/A`, etc.) y la **captura en cancha en tiempo real**: son para usuarios expertos / fase posterior. No los quites del código, pero **no inviertas más en ellos ahora**. La base de "menos operaciones" sigue siendo válida (modelo KLM), solo que no es la palanca de venta. Fuente: [Keystroke-Level Model (Wikipedia)](https://en.wikipedia.org/wiki/Keystroke-level_model).

---

## 5. La competencia como argumento de venta

No vendas features; vende **simplicidad + lo que nadie más tiene**.

| Rival                                                                                                             | Qué hacen                                  | Tu ángulo de venta                                                                                |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **LeagueRepublic** ([web](https://www.leaguerepublic.com/index.html))                                             | Gestión + web pública, gratis con anuncios | Tú eres en **español, mexicano, sin curva**, y centras en identidad/contenido, no en administrar. |
| **Spond / TeamSnap** ([Spond](https://www.spond.com/en-us/), [TeamSnap](https://www.teamsnap.com/teams/features)) | Comunicación, RSVP, pagos                  | Ellos son "apps de equipo". Tú haces que **la liga y el jugador se vean en serio** y se presuman. |
| **Veo** ([Player Profile](https://www.veo.com/product/player-profile))                                            | Identidad/stats por video IA               | Veo es **caro (cámara)**. Tú das ego del jugador a **costo casi cero**.                           |
| **Challonge / Tournify** ([Challonge](https://challonge.com/), [Tournify](https://tournifyapp.com/en))            | Brackets y live scoring                    | Ellos son herramienta de torneo seco; tú das **presencia digital permanente** de la liga.         |

**Foso real (úsalo en el pitch):** identidad global del jugador anclada al CURP — incorruptible y que **mejora sola** conforme más ligas de la ciudad entran (efecto red local). Nadie en este cuadro lo tiene.

---

## 6. Plan para empezar a vender / publicitar

Orientado a tu modelo (viral loop) y a tu cliente no técnico.

1. **Página de venta para organizadores** (ya existe `/para-organizadores` — auditar y afilar el mensaje a "tu liga en serio en 5 minutos, sigue usando tu Excel"). El copy debe prometer **contenido y verse profesional**, no "gestión".
2. **Modo demo / liga de muestra** pública para que el organizador vea el resultado **antes** de registrarse (reduce la barrera del no técnico). Hay `/demo` — convertirlo en demo de venta real.
3. **Contenido como marketing:** las piezas que genera la app (imagen de jornada, goleador, píldoras) son **el propio anuncio**. Cada imagen compartida con marca TalachaStats es publicidad. Por eso cerrar la Capa 2 es a la vez producto y growth.
4. **Pilotos visibles:** 2-3 ligas reales usándolo, documentadas como caso de éxito (tu roadmap ya lo contempla). Sirven de prueba social para las ligas "serias".
5. **Activar el loop del jugador:** que compartir el perfil sea de un toque (`share-assets` ya existe) — el jugador es la fuerza de venta.

> El soporte de estas decisiones de adopción está en §3 (time-to-value, simplicidad, onboarding mínimo).

---

## 7. Qué bloquea la venta HOY vs. nice-to-have

**Bloquea la venta (resolver ya):**

- Falta el **render a imagen** del contenido (la cuña). Sin esto, el gancho emocional es incompleto.
- Onboarding del organizador no técnico aún pasa por flujos de gestión; falta el **camino corto "Excel → liga bonita"**.
- Falta **demo de venta** y mensaje afilado en `/para-organizadores`.

**No bloquea (posponer):**

- Captura en cancha en tiempo real, formato ida/vuelta, round-robin/Swiss, notificaciones push, comunicación in-app, pagos.

---

## 8. ★ Listado accionable — cambiar / eliminar / agregar (a la brevedad)

Priorizado por **valor × impacto en la venta** y **bajo costo de desarrollo**. P0 = hacer ya; P1 = siguiente; P2 = después.

### AGREGAR (lo que más mueve la aguja)

| #   | Acción                                                                                                                                                                      | Por qué genera valor/venta                                                                                                                                                                                    | Prioridad |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A1  | **Render a imagen de las píldoras/jornada** (sobre `post-import-content`): imagen de tabla, goleador y datos curiosos con branding de la liga, lista para WhatsApp/Facebook | Es la **cuña** y a la vez es publicidad gratis (cada imagen lleva tu marca). Ahorra las 1-2 h de Canva del lunes                                                                                              | **P0**    |
| A2  | **Camino corto de primer uso "Sube tu Excel → mira tu liga"** sin tocar sorteo/canchas/cédula                                                                               | Da el momento de valor en 2-5 min al no técnico → adopción ([time-to-value](https://www.digitalapplied.com/blog/customer-onboarding-time-to-value-2026-saas-metrics-framework))                               | **P0**    |
| A3  | **Demo de venta pública** (liga de muestra navegable sin registro) sobre `/demo`                                                                                            | El tío ve el resultado antes de comprometerse; baja la barrera                                                                                                                                                | **P0**    |
| A4  | **Botón "compartir mi perfil" de un toque** bien visible en `/player/[id]` (usa `share-assets`)                                                                             | Enciende el viral loop: el jugador es la fuerza de venta                                                                                                                                                      | **P1**    |
| A5  | **Indicador "Guardado ✓" + validación inline on-blur** en formularios de alta/captura                                                                                       | Quita el miedo del no técnico a perder datos / equivocarse ([autosave](https://design.gitlab.com/patterns/saving-and-feedback/), [errores](https://www.nngroup.com/articles/errors-forms-design-guidelines/)) | **P1**    |
| A6  | **Página `/para-organizadores` afilada** al mensaje "tu liga en serio, sin cambiar tu Excel" + CTA de contacto/alta                                                         | Es el material de venta; hoy probablemente habla de features, no de la emoción                                                                                                                                | **P1**    |

### CAMBIAR (mejora sin reescribir)

| #   | Acción                                                                                                                  | Por qué                                                                                                                                                                      | Prioridad |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| C1  | **Esconder la gestión avanzada del primer uso** (sorteo, canchas, cédula, playoffs siguen opt-in y fuera de la portada) | Para el no técnico, verlas es fricción; matan la sensación de "fácil"                                                                                                        | **P0**    |
| C2  | **Formularios de alta a una sola columna + dropdowns 2-4 → botones**                                                    | Más rápido y menos error para no técnicos ([single column](https://www.nngroup.com/articles/web-form-design/), [radios](https://www.nngroup.com/articles/listbox-dropdown/)) | **P1**    |
| C3  | **Deducir más del CURP** (género del char 11; fecha ya se deduce) y precargar liga/equipo por contexto                  | Menos campos = más completado ([EAS](https://www.nngroup.com/articles/eas-framework-simplify-forms/))                                                                        | **P2**    |
| C4  | **Actualizar `PRODUCT-STRATEGY.md`** para decir: la gestión existe pero **no es el gancho comercial**                   | Evita que futuros agentes/devs lideren la venta con gestión (resuelve el choque con `AGENTS.md`)                                                                             | **P1**    |

### ELIMINAR / CONGELAR (liberar foco)

| #   | Acción                                                                                                  | Por qué                                                                                                           | Prioridad |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| E1  | **Congelar el módulo de captura en cancha en tiempo real** (no iniciar desarrollo)                      | No ayuda a vender hoy; compite por foco con la cuña de contenido                                                  | **P0**    |
| E2  | **No invertir más en atajos de teclado avanzados** de la cédula                                         | Son para power users; tu cliente es no técnico                                                                    | **P1**    |
| E3  | **Posponer** ida/vuelta, round-robin/Swiss, notificaciones push, comunicación in-app y pagos            | Operativo, no emocional; solo si ligas "serias" lo piden por escrito                                              | **P1**    |
| E4  | **Quitar onboarding/tutoriales largos** si existen; invertir ese esfuerzo en que la UI se explique sola | Los tutoriales no mejoran el desempeño ([NN/g](https://www.nngroup.com/videos/onboarding-skip-it-when-possible/)) | **P2**    |

**Si solo haces 3 cosas esta semana:** A1 (imagen de contenido), A2 (camino corto Excel→liga) y A3 (demo de venta). Son las que convierten "producto técnico" en "algo que el tío usa y presume" — y con eso empieza la fama.

---

## 9. Fuentes

**Adopción / onboarding / time-to-value**

- NN/g — Onboarding: Skip It When Possible: https://www.nngroup.com/videos/onboarding-skip-it-when-possible/
- NN/g — Onboarding Tutorials vs. Contextual Help: https://www.nngroup.com/articles/onboarding-tutorials/
- NN/g — How to Measure Learnability: https://www.nngroup.com/articles/measure-learnability/
- NN/g — CASTLE Framework (apps de trabajo): https://www.nngroup.com/articles/castle-framework/
- Time to Value — SaaS Onboarding Framework (benchmark de industria): https://www.digitalapplied.com/blog/customer-onboarding-time-to-value-2026-saas-metrics-framework
- The Science of SaaS Onboarding (benchmark de industria): https://www.saasfactor.co/blogs/the-science-of-saas-onboarding-a-comprehensive-framework-for-reducing-friction-improving-activation-and-preventing-churn

**Diseño de formularios / facilidad de captura (UX)**

- NN/g — EAS Framework: https://www.nngroup.com/articles/eas-framework-simplify-forms/
- NN/g — Web Form Design, Top 10: https://www.nngroup.com/articles/web-form-design/
- NN/g — 4 Principles to Reduce Cognitive Load in Forms: https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
- NN/g — Listboxes vs. Dropdown Lists: https://www.nngroup.com/articles/listbox-dropdown/
- NN/g — 10 Guidelines for Reporting Errors in Forms: https://www.nngroup.com/articles/errors-forms-design-guidelines/
- NN/g — Hostile Patterns in Error Messages: https://www.nngroup.com/articles/hostile-error-messages/
- Baymard — Touch Keyboard Types "Cheat Sheet": https://baymard.com/labs/touch-keyboard-types
- Baymard — Avoid Splitting Single Input Entities: https://baymard.com/blog/mobile-form-usability-single-input-fields
- Keystroke-Level Model (Wikipedia): https://en.wikipedia.org/wiki/Keystroke-level_model
- GitLab Pajamas — Saving and feedback: https://design.gitlab.com/patterns/saving-and-feedback/
- UI-Patterns — Autosave: https://ui-patterns.com/patterns/autosave

**Competencia**

- LeagueRepublic: https://www.leaguerepublic.com/index.html · resultados/stats: https://us.leaguerepublic.com/features/results-and-statistics.html
- Spond: https://www.spond.com/en-us/
- TeamSnap: https://www.teamsnap.com/teams/features
- Veo — Player Profile: https://www.veo.com/product/player-profile
- Challonge: https://challonge.com/
- Tournify: https://tournifyapp.com/en
- Sportlomo — Apps & communication: https://www.sportlomo.com/apps-and-communication/

> **Nota de método y honestidad de evidencia:** las cifras de onboarding/SaaS (5-15 min, % de churn, etc.) son **benchmarks de industria de blogs especializados**, no estudios controlados; úsalas como dirección estratégica, no como dato duro. Las afirmaciones de UX de formularios se citan a su fuente primaria (NN/g, Baymard, W3C). Las descripciones de competidores provienen de sus sitios oficiales y pueden cambiar (verifica precios/features al citar).
