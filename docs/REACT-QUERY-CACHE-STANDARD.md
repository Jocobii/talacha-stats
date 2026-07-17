# Estándar de caché — TanStack Query (keys, invalidación y cancelación)

> **Estatus: contrato.** Es el estándar único para gestionar estado-de-servidor en
> el frontend. Complementa `AGENTS.md §7.3/§7.3b` (contrato corto) y
> `docs/FRONTEND-DATA-STRATEGY.md` (las 5 capas). Si algo aquí choca con el código
> viejo, el código viejo se migra — no al revés.
>
> Alcance: **cómo se nombran, invalidan, cancelan y expiran las query keys.** No
> re-explica las 5 capas ni el mapper (eso ya está en los otros dos docs).

---

## 0. TL;DR (la regla de oro en 6 puntos)

1. **Una sola fábrica de keys:** `@/shared/api/query-keys.ts`. Nadie arma un array
   de key a mano, nunca. Ni en `useQuery`, ni en `invalidateQueries`, ni en tests.
2. **Keys jerárquicas por dominio** (`domain → list/detail → variante`). Invalidar
   el prefijo del dominio limpia todas sus variantes; invalidar la key completa
   limpia una sola entrada.
3. **La caché es el default.** Leer sirve cache (bien). El problema nunca es
   cachear: es **no invalidar** cuando una mutación cambió el servidor.
4. **Toda mutación declara qué invalida** a través del **registro central de
   invalidación** (`@/shared/api/cache-invalidation.ts`), no con
   `invalidateQueries` sueltos y copiados a mano.
5. **`cancelQueries` no es "limpiar caché":** es abortar peticiones en vuelo, y
   sólo se usa (a) antes de un optimistic update y (b) al desmontar un flujo en
   vivo. Para "traer lo nuevo porque cambió/se borró" se usa **invalidate** o
   **remove**, no cancel.
6. **`staleTime` por volatilidad del dato** (estático / dominio / en vivo). El dato
   en vivo va con `staleTime: 0` + invalidación explícita.

---

## 1. Diagnóstico — por qué existe este estándar

El proyecto ya tiene lo básico bien montado: una fábrica central
(`shared/api/query-keys.ts`), `QueryProvider` con defaults sanos, y hooks de
mutación que invalidan en `onSuccess` (p. ej. `useRosterMutations`). Pero hay tres
huecos que provocan bugs de caché reales:

### 1.1 La convención de invalidación vive en un comentario, no en código

`query-keys.ts` documenta el mapa de invalidación en un bloque de comentario
("emitir/renovar pase → credentialStatus"), pero **nada obliga a cumplirlo**. Caso
real: existe `queryKeys.credentialStatus(...)` y el hook de lectura
`useCredentialStatus`, con la convención escrita… pero **ninguna mutación llama a
`invalidateQueries` sobre esa key**. Resultado: al emitir/renovar un pase, la
tarjeta seguía mostrando **"Vencida"** — era la lectura cacheada (`staleTime 30s`),
no el estado real. El comentario no se ejecuta; el registro central sí (§4).

### 1.2 Keys planas → no se puede invalidar "todo lo de X"

Hoy las keys son arrays planos con **strings de dominio distintos** para cosas
relacionadas:

```ts
teamRoster: (teamId) => ["team-roster", teamId];
leagueTeams: (leagueId) => ["league-teams", leagueId];
team: (teamId) => ["team", teamId];
```

`"team-roster"`, `"league-teams"` y `"team"` son prefijos **desconectados**. No
existe forma de decir "invalida todo lo relacionado con equipos" con un solo
`invalidateQueries` por prefijo. Cada mutación tiene que enumerar a mano cada key
relacionada, y en cuanto alguien olvida una, aparece un bug de dato viejo. La
jerarquía (§3) arregla esto de raíz.

### 1.3 Filtros dentro de la key mal scopeados → duplicados y mezclas

El "mismo equipo dos veces en equipos actuales" (uno de liga terminada, uno de la
nueva) **no es caché**: son dos filas distintas en DB (mismo club, distinta
`league_id`/temporada) que la query trae juntas. El arreglo es de **scoping de
key + WHERE en backend** (§6.3), no de invalidación.

---

## 2. Los cinco verbos de la caché — cuándo usar cada uno

La confusión de fondo ("¿por qué a veces hay que cancelar el cache?") se disuelve
cuando quedan claros los cinco verbos. **No son intercambiables.**

