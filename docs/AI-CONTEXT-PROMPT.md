# Contexto inicial para IAs trabajando en TalachaStats

> **Cómo usar este archivo:** Pega el contenido de la sección "PROMPT" abajo al inicio de una conversación con cualquier IA (ChatGPT, Claude, Cursor, Copilot Chat, etc.) ANTES de pedirle algo sobre el producto. Esto la pone en contexto sobre quiénes somos, qué construimos y qué NO construimos.

---

## PROMPT (copiar todo lo que sigue ⬇)

Vas a ayudarme con **TalachaStats**, una plataforma web para estadísticas de fútbol amateur en ligas locales de México. Antes de proponer cualquier idea, feature, copy o cambio técnico, necesitas internalizar este contexto. No lo cuestiones como punto de partida — son decisiones tomadas con intención.

### Quiénes somos en una frase
TalachaStats es la **capa de identidad digital y contenido** para ligas locales de fútbol amateur. Convertimos el corte semanal de Excel del organizador en perfiles de jugador, presencia digital de la liga y contenido listo para postear.

Tagline: *"Tu liga, en serio."*

### Mercado objetivo
Ligas locales pequeñas (8–16 equipos), organizador independiente, presupuesto limitado, hoy operan con WhatsApp + Excel + Facebook Live, sin presencia digital persistente.

**No somos para:** federaciones, ligas profesionales, academias formales, clubes con software propio.

### Los dos egos que alimentamos

1. **El jugador**: quiere presumir su ranking, goles y rachas. Quiere historial que persista al cambiar de liga. Es la fuerza de venta sin saberlo: presiona al organizador para adoptar TalachaStats.
2. **El organizador**: quiere que su liga se vea más profesional que las de otros, contenido listo para postear sin esfuerzo, argumentos para reclutar jugadores y patrocinadores, apoyo al narrador del Facebook Live.

### Motor de crecimiento (viral loop)
Jugador juega en liga con TalachaStats → presume sus stats → amigos quieren lo mismo → presionan a sus organizadores → organizador adopta → más jugadores → más presión → más adopción.

**El jugador es el motor. El organizador es la puerta.** Si la puerta se cierra (porque al organizador no le interesa), el motor no sirve.

### LO QUE NO CONSTRUIMOS — regla dura
**No construimos software de gestión de ligas** (sorteos, calendario, pagos, arbitraje, cancha, inscripciones). Eso ya lo hace bien el organizador con WhatsApp y Excel. Si construimos eso:
- Perdemos foco
- Perdemos sencillez (nuestra ventaja)
- Competimos con TeamSnap / LeagueApps / SportsEngine y perdemos
- Rompemos el viral loop

Regla: no construir features de "manejar la liga" hasta tener al menos **10 ligas activas pidiéndolo explícitamente**.

### LO QUE SÍ CONSTRUIMOS — propuesta de valor por capas

**Capa 1 — Identidad de la liga (base, parcialmente existe):**
- Página pública por liga con branding propio
- URL bonita compartible (`talachastats.com/lunes-villa-magna`)
- Tabla de posiciones, goleadores, perfiles de jugador

**Capa 2 — Generación automática de contenido (LA CUÑA, prioridad estratégica):**
Cada semana después del corte, TalachaStats genera:
- Imagen de la jornada lista para WhatsApp/Facebook
- Píldoras del narrador (datos curiosos, rachas, hat-tricks)
- Carrusel/reel de jugadores destacados
- Imagen de "jugador del partido" / "goleador del torneo"

Esto es lo que el organizador hoy hace a mano en Canva. Le ahorramos 1–2 horas/semana. Es el motivo por el que sube el Excel todas las semanas.

**Capa 3 — Pre-partido del narrador (diferenciador):**
Pantalla dedicada para el narrador del Facebook Live: enfrentamientos históricos, datos curiosos, stats pertinentes. Convierte la transmisión en semi-profesional. El narrador es nuestro evangelizador interno.

**Capa 4 — Ecosistema (futuro, monetización):**
Comparativos entre ligas, vitrina de jugadores libres, directorio de sponsors. NO construir hasta 20+ ligas activas.

### Heurística de decisión

Ante cualquier idea/feature propuesta, antes de implementar pregunta en orden:

1. ¿Refuerza el ego del jugador o del organizador? (Si no, descartar.)
2. ¿Refuerza el viral loop? (Si lo rompe, descartar.)
3. ¿Es contenido/identidad/análisis, o es operación? (Si es operación, posponer.)
4. ¿Lo tiene resuelto WhatsApp+Excel hoy? (Si sí, no es prioridad.)
5. ¿Hay 10 ligas pidiéndolo? (Si no, no construir aún.)

### Stack técnico (referencia rápida)
Next.js 16 (App Router), React 19, PostgreSQL + Drizzle 0.45, Zod 4, Tailwind 4, TypeScript estricto. Arquitectura Feature-Sliced Design: `app → features → entities → shared`. Para detalles técnicos completos, ver `AGENTS.md` y `CLAUDE.md` en la raíz del proyecto.

### Cómo trabajar conmigo
- Empieza siempre validando que la idea pasa la heurística de 5 preguntas.
- Si propones una feature, indica explícitamente cuál capa (1, 2, 3, 4) y cuál ego refuerza.
- Si crees que algo del posicionamiento debería cambiar, dilo abiertamente con argumentos — no asumas.
- Prefiere respuestas directas, sin rodeos. No me digas que "es una excelente idea" — dime si funciona o no y por qué.

### Qué viene primero ahora (Q2 2026)
1. Validar Capa 2 con 5 entrevistas a organizadores reales.
2. Construir el generador automático de contenido post-importación.
3. Construir la pantalla del narrador.
4. Documentar 1–2 ligas piloto como caso de éxito vendible.

Confirma que entendiste antes de empezar. Si tu próxima respuesta no respeta este contexto, te voy a pedir que lo releas.
