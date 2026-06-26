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
 *   - transferir/dar de baja jugador → teamRoster(ambos equipos) + leagueTeams
 *   - disolver equipo               → leagueTeams + standings
 *   - resolver partido              → match + standings + topScorers + topAssists
 *   - cerrar/reabrir jornada        → standings + playoffs
 *   - confirmar sorteo              → pairings + schedulingConfig
 */

export const queryKeys = {
	cities: () => ["cities"] as const,

	// Liga
	leagues: (filters?: { city?: string }) =>
		filters ? (["leagues", filters] as const) : (["leagues"] as const),
	league: (leagueId: string) => ["league", leagueId] as const,
	leagueTeams: (leagueId: string) => ["league-teams", leagueId] as const,
	standings: (leagueId: string) => ["standings", leagueId] as const,
	topScorers: (leagueId: string) => ["top-scorers", leagueId] as const,
	topAssists: (leagueId: string) => ["top-assists", leagueId] as const,

	// Liguilla / sorteo
	playoffs: (leagueId: string) => ["playoffs", leagueId] as const,
	playoffZones: (leagueId: string) => ["playoff-zones", leagueId] as const,
	schedulingConfig: (leagueId: string) => ["scheduling-config", leagueId] as const,
	pairings: (leagueId: string, jornada: number) => ["pairings", leagueId, jornada] as const,

	// Equipos / roster
	team: (teamId: string) => ["team", teamId] as const,
	teamRoster: (teamId: string) => ["team-roster", teamId] as const,

	// Canchas
	venues: (scope?: { orgId?: string; city?: string }) =>
		scope ? (["venues", scope] as const) : (["venues"] as const),
	venueEvents: (venueId: string, range?: { start: string; end: string }) =>
		range ? (["venue-events", venueId, range] as const) : (["venue-events", venueId] as const),
	venueWindows: (leagueId: string, venueId: string) =>
		["venue-windows", leagueId, venueId] as const,
	purchasedTimeslots: (leagueId: string) => ["purchased-timeslots", leagueId] as const,

	// Partido / cédula
	match: (matchId: string) => ["match", matchId] as const,
	matchPreview: (matchId: string) => ["match-preview", matchId] as const,

	// Público
	players: (filters?: Record<string, string>) =>
		filters ? (["players", filters] as const) : (["players"] as const),
	ranking: (filters?: Record<string, string>) =>
		filters ? (["ranking", filters] as const) : (["ranking"] as const),
} as const;
