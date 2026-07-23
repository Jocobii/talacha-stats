/**
 * entities/player/queries.ts
 * Acceso a DB para el perfil de jugador cross-liga.
 *
 * Migrado a V2 (julio 2026): `playerId` es ahora un `global_players.id`
 * (mismo id que usan ranking/matchday/roster) — antes `getPlayerProfile`
 * buscaba en la tabla `players` (V1), un espacio de ids distinto del que
 * usaba el resto del sitio para armar los links a `/player/[id]`. Cualquier
 * jugador dado de alta vía admin-registration (V2) daba 404.
 *
 * Fuentes de stats (prioridad, §1 AGENTS.md) — resueltas por liga en
 * entities/player/live-stats.ts:
 *  1. player_season_stats  → importadas desde Excel (histórico, V1)
 *  2. match_player_stats    → cálculo en vivo desde la cédula (V2) cuando la
 *     liga no tiene import de Excel. Antes el fallback leía `match_events`,
 *     tabla que nadie escribe en producción (solo el simulador) — el
 *     fallback nunca traía datos reales.
 */

import { eq, and, or, isNull, inArray, desc, asc, sql, ilike } from "drizzle-orm";
import {
	db,
	matchEvents,
	playerSeasonStatsSnapshot,
	leagues,
	teams,
	globalPlayers,
	leagueMembers,
	inscriptions,
} from "@/db";
import type {
	PlayerView,
	PlayerLeagueStats,
	PlayerGlobalProfile,
	PlayerEgoStats,
	PlayerPositions,
	PlayerTeamGoalShare,
	PlayerBadge,
	PlayerListItem,
} from "./model";
import { getPlayerPositions } from "./ranking";
import {
	getMergedLeagueStatsRows,
	getLivePlayerMatchGoals,
	getLeagueIdsWithSeasonStats,
} from "./live-stats";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

// ── Función principal ─────────────────────────────────────────────────────────

export async function getPlayerProfile(globalPlayerId: string): Promise<PlayerView | null> {
	// 1. Datos básicos del jugador (identidad, §14 AGENTS.md)
	const player = await getGlobalPlayerBasic(globalPlayerId);
	if (!player) return null;

	// 2. Todas las ligas en las que es miembro (league_members + inscripción de equipo)
	const memberships = await getPlayerLeagueMemberships(globalPlayerId);

	if (memberships.length === 0) {
		return {
			id: player.id,
			fullName: player.fullName,
			// global_players no tiene alias/phone (solo existían en la tabla V1
			// `players`). `phone` además vive en league_members (dato privado por
			// liga, §14) — no corresponde exponerlo en el perfil público aunque
			// existiera.
			alias: null,
			phone: null,
			photoUrl: player.avatarUrl,
			global: emptyGlobal(),
			leagues: [],
		};
	}

	// 3. Stats por liga — fuente combinada (Excel o en vivo, por liga)
	const leagueIds = memberships.map((m) => m.leagueId);
	const statsByLeague = new Map(
		(await getMergedLeagueStatsRows(leagueIds))
			.filter((r) => r.playerId === globalPlayerId)
			.map((r) => [r.leagueId, r] as const),
	);

	// 4. Status efectivo de cada liga (explícito + auto-detección de sucesor)
	const finishedIds = await resolveFinishedLeagues(leagueIds);

	// 5. Construir stats por liga
	const leagueStats: PlayerLeagueStats[] = memberships.map((m) => {
		const s = statsByLeague.get(m.leagueId);
		const goals = s?.goals ?? 0;
		const assists = s?.assists ?? 0;
		const matchesPlayed = s?.matches ?? 0;
		const gpm = matchesPlayed > 0 ? round2(goals / matchesPlayed) : 0;

		return {
			leagueId: m.leagueId,
			leagueName: m.leagueName,
			dayOfWeek: m.dayOfWeek,
			season: m.season,
			city: m.city,
			teamId: m.teamId,
			teamName: m.teamName ?? "—",
			goals,
			assists,
			contributions: goals + assists,
			yellowCards: s?.yellowCards ?? 0,
			redCards: s?.redCards ?? 0,
			mvpCount: 0, // no se captura en la cédula ni en player_season_stats
			matchesPlayed,
			goalsPerMatch: gpm,
			source: s?.source ?? "live_match_stats",
			leagueStatus: finishedIds.has(m.leagueId) ? "finished" : "active",
		};
	});

	// 6. Ordenar: activas primero, luego por goles → asistencias → nombre
	leagueStats.sort((a, b) => {
		if (a.leagueStatus !== b.leagueStatus) {
			return a.leagueStatus === "active" ? -1 : 1;
		}
		if (b.goals !== a.goals) return b.goals - a.goals;
		if (b.assists !== a.assists) return b.assists - a.assists;
		return a.leagueName.localeCompare(b.leagueName);
	});

	// 7. Stats globales
	const global = computeGlobal(leagueStats);

	return {
		id: player.id,
		fullName: player.fullName,
		alias: null,
		phone: null,
		photoUrl: player.avatarUrl,
		global,
		leagues: leagueStats,
	};
}

// ── Membresías de liga para el perfil público ─────────────────────────────────
// A diferencia de getGlobalPlayerLeagueMembers (admin, con siloing de
// internalNotes/institutionPhotoUrl), esta versión es pública y trae los
// campos de liga que necesita PlayerLeagueStats (dayOfWeek/season/city).

type ProfileLeagueMembership = {
	leagueId: string;
	leagueName: string;
	dayOfWeek: string;
	season: string;
	city: string;
	teamId: string | null;
	teamName: string | null;
};

async function getPlayerLeagueMemberships(
	globalPlayerId: string,
): Promise<ProfileLeagueMembership[]> {
	const rows = await db
		.select({
			leagueId: leagueMembers.leagueId,
			leagueName: leagues.name,
			dayOfWeek: leagues.dayOfWeek,
			season: leagues.season,
			city: leagues.city,
			teamId: inscriptions.teamId,
			teamName: teams.name,
		})
		.from(leagueMembers)
		.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.leftJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(eq(leagueMembers.globalPlayerId, globalPlayerId))
		.orderBy(desc(leagues.createdAt));

	return rows.map((r) => ({ ...r, teamId: r.teamId ?? null, teamName: r.teamName ?? null }));
}

// ── Resolución de status de ligas ─────────────────────────────────────────────
// Una liga se considera "finished" si:
//   1. Su campo status = 'finished' (cierre explícito del admin), O
//   2. Existe una liga con el mismo nombre + dayOfWeek + ciudad creada después
//      (significa que fue reiniciada con "Nueva temporada" o manualmente).
//
// Esta función se ejecuta en cada carga del perfil — sin cron job necesario.

