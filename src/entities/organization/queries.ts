import { db } from "@/db";
import {
	organizations,
	users,
	leagues,
	teamStandingsSnapshot,
	playerSeasonStats,
	teams,
	globalPlayers,
	matchdays,
	matches,
	venues,
	leagueVenues,
	venueTimeWindows,
	leaguePlayoffZones,
} from "@/db/schema";
import { eq, asc, desc, and, sql, inArray, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "./model";
import { deriveArranqueState, type ArranqueState } from "./lib/derive-arranque-state";

// ---------------------------------------------------------------------------
// Lectura — Admin
// ---------------------------------------------------------------------------

/** Obtiene una organización por su ID. */
export async function getOrganizationById(id: string) {
	return db.query.organizations.findFirst({
		where: eq(organizations.id, id),
	});
}

/** Obtiene una organización por su slug (para URLs públicas). */
export async function getOrganizationBySlug(slug: string) {
	return db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});
}

/** Lista todas las organizaciones del sistema (solo para owner). */
export async function listOrganizations() {
	return db.query.organizations.findMany({
		orderBy: [asc(organizations.name)],
	});
}

/** Obtiene la organización de un usuario específico. */
export async function getOrganizationByUserId(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: { organization: true },
	});
	return user?.organization ?? null;
}

/** Obtiene una organización con sus ligas y miembros (panel admin). */
export async function getOrganizationWithDetails(id: string) {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, id),
		with: {
			leagues: {
				orderBy: (l, { asc }) => [asc(l.name)],
			},
			members: {
				columns: {
					id: true,
					name: true,
					email: true,
					role: true,
					active: true,
					createdAt: true,
				},
				orderBy: (u, { asc }) => [asc(u.name)],
			},
		},
	});
	return org ?? null;
}

/** Lista los usuarios que pertenecen a una organización. */
export async function getUsersByOrganization(organizationId: string) {
	return db.query.users.findMany({
		where: eq(users.organizationId, organizationId),
		columns: {
			id: true,
			name: true,
			email: true,
			role: true,
			active: true,
			createdAt: true,
		},
		orderBy: [asc(users.name)],
	});
}

/** Lista las ligas de una organización. */
export async function getLeaguesByOrganization(organizationId: string) {
	return db.query.leagues.findMany({
		where: eq(leagues.organizationId, organizationId),
		with: { teams: true },
		orderBy: (l, { desc }) => [desc(l.createdAt)],
	});
}

export type LeagueWithTeamCount = {
	id: string;
	name: string;
	city: string;
	season: string;
	teamCount: number;
	orgName: string | null;
};

/**
 * Todas las ligas del sistema con conteo de equipos — para el selector de
 * "avanzar liga existente" del Organization Simulator (Épica E). Solo
 * consumido desde un contexto owner-only, así que no filtra por org/status.
 */
export async function listAllLeaguesWithTeamCount(): Promise<LeagueWithTeamCount[]> {
	const rows = await db.query.leagues.findMany({
		with: {
			teams: { columns: { id: true } },
			organization: { columns: { name: true } },
		},
		orderBy: (l, { desc }) => [desc(l.createdAt)],
	});

	return rows.map((l) => ({
		id: l.id,
		name: l.name,
		city: l.city,
		season: l.season ?? "",
		teamCount: l.teams.length,
		orgName: l.organization?.name ?? null,
	}));
}

/**
 * Estado de "Onboarding Parte 2" (Arranque: Cancha → Liga → Horario), derivado
 * de conteos en DB (§17: filtrado a nivel de query, no en memoria). Sin
 * columna nueva en `organizations` — ver docs/ONBOARDING-PARTE-2.md §6.
 */