| Verbo               | Qué hace                                                  | Cuándo                                                                                                                | En este repo                   |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `invalidateQueries` | Marca como _stale_ y refetch si está montada              | **El 90% de los casos.** En cada `onSuccess` de mutación: actualizaste/creaste/eliminaste → refresca la rama afectada | El default. Todo el mapa de §4 |
| `cancelQueries`     | Aborta peticiones **en vuelo** (dispara el `AbortSignal`) | Antes de un optimistic update; al desmontar un flujo en vivo (cédula, sorteo)                                         | Sólo optimistic updates (§5)   |
| `removeQueries`     | Borra la entrada del cache por completo                   | El dato dejó de existir/tener sentido: logout, salir de una liga, cerrar la cédula                                    | Teardown de flujos scoped      |
| `resetQueries`      | Vuelve la query a su estado inicial (`initialData`)       | Reiniciar un wizard/paso a cero sin desmontar                                                                         | Onboarding, sorteo-cockpit     |
| `refetchQueries`    | Fuerza refetch **aunque esté fresh**                      | Casi nunca. Si necesitas esto, normalmente tu `staleTime` o tu key están mal                                          | Evitar                         |

> **Regla mental:** _cache por defecto para lecturas; invalidación dirigida en cada
> escritura._ `cancel`/`remove`/`reset` son para el ciclo de vida (montar/desmontar,
> optimismo, logout), **no** para "traer lo nuevo". Para eso siempre es `invalidate`.

### 2.1 El anti-patrón que causó el bug

```ts
// ❌ Emites el pase, muestras toast de éxito… y no invalidas nada.
// La tarjeta sigue leyendo credentialStatus de la caché (stale 30s) → "Vencida".
await apiFetch(ISSUE_PASS_URL, { method: "POST", body });
notify.success("Pase emitido");

// ✅ La mutación declara su invalidación (vía registro §4).
onSuccess: (_data, { leagueId, globalPlayerId }) => {
	invalidate.credentialIssued(queryClient, { leagueId, globalPlayerId });
	notify.success("Pase emitido");
};
```

---

## 3. La fábrica de keys — diseño jerárquico (estándar objetivo)

**Problema con lo actual:** keys planas con dominios desconectados (§1.2).
**Estándar:** cada dominio expone `all` (raíz para invalidación por prefijo) y
constructores anidados. La forma canónica (patrón "query key factory"):

```ts
// shared/api/query-keys.ts  (forma objetivo)
export const queryKeys = {
	teams: {
		all: ["teams"] as const,
		// lista de equipos de una liga (reemplaza leagueTeams)
		list: (leagueId: string, filters?: TeamListFilters) =>
			[...queryKeys.teams.all, "list", leagueId, filters ?? {}] as const,
		detail: (teamId: string) => [...queryKeys.teams.all, "detail", teamId] as const,
		roster: (teamId: string) => [...queryKeys.teams.detail(teamId), "roster"] as const,
	},

	credentials: {
		all: ["credentials"] as const,
		status: (leagueId: string, globalPlayerId: string | null) =>
			[...queryKeys.credentials.all, "status", leagueId, globalPlayerId] as const,
		orgConfig: (organizationId: string) =>
			[...queryKeys.credentials.all, "org-config", organizationId] as const,
	},
} as const;
```

Qué habilita la jerarquía:

```ts
// invalidar TODO lo de equipos (listas + detalles + rosters de la liga)
queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });

// invalidar sólo el roster de un equipo (detail + roster hacen match por prefijo)
queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) });

// invalidar una lista concreta
queryClient.invalidateQueries({ queryKey: queryKeys.teams.list(leagueId) });
```

Reglas de la fábrica (no negociables):

- **El primer segmento es el dominio** (`teams`, `credentials`, `standings`, …).
- **`detail(id)` es prefijo de todo lo anidado bajo esa entidad** (`roster`,
  `preview`, etc.) para poder invalidar la entidad completa de un tiro.
- **Los filtros van como último segmento**, siempre un objeto (`filters ?? {}`),
  nunca strings sueltos concatenados. Distintos filtros = distintas entradas de
  caché **de la misma familia** — se invalidan juntas por prefijo.
- **Prohibido `useQuery({ queryKey: ["algo", id] })` inline.** Si la key no existe
  en la fábrica, se agrega ahí primero.
- Migración: la forma plana actual (`leagueTeams`, `teamRoster`) se conserva como
  alias hasta migrar cada slice; el objetivo es la forma anidada de arriba. Un
  slice por PR (§7).

---

## 4. Registro central de invalidación (el corazón del estándar)

