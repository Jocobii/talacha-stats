/**
 * features/post-import-content/pills.ts
 *
 * Genera píldoras narrativas después de una importación de jornada.
 * Una píldora = un dato curioso / highlight listo para copiar y pegar
 * en WhatsApp, o para renderizar en la imagen de jornada.
 *
 * Fuentes de datos:
 *   - player_season_stats_snapshot (jornada N y N-1) → deltas por jugador
 *   - team_standings_snapshot (jornada N)            → forma y posición por equipo
 *
 * Reglas de diseño:
 *   - Función pura con respecto a efectos secundarios (solo lee de DB)
 *   - Sin dependencias de features/ hermanas
 *   - Devuelve datos, nunca JSX
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db, playerSeasonStatsSnapshot, teamStandingsSnapshot } from "@/db";
import { titleCase } from "@/shared/lib/normalize";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type PillType =
	| "hat_trick" // jugador anotó 3+ goles en la jornada
	| "scoring_streak" // jugador lleva N jornadas consecutivas anotando
	| "top_scorer" // líder de goleo al corte de esta jornada
	| "first_scorer" // jugador que abrió su cuenta goleadora
	| "comeback_scorer" // jugador que no había anotado en 2+ jornadas y volvió
	| "unbeaten_streak" // equipo lleva N jornadas sin perder
	| "leader" // equipo líder de tabla
	| "zone_change" // equipo entró o salió de una zona (liguilla/copa)
	| "top_assist"; // líder de asistencias

export type JornadaPill = {
	type: PillType;
	headline: string; // texto principal — máx ~60 chars
	detail: string; // dato de soporte — máx ~80 chars
	priority: number; // 1 = más importante, mayor número = menor prioridad
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Genera entre 3 y 8 píldoras para una jornada importada.
 * Si la jornada es la 1 (sin historial previo), solo genera píldoras
 * de liderato y goleadores del corte actual.
 */