export async function getArranqueState(organizationId: string): Promise<ArranqueState> {
	const [venueRows, leagueRows, scheduledRows] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(venues)
			.where(eq(venues.organizationId, organizationId)),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(leagues)
			.where(eq(leagues.organizationId, organizationId)),
		db
			.select({ count: sql<number>`count(distinct ${leagues.id})::int` })
			.from(leagues)
			.innerJoin(leagueVenues, eq(leagueVenues.leagueId, leagues.id))
			.innerJoin(
				venueTimeWindows,
				and(
					eq(venueTimeWindows.leagueId, leagues.id),
					eq(venueTimeWindows.venueId, leagueVenues.venueId),
				),
			)
			.where(eq(leagues.organizationId, organizationId)),
	]);

	return deriveArranqueState({
		venueCount: venueRows[0]?.count ?? 0,
		leagueCount: leagueRows[0]?.count ?? 0,
		scheduledLeagueCount: scheduledRows[0]?.count ?? 0,
	});
}

// ---------------------------------------------------------------------------
// Lectura — Páginas públicas
// ---------------------------------------------------------------------------

/**
 * Lista todas las organizaciones con sus ligas activas para la página /ligas.
 * Incluye el conteo de equipos de cada liga.
 */
export async function listOrganizationsPublic() {
	return db.query.organizations.findMany({
		// Only verified orgs appear in public directory
		where: eq(organizations.status, "verified"),
		orderBy: [asc(organizations.name)],
		with: {
			leagues: {
				where: eq(leagues.status, "active"),
				orderBy: (l, { asc }) => [asc(l.name)],
				with: { teams: true },
			},
		},
	});
}

/**
 * Obtiene una organización pública con sus ligas activas + último snapshot de cada liga.
 * Usada en /org/[slug].
 */
export async function getPublicOrganization(slug: string) {
	const org = await db.query.organizations.findFirst({
		// Trial orgs are not publicly accessible
		// comment only for testing
		// where: and(eq(organizations.slug, slug), eq(organizations.status, "verified")),
		where: and(eq(organizations.slug, slug)),
		with: {
			leagues: {
				where: eq(leagues.status, "active"),
				orderBy: (l, { asc }) => [asc(l.name)],
				with: { teams: true },
			},
		},
	});
	return org ?? null;
}

/**
 * Obtiene una liga pública por slug de org + slug de liga.
 * Incluye equipos para la tabla de posiciones.
 * Usada en /org/[slug]/[leagueSlug].
 */
export async function getPublicLeague(orgSlug: string, leagueSlug: string) {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.slug, orgSlug),
		columns: { id: true, name: true, slug: true, logoUrl: true, city: true, status: true },
	});
	if (!org) return null;

	const league = await db.query.leagues.findFirst({
		where: and(eq(leagues.organizationId, org.id), eq(leagues.slug, leagueSlug)),
		with: { teams: true },
	});
	if (!league) return null;

	return { org, league };
}

/**
 * Obtiene la tabla de posiciones para la vista pública de una liga.
 *
 * Prioridad 1 — snapshots importados desde Excel (V1 legacy):
 *   Devuelve la jornada más reciente disponible en teamStandingsSnapshot.
 *
 * Prioridad 2 — cálculo en vivo desde partidos capturados (V2):
 *   Se activa cuando no hay snapshots. Cuenta played + walkover_home +
 *   walkover_away. Los W.O. se contabilizan como 3-0 para el ganador.
 *   Devuelve filas con la misma forma que los snapshots ({ team: { id, name }, ... })
 *   para que la plantilla pública no necesite cambios.
 */
