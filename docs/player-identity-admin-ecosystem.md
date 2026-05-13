# TalachaStats — Breaking Change: Identidad Global de Jugadores + Ecosistema Admin

> **Estado:** Diseño cerrado · Listo para implementación.

---

## 1. Por qué este cambio

El problema real viene del fútbol amateur: doble registro de jugadores, jugadores que "no aparecen" cada semana, jugadores que no pueden jugar liguilla por errores de datos. El sistema actual no tiene un anchor de identidad — dos ligas pueden tener al mismo "José Vázquez" y "Pepe Vázquez" como registros distintos sin ningún mecanismo para detectarlo.

La solución es una **tabla de identidad global** anclada en el CURP. Una vez que alguien registra a un jugador con su CURP real, esa identidad es la fuente de verdad para toda la plataforma.

---

## 2. Estado actual del proyecto

### Tablas existentes (se mantienen o migran)

| Tabla                  | Estado                                          | Notas                                       |
| ---------------------- | ----------------------------------------------- | ------------------------------------------- |
| `organizations`        | Existe, estable                                 | Entidad organizadora (Novofut, Casablanca…) |
| `players`              | **BREAKING** — se convierte en `global_players` | Agregar `curp_hash`, renombrar              |
| `player_registrations` | **BREAKING** — se convierte en `league_members` | Agregar campos de institución               |
| `leagues`              | Existe, estable                                 | Sin cambios de schema en v1                 |
| `teams`                | Existe, estable                                 | Sin cambios de schema en v1                 |
| `match_events`         | Existe, estable                                 | FK actualiza a `global_players`             |
| `player_season_stats`  | Existe, estable                                 | FK actualiza a `global_players`             |

### Features existentes (no se tocan en este cambio)

- Import Excel → `player_season_stats`
- Narrator Analysis (pre-partido Facebook Live)
- Standings (tabla de posiciones)
- Top Scorers (estadísticas individuales)

---

## 3. El breaking change

### De `players` a `global_players`

La tabla `global_players` es identidad pura. **Nadie la modifica después del primer registro** salvo un superadmin con justificación explícita.

```ts
// entities/player/model.ts
export const GlobalPlayerSchema = z.object({
	id: z.string().uuid(),
	curp_hash: z.string().length(64), // sha256(CURP) — generado en servidor
	full_name: z.string().min(2).max(100),
	birth_date: z.string().date(),
	avatar_url: z.string().url().optional(),
});
```

**Regla de negocio crítica:**

- `curp_hash` es `NOT NULL UNIQUE`. Sin excepciones.
- Jugadores migrados del sistema anterior reciben `sha256("PENDING_" + uuid())` como dummy.
- Una vez asignado un hash real, no puede volver a dummy.

### De `player_registrations` a `league_members`

`league_members` es la capa de la institución. Cada liga tiene su vista privada del jugador.

```ts
// entities/player/model.ts
export const LeagueMemberSchema = z.object({
	id: z.string().uuid(),
	global_player_id: z.string().uuid(), // FK → global_players
	league_id: z.string().uuid(), // FK → leagues
	status: z.enum(["active", "suspended", "inactive"]),
	dorsal: z.number().int().min(1).max(99).optional(),
	inscription_date: z.string().date(),
	institution_photo_url: z.string().url().optional(),
	internal_notes: z.string().max(500).optional(),
	// UNIQUE: global_player_id + league_id
});
```

**Data siloing:** Una liga no puede leer `internal_notes` ni `institution_photo_url` de otra liga. Esto se hace a nivel de queries, no de schema.

### Nueva tabla `inscriptions`

Conecta un `league_member` con un equipo específico dentro de la liga.

Como **liga = torneo** (P2 resuelta), no se necesita `tournament_id`. El scope de unicidad ya está dado por `league_member_id`, que a su vez está scoped a `league_id`. Un jugador solo puede estar en un equipo por liga.

```ts
export const InscriptionSchema = z.object({
	id: z.string().uuid(),
	league_member_id: z.string().uuid(), // FK → league_members (ya scoped a league_id)
	team_id: z.string().uuid(), // FK → teams
	// UNIQUE: league_member_id
	// (un jugador solo puede estar en un equipo por liga — liga = torneo)
});
```

---

## 4. Nuevo ecosistema administrativo

### v1 — Lo que se construye ahora

#### Terminal de Registro de Alta Velocidad

