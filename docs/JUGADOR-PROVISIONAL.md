# Jugador provisional — la ventana de prueba de las jornadas 1–3

> **Estado:** propuesta de diseño. No implementado.
> **Relación con AGENTS.md:** extiende §14 (identidad global) y §13 (contexto de dominio).
> No lo contradice: el hard stop del CURP sigue vivo, pero deja de aplicarse en el
> punto equivocado del flujo.

---

## 1. El problema real

Las ligas amateur no arrancan con el padrón cerrado. Las primeras 1–3 jornadas son
**periodo de prueba**: el equipo trae gente a ver si se acopla, nadie pide INE, el
árbitro anota nombre y número en la hoja. El padrón real se cierra hasta la jornada
3 o 4, cuando ya se sabe quién se queda.

Hoy TalachaStats modela el mundo ideal: para alinear a alguien hay que registrarlo
con CURP. Las salidas que le quedan al organizador son dos, y las dos son malas:

- **Papel el domingo, captura el jueves.** Todas las hojas de todas las ligas, a mano,
  días después. Martirio, y mata el evento clave del producto (§13: el cierre de
  jornada dispara el contenido). Contenido que llega el jueves no es contenido.
- **Registrar con CURP a alguien que quizá no vuelve.** Fricción en la mesa de
  registro por jugadores que se van en la jornada 2.

El sistema tiene que soportar el mundo real sin que el mundo real se coma la
identidad global.

---

## 2. Por qué el `ad-hoc` de hoy no resuelve esto

`features/match-resolution/add-ad-hoc-player.ts` ya deja meter un jugador en la
cédula sin registro previo. Pero lo hace así:

```ts
curpHash: `adhoc-${crypto.randomUUID()}`,
birthDate: "1900-01-01",
```

Eso crea un **`global_player` permanente e irreconciliable**:

- Cada `adhoc-<uuid>` es único, así que `UNIQUE(curp_hash)` no protege de nada. El
  mismo señor capturado tres domingos son tres identidades globales.
- No hay ruta de regularización: cuando el jugador sí llega con INE en la jornada 4,
  se le crea un **cuarto** `global_player`, ahora con CURP real. No existe merge.
- La basura queda en la tabla que es el diferenciador del producto (§1.5). El
  ranking de ciudad se construye sobre `global_players`; si está inflada con
  fantasmas, el argumento entero se cae.

En corto: el escape hatch existe, pero **descarga el costo en la capa equivocada**.
La corrección no es agregar una feature, es mover ese costo a una zona de cuarentena.

---

## 3. Modelo de datos: cuarentena + rama nullable

### 3.1 La decisión

**Los jugadores provisionales NO entran a `global_players`.** Viven en una tabla
nueva, `provisional_players`, scoped a la liga. `league_members` gana una rama: o
apunta a un `global_player` (verificado) o a un `provisional_player`.

```
                      ┌── global_player_id      → global_players     (verificado)
league_members ───────┤
                      └── provisional_player_id → provisional_players (en prueba)
       ↓ (1:1)
  inscriptions
       ↓
 match_player_stats
```

**Lo que esto compra:** la cadena `league_members → inscriptions → match_player_stats`
**no se toca**. Cero FK polimórfica en stats, cero cambios en la cédula, en el goleo,
en la tabla. Toda la ramificación queda contenida en un solo join, el de identidad.

### 3.2 Schema

```ts
// Identidad provisional — vive y muere dentro de una liga.
// Nunca se lee cross-liga. Nunca alimenta ranking de ciudad.
export const provisionalPlayers = pgTable(
	"provisional_players",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		leagueId: uuid("league_id")
			.notNull()
			.references(() => leagues.id, { onDelete: "cascade" }),
		fullName: text("full_name").notNull(), // lo que dijo el árbitro; puede venir incompleto
		fullNameCanonical: text("full_name_canonical").notNull(),
		shirtNumber: integer("shirt_number"), // señal de identidad más fuerte que el nombre (§5.2)
		// Jornada en la que apareció por primera vez — base para la ventana de prueba.
		firstSeenMatchday: integer("first_seen_matchday").notNull(),
		// Se puebla al regularizar. Deja rastro de a qué identidad real se resolvió.
		resolvedGlobalPlayerId: uuid("resolved_global_player_id").references(() => globalPlayers.id, {
			onDelete: "set null",
		}),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),
		// Fusión intra-liga: este provisional resultó ser el mismo que otro (§5.3).
		mergedIntoId: uuid("merged_into_id").references((): AnyPgColumn => provisionalPlayers.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index("provisional_players_league_idx").on(t.leagueId),
		index("provisional_players_name_canonical_idx").on(t.leagueId, t.fullNameCanonical),
	],
);
```

Cambios en tablas existentes:

```ts
// league_members
globalPlayerId: uuid("global_player_id").references(() => globalPlayers.id, { onDelete: "cascade" }),
//                                                    ^ deja de ser .notNull()
provisionalPlayerId: uuid("provisional_player_id").references(() => provisionalPlayers.id, {
  onDelete: "cascade",
}),
// + CHECK: exactamente una de las dos ramas está poblada
check(
  "chk_league_member_identity",
  sql`(global_player_id IS NOT NULL) <> (provisional_player_id IS NOT NULL)`,
),
```

