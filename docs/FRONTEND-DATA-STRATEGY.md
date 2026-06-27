# Estrategia de datos del frontend — caché, capas y testeabilidad

> Blueprint para la migración a TanStack Query + capa de mapper. Es el plan de
> referencia de "la gran modificación". El contrato corto vive en `AGENTS.md §7.3`;
> aquí está el detalle y el porqué.

## Por qué

Hoy conviven tres patrones de carga de datos y eso es lo que hace difícil testear:

1. **Server Component → query de entidad → props.** La mayoría del admin: la
   página (server) llama a `entities/*/queries` y baja los datos como props. El
   cliente muta y hace `router.refresh()` para recargar toda la ruta. Es el caso
   de `useTeamRoster`, que además re-sincroniza las props con un `setState` dentro
   de un `useEffect` (el olor que rompe el lint y la testeabilidad).
2. **Fetch en cliente (`useEffect`/hooks).** `LeagueSelect`, `CityFilter`,
   `useVenueCalendar`, `analysis`, import wizards, sorteo-cockpit.
3. **`serverFetch`** en 3 páginas.

Olores transversales: casts `as` de la fila cruda de DB a tipo de vista (sin
mapper), y tipos duplicados inline (`type Team`/`type League` repetidos por componente).

## Las 5 capas (cada una testeable por separado)

```
apiFetch / serverFetch      Transporte. Devuelve ApiResult<DTO>. Ya existe. No cambia.
        ↓
entities/*  (DTO)           Tipo crudo del API, inferido de Drizzle/Zod (§4.1). Una sola fuente.
        ↓
features/*/lib/map-*.ts     MAPPER puro DTO → ViewModel. Aquí vive TODA la lógica de
                            negocio/formateo/derivación. Tests unitarios triviales.
        ↓
features/*/model/use*.ts    Hooks RQ (useQuery/useMutation). queryFn/mutationFn devuelven
                            ViewModels ya mapeados. Dueños de la caché y la invalidación.
        ↓
features/*/ui/*.tsx         Componente TONTO. Recibe ViewModels + callbacks por props.
                            Cero fetch, cero mapeo, cero regla de negocio.
```

La última capa es la que vuelve los componentes testeables con RTL **sin mockear
red**: solo pasas props. La lógica que antes vivía enredada en el componente ahora
está en el mapper (test puro) y en el hook (test con QueryClient).

## Estrategia de caché

**Keys:** una sola fábrica, `shared/api/query-keys.ts`. Los hooks NUNCA arman el
array a mano. Keys jerárquicas (`["standings", leagueId]`): invalidar por prefijo
de dominio limpia todas las variantes; invalidar con la key completa limpia una
entidad.

**`staleTime` por volatilidad:**

| Tier     | Datos                                         | staleTime           |
| -------- | --------------------------------------------- | ------------------- |
| Estático | cities, venues, scheduling-config             | 5–30 min            |
| Dominio  | standings, league-teams, team-roster, goleo   | ~30 s (default app) |
| En vivo  | cédula de partido, pairings durante el sorteo | 0 + invalidación    |

**Mapa de invalidación** (co-localizado con cada mutación, en sync con el comentario de `query-keys.ts`):

| Mutación                  | Invalida                                            |
| ------------------------- | --------------------------------------------------- |
| transferir / baja jugador | `teamRoster`(ambos equipos) + `leagueTeams`         |
| disolver equipo           | `leagueTeams` + `standings`                         |
| resolver partido          | `match` + `standings` + `topScorers` + `topAssists` |
| cerrar / reabrir jornada  | `standings` + `playoffs`                            |
| confirmar sorteo          | `pairings` + `schedulingConfig`                     |

**La decisión grande — patrón 1 (SSR→props):** pasar el DTO ya mapeado como
`initialData` del hook de query. El Server Component sigue pintando rápido, pero
el cliente usa RQ como fuente de verdad y reemplaza `router.refresh()` por
`invalidateQueries` puntual. Eso mata el `setState`-en-effect y vuelve la
sincronización testeable.

## Testeabilidad

- **Mappers** → unit puro (entorno `node`, sin setup). El grueso de los tests de
  lógica vive aquí.
- **Hooks** → `renderHook` con `createQueryWrapper()` de `shared/test/react-query.tsx`
  y `apiFetch` mockeado (única costura de red). El archivo declara `// @vitest-environment jsdom`.
- **Componentes** → RTL con props (ViewModels + spies). Sin red. Solo posible una
  vez que el componente es tonto.

Harness: `vitest.config.ts` colecta tests **co-localizados** (`*.test.{ts,tsx}`),
no solo los de `__tests__/`. Entorno por defecto `node`; los tests con DOM optan a
`jsdom` por archivo con el docblock.

## Secuencia de la migración

1. **Base** (este paso): `shared/api/query-keys.ts` + `shared/test/react-query.tsx`
   - arreglo del harness de Vitest. Plantilla viva: slice de transferencia en
     `team-management` (`useLeagueTeams` + `map-team-option`).
2. **Por feature slice**: extraer mapper (+test) → hooks query/mutation (+invalidación)
   → volver tonto el componente (solo props) → test de componente.
3. **Migrar patrón SSR→props** a `initialData` + invalidación, retirando `router.refresh()`.

Orden sugerido de features: `team-management` (en curso) → lecturas en `useEffect`
(`LeagueSelect`, `CityFilter`, `useVenueCalendar`) → cédula/sorteo (datos en vivo).