El flujo completo del oficinista al registrar un jugador:

```
1. Ingresa CURP (18 chars desde credencial INE o CURP de menor)
   └─ Validación regex en tiempo real
   └─ Al completar 18 chars → búsqueda automática en global_players

2a. CURP encontrado (camino rápido)
    └─ Muestra: nombre + foto global
    └─ Oficinista confirma identidad contra documento físico
    └─ Un clic: "Es este jugador"

2b. CURP no encontrado (camino crítico — sin margen de error)
    └─ Formulario: nombre completo + fecha de nacimiento + foto (opcional v1)
    └─ Datos van a global_players como fuente de verdad permanente
    └─ Hard stop: no avanza sin CURP real

3. Selecciona liga y equipo
   └─ Dropdown de ligas de la institución
   └─ Dropdown de equipos dentro de la liga
   └─ Validación: ¿ya está inscrito en esta liga?

4. Confirmar
   └─ Transacción atómica: global_player + league_member + inscription
   └─ Jugador aparece en la jornada inmediatamente
```

**Reglas de negocio del registro:**

- Adultos: deben traer INE. Sin INE, no hay registro.
- Menores de edad: padre/tutor trae la CURP del menor (acta o tarjeta CURP).
- Sin CURP real = sin registro. No hay excepciones en este flujo.
- La foto es opcional en v1 pero el campo existe desde el inicio.

#### Gestión de Ligas

- Crear liga con nombre y configuración básica
- Listar ligas activas de la institución

#### Gestión de Equipos

- Crear equipos asociados a una liga
- Listar jugadores inscritos por equipo

### v2 — En el backlog

- **Rol de partidos**: Crear fixture de la jornada, asignar equipos por partido
- **Registro de resultados**: Goles, tarjetas, resultado final
- **Liguilla**: Cálculo de elegibilidad (mínimo de partidos), generación de bracket
- **Standings automáticos**: Calcular tabla desde `match_events` sin necesidad de Excel

---

## 5. Arquitectura FSD

```
src/
├── entities/
│   ├── player/
│   │   ├── model.ts          # GlobalPlayerSchema, LeagueMemberSchema, InscriptionSchema
│   │   ├── queries.ts        # findByHash, upsertGlobal, createMember, createInscription
│   │   └── index.ts
│   ├── league/               # Sin cambios en v1
│   └── team/                 # Sin cambios en v1
│
├── features/
│   └── admin-registration/
│       ├── lookup.ts         # Buscar jugador por curp_hash
│       ├── register.ts       # Crear global_player + league_member + inscription (tx)
│       ├── hash.ts           # sha256(CURP) — solo se ejecuta en servidor
│       └── index.ts
│
└── app/
    ├── api/
    │   └── players/
    │       ├── lookup/route.ts     # GET ?curp_hash=...
    │       └── register/route.ts  # POST
    └── (admin)/
        └── registro/
            └── page.tsx           # RegistrationForm (Client Component)
```

---

## 6. Estrategia de migración

**Enfoque: clean break, no evolutivo.**

Crear tablas nuevas (`global_players`, `league_members`, `inscriptions`) en paralelo a las existentes. Migrar datos con script:

```
1. Por cada registro en players:
   └─ Insertar en global_players con curp_hash = sha256("PENDING_" + id)
   └─ Marcar como dummy para onboarding futuro

2. Por cada registro en player_registrations:
   └─ Insertar en league_members con los campos equivalentes

3. Actualizar FKs en match_events y player_season_stats

4. Deprecar players y player_registrations (mantener en DB hasta validar migración)
```

Este enfoque permite rollback si algo falla. No eliminar las tablas viejas hasta confirmar que todo el sistema usa las nuevas.

---

## 7. Decisiones de diseño (cerradas)

| #   | Pregunta                          | Decisión                                                                                                              |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P1  | ¿Existe institución como entidad? | Sí. Ya existe como `organizations`. El scope admin = organización. Multi-liga por organización es v2.                 |
| P2  | ¿Qué es un torneo?                | Liga = torneo. No se necesita tabla `tournaments` ni `tournament_id` en `inscriptions`. UNIQUE en `league_member_id`. |
| P3  | Migración de jugadores sin CURP   | Dummy CURP automático (`sha256("PENDING_" + id)`). Se regulariza conforme los jugadores regresan a la ventanilla.     |