En lugar de repartir `invalidateQueries` a mano por cada `onSuccess` (frágil, se
olvida una key y aparece el bug de §1.1), la relación **mutación → keys que caduca**
vive en **un módulo tipado y único**. El comentario de `query-keys.ts` se convierte
en código ejecutable y testeable.

```ts
// shared/api/cache-invalidation.ts
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

/**
 * Único lugar donde se declara qué caduca cada mutación de dominio.
 * Los hooks de mutación llaman a estas funciones en onSuccess; nunca
 * arman invalidateQueries a mano. Cada efecto tiene su test.
 */
export const invalidate = {
	// transferir / dar de baja jugador
	rosterChanged: (
		qc: QueryClient,
		p: { fromTeamId: string; toTeamId?: string; leagueId: string },
	) => {
		qc.invalidateQueries({ queryKey: queryKeys.teams.roster(p.fromTeamId) });
		if (p.toTeamId) qc.invalidateQueries({ queryKey: queryKeys.teams.roster(p.toTeamId) });
		qc.invalidateQueries({ queryKey: queryKeys.teams.list(p.leagueId) });
	},

	// disolver equipo
	teamDissolved: (qc: QueryClient, p: { leagueId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.teams.list(p.leagueId) });
		qc.invalidateQueries({ queryKey: queryKeys.standings(p.leagueId) });
	},

	// resolver partido (cédula)
	matchResolved: (qc: QueryClient, p: { matchId: string; leagueId: string }) => {
		qc.invalidateQueries({ queryKey: queryKeys.match(p.matchId) });
		qc.invalidateQueries({ queryKey: queryKeys.standings(p.leagueId) });
		qc.invalidateQueries({ queryKey: queryKeys.topScorers(p.leagueId) });
		qc.invalidateQueries({ queryKey: queryKeys.topAssists(p.leagueId) });
	},

	// emitir / renovar pase  ← el que faltaba (§1.1)
	credentialIssued: (qc: QueryClient, p: { leagueId: string; globalPlayerId: string | null }) => {
		qc.invalidateQueries({ queryKey: queryKeys.credentials.status(p.leagueId, p.globalPlayerId) });
	},
} as const;
```

Uso desde el hook de mutación:

```ts
// features/.../model/useIssueCredential.ts
onSuccess: (_data, vars) => {
	invalidate.credentialIssued(queryClient, vars);
	notify.success("Pase emitido"); // feedback obligatorio (AGENTS.md §7.2b)
};
```

Ventajas frente al `invalidateQueries` disperso:

- **Una sola verdad.** Cambias qué caduca `matchResolved` en un lugar; todos los
  callsites lo heredan.
- **Testeable.** Cada efecto se prueba con un `QueryClient` espiado:
  "`credentialIssued` invalida `credentials.status(leagueId, playerId)`". Un test
  hubiera atrapado el bug de la credencial.
- **Descubrible.** El registro es el índice legible de "qué toca qué"; ya no vive
  en un comentario que nadie ejecuta.

### 4.1 Mapa de invalidación (fuente de verdad, en sync con el registro)

| Mutación                   | Efecto en el registro | Invalida                                            |
| -------------------------- | --------------------- | --------------------------------------------------- |
| transferir / baja jugador  | `rosterChanged`       | `teams.roster`(ambos) + `teams.list`                |
| disolver equipo            | `teamDissolved`       | `teams.list` + `standings`                          |
| resolver partido           | `matchResolved`       | `match` + `standings` + `topScorers` + `topAssists` |
| cerrar / reabrir jornada   | `matchdayClosed`      | `standings` + `playoffs`                            |
| confirmar sorteo           | `scheduleConfirmed`   | `pairings` + `schedulingConfig`                     |
| emitir / renovar pase      | `credentialIssued`    | `credentials.status`                                |
| guardar tema org           | `orgThemeSaved`       | `orgTheme`                                          |
| activar/toggle/borrar skin | `skinChanged`         | `skinActivations` + `activeSkin`                    |

> Regla: **agregar una mutación de dominio nueva obliga a agregar su efecto aquí y
> en `cache-invalidation.ts`** (mismo PR). El checklist de commit lo verifica (§8).

---

## 5. Cancelación — `cancelQueries` bien usado

`cancelQueries` sólo tiene dos usos legítimos. Fuera de ellos, no se usa.

### 5.1 Optimistic updates (evitar que una respuesta vieja pise tu cambio)