async function resolveFinishedLeagues(leagueIds: string[]): Promise<Set<string>> {
	if (leagueIds.length === 0) return new Set();

	const l1 = leagues;

	const rows = await db
		.select({ id: l1.id })
		.from(l1)
		.where(
			and(
				inArray(l1.id, leagueIds),
				sql`(
          ${l1.status} = 'finished'
          OR EXISTS (
            SELECT 1 FROM leagues l2
            WHERE l2.name      = ${l1.name}
              AND l2.day_of_week = ${l1.dayOfWeek}
              AND l2.city       = ${l1.city}
              AND l2.created_at > ${l1.createdAt}
              AND l2.id        != ${l1.id}
          )
        )`,
			),
		);

	return new Set(rows.map((r) => r.id));
}

// ── Perfil scoped a una org (docs/SUBDOMINIOS-MULTITENANT.md §3, §9.5) ───────
// Alcance decidido: en el subdominio de una org solo se ven los números del
// jugador EN ESA ORG (el mismo global_player puede jugar en varias orgs).
// Reutiliza getPlayerProfile (misma fuente de stats, cero lógica duplicada)
// y recorta `leagues` a las que pertenecen a la org — sin volver a tocar
// live-stats.ts. Si el jugador no tiene actividad en esas ligas, null
// (la page hace notFound(): no existe "su" perfil en esta org).