`UNIQUE(global_player_id, league_id)` sigue funcionando: Postgres trata los NULL como
distintos, así que N provisionales por liga conviven sin pelear con el constraint.

```ts
// league_config — la ventana es del organizador, no nuestra
trialMatchdays: integer("trial_matchdays").notNull().default(3), // 0 = sin ventana de prueba
```

---

## 4. Los tres momentos

### 4.1 Captura — el domingo en la cancha

El árbitro está en la cédula, alguien no está en la lista. Flujo actual de ad-hoc,
pero ramificado por la ventana:

```
Jugador fuera del roster
  ├─ jornada ≤ trialMatchdays  → buscador anti-duplicado (§5) → provisional_player
  │                               (nombre + número, 2 campos, sin fricción)
  └─ jornada >  trialMatchdays  → mismo flujo, pero el jugador queda marcado
                                  "fuera de ventana" y el organizador confirma (§4.2)
```

Nunca se bloquea la alineación. **El árbitro no puede pelear con la app en la cancha
un domingo** — si la app estorba, vuelve el papel y perdimos.

### 4.2 Convivencia — bloqueo blando

Al pasar `trialMatchdays`, el provisional no desaparece ni se bloquea: **se pone en
rojo**. Concretamente:

- En la cédula aparece con badge `PROVISIONAL — vence J3` y, ya vencido, en rojo con
  confirmación explícita del organizador para alinearlo.
- El panel de equipo muestra un contador de **deuda de regularización**:
  "4 jugadores sin credencial". Es la métrica que el organizador ve y quiere en cero.
- El org-hub / cierre de jornada genera la píldora accionable:
  _"Deportivo trae 4 jugadores sin regularizar — vencen esta jornada."_

### 4.3 Regularización — donde el problema se resuelve solo

El jugador llega a ventanilla con INE. Terminal de alta velocidad (§14), CURP →
hash → busca en `global_players`. Se agrega un paso:

```
CURP hasheado
  ├─ existe global_player  → reusar identidad
  └─ no existe             → crear global_player
                ↓
  buscar provisionales sin resolver en esta liga con nombre parecido / mismo número
                ↓
  proponer: "¿Es el 'Juan' del #7 que jugó J1 y J2?"  [Sí, es él] [No, es alguien más]
                ↓
  al confirmar (transacción atómica):
    - league_member.global_player_id      = <real>
    - league_member.provisional_player_id = NULL
    - provisional_player.resolvedGlobalPlayerId / resolvedAt = <real> / now()
```

**Las stats no se mueven.** Cuelgan de `inscriptions`, que cuelga del mismo
`league_member`. Al cambiar la rama de identidad, los goles de las jornadas 1 y 2
aparecen automáticamente en el perfil global del jugador. Esa es la recompensa
visible y es exactamente el gancho: _"regularízate y tus 3 goles se vuelven tuyos"_.

---

## 5. Anti-duplicado — el núcleo del asunto

El riesgo que importa: "Juan" (J1), "Juan Pérez" (J2), "Juan P. López" (J3) son tres
filas para un solo señor. **No se puede prevenir con un constraint** — hasta que
alguien decida, esos tres nombres son legítimamente distintos. Así que la postura es:
contener, sugerir, fusionar.

### 5.1 Contener

Los duplicados ocurren dentro de `provisional_players`, scoped a una liga. Ahí no
dañan: no entran al ranking de ciudad, no rompen `UNIQUE(curp_hash)`, no ensucian
identidad de plataforma. Un duplicado provisional es un tema de limpieza de una liga,
no un defecto permanente del producto.

### 5.2 Sugerir en el momento de la captura

El buscador que se abre al agregar un provisional ordena candidatos por señal, de más
fuerte a más débil:

1. **Mismo dorsal en el mismo equipo.** En fútbol amateur el número es más estable
   que el nombre; el mismo tipo trae la misma playera todos los domingos. Es la señal
   de mayor peso, por encima del nombre.
2. **Similitud de nombre** con `pg_trgm` (`similarity()` sobre `full_name_canonical`,
   ya usado en el proyecto, §5 AGENTS.md), con umbral bajo para que "Juan" traiga
   "Juan Pérez".
3. **Prefijo del nombre.** "Juan" es prefijo de "Juan Pérez López" → candidato fuerte
   aunque `similarity()` lo castigue por diferencia de longitud.

La UI **sugiere, no bloquea**: _"¿Es el mismo Juan del #7 que jugó la J1?"_ con
`[Sí, es él] [No, es otro]`. Si el árbitro se equivoca, se arregla después (§5.3);
si bloqueamos, el árbitro inventa "Juan 2" y perdimos el dato para siempre.

> Esto reemplaza el `DUPLICATE_PLAYER` que hoy lanza `addAdHocPlayer`: hoy tira error
> duro por match exacto de canónico. Un error duro en la cancha es exactamente lo que
> no queremos.

### 5.3 Fusionar después