export async function getLatestStandings(leagueId: string) {
	// ── Prioridad 1: snapshots Excel ──────────────────────────────────────────
	const lastJornada = await db
		.select({ jornada: sql<number>`max(${teamStandingsSnapshot.jornada})` })
		.from(teamStandingsSnapshot)
		.where(eq(teamStandingsSnapshot.leagueId, leagueId));

	const jornada = lastJornada[0]?.jornada ?? null;

	if (jornada) {
		const rows = await db.query.teamStandingsSnapshot.findMany({
			where: and(
				eq(teamStandingsSnapshot.leagueId, leagueId),
				eq(teamStandingsSnapshot.jornada, jornada),
			),
			with: { team: { columns: { id: true, name: true } } },
			orderBy: [
				desc(teamStandingsSnapshot.points),
				desc(sql`${teamStandingsSnapshot.goalsFor} - ${teamStandingsSnapshot.goalsAgainst}`),
				desc(teamStandingsSnapshot.goalsFor),
			],
		});
		return { standings: rows, jornada };
	}

	// ── Prioridad 2: cálculo en vivo desde partidos capturados (V2) ───────────
	const COUNTED_STATUSES = ["played", "walkover_home", "walkover_away", "completed"] as const;

	const [leagueTeams, countedMatches] = await Promise.all([
		db.query.teams.findMany({
			where: eq(teams.leagueId, leagueId),
			columns: { id: true, name: true },
		}),
		db.query.matches.findMany({
			where: and(eq(matches.leagueId, leagueId), inArray(matches.status, [...COUNTED_STATUSES])),
			columns: {
				id: true,
				homeTeamId: true,
				awayTeamId: true,
				homeScore: true,
				awayScore: true,
				status: true,
			},
		}),
	]);

	if (countedMatches.length === 0) return { standings: [], jornada: null };

	const rows = leagueTeams.map((team) => {
		let wins = 0,
			draws = 0,
			losses = 0,
			goalsFor = 0,
			goalsAgainst = 0;

		for (const m of countedMatches) {
			const isHome = m.homeTeamId === team.id;
			const isAway = m.awayTeamId === team.id;
			if (!isHome && !isAway) continue;

			// Goles efectivos: W.O. = 3-0 para el ganador
			let homeGoals: number, awayGoals: number;
			if (m.status === "walkover_home") {
				homeGoals = 3;
				awayGoals = 0;
			} else if (m.status === "walkover_away") {
				homeGoals = 0;
				awayGoals = 3;
			} else {
				homeGoals = m.homeScore ?? 0;
				awayGoals = m.awayScore ?? 0;
			}

			const myGoals = isHome ? homeGoals : awayGoals;
			const theirGoals = isHome ? awayGoals : homeGoals;
			goalsFor += myGoals;
			goalsAgainst += theirGoals;

			if (myGoals > theirGoals) wins++;
			else if (myGoals === theirGoals) draws++;
			else losses++;
		}

		const played = wins + draws + losses;
		const points = wins * 3 + draws;

		// Forma idéntica a los snapshot rows para que la plantilla pública no cambie
		return {
			id: team.id,
			team: { id: team.id, name: team.name },
			played,
			wins,
			draws,
			losses,
			goalsFor,
			goalsAgainst,
			points,
		};
	});

	const sorted = rows.sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const aDiff = a.goalsFor - a.goalsAgainst;
		const bDiff = b.goalsFor - b.goalsAgainst;
		if (bDiff !== aDiff) return bDiff - aDiff;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		return a.team.name.localeCompare(b.team.name);
	});

	return { standings: sorted, jornada: null };
}

/**
 * Obtiene el top de goleadores del último snapshot para una liga.
 */
export async function getLatestTopScorers(leagueId: string, limit = 10) {
	return db
		.select({
			playerId: playerSeasonStats.globalPlayerId,
			fullName: globalPlayers.fullName,
			alias: sql<string | null>`null`,
			goals: playerSeasonStats.goals,
			assists: playerSeasonStats.assists,
			matchesPlayed: playerSeasonStats.matchesPlayed,
			teamName: teams.name,
		})
		.from(playerSeasonStats)
		.innerJoin(globalPlayers, eq(playerSeasonStats.globalPlayerId, globalPlayers.id))
		.innerJoin(teams, eq(playerSeasonStats.teamId, teams.id))
		.where(eq(playerSeasonStats.leagueId, leagueId))
		.orderBy(desc(playerSeasonStats.goals), desc(playerSeasonStats.assists))
		.limit(limit);
}

/**
 * Obtiene el historial de posiciones por jornada para un equipo.
 * Usado en el gráfico de evolución dentro de la página de liga.
 */