export async function getPlayerProfileForLeagues(
	globalPlayerId: string,
	leagueIds: readonly string[],
): Promise<PlayerView | null> {
	const profile = await getPlayerProfile(globalPlayerId);
	if (!profile) return null;

	const scopeIds = new Set(leagueIds);
	const scopedLeagues = profile.leagues.filter((l) => scopeIds.has(l.leagueId));
	if (scopedLeagues.length === 0) return null;

	return { ...profile, global: computeGlobal(scopedLeagues), leagues: scopedLeagues };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeGlobal(leagues: PlayerLeagueStats[]): PlayerGlobalProfile {
	const totalGoals = leagues.reduce((s, l) => s + l.goals, 0);
	const totalAssists = leagues.reduce((s, l) => s + l.assists, 0);
	const totalMatches = leagues.reduce((s, l) => s + l.matchesPlayed, 0);
	const totalYellow = leagues.reduce((s, l) => s + l.yellowCards, 0);
	const totalRed = leagues.reduce((s, l) => s + l.redCards, 0);
	const totalMvp = leagues.reduce((s, l) => s + l.mvpCount, 0);

	return {
		totalGoals,
		totalAssists,
		totalContributions: totalGoals + totalAssists,
		totalYellowCards: totalYellow,
		totalRedCards: totalRed,
		totalMvp,
		totalMatches,
		leaguesCount: leagues.length,
		goalsPerMatch: totalMatches > 0 ? round2(totalGoals / totalMatches) : 0,
	};
}

function emptyGlobal(): PlayerGlobalProfile {
	return {
		totalGoals: 0,
		totalAssists: 0,
		totalContributions: 0,
		totalYellowCards: 0,
		totalRedCards: 0,
		totalMvp: 0,
		totalMatches: 0,
		leaguesCount: 0,
		goalsPerMatch: 0,
	};
}

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

// ── Player Ego Stats ──────────────────────────────────────────────────────────
// Todos los cálculos que alimentan el perfil público (ranking, racha, badges).
// Sin dependencia del resultado de getPlayerProfile — queries propias.

export async function getPlayerEgoStats(globalPlayerId: string): Promise<PlayerEgoStats> {
	const memberships = await getPlayerLeagueMemberships(globalPlayerId);
	if (memberships.length === 0) return emptyEgoStats();

	const leagueIds = memberships.map((m) => m.leagueId);
	const statsRows = (await getMergedLeagueStatsRows(leagueIds)).filter(
		(r) => r.playerId === globalPlayerId,
	);

	const [streak, hatTricks, mvpCount] = await Promise.all([
		fetchGoalStreak(globalPlayerId, leagueIds),
		fetchHatTricks(globalPlayerId, leagueIds),
		fetchMvpCount(globalPlayerId),
	]);

	if (statsRows.length === 0) {
		return emptyEgoStats();
	}

	// Liga con más goles para el scope de posiciones
	const bestRow = statsRows.reduce((a, b) => (b.goals > a.goals ? b : a));

	const positions = await getPlayerPositions(globalPlayerId, {
		leagueId: bestRow.leagueId,
		city: bestRow.city,
	});

	const cityTopPercent =
		positions.city && positions.city.goals > 0 && positions.city.total > 0
			? Math.ceil((positions.city.rank / positions.city.total) * 100)
			: null;

	const normalizedRows = statsRows.map((r) => ({
		leagueId: r.leagueId,
		leagueName: r.leagueName,
		teamId: r.teamId,
		teamName: r.teamName ?? "—",
		goals: r.goals,
		matchesPlayed: r.matches,
	}));

	const teamGoalShares = await fetchTeamGoalShares(normalizedRows);
	const leaguesCount = new Set(statsRows.map((r) => r.leagueId)).size;
	const totalMatches = statsRows.reduce((s, r) => s + r.matches, 0);
	const totalGoals = statsRows.reduce((s, r) => s + r.goals, 0);
	const overallGPM = totalMatches > 0 ? totalGoals / totalMatches : 0;
	const badges = computeBadges(
		positions,
		leaguesCount,
		mvpCount,
		streak,
		hatTricks,
		totalMatches,
		overallGPM,
	);

	return { positions, cityTopPercent, goalStreak: streak, hatTricks, teamGoalShares, badges };
}

// ── Helpers de ego stats ──────────────────────────────────────────────────────
// Fuente combinada: playerSeasonStatsSnapshot (Excel, por jornada) para ligas
// con import; cálculo en vivo desde match_player_stats (por partido, vía
// getLivePlayerMatchGoals) para ligas sin import. Nunca se mezclan ambas
// fuentes para la MISMA liga (getLeagueIdsWithSeasonStats decide).

async function splitLeaguesBySnapshotSource(
	leagueIds: string[],
): Promise<{ snapshotLeagueIds: string[]; liveLeagueIds: string[] }> {
	const withSeasonStats = await getLeagueIdsWithSeasonStats(leagueIds);
	return {
		snapshotLeagueIds: leagueIds.filter((id) => withSeasonStats.has(id)),
		liveLeagueIds: leagueIds.filter((id) => !withSeasonStats.has(id)),
	};
}

// Racha activa: partidos/jornadas consecutivas con goles > 0 desde el más reciente.
async function fetchGoalStreak(globalPlayerId: string, leagueIds: string[]): Promise<number> {
	const { snapshotLeagueIds, liveLeagueIds } = await splitLeaguesBySnapshotSource(leagueIds);
	let bestStreak = 0;

	if (snapshotLeagueIds.length > 0) {
		const rows = await db
			.select({
				leagueId: playerSeasonStatsSnapshot.leagueId,
				jornada: playerSeasonStatsSnapshot.jornada,
				goals: playerSeasonStatsSnapshot.goals,
			})
			.from(playerSeasonStatsSnapshot)
			.where(
				and(
					eq(playerSeasonStatsSnapshot.globalPlayerId, globalPlayerId),
					inArray(playerSeasonStatsSnapshot.leagueId, snapshotLeagueIds),
				),
			)
			.orderBy(desc(playerSeasonStatsSnapshot.leagueId), desc(playerSeasonStatsSnapshot.jornada));

		// Agrupar por liga manteniendo orden jornada desc
		const byLeague = new Map<string, { jornada: number; goals: number }[]>();
		for (const r of rows) {
			if (!byLeague.has(r.leagueId)) byLeague.set(r.leagueId, []);
			byLeague.get(r.leagueId)!.push({ jornada: r.jornada, goals: r.goals });
		}

		for (const snaps of byLeague.values()) {
			// snaps ya viene ordenado desc por jornada — goals es cumulativo, se
			// compara contra la jornada siguiente (delta > 0 = anotó esa jornada)
			let streak = 0;
			for (let i = 0; i < snaps.length; i++) {
				const prev = snaps[i + 1];
				const delta = snaps[i].goals - (prev?.goals ?? 0);
				if (delta > 0) streak++;
				else break;
			}
			if (streak > bestStreak) bestStreak = streak;
		}
	}

	if (liveLeagueIds.length > 0) {
		// match_player_stats.goals ya es por partido (no cumulativo) — no hace
		// falta calcular delta contra el partido anterior.
		const liveRows = await getLivePlayerMatchGoals(globalPlayerId, liveLeagueIds);
		const byLeague = new Map<string, number[]>(); // goles por partido, más reciente primero
		for (const r of liveRows) {
			if (!byLeague.has(r.leagueId)) byLeague.set(r.leagueId, []);
			byLeague.get(r.leagueId)!.unshift(r.goals);
		}
		for (const goalsDesc of byLeague.values()) {
			let streak = 0;
			for (const g of goalsDesc) {
				if (g > 0) streak++;
				else break;
			}
			if (streak > bestStreak) bestStreak = streak;
		}
	}

	return bestStreak;
}

// Hat-tricks: partidos/jornadas donde el jugador anotó ≥ 3 goles.
async function fetchHatTricks(globalPlayerId: string, leagueIds: string[]): Promise<number> {
	const { snapshotLeagueIds, liveLeagueIds } = await splitLeaguesBySnapshotSource(leagueIds);
	let total = 0;

	if (snapshotLeagueIds.length > 0) {
		const rows = await db
			.select({
				leagueId: playerSeasonStatsSnapshot.leagueId,
				jornada: playerSeasonStatsSnapshot.jornada,
				goals: playerSeasonStatsSnapshot.goals,
			})
			.from(playerSeasonStatsSnapshot)
			.where(
				and(
					eq(playerSeasonStatsSnapshot.globalPlayerId, globalPlayerId),
					inArray(playerSeasonStatsSnapshot.leagueId, snapshotLeagueIds),
				),
			)
			.orderBy(playerSeasonStatsSnapshot.leagueId, playerSeasonStatsSnapshot.jornada);

		const byLeague = new Map<string, { jornada: number; goals: number }[]>();
		for (const r of rows) {
			if (!byLeague.has(r.leagueId)) byLeague.set(r.leagueId, []);
			byLeague.get(r.leagueId)!.push({ jornada: r.jornada, goals: r.goals });
		}

		for (const snaps of byLeague.values()) {
			for (let i = 0; i < snaps.length; i++) {
				const prevGoals = i > 0 ? snaps[i - 1].goals : 0;
				if (snaps[i].goals - prevGoals >= 3) total++;
			}
		}
	}

	if (liveLeagueIds.length > 0) {
		const liveRows = await getLivePlayerMatchGoals(globalPlayerId, liveLeagueIds);
		total += liveRows.filter((r) => r.goals >= 3).length;
	}

	return total;
}

// MVP: no se captura en la cédula (match_player_stats no tiene columna mvp,
// §live-stats.ts) — esto solo puede traer datos donde match_events sí tiene
// filas (simulador de pruebas). En producción real hoy siempre es 0.
async function fetchMvpCount(globalPlayerId: string): Promise<number> {
	const rows = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(matchEvents)
		.where(and(eq(matchEvents.globalPlayerId, globalPlayerId), eq(matchEvents.eventType, "mvp")));
	return rows[0]?.count ?? 0;
}

type SeasonRow = {
	leagueId: string;
	leagueName: string;
	teamId: string | null;
	teamName: string;
	goals: number;
	matchesPlayed: number;
};

async function fetchTeamGoalShares(seasonRows: SeasonRow[]): Promise<PlayerTeamGoalShare[]> {
	const relevant = seasonRows.filter((r) => r.teamId !== null && r.goals > 0);
	if (relevant.length === 0) return [];

	// Totales del equipo (todos los jugadores) en las mismas ligas — fuente
	// combinada, igual que el resto del módulo.
	const leagueIds = [...new Set(relevant.map((r) => r.leagueId))];
	const allRows = await getMergedLeagueStatsRows(leagueIds);

	const teamTotalMap = new Map<string, number>();
	for (const row of allRows) {
		if (!row.teamId) continue;
		const key = `${row.leagueId}:${row.teamId}`;
		teamTotalMap.set(key, (teamTotalMap.get(key) ?? 0) + row.goals);
	}

	return relevant
		.map((r) => {
			const teamGoals = teamTotalMap.get(`${r.leagueId}:${r.teamId}`) ?? r.goals;
			const sharePercent = teamGoals > 0 ? Math.round((r.goals / teamGoals) * 100) : 0;
			return {
				leagueId: r.leagueId,
				leagueName: r.leagueName,
				teamName: r.teamName,
				playerGoals: r.goals,
				teamGoals,
				sharePercent,
			};
		})
		.filter((s) => s.sharePercent > 0);
}

function computeBadges(
	positions: PlayerPositions,
	leaguesCount: number,
	mvpCount: number,
	goalStreak: number,
	hatTricks: number,
	totalMatches: number,
	goalsPerMatch: number,
): PlayerBadge[] {
	const badges: PlayerBadge[] = [];
	if (positions.league?.rank === 1) badges.push("league_top_scorer");
	if (leaguesCount >= 2) badges.push("multi_league");
	if (goalsPerMatch >= 1.0 && totalMatches >= 5) badges.push("marksman");
	if (goalStreak >= 3) badges.push("on_streak");
	if (mvpCount > 0) badges.push("mvp");
	if (hatTricks > 0) badges.push("hat_trick_club");
	if (totalMatches >= 25) badges.push("veteran");
	return badges;
}

function emptyEgoStats(): PlayerEgoStats {
	return {
		positions: {
			league: null,
			city: null,
			global: { rank: 0, total: 0, goals: 0 },
		},
		cityTopPercent: null,
		goalStreak: 0,
		hatTricks: 0,
		teamGoalShares: [],
		badges: [],
	};
}

// ===========================================================================
// BREAKING CHANGE — Ecosistema de identidad global (admin-ecosystem branch)
//
// Queries para las tres nuevas entidades:
//   GlobalPlayer / LeagueMember / Inscription
//
// Todas las funciones tienen tipos de retorno explícitos (regla TypeScript strict).
// Las que pueden no encontrar un registro retornan null, nunca lanzan.
// ===========================================================================

import { assignNextCredential } from "./lib/assign-credential";
import type {
	GlobalPlayer,
	CreateGlobalPlayer,
	LeagueMember,
	CreateLeagueMember,
	Inscription,
	CreateInscription,
	LeagueMemberView,
} from "./model";

// ---------------------------------------------------------------------------
// GlobalPlayer
// ---------------------------------------------------------------------------

/**
 * Directorio público de jugadores (GET /api/players, §7.4) — migrado a V2.
 *
 * Antes leía `players` + `player_registrations` (V1), que dejaron de recibir
 * escrituras cuando se eliminó `import-excel` (§1.6 AGENTS.md): cualquier
 * jugador dado de alta vía admin-registration (global_players/league_members)
 * nunca aparecía. Ahora la fuente es `league_members` (pertenencia real a una
 * liga) + `global_players` (identidad). `global_players` no tiene columna
 * `alias` (apodo) — ese dato solo existía en V1 — así que el directorio
 * público ya no lo muestra (ver PlayerListItem).
 */
export async function searchDirectoryPlayers(opts: {
	leagueIds: string[];
	q?: string;
	limit: number;
	offset: number;
}): Promise<{ rows: PlayerListItem[]; total: number }> {
	const { leagueIds, q, limit, offset } = opts;
	if (leagueIds.length === 0) return { rows: [], total: 0 };

	const registered = await db
		.selectDistinct({ globalPlayerId: leagueMembers.globalPlayerId })
		.from(leagueMembers)
		.where(inArray(leagueMembers.leagueId, leagueIds));

	const playerIds = registered.map((r) => r.globalPlayerId);
	if (playerIds.length === 0) return { rows: [], total: 0 };

	const searchWhere = q ? ilike(globalPlayers.fullName, `%${q}%`) : undefined;
	const where = searchWhere
		? and(inArray(globalPlayers.id, playerIds), searchWhere)
		: inArray(globalPlayers.id, playerIds);

	const [totalRow, rows] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(globalPlayers)
			.where(where),
		db
			.select({ id: globalPlayers.id, fullName: globalPlayers.fullName })
			.from(globalPlayers)
			.where(where)
			.orderBy(desc(globalPlayers.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return { rows, total: totalRow[0]?.count ?? 0 };
}

/**
 * Cuenta cuántas ligas (league_members) tiene un global_player.
 * Usado en el lookup para mostrar historial en la ventanilla de registro.
 */
export async function countGlobalPlayerLeagueMemberships(globalPlayerId: string): Promise<number> {
	const rows = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(leagueMembers)
		.where(eq(leagueMembers.globalPlayerId, globalPlayerId));
	return rows[0]?.count ?? 0;
}

/**
 * Busca un jugador global por su curp_hash.
 * Es la query central del flujo de registro: el oficinista ingresa el CURP,
 * el feature genera el hash y llama a esta función.
 *
 * Retorna null si el jugador nunca ha sido registrado en el sistema.
 */
export async function findGlobalPlayerByHash(curpHash: string): Promise<GlobalPlayer | null> {
	const row = await db.query.globalPlayers.findFirst({
		where: eq(globalPlayers.curpHash, curpHash),
	});
	if (!row) return null;

	return {
		id: row.id,
		curpHash: row.curpHash,
		fullName: row.fullName,
		birthDate: row.birthDate,
		avatarUrl: row.avatarUrl ?? null,
		createdAt: row.createdAt,
	};
}

/**
 * Inserta un nuevo jugador global y retorna la fila creada.
 * El caller debe asegurarse de que el curpHash no exista previamente
 * (usar findGlobalPlayerByHash antes de llamar a esta función).
 */
export async function createGlobalPlayer(data: CreateGlobalPlayer): Promise<GlobalPlayer> {
	const rows = await db
		.insert(globalPlayers)
		.values({
			curpHash: data.curpHash,
			fullName: data.fullName,
			birthDate: data.birthDate,
			avatarUrl: data.avatarUrl ?? null,
		})
		.returning();

	const row = rows[0];
	if (!row) throw new Error("createGlobalPlayer: insert no retornó ninguna fila");

	return {
		id: row.id,
		curpHash: row.curpHash,
		fullName: row.fullName,
		birthDate: row.birthDate,
		avatarUrl: row.avatarUrl ?? null,
		createdAt: row.createdAt,
	};
}

// ---------------------------------------------------------------------------
// LeagueMember
// ---------------------------------------------------------------------------

/**
 * Busca la membresía de un jugador en una liga específica.
 * Usado para verificar si el jugador ya está inscrito antes de crear
 * una nueva membresía (evitar duplicados en el flujo de registro).
 */
export async function findLeagueMember(
	globalPlayerId: string,
	leagueId: string,
): Promise<LeagueMember | null> {
	const row = await db.query.leagueMembers.findFirst({
		where: and(
			eq(leagueMembers.globalPlayerId, globalPlayerId),
			eq(leagueMembers.leagueId, leagueId),
		),
	});
	if (!row) return null;

	return {
		id: row.id,
		globalPlayerId: row.globalPlayerId,
		leagueId: row.leagueId,
		status: row.status,
		dorsal: row.dorsal ?? null,
		inscriptionDate: row.inscriptionDate,
		institutionPhotoUrl: row.institutionPhotoUrl ?? null,
		internalNotes: row.internalNotes ?? null,
		createdAt: row.createdAt,
		credentialCode: row.credentialCode ?? null,
		credentialId: row.credentialId ?? null,
	};
}

/**
 * Crea una nueva membresía (global_player ↔ liga).
 * La constraint UNIQUE(global_player_id, league_id) en la DB es el
 * último guardia — pero el caller debe verificar con findLeagueMember primero
 * para retornar un error legible al usuario.
 */
export async function createLeagueMember(data: CreateLeagueMember): Promise<LeagueMember> {
	const today = new Date().toISOString().slice(0, 10);

	return await db.transaction(async (tx) => {
		// credential_code se asigna en el server, dentro de la misma tx que
		// crea el league_member — nunca lo propone el cliente (ver
		// docs/CREDENCIAL-CODIGO-JUGADOR.md).
		const credentialCode = await assignNextCredential(tx, data.leagueId);

		const rows = await tx
			.insert(leagueMembers)
			.values({
				globalPlayerId: data.globalPlayerId,
				leagueId: data.leagueId,
				status: data.status ?? "active",
				dorsal: data.dorsal ?? null,
				credentialCode,
				inscriptionDate: data.inscriptionDate ?? today,
				institutionPhotoUrl: data.institutionPhotoUrl ?? null,
				internalNotes: data.internalNotes ?? null,
			})
			.returning();

		const row = rows[0];
		if (!row) throw new Error("createLeagueMember: insert no retornó ninguna fila");

		return {
			id: row.id,
			globalPlayerId: row.globalPlayerId,
			leagueId: row.leagueId,
			status: row.status,
			dorsal: row.dorsal ?? null,
			credentialCode: row.credentialCode ?? null,
			credentialId: row.credentialId ?? null,
			inscriptionDate: row.inscriptionDate,
			institutionPhotoUrl: row.institutionPhotoUrl ?? null,
			internalNotes: row.internalNotes ?? null,
			createdAt: row.createdAt,
		};
	});
}

// ---------------------------------------------------------------------------
// Inscription
// ---------------------------------------------------------------------------

/**
 * Inscribe un league_member en un equipo.
 * La constraint UNIQUE(league_member_id) garantiza un solo equipo por jugador
 * por liga. Si ya existe inscripción para ese member, la DB lanzará un error
 * de constraint — el caller (feature) debe manejarlo con onConflict o precheck.
 */
export async function createInscription(data: CreateInscription): Promise<Inscription> {
	const rows = await db
		.insert(inscriptions)
		.values({
			leagueMemberId: data.leagueMemberId,
			teamId: data.teamId,
		})
		.returning();

	const row = rows[0];
	if (!row) throw new Error("createInscription: insert no retornó ninguna fila");

	return {
		id: row.id,
		leagueMemberId: row.leagueMemberId,
		teamId: row.teamId,
		createdAt: row.createdAt,
	};
}

// ---------------------------------------------------------------------------
// Vista combinada — usada por la UI del panel de registro
// ---------------------------------------------------------------------------

/**
 * Retorna la vista combinada de un jugador en el contexto de una liga:
 * datos globales + membresía + equipo asignado (si existe).
 *
 * Data siloing: institution_photo_url e internal_notes solo se devuelven
 * aquí porque la query ya está scoped a una liga específica.
 *
 * Retorna null si el jugador no es miembro de la liga.
 */
export async function findLeagueMemberView(
	globalPlayerId: string,
	leagueId: string,
): Promise<LeagueMemberView | null> {
	const rows = await db
		.select({
			// Campos globales
			id: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			// Membresía
			memberId: leagueMembers.id,
			leagueId: leagueMembers.leagueId,
			status: leagueMembers.status,
			dorsal: leagueMembers.dorsal,
			inscriptionDate: leagueMembers.inscriptionDate,
			// Equipo (nullable — puede no estar inscrito aún)
			teamId: inscriptions.teamId,
			teamName: teams.name,
		})
		.from(globalPlayers)
		.innerJoin(
			leagueMembers,
			and(eq(leagueMembers.globalPlayerId, globalPlayers.id), eq(leagueMembers.leagueId, leagueId)),
		)
		.leftJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(eq(globalPlayers.id, globalPlayerId))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	return {
		id: row.id,
		fullName: row.fullName,
		birthDate: row.birthDate,
		avatarUrl: row.avatarUrl ?? null,
		memberId: row.memberId,
		leagueId: row.leagueId,
		status: row.status,
		dorsal: row.dorsal ?? null,
		inscriptionDate: row.inscriptionDate,
		teamId: row.teamId ?? null,
		teamName: row.teamName ?? null,
	};
}

// ---------------------------------------------------------------------------
// Roster de equipo — jugadores inscritos via tablas V2
// ---------------------------------------------------------------------------

export type TeamRosterEntry = {
	inscriptionId: string;
	memberId: string;
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	dorsal: number | null;
	status: "active" | "suspended" | "inactive";
	inscriptionDate: string;
};

/**
 * Devuelve el roster completo de un equipo usando las tablas V2:
 *   inscriptions → league_members → global_players
 *
 * Ordenado por dorsal (nulls al final, comportamiento por defecto en PG para ASC)
 * y luego por nombre alfabético.
 */
export async function getTeamRoster(teamId: string): Promise<TeamRosterEntry[]> {
	const rows = await db
		.select({
			inscriptionId: inscriptions.id,
			memberId: leagueMembers.id,
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			dorsal: leagueMembers.dorsal,
			status: leagueMembers.status,
			inscriptionDate: leagueMembers.inscriptionDate,
		})
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.innerJoin(globalPlayers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.where(eq(inscriptions.teamId, teamId))
		.orderBy(asc(leagueMembers.dorsal), asc(globalPlayers.fullName));

	return rows.map((r) => ({
		inscriptionId: r.inscriptionId,
		memberId: r.memberId,
		globalPlayerId: r.globalPlayerId,
		fullName: r.fullName,
		birthDate: r.birthDate,
		avatarUrl: r.avatarUrl ?? null,
		dorsal: r.dorsal ?? null,
		status: r.status as TeamRosterEntry["status"],
		inscriptionDate: r.inscriptionDate,
	}));
}

// ---------------------------------------------------------------------------
// Lista de jugadores por organización — para /admin/players
// ---------------------------------------------------------------------------

import type { AnyColumn, SQLWrapper } from "drizzle-orm";
import type { ListQuery, SortRule } from "@/shared/lib/list-query";
import { buildWhere } from "@/shared/lib/list-query";
import { orgPlayerFilters } from "./filters";
import { playerCredentials } from "@/db/schema";
import { computeCredentialDisplayStatus } from "@/entities/player-credential/lib/credential-status";
import { todayIsoDate } from "@/entities/player-credential/lib/dates";
import type {
	CredentialDisplayStatus,
	PlayerCredentialScope,
} from "@/entities/player-credential/model";

export type OrgPlayerRow = {
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	leagueCount: number;
	// Liga/equipo/estado/dorsal de la membresía más reciente que matchea los
	// filtros activos (ver nota de semántica en listOrgPlayers).
	latestLeagueName: string | null;
	latestTeamName: string | null;
	latestStatus: "active" | "suspended" | "inactive" | null;
	latestDorsal: number | null;
	// Estado del pase (docs/CREDENCIAL-PASE-JUGADOR.md) de la membresía más
	// reciente — badge de credencial en la tabla (pantalla C). Campos crudos
	// (scope/validUntil/season) para que el mapper de UI arme el texto de
	// detalle ("Anual · vence...", "Por liga · Apertura 2025"), no se formatea
	// aquí (AGENTS.md §19 — el formateo vive en el mapper, no en la entidad).
	credentialStatus: CredentialDisplayStatus;
	credentialScope: PlayerCredentialScope | null;
	credentialValidUntil: string | null;
	latestLeagueSeason: string | null;
	// Liga de la membresía más reciente — insumo para el botón "Emitir" (pantalla
	// C): el pase se emite/renueva desde el contexto de una liga (ver
	// features/player-credential/issue-credential.ts).
	latestLeagueId: string | null;
};

/**
 * Lista paginada de jugadores "de la organización": los que tienen al menos
 * un league_member en alguna liga de la organización, MÁS los que fueron
 * dados de alta por la organización sin liga todavía (Camino E de
 * admin-registration/register.ts — registeredByOrganizationId). Sin este
 * segundo grupo, un jugador registrado sin liga quedaba invisible para
 * siempre en /admin/players (global_players no tiene otra forma de saber a
 * qué organización pertenece si no hay league_members de por medio).
 *
 * Contrato ListQuery (ver docs/LIST-QUERY-FILTERS.md) — filtros/orden llegan
 * ya normalizados desde parseListQuery en la page. Los filtros (liga/equipo/
 * estado/dorsal) referencian columnas de league_members/teams — un jugador
 * sin liga nunca los matchea, así que naturalmente desaparece de vistas
 * filtradas (correcto: no tiene liga/equipo/estado que filtrar) pero sigue
 * apareciendo en la vista sin filtros.
 *
 * Devuelve jugadores únicos (una fila por global_player): cada fila muestra
 * los datos de la membresía más reciente que cumple los filtros activos (o
 * todo null si el jugador no tiene ninguna membresía). Si se filtra por
 * estado/liga/equipo/dorsal, "más reciente" se calcula sobre el subconjunto
 * de membresías que matchean — así la fila mostrada siempre es consistente
 * con lo que se filtró.
 *
 * Nota: "leagueCount" cuenta las membresías que matchean el filtro (no el
 * total histórico del jugador) — es el trade-off de resolver esto con una
 * window function dentro del WHERE filtrado, en vez de una subquery aparte.
 */
export async function listOrgPlayers(
	organizationId: string,
	query: ListQuery,
): Promise<{ rows: OrgPlayerRow[]; total: number }> {
	const filterWhere = buildWhere(orgPlayerFilters, query.filters);
	// Scope de negocio (nunca es un filtro de usuario): pertenece a la org si
	// tiene una membresía en una liga de la org, O si no tiene ninguna
	// membresía EN ESTA ORG pero la org fue quien lo registró (Camino E).
	// "Sin ninguna membresía en esta org" NO es lo mismo que "sin ninguna
	// membresía en ninguna parte" — un jugador con historial en otra
	// organización sí puede (y debe) matchear este segundo caso. Por eso el
	// JOIN de leagueMembers de abajo está scoped a la org (no es un JOIN
	// abierto): si no estuviera scoped, las membresías de OTRAS orgs
	// "tapaban" el isNull de acá abajo y el jugador quedaba invisible.
	const orgScope = or(
		eq(leagues.organizationId, organizationId),
		and(isNull(leagueMembers.id), eq(globalPlayers.registeredByOrganizationId, organizationId)),
	);
	const where = and(orgScope, filterWhere);
	const offset = (query.page - 1) * query.pageSize;

	const inner = db
		.selectDistinctOn([globalPlayers.id], {
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			leagueCount:
				sql<number>`COUNT(${leagueMembers.id}) OVER (PARTITION BY ${globalPlayers.id})::int`.as(
					"league_count",
				),
			// leagues.name y teams.name colisionan (ambas se llaman "name" en su
			// tabla) — sin alias explícito, Postgres las expone sin distinguir y
			// falla con "column reference \"name\" is ambiguous" al envolver esto
			// en una subquery reusada desde afuera. .as() fuerza un nombre único.
			latestLeagueId: sql<string | null>`${leagues.id}`.as("latest_league_id"),
			latestLeagueName: sql<string | null>`${leagues.name}`.as("latest_league_name"),
			latestTeamName: sql<string | null>`${teams.name}`.as("latest_team_name"),
			// Ahora nullable: LEFT JOIN — un jugador sin ninguna membresía
			// produce una fila con estos campos en null (ver OrgPlayerRow).
			latestStatus: sql<string | null>`${leagueMembers.status}`.as("latest_status"),
			latestDorsal: sql<number | null>`${leagueMembers.dorsal}`.as("latest_dorsal"),
			// Crudos para el badge de credencial (pantalla C) — computados
			// después del fetch, ver fetchCredentialsForRows/buildCredentialFields.
			latestLeagueStatus: sql<string | null>`${leagues.status}`.as("latest_league_status"),
			latestLeagueSeason: sql<string | null>`${leagues.season}`.as("latest_league_season"),
			latestCredentialId: sql<string | null>`${leagueMembers.credentialId}`.as(
				"latest_credential_id",
			),
		})
		.from(globalPlayers)
		// LEFT JOIN (antes INNER) — necesario para no perder a los jugadores sin
		// ninguna membresía en esta org (Camino E). El JOIN va scoped a leagues
		// de ESTA organización (vía el subquery en el ON) — si uniéramos TODAS
		// las membresías del jugador (sin scope), las de otras organizaciones
		// "tapaban" el LEFT JOIN (deja de producir la fila null) y un jugador
		// con historial en otra org quedaba invisible aquí aunque esta org lo
		// hubiera registrado sin liga. El scope de organización para el caso
		// sin membresía se resuelve en orgScope, vía registeredByOrganizationId.
		.leftJoin(
			leagueMembers,
			and(
				eq(leagueMembers.globalPlayerId, globalPlayers.id),
				sql`${leagueMembers.leagueId} IN (SELECT ${leagues.id} FROM ${leagues} WHERE ${leagues.organizationId} = ${organizationId})`,
			),
		)
		.leftJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.leftJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(where)
		// Fija qué fila representa a cada jugador dentro del DISTINCT ON: la
		// membresía más reciente (o la única fila null si no tiene ninguna). El
		// orden visible (nombre/dorsal/ligas) se aplica DESPUÉS, en la query
		// externa — no puede ir aquí porque el DISTINCT ON debe empezar por la
		// columna de agrupación.
		.orderBy(asc(globalPlayers.id), desc(leagues.createdAt))
		.as("org_players");

	const outerOrderBy = buildOrgPlayersOrderBy(inner, query.sort);

	const [rowsResult, countResult] = await Promise.all([
		db
			.select()
			.from(inner)
			.orderBy(...outerOrderBy)
			.limit(query.pageSize)
			.offset(offset),
		db.select({ total: sql<number>`COUNT(*)::int` }).from(inner),
	]);

	const credentialByRow = await fetchCredentialsForRows(rowsResult);

	return {
		rows: rowsResult.map((r) => ({
			globalPlayerId: r.globalPlayerId,
			fullName: r.fullName,
			birthDate: r.birthDate,
			avatarUrl: r.avatarUrl ?? null,
			leagueCount: r.leagueCount,
			latestLeagueId: r.latestLeagueId ?? null,
			latestLeagueName: r.latestLeagueName ?? null,
			latestTeamName: r.latestTeamName ?? null,
			latestStatus: (r.latestStatus as OrgPlayerRow["latestStatus"]) ?? null,
			latestDorsal: r.latestDorsal ?? null,
			latestLeagueSeason: r.latestLeagueSeason ?? null,
			...buildCredentialFields(r, credentialByRow),
		})),
		total: countResult[0]?.total ?? 0,
	};
}

type OrgPlayerInnerRow = {
	latestCredentialId: string | null;
	// null cuando el jugador no tiene ninguna membresía (Camino E, sin liga).
	latestLeagueStatus: string | null;
};

type CredentialRow = Awaited<ReturnType<typeof db.query.playerCredentials.findMany>>[number];

/** Trae en una sola query los player_credentials referidos por la página actual. */
async function fetchCredentialsForRows(
	rows: OrgPlayerInnerRow[],
): Promise<Map<string, CredentialRow>> {
	const ids = [
		...new Set(rows.map((r) => r.latestCredentialId).filter((id): id is string => !!id)),
	];
	if (ids.length === 0) return new Map();

	const credentials = await db.query.playerCredentials.findMany({
		where: inArray(playerCredentials.id, ids),
	});
	return new Map(credentials.map((c) => [c.id, c]));
}

/**
 * Estado del pase de una fila + campos crudos para que el mapper de UI arme
 * el texto de detalle. Sin credencial enlazada -> "pendiente" (§6, §8).
 */
function buildCredentialFields(
	row: OrgPlayerInnerRow,
	credentialByRow: Map<string, CredentialRow>,
): Pick<OrgPlayerRow, "credentialStatus" | "credentialScope" | "credentialValidUntil"> {
	const credential = row.latestCredentialId
		? (credentialByRow.get(row.latestCredentialId) ?? null)
		: null;
	// credential es null cuando latestLeagueStatus es null (sin membresía) —
	// computeCredentialDisplayStatus corta en el primer if y nunca lee este
	// argumento en ese caso; el fallback es solo para satisfacer el tipo.
	return {
		credentialStatus: computeCredentialDisplayStatus(
			credential,
			row.latestLeagueStatus ?? "active",
			todayIsoDate(),
		),
		credentialScope: (credential?.scope as PlayerCredentialScope | undefined) ?? null,
		credentialValidUntil: credential?.validUntil ?? null,
	};
}

/**
 * Orden de la query externa a listOrgPlayers. No usa buildOrderBy genérico
 * porque los campos ordenables (nombre, dorsal, ligas) viven en la subquery
 * "org_players" (alias), no en las columnas originales del FilterMap —
 * buildOrderBy asume columnas de tabla, no de subquery proyectada.
 */
function buildOrgPlayersOrderBy(
	inner: {
		fullName: AnyColumn | SQLWrapper;
		latestDorsal: AnyColumn | SQLWrapper;
		leagueCount: AnyColumn | SQLWrapper;
	},
	sort: SortRule[],
) {
	const clauses = sort.flatMap((rule) => {
		const dir = rule.dir === "desc" ? desc : asc;
		if (rule.field === "nombre") return [dir(inner.fullName)];
		if (rule.field === "dorsal") return [dir(inner.latestDorsal)];
		if (rule.field === "ligas") return [dir(inner.leagueCount)];
		return [];
	});
	return clauses.length > 0 ? clauses : [asc(inner.fullName)];
}

/**
 * Cuenta jugadores únicos (global_player) "de la organización" — mismo
 * criterio que listOrgPlayers: al menos un league_member en alguna liga de
 * la organización, MÁS los registrados por la organización sin liga
 * (registeredByOrganizationId, Camino E). Total sin filtros, usado para
 * distinguir "vacío sin datos" de "vacío por filtros" y para el label "X de Y".
 */
export async function countOrgPlayers(organizationId: string): Promise<number> {
	const rows = await db
		.select({ total: sql<number>`COUNT(DISTINCT ${globalPlayers.id})::int` })
		.from(globalPlayers)
		// JOIN scoped a leagues de esta org — ver comentario largo en
		// listOrgPlayers: sin el scope, un jugador con historial en OTRA
		// organización nunca produce la fila null que necesita isNull(...) más
		// abajo, y quedaba invisible aunque esta org lo hubiera registrado sin liga.
		.leftJoin(
			leagueMembers,
			and(
				eq(leagueMembers.globalPlayerId, globalPlayers.id),
				sql`${leagueMembers.leagueId} IN (SELECT ${leagues.id} FROM ${leagues} WHERE ${leagues.organizationId} = ${organizationId})`,
			),
		)
		.leftJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.where(
			or(
				eq(leagues.organizationId, organizationId),
				and(isNull(leagueMembers.id), eq(globalPlayers.registeredByOrganizationId, organizationId)),
			),
		);
	return rows[0]?.total ?? 0;
}

// ---------------------------------------------------------------------------
// Lista de todos los global_players — vista del owner en /admin/players
// ---------------------------------------------------------------------------

export type GlobalPlayerRow = {
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	leagueCount: number;
};

/**
 * Lista paginada de todos los global_players de la plataforma (vista owner,
 * sin scope de organización). Búsqueda simple por nombre — este listado no
 * usa el contrato ListQuery porque no tiene FilterBar (fuera del alcance del
 * brief de diseño data-heavy, que cubre la vista de organizador).
 */
export async function listAllGlobalPlayers(opts: {
	page: number;
	pageSize: number;
	search?: string;
}): Promise<{ rows: GlobalPlayerRow[]; total: number }> {
	const { page, pageSize, search } = opts;
	const whereFilter = search ? ilike(globalPlayers.fullName, `%${search}%`) : undefined;

	const [rows, countResult] = await Promise.all([
		db
			.select({
				globalPlayerId: globalPlayers.id,
				fullName: globalPlayers.fullName,
				birthDate: globalPlayers.birthDate,
				leagueCount: sql<number>`COUNT(DISTINCT ${leagueMembers.id})::int`.as("league_count"),
			})
			.from(globalPlayers)
			.leftJoin(leagueMembers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
			.where(whereFilter)
			.groupBy(globalPlayers.id)
			.orderBy(asc(globalPlayers.fullName))
			.limit(pageSize)
			.offset((page - 1) * pageSize),

		db
			.select({ total: sql<number>`COUNT(*)::int` })
			.from(globalPlayers)
			.where(whereFilter),
	]);

	return {
		rows: rows.map((r) => ({
			globalPlayerId: r.globalPlayerId,
			fullName: r.fullName,
			birthDate: r.birthDate,
			leagueCount: r.leagueCount,
		})),
		total: countResult[0]?.total ?? 0,
	};
}

// ---------------------------------------------------------------------------
// Búsqueda por nombre para "Agregar jugador existente" a un equipo
//
// CORREGIDO (julio 2026) — filtración de datos entre organizaciones: la
// versión anterior buscaba en TODO `global_players` sin ningún filtro de
// organización. Un organizador podía encontrar y agregar a su equipo a
// cualquier jugador de la plataforma, aunque nunca hubiera sido dado de alta
// en su organización — violando la regla de negocio de que solo el
// encargado de la liga puede darlo de alta explícitamente (vía
// /admin/registro, §14 AGENTS.md). global_players SÍ es identidad de
// plataforma (un jugador, un CURP, para siempre) pero eso no significa que
// cualquier organización pueda verlo o reclutarlo sin que su propio
// encargado lo registre primero.
//
// Scope obligatorio, nunca cross-org — mismo criterio que listOrgPlayers:
// el jugador "pertenece" a esta organización si (a) tiene un league_member
// en alguna liga de la org, o (b) la org lo dio de alta sin liga todavía
// ("Camino E" de admin-registration/register.ts). Si la liga no tiene
// organización (legacy/sin org), no hay org con la que comparar — el scope
// se reduce a "ya es miembro de ESTA liga".
//
// El match es por nombre canónico (sin acentos) para tolerar tildes. Marca
// alreadyInLeagueTeam cuando el jugador ya está inscrito en un equipo de la
// liga destino (para deshabilitarlo en la UI) y hasAnyLeagueMembership para
// distinguir "nunca inscrito en ninguna liga" de "ya jugó en otra liga de
// esta org" — solo informativo.
// ---------------------------------------------------------------------------

export type OrgPlayerSearchResult = {
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	alreadyInLeagueTeam: boolean;
	hasAnyLeagueMembership: boolean;
};

export async function searchOrgGlobalPlayers(
	q: string,
	opts: { leagueId: string; organizationId: string | null },
): Promise<OrgPlayerSearchResult[]> {
	const canonical = sanitizeToCanonical(q);
	if (canonical.length < 2) return [];

	const { leagueId, organizationId } = opts;
	const like = `%${canonical}%`;

	const belongsToOrg = organizationId
		? sql`(
				EXISTS (
					SELECT 1 FROM league_members lm
					INNER JOIN leagues l ON l.id = lm.league_id
					WHERE lm.global_player_id = ${globalPlayers.id} AND l.organization_id = ${organizationId}
				)
				OR ${globalPlayers.registeredByOrganizationId} = ${organizationId}
			)`
		: sql`EXISTS (
				SELECT 1 FROM league_members lm
				WHERE lm.global_player_id = ${globalPlayers.id} AND lm.league_id = ${leagueId}
			)`;

	const rows = await db
		.select({
			globalPlayerId: globalPlayers.id,
			fullName: globalPlayers.fullName,
			birthDate: globalPlayers.birthDate,
			avatarUrl: globalPlayers.avatarUrl,
			leagueMemberCount: sql<number>`COUNT(${leagueMembers.id})`.as("league_member_count"),
		})
		.from(globalPlayers)
		.leftJoin(leagueMembers, eq(leagueMembers.globalPlayerId, globalPlayers.id))
		.where(
			and(
				sql`COALESCE(${globalPlayers.fullNameCanonical}, LOWER(${globalPlayers.fullName})) LIKE ${like}`,
				belongsToOrg,
			),
		)
		.groupBy(globalPlayers.id)
		.orderBy(asc(globalPlayers.id))
		.limit(15);

	if (rows.length === 0) return [];

	const inTeam = await fetchPlayersAlreadyInLeagueTeam(
		rows.map((r) => r.globalPlayerId),
		leagueId,
	);

	return rows
		.map((r) => ({
			globalPlayerId: r.globalPlayerId,
			fullName: r.fullName,
			birthDate: r.birthDate,
			avatarUrl: r.avatarUrl ?? null,
			alreadyInLeagueTeam: inTeam.has(r.globalPlayerId),
			hasAnyLeagueMembership: Number(r.leagueMemberCount) > 0,
		}))
		.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** Subconjunto de globalPlayerIds que ya tienen inscripción a un equipo en la liga. */
async function fetchPlayersAlreadyInLeagueTeam(
	globalPlayerIds: string[],
	leagueId: string,
): Promise<Set<string>> {
	if (globalPlayerIds.length === 0) return new Set();

	const rows = await db
		.selectDistinct({ globalPlayerId: leagueMembers.globalPlayerId })
		.from(inscriptions)
		.innerJoin(leagueMembers, eq(leagueMembers.id, inscriptions.leagueMemberId))
		.where(
			and(
				eq(leagueMembers.leagueId, leagueId),
				inArray(leagueMembers.globalPlayerId, globalPlayerIds),
			),
		);

	return new Set(rows.map((r) => r.globalPlayerId));
}

// ---------------------------------------------------------------------------
// GlobalPlayerLeagueMembers — detalle de membresías V2 para pantalla de admin
//
// Devuelve todas las ligas en las que el global_player está inscrito, con los
// campos editables (status, dorsal, internalNotes, institutionPhotoUrl).
//
// Si se pasa organizationId, filtra solo las ligas de esa organización.
// Los campos sensibles (internalNotes, institutionPhotoUrl) solo se incluyen
// cuando la query ya está scoped a la organización del usuario.
// ---------------------------------------------------------------------------

export type GlobalPlayerLeagueMember = {
	memberId: string;
	leagueId: string;
	leagueName: string;
	// "active" | "finished" — usado para no mostrar como "actual" un equipo de
	// una liga que ya cerró (ej. tras "Nueva Temporada", el jugador queda con
	// membresía en la liga vieja Y la nueva; solo la activa cuenta como actual).
	leagueStatus: string;
	organizationId: string;
	teamId: string | null;
	teamName: string | null;
	dorsal: number | null;
	status: "active" | "suspended" | "inactive";
	inscriptionDate: string;
	internalNotes: string | null;
	institutionPhotoUrl: string | null;
};

export async function getGlobalPlayerLeagueMembers(
	globalPlayerId: string,
	organizationId?: string,
): Promise<GlobalPlayerLeagueMember[]> {
	const rows = await db
		.select({
			memberId: leagueMembers.id,
			leagueId: leagueMembers.leagueId,
			leagueName: leagues.name,
			leagueStatus: leagues.status,
			organizationId: leagues.organizationId,
			teamId: inscriptions.teamId,
			teamName: teams.name,
			dorsal: leagueMembers.dorsal,
			status: leagueMembers.status,
			inscriptionDate: leagueMembers.inscriptionDate,
			internalNotes: leagueMembers.internalNotes,
			institutionPhotoUrl: leagueMembers.institutionPhotoUrl,
		})
		.from(leagueMembers)
		.innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
		.leftJoin(inscriptions, eq(inscriptions.leagueMemberId, leagueMembers.id))
		.leftJoin(teams, eq(teams.id, inscriptions.teamId))
		.where(
			and(
				eq(leagueMembers.globalPlayerId, globalPlayerId),
				organizationId ? eq(leagues.organizationId, organizationId) : undefined,
			),
		)
		.orderBy(desc(leagues.createdAt));

	return rows.map((r) => ({
		memberId: r.memberId,
		leagueId: r.leagueId,
		leagueName: r.leagueName,
		leagueStatus: r.leagueStatus,
		organizationId: r.organizationId!,
		teamId: r.teamId ?? null,
		teamName: r.teamName ?? null,
		dorsal: r.dorsal ?? null,
		status: r.status as GlobalPlayerLeagueMember["status"],
		inscriptionDate: r.inscriptionDate,
		internalNotes: organizationId ? (r.internalNotes ?? null) : null,
		institutionPhotoUrl: organizationId ? (r.institutionPhotoUrl ?? null) : null,
	}));
}

// ---------------------------------------------------------------------------
// getGlobalPlayerBasic — datos básicos de un global_player (nombre, fecha nac.)
// Para la pantalla de detalle cuando no hay perfil V1 disponible.
// ---------------------------------------------------------------------------

export type GlobalPlayerBasic = {
	id: string;
	fullName: string;
	birthDate: string | null;
	avatarUrl: string | null;
};

export async function getGlobalPlayerBasic(
	globalPlayerId: string,
): Promise<GlobalPlayerBasic | null> {
	const row = await db.query.globalPlayers.findFirst({
		where: eq(globalPlayers.id, globalPlayerId),
	});
	if (!row) return null;
	return {
		id: row.id,
		fullName: row.fullName,
		birthDate: row.birthDate ?? null,
		avatarUrl: row.avatarUrl ?? null,
	};
}