```ts
useMutation({
	mutationFn: updateMember,
	onMutate: async (vars) => {
		// 1) cancela refetches en vuelo de esa key: si no, una respuesta vieja
		//    en camino pisaría el update optimista al llegar
		await queryClient.cancelQueries({ queryKey: queryKeys.teams.roster(vars.teamId) });
		// 2) snapshot para rollback
		const prev = queryClient.getQueryData(queryKeys.teams.roster(vars.teamId));
		// 3) aplica el cambio optimista
		queryClient.setQueryData(queryKeys.teams.roster(vars.teamId), (old) => patch(old, vars));
		return { prev };
	},
	onError: (_e, vars, ctx) => {
		queryClient.setQueryData(queryKeys.teams.roster(vars.teamId), ctx?.prev); // rollback
		notify.error("No se pudo actualizar"); // §7.2b
	},
	onSettled: (_d, _e, vars) => {
		queryClient.invalidateQueries({ queryKey: queryKeys.teams.roster(vars.teamId) }); // reconcilia
	},
});
```

`cancel` aquí **no borra caché**: sólo aborta el fetch en curso para que su
respuesta no llegue después y sobrescriba el optimismo.

### 5.2 Teardown de flujos en vivo (cédula, sorteo)

Al salir de la cédula de partido o del cockpit de sorteo (datos `staleTime: 0`),
aborta lo que quede en vuelo y limpia lo scoped para que no se reuse en otro
partido/liga:

```ts
useEffect(() => {
	return () => {
		queryClient.cancelQueries({ queryKey: queryKeys.match(matchId) });
		queryClient.removeQueries({ queryKey: queryKeys.match(matchId) }); // dato scoped, no reutilizable
	};
}, [queryClient, matchId]);
```

### 5.3 El `queryFn` debe respetar el `signal`

Para que `cancelQueries` realmente aborte la red, el `queryFn` tiene que propagar
el `AbortSignal`. Estándar: `apiFetch` acepta y reenvía el `signal`.

```ts
queryFn: ({ signal }) =>
  apiFetch<MatchDto>(MATCH_URL(matchId), { signal }),
```

> **Deuda a cerrar:** `apiFetch`/`apiUpload` aún no exponen `signal`. Agregarlo al
> `FetchOptions` y reenviarlo al `fetch` nativo es prerequisito de la cancelación
> real (hoy `cancelQueries` sólo descarta la respuesta, no aborta el request).

---

## 6. `staleTime`, scoping y el caso de los duplicados

### 6.1 Tiers de `staleTime` por volatilidad

El default global (`QueryProvider`) es `staleTime: 30_000`, `retry: 1`,
`refetchOnWindowFocus: false`. Se sobre-escribe **por query** según el dato:

| Tier     | Datos                                                                                 | `staleTime`        | Notas                                        |
| -------- | ------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------- |
| Estático | `cities`, `venues`, `scheduling-config`, `orgTheme`                                   | 5–30 min           | Cambian rara vez                             |
| Dominio  | `standings`, `teams.list`, `teams.roster`, goleo                                      | ~30 s (default)    | Volatilidad media                            |
| En vivo  | cédula de partido, `pairings` durante el sorteo, `credentials.status` durante emisión | `0` + invalidación | La verdad la marca la mutación, no el tiempo |

> `credentials.status` es tramposo: en la pantalla de emisión es **en vivo**
> (`staleTime: 0`), porque el usuario emite y espera ver el cambio al instante. En
> una tabla de listado puede ser dominio. Si el mismo dato se usa en dos contextos
> con volatilidad distinta, se acepta `staleTime` por callsite — la key es la misma,
> la frescura no.

### 6.2 `select` para filtrar sobre caché (sin nueva key)

Si el filtro es sobre datos ya cacheados (barato, sin nueva petición), se usa
`select` de la query existente — no una key nueva. Ya se hace bien en
`useLeagueTeams` (excluir un equipo del selector con `select`, compartiendo caché
entre distintos `excludeTeamId`). Ese es el patrón.

### 6.3 El equipo duplicado — es scoping, no caché

"El mismo equipo dos veces en equipos actuales (uno de liga terminada, uno de la
nueva)" son **dos filas reales** (mismo club, distinta `league_id`/temporada). No
lo arregla la invalidación. Se arregla en dos frentes, alineado con
"Thin Client, Smart Backend" (`AGENTS.md §17`):

1. **Filtro en el backend (WHERE), no en memoria.** "Equipos actuales" = equipos de
   ligas **activas**. El filtro `status = 'active'` baja a SQL (registro de filtros,
   `docs/LIST-QUERY-FILTERS.md`), nunca un `.filter()` en el cliente.
2. **El filtro entra en la key.** La query se scopea por liga/estado activo:
   `queryKeys.teams.list(leagueId, { status: "active" })`. Así "liga terminada" y
   "liga nueva" **no comparten** entrada de caché y no se pisan ni se mezclan.

