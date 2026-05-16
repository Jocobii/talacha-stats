# TalachaStats — Estrategia de producto

> **Última revisión:** 2026-04-30
> **Audiencia:** Founder, IAs/agentes que ayudan a construir, futuros colaboradores.
> **Para detalles técnicos del codebase, ver `AGENTS.md`.**

Este documento define **qué somos, qué NO somos, y por qué**. Toda decisión de producto, feature o copy se valida contra este documento. Si algo en el código contradice esta estrategia, el código está mal — no la estrategia.

---

## 1. Una frase

**TalachaStats es la capa de identidad digital y contenido para ligas locales de fútbol amateur en México.** Convierte el corte semanal de Excel del organizador en perfiles de jugador, presencia digital de la liga y contenido listo para postear.

**Tagline:** _"Tu liga, en serio."_

---

## 2. Mercado objetivo

Ligas locales pequeñas en México:

- 8–16 equipos
- Organizador independiente (no federación, no club institucional)
- Presupuesto limitado o nulo para software
- Hoy operan con WhatsApp + Excel + Facebook Live
- Cero presencia digital persistente de la liga

**No somos para:** federaciones, ligas profesionales, academias formales, clubes con software propio.

---

## 3. Los dos egos a alimentar

El producto vive de dos psicologías paralelas. Toda feature debe servir al menos a una de las dos, idealmente a las dos.

### 3.1 El jugador

- Quiere **presumir** su posición en el ranking, sus goles, sus rachas.
- Quiere un **historial** que persista al cambiar de liga.
- Es la fuerza de venta sin saberlo: presiona al organizador para que adopte TalachaStats.

### 3.2 El organizador

- Quiere que su liga **se vea más profesional** que las del compa de la otra colonia.
- Quiere **contenido listo para postear** sin trabajo extra.
- Quiere **argumentos para reclutar** jugadores y patrocinadores.
- Quiere apoyar al narrador del Facebook Live para que la transmisión se vea seria.

**Lo que el organizador NO quiere de nosotros:** que le manejemos sorteos, calendario, pagos, arbitraje, cancha. Eso ya lo hace bien con WhatsApp.

---

## 4. Motor de crecimiento (viral loop)

```
Jugador juega en liga con TalachaStats
    ↓
Ve y presume sus stats / ranking / perfil
    ↓
Amigos / otros jugadores quieren lo mismo
    ↓
Presionan a sus organizadores para que usen TalachaStats
    ↓
Organizador adopta la plataforma
    ↓
Más jugadores en el ecosistema → más presión → más adopción
```

**El jugador es el motor. El organizador es la puerta.** Si la puerta se cierra (porque al organizador no le interesa), el motor no sirve. Por eso la estrategia 2026 invierte en darle al organizador razones **emocionales y de contenido** para entrar — no operativas.

---

## 5. La trampa que NO vamos a caer

**Construir software de gestión de ligas** (sorteos, calendario, pagos, arbitraje, cancha, inscripciones).

Hacerlo significaría:

- Perder foco actual
- Perder ventaja competitiva (sencillez)
- Competir con TeamSnap, LeagueApps, SportsEngine — y perder
- Romper el viral loop ("esta liga usa software complicado" deja de ser presumible)
- Volvernos un ERP de ligas en lugar de una plataforma de identidad y stats

**Regla dura:** no construimos features de "manejar la liga" hasta tener al menos **10 ligas activas pidiéndolo explícitamente y por escrito**.

---

## 6. Propuesta de valor por capas

El producto se construye en capas. Cada capa profundiza el valor sin cambiar el ADN.

### Capa 1 — Identidad de la liga (base)

_Estado: existe parcialmente._

- Página pública por liga con branding propio (logo, colores)
- URL bonita y compartible: `talachastats.com/lunes-villa-magna`
- Tabla de posiciones y goleo siempre actualizadas
- Perfiles de jugador navegables

**Promesa al organizador:** "Tu liga tiene presencia digital permanente. Mándalo en un link."

### Capa 2 — Generación automática de contenido (LA CUÑA)

_Estado: por construir. Es la prioridad estratégica._

Cada lunes/martes después de que el organizador sube el corte (Excel), TalachaStats genera automáticamente:

- **Imagen de la jornada** lista para WhatsApp/Facebook (tabla + goleo, con branding de la liga)
- **Píldoras del narrador** — datos curiosos para postear (rachas, líderes históricos, hat-tricks, "X jornadas sin perder")
- **Carrusel/reel de jugadores** destacados de la jornada
- **Imagen de jugador del partido / goleador del torneo** con stats

**Por qué importa:** esto es lo que el organizador hoy hace **a mano en Canva los lunes**. Le ahorramos 1–2 horas por semana. Es el motivo por el que mandará el Excel todas las semanas. Es lo que **no tiene nadie más** en este nicho.

### Capa 3 — Pre-partido del narrador (DIFERENCIADOR)

_Estado: existe `lib/narrator.ts`, falta UI dedicada._

Pantalla específica para el narrador del Facebook Live:

- Enfrentamientos históricos del partido del día
- Jugadores destacados de cada equipo con estadísticas pertinentes
- Datos curiosos generados ("hoy se cumplen X jornadas sin perder de Y equipo")
- Modo "vista de transmisión" optimizado para celular o segunda pantalla

**Por qué importa:** convierte el Facebook Live en transmisión semi-profesional. El narrador se vuelve nuestro **evangelizador interno**: si lo enamoramos, defiende TalachaStats con el organizador.

