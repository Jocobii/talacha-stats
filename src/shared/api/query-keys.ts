/**
 * shared/api/query-keys.ts
 *
 * Fábrica central de query keys de TanStack Query. ÚNICA fuente de verdad de
 * las keys: los hooks NUNCA arman el array a mano. Esto evita strings sueltos
 * duplicados y hace que la invalidación sea refactor-safe (cambias la forma de
 * la key en un solo lugar).
 *
 * Las keys son jerárquicas: el primer segmento es el dominio. Invalidar por el
 * prefijo del dominio (`queryClient.invalidateQueries({ queryKey: ["standings"] })`)
 * limpia todas sus variantes; invalidar con la key completa limpia una entidad.
 *
 * Convención de invalidación (mantener en sync con cada mutación):
 *   - transferir/dar de baja jugador → teams.roster(ambos equipos) + teams.list(leagueId)
 *   - disolver equipo               → teams.list(leagueId) + standings
 *   - resolver partido              → match + standings + topScorers + topAssists
 *   - cerrar/reabrir jornada        → standings + playoffs
 *   - confirmar sorteo              → pairings + schedulingConfig
 */

export const queryKeys = {
	cities: () => ["cities"] as const,

	// Liga — dominio jerárquico (docs/REACT-QUERY-CACHE-STANDARD.md §3).
	// `detail(leagueId)` es prefijo de todo lo anidado bajo esa liga (hoy solo
	// `config`); permite invalidar "todo lo de esta liga como entidad" con una
	// sola key el día que haya más de un sub-recurso. `leagueTeams`/`standings`/
	// etc. quedan fuera a propósito (dominios propios, ver comentarios abajo).
	leagues: {
		all: ["leagues"] as const,
		list: (filters?: { city?: string }) =>
			[...queryKeys.leagues.all, "list", filters ?? {}] as const,
		detail: (leagueId: string) => [...queryKeys.leagues.all, "detail", leagueId] as const,
		// Reglamento de la liga (tournament-rules)
		config: (leagueId: string) => [...queryKeys.leagues.detail(leagueId), "config"] as const,
	},
	// "Liga en vivo" — standings/topScorers/topAssists/playoffs/schedulingConfig
	// (nivel liga)/pairings/match/matchPreview. Hoy NINGUNA de estas tiene
	// consumidor real: esas pantallas leen con Server Components (serverFetch)
	// o mutan sin pasar por TanStack Query todavía (cédula, sorteo). El mapa de
	// invalidación de arriba (matchResolved, matchdayClosed, scheduleConfirmed)
	// es aspiracional — documenta el plan de adopción §9 paso 6 del doc, no
	// código que exista hoy. Se dejan planas a propósito: convertirlas a forma
	// jerárquica ahora sería especulativo (nada que verificar con un test real).
	// No borrar sin confirmar que de verdad no se van a necesitar.
	standings: (leagueId: string) => ["standings", leagueId] as const,
	topScorers: (leagueId: string) => ["top-scorers", leagueId] as const,
	topAssists: (leagueId: string) => ["top-assists", leagueId] as const,
	playoffs: (leagueId: string) => ["playoffs", leagueId] as const,
	playoffZones: (leagueId: string) => ["playoff-zones", leagueId] as const,
	schedulingConfig: (leagueId: string) => ["scheduling-config", leagueId] as const,
	pairings: (leagueId: string, jornada: number) => ["pairings", leagueId, jornada] as const,

	// Organización — dominio jerárquico (docs/REACT-QUERY-CACHE-STANDARD.md §3).
	// Cuatro sub-recursos de la misma entidad (docs/ORG-PROFILE-HUB.md); cada
	// mutación hoy solo escribe su propio sub-recurso con `setQueryData`
	// (autocontenidas, sin invalidación cruzada — confirmado auditando los 3
	// pares lectura/escritura). `slugAvailability` no es un sub-recurso
	// persistente sino un chequeo de formulario parametrizado por `slug`, pero
	// vive en el mismo dominio por ser la misma entidad conceptual.
	organizations: {
		all: ["organizations"] as const,
		general: (organizationId: string) =>
			[...queryKeys.organizations.all, "general", organizationId] as const,
		config: (organizationId: string) =>
			[...queryKeys.organizations.all, "config", organizationId] as const,
		schedulingConfig: (organizationId: string) =>
			[...queryKeys.organizations.all, "scheduling-config", organizationId] as const,
		// Dos contextos, dos endpoints distintos (§1.3 del doc: filtros/contexto
		// mal scopeados = mezclas de caché) — NUNCA colapsar en una sola key
		// aunque el `slug` tecleado coincida: alta (onboarding, sin excepción)
		// y edición (perfil, excluye el slug ya guardado por la propia org) son
		// respuestas distintas para el mismo string.
		slugAvailabilityForNewOrg: (slug: string) =>
			[...queryKeys.organizations.all, "slug-availability", "new", slug] as const,
		slugAvailabilityForEdit: (slug: string) =>
			[...queryKeys.organizations.all, "slug-availability", "edit", slug] as const,
		// Hub de Portales (/organizaciones, features/org-directory). `limit`
		// entra en la key a propósito: "cargar más" no acumula páginas en
		// estado local, vuelve a pedir el mismo listado con más `limit` (offset
		// 0) — cada `limit` distinto es, para TanStack Query, una entrada de
		// caché propia.
		directory: (filters: { city?: string; q?: string; sort: string }, limit: number) =>
			[...queryKeys.organizations.all, "directory", filters, limit] as const,
	},

	// Sanciones — dominio jerárquico. `admin()` es la vista global (todas las
	// ligas visibles al usuario) y `byLeague(leagueId)` es el tab de una liga.
	// Invalidación real (auditada en las 4 mutaciones de discipline/model):
	// las variantes *Global invalidan admin() + byLeague(leagueId); las
	// variantes scoped (sin "Global") invalidan SOLO byLeague(leagueId) — a
	// propósito, no tocan la vista global. No fusionar ese comportamiento al
	// migrar. `rosterSearch` es el picker de jugador del modal "Registrar
	// sanción" (mismo dominio funcional, sin mutación que lo invalide).
	suspensions: {
		all: ["suspensions"] as const,
		admin: () => [...queryKeys.suspensions.all, "admin"] as const,
		byLeague: (leagueId: string) => [...queryKeys.suspensions.all, "league", leagueId] as const,
		rosterSearch: (leagueId: string | null, q: string) =>
			[...queryKeys.suspensions.all, "roster-search", leagueId, q] as const,
	},

	// Equipos — dominio jerárquico (docs/REACT-QUERY-CACHE-STANDARD.md §3, es el
	// ejemplo canónico del propio doc). `detail(teamId)` es prefijo de `roster`,
	// así que invalidar la entidad completa (el día que haga falta) es una sola
	// key. `list(leagueId)` NUNCA lleva `excludeTeamId` en la key — ese filtro se
	// aplica con `select` en `useLeagueTeams` para compartir caché entre distintas
	// exclusiones (misma liga = misma entrada).
	teams: {
		all: ["teams"] as const,
		list: (leagueId: string) => [...queryKeys.teams.all, "list", leagueId] as const,
		detail: (teamId: string) => [...queryKeys.teams.all, "detail", teamId] as const,
		roster: (teamId: string) => [...queryKeys.teams.detail(teamId), "roster"] as const,
	},

	// Canchas — dominio jerárquico. `list(scope?)` reemplaza `venues(scope?)`.
	// `windows` y `purchasedTimeslots` cuelgan del mismo dominio (sub-recursos
	// de cancha+liga) aunque hoy no tengan consumidor de TanStack Query — se
	// dejan listas para cuando esas pantallas migren (mismo criterio que
	// `leagues.detail`/`teams.detail` antes de tener lector real).
	venues: {
		all: ["venues"] as const,
		list: (scope?: { orgId?: string; city?: string }) =>
			[...queryKeys.venues.all, "list", scope ?? {}] as const,
		windows: (leagueId: string, venueId: string) =>
			[...queryKeys.venues.all, "windows", leagueId, venueId] as const,
		purchasedTimeslots: (leagueId: string) =>
			[...queryKeys.venues.all, "purchased-timeslots", leagueId] as const,
	},
	// `venueEvents` NO pasa por TanStack a propósito: FullCalendar (venue-calendar)
	// trae su propio motor de fetch por rango y gestiona su caché interna — no
	// tiene sentido forzarla a la fábrica jerárquica de arriba. Se deja plana y
	// fuera del dominio `venues` para que quede claro que es un caso aparte.
	venueEvents: (venueId: string, range?: { start: string; end: string }) =>
		range ? (["venue-events", venueId, range] as const) : (["venue-events", venueId] as const),

	// Partido / cédula
	match: (matchId: string) => ["match", matchId] as const,
	matchPreview: (matchId: string) => ["match-preview", matchId] as const,

	// Jugadores — dominio jerárquico (docs/REACT-QUERY-CACHE-STANDARD.md §3).
	// `all` es la raíz: invalida directorio + ambas búsquedas de un tiro cuando
	// una mutación de identidad (alta, transferencia) lo requiera. Los filtros
	// van siempre como objeto, último segmento.
	players: {
		all: ["players"] as const,
		// Directorio público (PlayersView.tsx)
		list: (filters?: { city: string; q?: string }) =>
			[...queryKeys.players.all, "list", filters ?? {}] as const,
		// Búsqueda existente scoped a liga (team-management/useOrgPlayerSearch)
		searchOrg: (leagueId: string, q: string) =>
			[...queryKeys.players.all, "search-org", leagueId, q] as const,
		// Búsqueda existente org/owner-wide (discipline/usePlayerSearchForDiscipline)
		searchDiscipline: (q: string) => [...queryKeys.players.all, "search-discipline", q] as const,
	},

	// Ranking — aún huérfana: PlayerSearch.tsx (ranking) sigue en
	// useState+useEffect con fetch() crudo, pendiente de migrar al patrón
	// useXFilters/useXQuery (§7.3b) + fábrica jerárquica. No borrar.
	ranking: (filters?: Record<string, string>) =>
		filters ? (["ranking", filters] as const) : (["ranking"] as const),

	// Narrador — análisis pre-partido (flujo BD, /analysis)
	// Dominio propio (no comparte con `teams.list`): el mapper de esta feature
	// devuelve un shape distinto (TeamOption sin color) y no debe pisar la
	// caché de team-management. Solo lectura, sin mutaciones que invalidar.
	narrator: {
		all: ["narrator"] as const,
		teams: (leagueId: string) => [...queryKeys.narrator.all, "teams", leagueId] as const,
		analysis: (leagueId: string, teamA: string, teamB: string) =>
			[...queryKeys.narrator.all, "analysis", leagueId, teamA, teamB] as const,
	},

	// Temas por torneo (tournament-skin) — dominio jerárquico. `all` sirve
	// también para invalidar ambas variantes de un tiro (ver
	// `invalidate.skinChanged` en cache-invalidation.ts).
	skins: {
		all: ["skins"] as const,
		active: () => [...queryKeys.skins.all, "active"] as const,
		activations: () => [...queryKeys.skins.all, "activations"] as const,
	},

	// Tema por organización (org-theming). Dominio propio, pequeño y
	// autocontenido (una sola mutación, sin cruces) — no amerita fusionarse
	// con `organizations` todavía.
	// Invalidación: guardar tema → orgTheme(organizationId)
	orgTheme: (organizationId: string) => ["org-theme", organizationId] as const,

	// Pase del jugador (docs/CREDENCIAL-PASE-JUGADOR.md) — dominio jerárquico,
	// es el ejemplo literal del doc §3. `status` hoy no tiene ninguna mutación
	// que la invalide (el pase se emite server-side, en la misma tx del
	// registro — `admin-registration/register.ts` — o desde pantallas Server
	// Component que refrescan con `router.refresh()`, no con RQ). Se deja lista
	// para el día que `IssueCredentialModal` conviva con un `useCredentialStatus`
	// montado en el mismo árbol.
	credentials: {
		all: ["credentials"] as const,
		status: (leagueId: string, globalPlayerId: string | null) =>
			[...queryKeys.credentials.all, "status", leagueId, globalPlayerId] as const,
		orgConfig: (organizationId: string) =>
			[...queryKeys.credentials.all, "org-config", organizationId] as const,
	},
} as const;