export async function getStandingsHistory(leagueId: string) {
	const rows = await db.query.teamStandingsSnapshot.findMany({
		where: eq(teamStandingsSnapshot.leagueId, leagueId),
		with: { team: { columns: { id: true, name: true } } },
		orderBy: [asc(teamStandingsSnapshot.jornada)],
	});
	return rows;
}

// ---------------------------------------------------------------------------
// Público — jornadas (sorteo)
// ---------------------------------------------------------------------------

export type PublicMatchInfo = {
	matchId: string;
	homeTeamName: string;
	awayTeamName: string;
	venueName: string | null;
	/** ISO string, null si no hay hora definida */
	kickoffAt: string | null;
};

export type PublicMatchday = {
	id: string;
	number: number;
	phase: string;
	scheduledDate: string;
	status: string;
	matches: PublicMatchInfo[];
	/** true si el sorteo fue confirmado/actualizado en las últimas 48h */
	recentlyUpdated: boolean;
	/** ISO string del último insert de partido en esta jornada, o null */
	lastConfirmedAt: string | null;
};

/**
 * Devuelve las jornadas publicadas/en progreso/completadas de una liga,
 * con sus partidos y metadatos de actualización reciente.
 * Usada en la página pública /org/[slug]/[leagueSlug].
 */