### Capa 4 — Ecosistema (futuro, monetización)

_Estado: no construir hasta tener 20+ ligas activas._

- Comparativos entre ligas (ranking de Pichichis cruzando ligas, etc.)
- Vitrina de "jugadores libres" buscando liga
- Directorio de patrocinadores interesados en ligas locales
- Premium para organizador: ad-free, branding completo, exportes, analytics avanzados

---

## 7. Persona del organizador — qué SÍ y qué NO

### Sí construimos para él

- Generador de contenido visual semanal (Capa 2)
- Página pública de su liga con branding propio
- Apoyo al narrador (Capa 3)
- Métricas que le permitan presumir ("tu liga creció X% en jugadores este torneo")
- Excusas para presumir ("tu liga es la que más hat-tricks tiene en la zona")

### No construimos para él (al menos no hasta tener tracción)

- Calendario / fixtures / sorteos
- Cobro de inscripciones / pagos
- Arbitraje / asignación de árbitros
- Reservas de cancha
- Gestión de uniformes / inventario
- App nativa para captura de eventos en vivo

---

## 8. Roadmap recomendado (próximos 90 días)

| Sprint   | Objetivo                         | Entregable                                                                     |
| -------- | -------------------------------- | ------------------------------------------------------------------------------ |
| 1–2 sem  | Validar con organizadores reales | 5 entrevistas: "¿qué postearías esta semana sobre tu liga si tuvieras tiempo?" |
| 3–6 sem  | Capa 2 — generador de contenido  | Pipeline post-importación que produce 5–7 piezas listas para postear           |
| 7–8 sem  | Capa 3 — pantalla del narrador   | UI dedicada para el narrador, optimizada para uso en vivo                      |
| 9–12 sem | Pulido y caso de éxito           | Documentar 1–2 ligas piloto como caso de éxito vendible                        |

---

## 9. Métricas que importan

### Métricas de salud del viral loop (jugador)

- % de jugadores que comparten su perfil al menos 1 vez
- Visitas únicas a perfiles de jugador
- Tiempo en perfil

### Métricas de adopción del organizador

- # de ligas activas (con corte recibido en últimas 2 semanas)
- # de piezas de contenido generadas y descargadas/compartidas por liga
- Frecuencia con que el narrador entra a su pantalla pre-partido

### Métricas que NO obsesionan

- Total de usuarios registrados (vanidad)
- Tiempo total en la plataforma (no es el modelo)

---

## 10. Heurística de decisión rápida

Ante cualquier feature propuesta, preguntar en orden:

1. ¿Refuerza el ego del jugador o del organizador? (Si no, descartar.)
2. ¿Refuerza el viral loop? (Si lo rompe, descartar.)
3. ¿Es contenido/identidad/análisis, o es operación? (Si es operación, posponer.)
4. ¿Lo tiene resuelto WhatsApp+Excel hoy? (Si sí, no es prioridad.)
5. ¿Hay 10 ligas pidiéndolo? (Si no, no construir aún.)

Si pasa los cinco filtros, construir.

---

## 11. Módulo de sorteo y calendarización

> Actualizado 2026-05. Implementación completa en `src/features/scheduling/`.

### Posicionamiento

Feature **opt-in por liga** (`leagues.scheduling_enabled`). No bloquea el flujo base de Excel→stats. El organizador la activa cuando quiere reemplazar su sorteo manual de WhatsApp.

### Restricciones de negocio (S1–S7)

| ID  | Nombre              | Qué garantiza                                                                  |
| --- | ------------------- | ------------------------------------------------------------------------------ |
| S1  | Reproducibilidad    | Mismo seed → mismo sorteo. Seed guardado en `leagueSchedulingConfig.lastSeed`. |
| S2  | Equipos tardíos     | Equipos que entran después de J1 reciben jornadas de recuperación automáticas. |
| S3  | Descanso solicitado | Un equipo puede pedir descanso en una jornada específica.                      |
| S4  | Sin duplicados      | Ningún par se enfrenta más de una vez en fase regular.                         |
| S5  | BYE en N impar      | Si los equipos son impares, una jornada tiene un slot BYE.                     |
| S6  | Overrides manuales  | El admin puede mover hora, cancha o equipo después de confirmar el sorteo.     |
| S7  | Slots comprados     | Un equipo puede comprar un horario fijo. Hard constraint para el asignador.    |

### Arquitectura de dos capas (ambas puras, sin DB)

```
Capa 1 — Pairing Generator:  circle-method → apply-rests → validate-no-duplicates
Capa 2 — Slot Assigner:      build-slots → conflict-detector → assign-greedy
```

La persistencia ocurre una sola vez en `POST /schedule/confirm` dentro de una transacción atómica.

### Flujo de uso

1. Owner activa el módulo por liga (`scheduling-toggle`)
2. Admin configura venues, ventanas horarias y config del sorteo
3. Admin/equipos registran descansos y slots comprados
4. Admin hace preview (sin persistir) → confirma → overrides manuales si aplica
5. Equipos tardíos → `POST /makeup` genera jornadas de recuperación

### Lo que no hace el MVP

- ❌ Formato doble (vuelta) — rechazado con 400 si se intenta
- ❌ Playoffs — schema preparado, generador pendiente
- ❌ Notificaciones push al confirmar
- ❌ Exportación PDF/Excel del sorteo
- ❌ Solver LP para optimización multi-cancha