export async function generateJornadaPills(
	leagueId: string,
	jornada: number,
): Promise<JornadaPill[]> {
	const [playerPills, teamPills] = await Promise.all([
		buildPlayerPills(leagueId, jornada),
		buildTeamPills(leagueId, jornada),
	]);

	// Mezcla y ordena por prioridad, máximo 8 píldoras
	return [...playerPills, ...teamPills].sort((a, b) => a.priority - b.priority).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Píldoras de jugadores
// ---------------------------------------------------------------------------

async function buildPlayerPills(leagueId: string, jornada: number): Promise<JornadaPill[]> {
	const pills: JornadaPill[] = [];

	// Obtener snapshots de jornada N y N-1
	const snapshotN = await db.query.playerSeasonStatsSnapshot.findMany({
		where: and(
			eq(playerSeasonStatsSnapshot.leagueId, leagueId),
			eq(playerSeasonStatsSnapshot.jornada, jornada),
		),
		with: {
			player: { columns: { id: true, fullName: true, alias: true } },
			team: { columns: { id: true, name: true } },
		},
	});

	if (snapshotN.length === 0) return pills;

	// Snapshot anterior — puede no existir en jornada 1
	const snapshotPrev =
		jornada > 1
			? await db.query.playerSeasonStatsSnapshot.findMany({
					where: and(
						eq(playerSeasonStatsSnapshot.leagueId, leagueId),
						eq(playerSeasonStatsSnapshot.jornada, jornada - 1),
					),
					columns: { playerId: true, goals: true, assists: true },
				})
			: [];

	const prevByPlayer = new Map(snapshotPrev.map((s) => [s.playerId, s]));

	// Calcular deltas de esta jornada
	type Delta = {
		playerId: string;
		name: string;
		teamName: string;
		goalsTotal: number;
		assistsTotal: number;
		goalsThisJornada: number;
		assistsThisJornada: number;
	};

	const deltas: Delta[] = snapshotN.map((s) => {
		const prev = prevByPlayer.get(s.playerId);
		return {
			playerId: s.playerId,
			name: s.player.alias ? `"${titleCase(s.player.alias)}"` : titleCase(s.player.fullName),
			teamName: titleCase(s.team?.name ?? ""),
			goalsTotal: s.goals,
			assistsTotal: s.assists,
			goalsThisJornada: s.goals - (prev?.goals ?? 0),
			assistsThisJornada: s.assists - (prev?.assists ?? 0),
		};
	});

	// ── Hat-tricks (3+ goles en la jornada) ──────────────────────────────────
	const hatTricks = deltas
		.filter((d) => d.goalsThisJornada >= 3)
		.sort((a, b) => b.goalsThisJornada - a.goalsThisJornada);

	for (const h of hatTricks) {
		pills.push({
			type: "hat_trick",
			headline: `${h.name} se mandó ${h.goalsThisJornada === 3 ? "hat-trick" : `${h.goalsThisJornada} goles`}`,
			detail: `${h.teamName} · J${jornada} · ${h.goalsTotal} goles en el torneo`,
			priority: 1,
		});
	}

	// ── Goleador del torneo ───────────────────────────────────────────────────
	const topScorer = [...deltas].sort((a, b) => b.goalsTotal - a.goalsTotal)[0];
	if (topScorer && topScorer.goalsTotal > 0) {
		pills.push({
			type: "top_scorer",
			headline: `${topScorer.name} lidera el goleo`,
			detail: `${topScorer.goalsTotal} goles · ${topScorer.teamName} · J${jornada}`,
			priority: 2,
		});
	}

	// ── Líder de asistencias ──────────────────────────────────────────────────
	const topAssist = [...deltas].sort((a, b) => b.assistsTotal - a.assistsTotal)[0];
	if (topAssist && topAssist.assistsTotal >= 2) {
		pills.push({
			type: "top_assist",
			headline: `${topAssist.name} domina en asistencias`,
			detail: `${topAssist.assistsTotal} asistencias · ${topAssist.teamName}`,
			priority: 5,
		});
	}

	// ── Primer gol del torneo (solo aplica con historial) ────────────────────
	if (jornada > 1) {
		const firstTimers = deltas.filter(
			(d) => d.goalsThisJornada > 0 && d.goalsTotal === d.goalsThisJornada,
		);
		for (const p of firstTimers.slice(0, 2)) {
			pills.push({
				type: "first_scorer",
				headline: `${p.name} abrió su cuenta`,
				detail: `Primer gol del torneo · ${p.teamName} · J${jornada}`,
				priority: 6,
			});
		}
	}

	// ── Rachas goleadoras (anotó en 3+ jornadas consecutivas) ────────────────
	if (jornada >= 3) {
		const streaks = await buildScoringStreaks(
			leagueId,
			jornada,
			snapshotN.map((s) => s.playerId),
		);
		for (const [playerId, count] of streaks) {
			if (count < 3) continue;
			const player = deltas.find((d) => d.playerId === playerId);
			if (!player) continue;
			pills.push({
				type: "scoring_streak",
				headline: `${player.name} lleva ${count} jornadas anotando`,
				detail: `${player.teamName} · ${player.goalsTotal} goles en el torneo`,
				priority: 3,
			});
		}
	}

	return pills;
}

/**
 * Para cada jugador, calcula cuántas jornadas consecutivas hasta `jornada`
 * tiene con al menos 1 gol (delta positivo respecto a la jornada anterior).
 * Solo se evalúan los jugadores activos en la jornada N.
 */
async function buildScoringStreaks(
	leagueId: string,
	currentJornada: number,
	playerIds: string[],
): Promise<Map<string, number>> {
	if (playerIds.length === 0 || currentJornada < 2) return new Map();

	// Traemos las últimas 5 jornadas disponibles para no hacer queries infinitas
	const lookback = Math.min(currentJornada, 5);
	const jornadaRange = Array.from({ length: lookback }, (_, i) => currentJornada - i);

	const history = await db.query.playerSeasonStatsSnapshot.findMany({
		where: and(
			eq(playerSeasonStatsSnapshot.leagueId, leagueId),
			inArray(playerSeasonStatsSnapshot.playerId, playerIds),
			inArray(playerSeasonStatsSnapshot.jornada, jornadaRange),
		),
		columns: { playerId: true, jornada: true, goals: true },
		orderBy: [desc(playerSeasonStatsSnapshot.jornada)],
	});

	// Agrupar por jugador y ordenar por jornada desc
	const byPlayer = new Map<string, { jornada: number; goals: number }[]>();
	for (const row of history) {
		const arr = byPlayer.get(row.playerId) ?? [];
		arr.push({ jornada: row.jornada, goals: row.goals });
		byPlayer.set(row.playerId, arr);
	}

	const streaks = new Map<string, number>();

	for (const [playerId, rows] of byPlayer) {
		rows.sort((a, b) => b.jornada - a.jornada); // más reciente primero
		let streak = 0;

		for (let i = 0; i < rows.length - 1; i++) {
			const curr = rows[i];
			const prev = rows[i + 1];
			// Solo contar si las jornadas son consecutivas
			if (curr.jornada !== prev.jornada + 1) break;
			const goalsThisJornada = curr.goals - prev.goals;
			if (goalsThisJornada <= 0) break;
			streak++;
		}

		// La jornada actual cuenta como +1 si anotó
		if (streak > 0) streaks.set(playerId, streak + 1);
	}

	return streaks;
}

// ---------------------------------------------------------------------------
// Píldoras de equipos
// ---------------------------------------------------------------------------

async function buildTeamPills(leagueId: string, jornada: number): Promise<JornadaPill[]> {
	const pills: JornadaPill[] = [];

	const standingsN = await db.query.teamStandingsSnapshot.findMany({
		where: and(
			eq(teamStandingsSnapshot.leagueId, leagueId),
			eq(teamStandingsSnapshot.jornada, jornada),
		),
		with: { team: { columns: { id: true, name: true } } },
		orderBy: [desc(teamStandingsSnapshot.points), desc(teamStandingsSnapshot.goalsFor)],
	});

	if (standingsN.length === 0) return pills;

	// ── Líder de tabla ────────────────────────────────────────────────────────
	const leader = standingsN[0];
	pills.push({
		type: "leader",
		headline: `${titleCase(leader.team.name)} comanda la tabla`,
		detail: `${leader.points} pts · ${leader.wins}G ${leader.draws}E ${leader.losses}P · J${jornada}`,
		priority: 4,
	});

	// ── Cambios de zona (entró a liguilla / copa) ─────────────────────────────
	if (jornada > 1) {
		const standingsPrev = await db.query.teamStandingsSnapshot.findMany({
			where: and(
				eq(teamStandingsSnapshot.leagueId, leagueId),
				eq(teamStandingsSnapshot.jornada, jornada - 1),
			),
			columns: { teamId: true, zone: true },
		});

		const prevZoneByTeam = new Map(standingsPrev.map((s) => [s.teamId, s.zone]));

		for (const curr of standingsN) {
			const prevZone = prevZoneByTeam.get(curr.teamId);
			if (!prevZone && curr.zone) {
				const zoneLabel =
					curr.zone === "LIGUILLA"
						? "la liguilla"
						: curr.zone === "COPA"
							? "la copa"
							: curr.zone === "RECOPA"
								? "la recopa"
								: curr.zone;
				pills.push({
					type: "zone_change",
					headline: `${titleCase(curr.team.name)} entró a ${zoneLabel}`,
					detail: `${curr.points} pts · J${jornada}`,
					priority: 2,
				});
			}
		}
	}

	// ── Racha invicta ─────────────────────────────────────────────────────────
	// Equipo con más jornadas sin perder (wins + draws consecutivos al final)
	if (jornada >= 3 && standingsN.length > 0) {
		const teamIds = standingsN.map((s) => s.teamId);
		const unbeatenStreaks = await buildUnbeatenStreaks(leagueId, jornada, teamIds);

		for (const [teamId, count] of unbeatenStreaks) {
			if (count < 3) continue;
			const team = standingsN.find((s) => s.teamId === teamId);
			if (!team) continue;
			pills.push({
				type: "unbeaten_streak",
				headline: `${titleCase(team.team.name)} lleva ${count} jornadas sin perder`,
				detail: `${team.points} pts · J${jornada}`,
				priority: 3,
			});
			break; // solo el más largo
		}
	}

	return pills;
}

/**
 * Calcula cuántas jornadas consecutivas al final lleva cada equipo sin perder.
 */
async function buildUnbeatenStreaks(
	leagueId: string,
	currentJornada: number,
	teamIds: string[],
): Promise<Map<string, number>> {
	if (teamIds.length === 0) return new Map();

	const lookback = Math.min(currentJornada, 6);
	const jornadaRange = Array.from({ length: lookback }, (_, i) => currentJornada - i);

	const history = await db.query.teamStandingsSnapshot.findMany({
		where: and(
			eq(teamStandingsSnapshot.leagueId, leagueId),
			inArray(teamStandingsSnapshot.teamId, teamIds),
			inArray(teamStandingsSnapshot.jornada, jornadaRange),
		),
		columns: { teamId: true, jornada: true, wins: true, draws: true, losses: true },
		orderBy: [desc(teamStandingsSnapshot.jornada)],
	});

	// Agrupar y calcular wins/draws/losses por jornada (deltas)
	const byTeam = new Map<
		string,
		{ jornada: number; wins: number; draws: number; losses: number }[]
	>();
	for (const row of history) {
		const arr = byTeam.get(row.teamId) ?? [];
		arr.push(row);
		byTeam.set(row.teamId, arr);
	}

	const streaks = new Map<string, number>();

	for (const [teamId, rows] of byTeam) {
		rows.sort((a, b) => b.jornada - a.jornada);
		let streak = 0;

		for (let i = 0; i < rows.length - 1; i++) {
			const curr = rows[i];
			const prev = rows[i + 1];
			if (curr.jornada !== prev.jornada + 1) break;
			const lossesThisJornada = curr.losses - prev.losses;
			if (lossesThisJornada > 0) break;
			streak++;
		}

		if (streak >= 3) streaks.set(teamId, streak);
	}

	return streaks;
}