Si de verdad se quiere "un club, una tarjeta" agregando ligas, la deduplicación por
`clubId` va en el **mapper** (`lib/map-*.ts`, §19 de AGENTS), no en el componente.

---

## 7. Patrón filtros + fetching (dos hooks, obligatorio)

Ya es contrato en `AGENTS.md §7.3b`; se reitera aquí porque es donde más se filtran
mal las keys:

```
model/useXFilters.ts   → estado de filtro (URL sync + confirmación; sin useEffect+setState)
        ↓ objeto de filtro tipado
model/useXQuery.ts     → useQuery: key desde queryKeys.* (incluye el filtro) + enabled gatea el fetch
```

- El hook de filtro es dueño del estado; si sincroniza con la URL usa
  `useSearchParams`/`router.replace` con **lazy initializer**, nunca
  `setState` dentro de `useEffect`.
- El hook de query mete los valores de filtro **dentro de la key** (§3) y usa
  `enabled` para no disparar hasta que el filtro sea válido/confirmado. Texto libre:
  debounce + mínimo de caracteres (`enabled: q.length >= N`).
- Referencias canónicas en el repo: `narrator-analysis/model/useNarratorMatchup.ts`
  (+ `useNarratorAnalysisQuery.ts`) para filtro confirmado; `team-management/model/
useOrgPlayerSearch.ts` para debounce; `useLeagueTeams.ts` para filtrar sobre
  caché con `select`.

---

## 8. Checklist antes de commit (caché)

Se suma al checklist general de `AGENTS.md §12`:

- [ ] ¿La key sale de `queryKeys.*`? (cero arrays inline en `useQuery`/`invalidate`/tests)
- [ ] ¿La key nueva es jerárquica (`domain → detail/list → variante`) y los filtros
      van como último segmento objeto?
- [ ] ¿Toda mutación que cambia el servidor invalida vía el **registro**
      (`invalidate.*`), no con `invalidateQueries` a mano?
- [ ] ¿El efecto de invalidación nuevo está en `cache-invalidation.ts` **y** en el
      mapa de §4.1, con su test?
- [ ] ¿Usé `cancelQueries` sólo para optimistic update o teardown en vivo — no para
      "refrescar"?
- [ ] ¿El dato en vivo (cédula/sorteo/emisión) tiene `staleTime: 0` y su
      invalidación explícita?
- [ ] ¿Filtrado sobre caché con `select`, no una key nueva ni `.filter()` en la UI?
- [ ] ¿El filtro que scopea el dato (liga activa, estado) está en la key **y** en el
      WHERE del backend? (evita el duplicado de §6.3)
- [ ] ¿Toda mutación muestra `notify.success/error`? (`AGENTS.md §7.2b`)

---

## 9. Plan de adopción (un commit por paso)

1. **`apiFetch` propaga `signal`** — prerequisito de cancelación real (§5.3).
2. **Registro `shared/api/cache-invalidation.ts`** + sus tests. Migrar los
   `invalidateQueries` sueltos existentes (`useRosterMutations`, etc.) a llamarlo.
   **Cerrar el bug de la credencial aquí** (`credentialIssued`).
3. **Fábrica jerárquica** — introducir `teams.all/list/detail/roster` y
   `credentials.*`; mantener alias planos hasta migrar cada consumidor.
4. **Scoping de "equipos actuales"** por liga activa (key + WHERE) — cierra el
   duplicado (§6.3).
5. **`staleTime` por tier** en los callsites en vivo (cédula, sorteo, emisión).
6. Barrido: cada slice restante migra a fábrica jerárquica + registro, con test de
   invalidación. Orden sugerido: `team-management` → lecturas en `useEffect`
   (`LeagueSelect`, `CityFilter`, `useVenueCalendar`) → cédula/sorteo (en vivo).

---

## 10. Referencias

- `AGENTS.md §7.3` (contrato corto de datos), `§7.3b` (filtros+fetching),
  `§7.2b` (feedback en mutaciones), `§17` (Thin Client, Smart Backend), `§19` (mapper).
- `docs/FRONTEND-DATA-STRATEGY.md` — las 5 capas y el porqué de la migración.
- `docs/LIST-QUERY-FILTERS.md` — filtros que bajan a SQL (evita filtrar en memoria).
- Código: `shared/api/query-keys.ts`, `shared/api/client.ts`,
  `shared/api/QueryProvider.tsx`, `shared/test/react-query.tsx`,
  `features/team-management/model/*` (plantilla viva).