export async function getPublicMatchdays(leagueId: string): Promise<PublicMatchday[]> {
	// 1. Traer jornadas visibles con MAX(matches.createdAt) por jornada
	const jornadasRows = await db
		.select({
			id: matchdays.id,
			number: matchdays.number,
			phase: matchdays.phase,
			scheduledDate: matchdays.scheduledDate,
			status: matchdays.status,
			lastConfirmedAt: sql<Date | null>`max(${matches.createdAt})`,
		})
		.from(matchdays)
		.leftJoin(matches, eq(matches.matchdayId, matchdays.id))
		.where(
			and(
				eq(matchdays.leagueId, leagueId),
				sql`${matchdays.status} IN ('published', 'in_progress', 'completed')`,
			),
		)
		.groupBy(matchdays.id)
		.orderBy(asc(matchdays.number));

	if (jornadasRows.length === 0) return [];

	const matchdayIds = jornadasRows.map((j) => j.id);

	// 2. Traer todos los partidos de estas jornadas con nombres de equipo y cancha
	const homeTeams = alias(teams, "home_teams");
	const awayTeams = alias(teams, "away_teams");

	const matchRows = await db
		.select({
			matchId: matches.id,
			matchdayId: matches.matchdayId,
			homeTeamName: homeTeams.name,
			awayTeamName: awayTeams.name,
			venueName: venues.name,
			kickoffAt: matches.kickoffAt,
		})
		.from(matches)
		.innerJoin(homeTeams, eq(homeTeams.id, matches.homeTeamId))
		.innerJoin(awayTeams, eq(awayTeams.id, matches.awayTeamId))
		.leftJoin(venues, eq(venues.id, matches.venueId))
		.where(inArray(matches.matchdayId, matchdayIds))
		.orderBy(asc(matches.kickoffAt));

	// 3. Agrupar partidos por jornada (kickoffAt todavía como Date | null aquí)
	type MatchRaw = {
		matchId: string;
		homeTeamName: string;
		awayTeamName: string;
		venueName: string | null;
		kickoffAt: Date | null;
	};
	const matchesByMatchday = new Map<string, MatchRaw[]>();
	for (const row of matchRows) {
		if (!row.matchdayId) continue;
		const list = matchesByMatchday.get(row.matchdayId) ?? [];
		list.push({
			matchId: row.matchId,
			homeTeamName: row.homeTeamName,
			awayTeamName: row.awayTeamName,
			venueName: row.venueName ?? null,
			kickoffAt: row.kickoffAt ?? null,
		});
		matchesByMatchday.set(row.matchdayId, list);
	}

	const now = Date.now();
	const MS_48H = 48 * 60 * 60 * 1000;

	// 4. Construir resultado final — serializar fechas a ISO string para la
	//    frontera Server → Client Component (Next.js no acepta Date como prop)
	return jornadasRows.map((j) => {
		const lastConfirmedAt = j.lastConfirmedAt ? new Date(j.lastConfirmedAt) : null;
		const recentlyUpdated = lastConfirmedAt ? now - lastConfirmedAt.getTime() <= MS_48H : false;
		return {
			id: j.id,
			number: j.number,
			phase: j.phase,
			scheduledDate: j.scheduledDate,
			status: j.status,
			matches: (matchesByMatchday.get(j.id) ?? []).map((m) => ({
				...m,
				kickoffAt: m.kickoffAt ? new Date(m.kickoffAt).toISOString() : null,
			})),
			recentlyUpdated,
			lastConfirmedAt: lastConfirmedAt ? lastConfirmedAt.toISOString() : null,
		};
	});
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/** Crea una nueva organización. */
export async function createOrganization(
	input: CreateOrganizationInput,
): Promise<typeof organizations.$inferSelect> {
	const [org] = await db
		.insert(organizations)
		.values({
			name: input.name,
			slug: input.slug,
			logoUrl: input.logoUrl,
			city: input.city,
		})
		.returning();
	return org;
}

/** Actualiza una organización existente. */
export async function updateOrganization(
	id: string,
	input: UpdateOrganizationInput,
): Promise<typeof organizations.$inferSelect | null> {
	const [updated] = await db
		.update(organizations)
		.set({
			...(input.name !== undefined && { name: input.name }),
			...(input.slug !== undefined && { slug: input.slug }),
			...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
			...(input.city !== undefined && { city: input.city }),
		})
		.where(eq(organizations.id, id))
		.returning();
	return updated ?? null;
}

/** Elimina una organización. Solo debería usarse si no tiene ligas activas. */
export async function deleteOrganization(id: string): Promise<boolean> {
	const result = await db
		.delete(organizations)
		.where(eq(organizations.id, id))
		.returning({ id: organizations.id });
	return result.length > 0;
}

/** Asigna un usuario a una organización (o lo desvincula con null). */
export async function setUserOrganization(
	userId: string,
	organizationId: string | null,
): Promise<void> {
	await db.update(users).set({ organizationId }).where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Showcase de ligas — homepage pública
// ---------------------------------------------------------------------------

export type LeagueShowcaseItem = {
	id: string;
	name: string;
	city: string;
	season: string;
	teamCount: number;
	playerCount: number;
	topScorer: { fullName: string; alias: string | null; goals: number } | null;
	/** Slug de la organización dueña de la liga. Null si la liga no tiene org. */
	orgSlug: string | null;
	/** Slug de la propia liga. Null si aún no fue asignado. */
	leagueSlug: string | null;
};

/**
 * Devuelve las ligas activas de una ciudad con datos de resumen para la
 * vitrina de la homepage: número de equipos, jugadores y goleador actual.
 */
export async function getLeaguesShowcase(city: string, limit = 6): Promise<LeagueShowcaseItem[]> {
	const activeLeagues = await db.query.leagues.findMany({
		where: and(eq(leagues.city, city), eq(leagues.status, "active")),
		with: {
			teams: { columns: { id: true } },
			// Include org status so we can filter out trial orgs below
			organization: { columns: { slug: true, status: true } },
		},
		orderBy: [desc(leagues.createdAt)],
		// Fetch extra to account for trial org filtering
		limit: limit * 3,
	});

	// Only show leagues from verified organizations in public cross-org views
	const verifiedLeagues = activeLeagues
		.filter((l) => l.organization?.status === "verified")
		.slice(0, limit);

	if (verifiedLeagues.length === 0) return [];

	const leagueIds = verifiedLeagues.map((l) => l.id);

	// Conteo de jugadores y datos de goleadores en paralelo
	const [playerCounts, scorerRows] = await Promise.all([
		db
			.select({
				leagueId: playerSeasonStats.leagueId,
				count: sql<number>`count(*)`,
			})
			.from(playerSeasonStats)
			.where(inArray(playerSeasonStats.leagueId, leagueIds))
			.groupBy(playerSeasonStats.leagueId),

		db
			.select({
				leagueId: playerSeasonStats.leagueId,
				fullName: globalPlayers.fullName,
				alias: sql<string | null>`null`,
				goals: playerSeasonStats.goals,
			})
			.from(playerSeasonStats)
			.innerJoin(globalPlayers, eq(playerSeasonStats.globalPlayerId, globalPlayers.id))
			.where(inArray(playerSeasonStats.leagueId, leagueIds))
			.orderBy(desc(playerSeasonStats.goals), desc(playerSeasonStats.assists)),
	]);

	// Construir mapas para O(1) lookup
	const playerCountMap = new Map(playerCounts.map((r) => [r.leagueId, Number(r.count)]));

	// Top scorer por liga: primer row encontrado por leagueId (ya vienen ordenados)
	const topScorerMap = new Map<string, (typeof scorerRows)[0]>();
	for (const row of scorerRows) {
		if (!topScorerMap.has(row.leagueId)) {
			topScorerMap.set(row.leagueId, row);
		}
	}

	return verifiedLeagues.map((league) => {
		const scorer = topScorerMap.get(league.id) ?? null;
		return {
			id: league.id,
			name: league.name,
			city: league.city,
			season: league.season ?? "",
			teamCount: league.teams.length,
			playerCount: playerCountMap.get(league.id) ?? 0,
			topScorer: scorer
				? { fullName: scorer.fullName, alias: scorer.alias, goals: scorer.goals }
				: null,
			orgSlug: league.organization?.slug ?? null,
			leagueSlug: league.slug ?? null,
		};
	});
}

// ---------------------------------------------------------------------------
// Hub público — datos de resumen para la página de organización
// ---------------------------------------------------------------------------

export type LeagueSnapshot = {
	leader: { teamName: string; points: number } | null;
	topScorer: { fullName: string; alias: string | null; goals: number } | null;
	lastJornada: number | null;
};

export type OrgHubStats = {
	totalGoals: number;
	lastJornada: number | null;
};

/**
 * Retorna el líder de tabla, top goleador y última jornada de una liga.
 * Usado en las cards del hub de organización.
 */
export async function getLeagueSnapshot(leagueId: string): Promise<LeagueSnapshot> {
	const jornadaRows = await db
		.select({ max: sql<number>`max(${teamStandingsSnapshot.jornada})` })
		.from(teamStandingsSnapshot)
		.where(eq(teamStandingsSnapshot.leagueId, leagueId));

	const lastJornada = jornadaRows[0]?.max ?? null;

	const [leaderRow, scorerRows] = await Promise.all([
		lastJornada
			? db.query.teamStandingsSnapshot.findFirst({
					where: and(
						eq(teamStandingsSnapshot.leagueId, leagueId),
						eq(teamStandingsSnapshot.jornada, lastJornada),
					),
					with: { team: { columns: { name: true } } },
					orderBy: [desc(teamStandingsSnapshot.points)],
				})
			: Promise.resolve(null),
		db
			.select({
				fullName: globalPlayers.fullName,
				alias: sql<string | null>`null`,
				goals: playerSeasonStats.goals,
			})
			.from(playerSeasonStats)
			.innerJoin(globalPlayers, eq(playerSeasonStats.globalPlayerId, globalPlayers.id))
			.where(eq(playerSeasonStats.leagueId, leagueId))
			.orderBy(desc(playerSeasonStats.goals))
			.limit(1),
	]);

	return {
		lastJornada,
		leader: leaderRow ? { teamName: leaderRow.team.name, points: leaderRow.points } : null,
		topScorer: scorerRows[0]
			? {
					fullName: scorerRows[0].fullName,
					alias: scorerRows[0].alias,
					goals: scorerRows[0].goals,
				}
			: null,
	};
}

// ---------------------------------------------------------------------------
// Zonas de clasificación pública
// ---------------------------------------------------------------------------

export type PublicZone = {
	id: string;
	name: string;
	fromPosition: number;
	toPosition: number;
	color: string;
};

/**
 * Retorna las zonas de clasificación de una liga, ordenadas por `order` y posición.
 * Se usa tanto en la página pública como en la admin.
 */
export async function getLeagueZones(leagueId: string): Promise<PublicZone[]> {
	const rows = await db.query.leaguePlayoffZones.findMany({
		where: eq(leaguePlayoffZones.leagueId, leagueId),
		orderBy: [asc(leaguePlayoffZones.order), asc(leaguePlayoffZones.fromPosition)],
	});

	return rows.map((z) => ({
		id: z.id,
		name: z.name,
		fromPosition: z.fromPosition,
		toPosition: z.toPosition,
		color: z.color,
	}));
}

/**
 * Retorna el total de goles y la última jornada registrada en toda la organización.
 * Usado en el strip de stats del hub.
 */
export async function getOrgHubStats(orgId: string): Promise<OrgHubStats> {
	const orgLeagues = await db
		.select({ id: leagues.id })
		.from(leagues)
		.where(eq(leagues.organizationId, orgId));

	const leagueIds = orgLeagues.map((l) => l.id);
	if (leagueIds.length === 0) return { totalGoals: 0, lastJornada: null };

	const [goalsResult, jornadaResult] = await Promise.all([
		db
			.select({
				total: sql<number>`coalesce(sum(${playerSeasonStats.goals}), 0)`,
			})
			.from(playerSeasonStats)
			.where(inArray(playerSeasonStats.leagueId, leagueIds)),
		db
			.select({ max: sql<number>`max(${teamStandingsSnapshot.jornada})` })
			.from(teamStandingsSnapshot)
			.where(inArray(teamStandingsSnapshot.leagueId, leagueIds)),
	]);

	return {
		totalGoals: Number(goalsResult[0]?.total ?? 0),
		lastJornada: jornadaResult[0]?.max ?? null,
	};
}

// ---------------------------------------------------------------------------
// Verificaciones pendientes — panel del owner
// ---------------------------------------------------------------------------

export type PendingVerification = {
	id: string;
	name: string;
	slug: string;
	city: string;
	verificationRequestedAt: Date;
	organizer: { name: string; email: string } | null;
};

/**
 * Returns organizations in trial mode that have requested verification.
 * Used in /admin/verifications (owner-only panel).
 */
export async function listPendingVerifications(): Promise<PendingVerification[]> {
	const orgs = await db.query.organizations.findMany({
		where: and(eq(organizations.status, "trial"), isNotNull(organizations.verificationRequestedAt)),
		orderBy: [asc(organizations.verificationRequestedAt)],
	});

	if (orgs.length === 0) return [];

	const orgIds = orgs.map((o) => o.id);

	// Get the first organizer user for each org (to show contact info)
	const organizers = await db.query.users.findMany({
		where: and(inArray(users.organizationId, orgIds), eq(users.role, "organizer")),
		columns: { organizationId: true, name: true, email: true },
	});

	const organizerMap = new Map(organizers.map((u) => [u.organizationId, u]));

	return orgs.map((org) => ({
		id: org.id,
		name: org.name,
		slug: org.slug,
		city: org.city,
		verificationRequestedAt: org.verificationRequestedAt!,
		organizer: organizerMap.get(org.id) ?? null,
	}));
}

/**
 * Marks an organization as verified.
 * Returns the updated org and the organizer's email for sending confirmation.
 */
export async function approveOrganization(orgId: string): Promise<{
	org: typeof organizations.$inferSelect;
	organizerEmail: string | null;
	organizerName: string | null;
} | null> {
	const [updated] = await db
		.update(organizations)
		.set({ status: "verified", verificationRequestedAt: null })
		.where(eq(organizations.id, orgId))
		.returning();

	if (!updated) return null;

	const organizer = await db.query.users.findFirst({
		where: and(eq(users.organizationId, orgId), eq(users.role, "organizer")),
		columns: { email: true, name: true },
	});

	return {
		org: updated,
		organizerEmail: organizer?.email ?? null,
		organizerName: organizer?.name ?? null,
	};
}
