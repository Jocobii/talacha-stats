---
titulo: Inventario de flujos UI del organizador
tipo: indice
audiencia: organizador
estado: borrador
version-app: as-is 2026-07
---

# Inventario de flujos UI del organizador

Backlog de documentación. Lista los flujos **que hoy existen** en el panel
`/admin` (rutas reales del app router). Cada renglón se convierte en al menos un
archivo de `referencia/` y, cuando aplique, un `how-to/`.

Prioridad sugerida: **P1** = flujo central del día a día del organizador;
**P2** = configuración/soporte; **P3** = avanzado u ocasional.

## Acceso y cuenta

| Flujo              | Ruta UI         | Prioridad | Estado doc |
| ------------------ | --------------- | --------- | ---------- |
| Iniciar sesión     | `/login`        | P2        | ⬜         |
| Registro de cuenta | `/register`     | P2        | ⬜         |
| Verificar email    | `/verify-email` | P3        | ⬜         |
| Onboarding inicial | `/onboarding`   | P1        | ⬜         |

## Organización

| Flujo                     | Ruta UI                                          | Prioridad | Estado doc |
| ------------------------- | ------------------------------------------------ | --------- | ---------- |
| Listado de organizaciones | `/admin/organizations`                           | P2        | ⬜         |
| Crear organización        | `/admin/organizations/new`                       | P2        | ⬜         |
| Detalle de organización   | `/admin/organizations/[id]`                      | P2        | ⬜         |
| Solicitar verificación    | `/admin/organizations/[id]/request-verification` | P3        | ⬜         |
| Tema de la organización   | `/admin/organizacion/tema`                       | P3        | ⬜         |
| Temas por torneo (owner)  | `/admin/temas`                                   | P3        | ⬜         |

## Liga (núcleo de gestión)

| Flujo                       | Ruta UI                             | Prioridad | Estado doc |
| --------------------------- | ----------------------------------- | --------- | ---------- |
| Listado de ligas            | `/admin/leagues`                    | P1        | ⬜         |
| Crear liga                  | `/admin/leagues/new`                | P1        | ⬜         |
| Dashboard de liga           | `/admin/leagues/[id]`               | P1        | ⬜         |
| Setup inicial de liga       | `/admin/leagues/[id]/setup`         | P1        | ⬜         |
| Configuración de liga       | `/admin/leagues/[id]/configuracion` | P1        | ⬜         |
| Reglamento                  | `/admin/leagues/[id]/reglamento`    | P2        | ⬜         |
| Tabla de posiciones (admin) | `/admin/leagues/[id]/posiciones`    | P1        | ⬜         |
| Canchas de la liga          | `/admin/leagues/[id]/canchas`       | P2        | ⬜         |
| Calendario                  | `/admin/leagues/[id]/calendario`    | P1        | ⬜         |

## Sorteo y calendario

| Flujo               | Ruta UI                                 | Prioridad | Estado doc |
| ------------------- | --------------------------------------- | --------- | ---------- |
| Sorteo (cockpit)    | `/admin/leagues/[id]/sorteo`            | P1        | ⬜         |
| Sorteo — calendario | `/admin/leagues/[id]/sorteo/calendario` | P1        | ⬜         |
| Sorteo — canchas    | `/admin/leagues/[id]/sorteo/canchas`    | P2        | ⬜         |

## Jornadas, partidos y captura

| Flujo                       | Ruta UI                                                            | Prioridad | Estado doc |
| --------------------------- | ------------------------------------------------------------------ | --------- | ---------- |
| Captura (lista de jornadas) | `/admin/leagues/[id]/captura`                                      | P1        | ✅ ejemplo |
| Detalle de jornada          | `/admin/ligas/[leagueId]/jornadas/[matchdayId]`                    | P1        | ⬜         |
| Cédula de partido           | `/admin/ligas/[leagueId]/jornadas/[matchdayId]/partidos/[matchId]` | P1        | ⬜         |
| Resolución de partido       | `/admin/matches/[id]`                                              | P1        | ⬜         |
| Preview de partido          | `/admin/matches/[id]/preview`                                      | P2        | ⬜         |

## Equipos y jugadores

| Flujo                | Ruta UI               | Prioridad | Estado doc |
| -------------------- | --------------------- | --------- | ---------- |
| Listado de equipos   | `/admin/teams`        | P1        | ⬜         |
| Detalle de equipo    | `/admin/teams/[id]`   | P1        | ⬜         |
| Listado de jugadores | `/admin/players`      | P1        | ⬜         |
| Detalle de jugador   | `/admin/players/[id]` | P1        | ⬜         |
| Registro (admin)     | `/admin/registro`     | P1        | ⬜         |

## Canchas / venues

| Flujo                 | Ruta UI                  | Prioridad | Estado doc |
| --------------------- | ------------------------ | --------- | ---------- |
| Canchas (global)      | `/admin/canchas`         | P2        | ⬜         |
| Calendario de canchas | `/admin/venues/calendar` | P2        | ⬜         |

## Narrador y análisis

| Flujo                | Ruta UI           | Prioridad | Estado doc |
| -------------------- | ----------------- | --------- | ---------- |
| Panel del narrador   | `/admin/narrator` | P2        | ⬜         |
| Análisis pre-partido | `/admin/analisis` | P2        | ⬜         |

## Administración de la plataforma

| Flujo              | Ruta UI                | Prioridad | Estado doc |
| ------------------ | ---------------------- | --------- | ---------- |
| Panel admin (home) | `/admin`               | P2        | ⬜         |
| Usuarios           | `/admin/users`         | P3        | ⬜         |
| Verificaciones     | `/admin/verifications` | P3        | ⬜         |

---

**Nota:** este inventario cubre solo rutas `/admin` (organizador). Las rutas
públicas (`/`, `/ranking`, `/player/[id]`, `/org/[slug]`…) quedan fuera del
alcance acordado (organizadores de liga). Marca ✅ en "Estado doc" al completar
cada archivo.