Herramienta de organizador — **"Limpiar provisionales"**, por liga:

- Agrupa candidatos por dorsal + similitud, muestra las stats de cada uno
  ("Juan, #7, 2 goles, J1–J2" / "Juan Pérez, #7, 1 gol, J3").
- Fusionar = mover las `inscriptions` del provisional absorbido al `league_member`
  ganador, marcar `mergedIntoId`, dejar el perdedor en la tabla como rastro
  (auditable, reversible).
- Es la misma operación que ya hace `POST /api/teams/merge` para equipos. Mismo
  patrón, distinto recurso: `POST /api/provisional-players/merge`.

### 5.4 Presión en el punto correcto

La regularización se pide **cuando el jugador tiene el documento en la mano**, no
cuando está a punto de entrar a la cancha. Es el único momento en que pedir CURP no
cuesta nada. Todo el diseño empuja hacia ahí.

---

## 6. Impacto en reglas existentes

| Regla                                                    | Qué cambia                                                                                                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §14 "Sin CURP real = sin registro"                       | Sigue vigente **para `global_players`**. La ventana de prueba no crea identidad global, así que no la viola — la reubica. Actualizar §14 con esta excepción explícita. |
| §14 dummy `PENDING_*`                                    | Queda obsoleto para casos nuevos. Los migrados del sistema viejo se quedan como están; los nuevos van por `provisional_players`.                                       |
| `addAdHocPlayer` (`curpHash: adhoc-*`)                   | Se reescribe para crear `provisional_player`. **Los `adhoc-*` existentes necesitan una data migration** que los mueva a la cuarentena (§7).                            |
| Ranking cross-liga, `/player/[id]`, contenido presumible | `INNER JOIN global_players` los excluye por construcción. Verificar que ninguna query de perfil use `LEFT JOIN`, porque ahí sí se colarían.                            |
| Goleo, tabla y cédula de la liga                         | Sí los incluyen: el partido pasó, el gol existe. Las queries de liga pasan a resolver el nombre vía `COALESCE` de las dos ramas en el mapper (§19).                    |
| Credencial (`credentialCode`)                            | Un provisional **no** consume código de credencial — hoy `addAdHocPlayer` sí lo hace. Se le asigna al regularizar. Revisar `docs/CREDENCIAL-CODIGO-JUGADOR.md §6`.     |
| §19 mapper DTO → ViewModel                               | `mapLeagueMemberToPlayerView` resuelve la rama y expone `identityStatus: "verified" \| "provisional"` + `displayName`. La UI nunca ve la rama cruda.                   |

---

## 7. Migraciones (append-only, §15)

Todas en migraciones **nuevas**, nunca editando las existentes:

1. `CREATE TABLE provisional_players` + índices.
2. `ALTER league_members`: `global_player_id` DROP NOT NULL, `+ provisional_player_id`,
   `+ CHECK chk_league_member_identity`.
3. `ALTER league_config`: `+ trial_matchdays DEFAULT 3`.
4. **Data migration** de los `global_players` con `curp_hash LIKE 'adhoc-%'`:
   crear su `provisional_player` equivalente, repuntar el `league_member`, y dejar el
   `global_player` huérfano marcado para revisión. **No borrarlo en la misma migración**
   — forward-only y no destructivo (§15).
5. `CREATE EXTENSION IF NOT EXISTS pg_trgm` + índice GIN sobre `full_name_canonical`
   si aún no existe.

---

## 8. Fases

**Fase 1 — cimiento (sin UI nueva).** Schema, `provisional_players`, rama en
`league_members`, reescribir `addAdHocPlayer`, data migration de los `adhoc-*`.
Al terminar, el sistema deja de contaminar `global_players` aunque la UX siga igual.

**Fase 2 — captura decente.** Buscador anti-duplicado con dorsal + `pg_trgm` en el
modal de la cédula. Badge `PROVISIONAL` + bloqueo blando. `trialMatchdays` en la
config de liga.

**Fase 3 — regularización.** Paso de reconciliación en la terminal de alta velocidad
(§4.3) y contador de deuda por equipo.

**Fase 4 — limpieza y contenido.** Herramienta de fusión (§5.3) y píldoras de deuda
en el cierre de jornada.

Fase 1 es la que urge: cada domingo que pasa sin ella son más `adhoc-*` permanentes
que después hay que reconciliar a mano.

---

## 9. Lo que NO se debe hacer

- **No reintroducir un `curp_hash` sintético** en `global_players` bajo ningún nombre
  nuevo. Ese es el error que este documento corrige.
- **No bloquear la alineación en la cancha.** Ninguna regla de identidad puede
  impedir que un jugador entre a la cédula un domingo. Todo bloqueo es blando.
- **No dejar que un provisional aparezca en ranking cross-liga, perfil público o
  contenido presumible.** Es la línea que sostiene el diferenciador del producto.
- **No prevenir duplicados con constraints** sobre nombres provisionales. Los
  duplicados se contienen y se fusionan, no se prohíben.
- **No pedir CURP en la cancha.** Se pide en ventanilla, con el documento en la mano.
