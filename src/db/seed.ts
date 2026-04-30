/**
 * src/db/seed.ts
 *
 * Populates a local database with deterministic, MVP-grade dev data so the
 * app and e2e tests have something realistic to read against. Uses scrypt
 * (matches the project's auth format) so seeded users can log in.
 *
 * Usage:
 *   pnpm db:seed     idempotent — skips when player_season_stats has rows
 *   pnpm db:reset    TRUNCATE every domain table then re-seed from scratch
 *
 * Anti-foot-gun: aborts if DATABASE_URL points at a Supabase host. This
 * script is for local Postgres only — it is not safe to run against prod.
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import * as schema from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

// ── Boot guards ───────────────────────────────────────────────────────────────

const url = (process.env.DATABASE_URL ?? "").trim();
if (!url) {
	console.error("❌  DATABASE_URL no definida");
	process.exit(1);
}

const PROD_PATTERNS: RegExp[] = [
	/supabase\.co\b/,
	/supabase\.com\b/,
	/supabase\.io\b/,
];

if (PROD_PATTERNS.some((p) => p.test(url))) {
	console.error(
		`❌  DATABASE_URL parece producción (${url.replace(/:[^:@]+@/, ":***@")}). Aborto el seed.`,
	);
	process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

const RESET = process.argv.includes("--reset");

// ── Constants ─────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
	"Carlos", "Roberto", "Luis", "Miguel", "Andrés", "Daniel", "Fernando",
	"Javier", "Alejandro", "Sergio", "Pablo", "Hugo", "Eduardo", "Iván",
	"Ricardo", "César", "Manuel", "Óscar", "Diego", "Marcos", "Tomás",
	"Jorge", "Raúl", "Adrián", "Bruno", "Emilio", "Francisco", "Gerardo",
	"Héctor", "Joel", "Kevin", "Lucas", "Mario", "Nicolás", "Octavio",
	"Patricio", "Rodrigo", "Saúl", "Ulises", "Víctor", "Xavier", "Yael",
	"Ángel", "Benjamín", "Cristian", "Damián", "Elías", "Fabián", "Gael",
	"Ismael",
] as const;

const LAST_NAMES = [
	"Hernández", "Mendez", "Austin", "García", "Torres", "López", "Ramírez",
	"Castillo", "Morales", "Vargas", "Núñez", "Rivera", "Domínguez", "Salinas",
	"Cárdenas", "Ortega", "Aguilar", "Ibarra", "Reyes", "Soto", "Acosta",
	"Padilla", "Zúñiga", "Mendoza", "Cruz", "Olvera", "Fuentes", "Vega",
	"Lara", "Sánchez", "Ruiz", "Jiménez", "Rodríguez", "Pérez", "Martínez",
	"Díaz", "Romero", "Flores", "Gómez", "Herrera", "Castro", "Ortiz",
	"Silva", "Ríos", "Espinoza", "Cervantes", "Esparza", "Vázquez", "Carrillo",
	"Aguirre",
] as const;

const TEAM_NAMES = [
	"Cobras FC", "Águilas Doradas", "Pumas TJ", "Halcones", "Lobos Grises",
	"Tigres del Norte", "Caimanes", "Diablos Rojos", "Coyotes", "Toros Salvajes",
	"Gallos Negros", "Panteras", "Tiburones Blancos", "Leones de Oro",
	"Zorros del Pacífico", "Búhos", "Real Frontera", "Atlético Tijuana",
	"Deportivo Otay", "Internacional", "Bravos del Cerro", "Halcones Imperial",
	"Estudiantes FC", "Real Madrid TJ", "Borregos del Valle", "Cabras Locas",
	"Pingüinos del Norte", "Águilas Imperial", "Pumas Mexicali", "Cementeros",
] as const;

const LEAGUE_DEFS: Array<{
	name: string;
	dayOfWeek: schema.DayOfWeek;
	season: string;
	city: string;
	adminIdx: number;
	status: "active" | "finished";
}> = [
	{ name: "Liga Lunes",     dayOfWeek: "lunes",     season: "Apertura 2026", city: "Tijuana",  adminIdx: 1, status: "active"   },
	{ name: "Liga Martes",    dayOfWeek: "martes",    season: "Apertura 2026", city: "Tijuana",  adminIdx: 1, status: "active"   },
	{ name: "Liga Miércoles", dayOfWeek: "miercoles", season: "Apertura 2026", city: "Tijuana",  adminIdx: 2, status: "active"   },
	{ name: "Liga Jueves",    dayOfWeek: "jueves",    season: "Apertura 2026", city: "Tijuana",  adminIdx: 2, status: "active"   },
	{ name: "Liga Verano",    dayOfWeek: "viernes",   season: "Verano 2026",   city: "Tijuana",  adminIdx: 3, status: "active"   },
	{ name: "Liga Mexicali",  dayOfWeek: "domingo",   season: "Apertura 2026", city: "Mexicali", adminIdx: 4, status: "active"   },
	{ name: "Liga Lunes",     dayOfWeek: "lunes",     season: "Apertura 2025", city: "Tijuana",  adminIdx: 0, status: "finished" },
	{ name: "Liga Verano",    dayOfWeek: "viernes",   season: "Verano 2025",   city: "Tijuana",  adminIdx: 3, status: "finished" },
];

const TOTAL_PLAYERS = 200;
const TEAMS_PER_LEAGUE = 10;
const PLAYERS_PER_TEAM = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────

const scryptAsync = promisify(scrypt);
async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const derived = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${derived.toString("hex")}`;
}

/** Deterministic pseudo-random in [0, max). Same input → same output. */
function det(i: number, max: number, salt = 0): number {
	return Math.abs((i * 9301 + 49297 + salt * 233) % 233280) % max;
}

/** Deterministic Fisher-Yates shuffle of 0..n-1, seeded by `seed`. */
function detShuffle(n: number, seed: number): number[] {
	const arr = Array.from({ length: n }, (_, i) => i);
	let r = (seed * 9301 + 49297) >>> 0;
	for (let i = n - 1; i > 0; i--) {
		r = ((r * 1664525) + 1013904223) >>> 0;
		const j = r % (i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function aliasFor(fullName: string): string {
	const first = fullName
		.split(" ")[0]
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "");
	return `@${first}`;
}

async function isAlreadySeeded(): Promise<boolean> {
	const r = await pool.query<{ count: string }>(
		"SELECT count(*)::text AS count FROM player_season_stats",
	);
	return Number(r.rows[0].count) > 0;
}

async function reset(): Promise<void> {
	console.log("🗑   Truncating tables (CASCADE, RESTART IDENTITY)…");
	await pool.query(`
		TRUNCATE TABLE
			match_events,
			matches,
			player_registrations,
			team_standings_snapshot,
			player_season_stats_snapshot,
			player_season_stats,
			teams,
			players,
			leagues,
			users,
			import_audit_log,
			page_views
		RESTART IDENTITY CASCADE
	`);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
	console.log("──────────────────────────────────────────");
	console.log("🌱  TalachaStats — Seed (MVP dataset)");
	console.log(`📍  ${url.replace(/:[^:@]+@/, ":***@")}`);
	console.log("──────────────────────────────────────────");

	if (RESET) {
		await reset();
	} else if (await isAlreadySeeded()) {
		console.log("ℹ️   La BD ya tiene datos (player_season_stats no vacía).");
		console.log("    Usa `pnpm db:reset` para borrar y re-seedear.");
		console.log("──────────────────────────────────────────");
		return;
	}

	// ── Users ────────────────────────────────────────────────────────────────
	const passwordHash = await hashPassword("admin1234");
	const userDefs = [
		{ email: "owner@talacha.local",    name: "Roberto Owner",     role: "owner"     },
		{ email: "andres@talacha.local",   name: "Andrés Cárdenas",   role: "organizer" },
		{ email: "patricia@talacha.local", name: "Patricia Mendoza",  role: "organizer" },
		{ email: "manuel@talacha.local",   name: "Manuel Ibarra",     role: "organizer" },
		{ email: "lucia@talacha.local",    name: "Lucía Ortega",      role: "organizer" },
	];
	const users = await db
		.insert(schema.users)
		.values(userDefs.map((u) => ({ ...u, passwordHash })))
		.returning();
	console.log(`✓ users:            ${users.length}  (password: admin1234)`);

	// ── Leagues ──────────────────────────────────────────────────────────────
	const leagues = await db
		.insert(schema.leagues)
		.values(
			LEAGUE_DEFS.map((d) => ({
				name: d.name,
				dayOfWeek: d.dayOfWeek,
				season: d.season,
				city: d.city,
				adminId: users[d.adminIdx].id,
				status: d.status,
			})),
		)
		.returning();
	const activeLeagues = leagues.filter((_, i) => LEAGUE_DEFS[i].status === "active");
	const finishedLeagues = leagues.filter((_, i) => LEAGUE_DEFS[i].status === "finished");
	console.log(
		`✓ leagues:          ${leagues.length}  (${activeLeagues.length} activas, ${finishedLeagues.length} finalizadas, 2 ciudades)`,
	);

	// ── Teams ────────────────────────────────────────────────────────────────
	// 10 teams per league. Team names rotate from the pool — same name in
	// different leagues is the realistic scenario (teams scoped to leagues).
	const teamRows: schema.NewTeam[] = [];
	for (let li = 0; li < leagues.length; li++) {
		const offset = det(li, TEAM_NAMES.length, 11);
		for (let ti = 0; ti < TEAMS_PER_LEAGUE; ti++) {
			teamRows.push({
				name: TEAM_NAMES[(offset + ti) % TEAM_NAMES.length],
				leagueId: leagues[li].id,
			});
		}
	}
	const teams = await db.insert(schema.teams).values(teamRows).returning();
	console.log(
		`✓ teams:            ${teams.length}  (${TEAMS_PER_LEAGUE} per league)`,
	);
	const teamsByLeague = new Map<string, schema.Team[]>();
	for (const t of teams) {
		const arr = teamsByLeague.get(t.leagueId) ?? [];
		arr.push(t);
		teamsByLeague.set(t.leagueId, arr);
	}

	// ── Players ──────────────────────────────────────────────────────────────
	const playerRows: schema.NewPlayer[] = [];
	for (let i = 0; i < TOTAL_PLAYERS; i++) {
		const first = FIRST_NAMES[i % FIRST_NAMES.length];
		const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
		const fullName = `${first} ${last}`;
		playerRows.push({
			fullName,
			alias: i % 5 === 0 ? aliasFor(fullName) : null,
		});
	}
	const players = await db.insert(schema.players).values(playerRows).returning();
	console.log(`✓ players:          ${players.length}`);

	// ── Registrations + season stats ─────────────────────────────────────────
	// For each league, deterministically shuffle the player pool and pick the
	// first 60 (10 teams × 6 players). Across leagues different shuffles cause
	// many players to appear in multiple leagues — exercising the cross-liga
	// queries — while keeping the per-league UNIQUE constraint clean.
	const registrationRows: schema.NewPlayerRegistration[] = [];
	const statRows: schema.NewPlayerSeasonStats[] = [];
	for (let li = 0; li < leagues.length; li++) {
		const league = leagues[li];
		const leagueTeams = teamsByLeague.get(league.id)!;
		const perm = detShuffle(TOTAL_PLAYERS, li + 1);
		const slots = TEAMS_PER_LEAGUE * PLAYERS_PER_TEAM; // 60
		for (let s = 0; s < slots; s++) {
			const playerIdx = perm[s];
			const teamIdx = Math.floor(s / PLAYERS_PER_TEAM);
			const team = leagueTeams[teamIdx];
			registrationRows.push({
				playerId: players[playerIdx].id,
				teamId: team.id,
				leagueId: league.id,
				jerseyNumber: (s % PLAYERS_PER_TEAM) + 1,
			});
			// Stats vary by both player and league index so the same player
			// has different numbers per league (which is realistic).
			statRows.push({
				playerId: players[playerIdx].id,
				leagueId: league.id,
				teamId: team.id,
				goals:        det(playerIdx + li * 7,  26, 1),
				assists:      det(playerIdx + li * 11, 12, 2),
				yellowCards:  det(playerIdx + li * 3,   5, 3),
				redCards:     det(playerIdx + li * 5,  12, 4) === 0 ? 1 : 0,
				matchesPlayed: 6 + det(playerIdx + li, 9, 5),
				jornada: LEAGUE_DEFS[li].status === "finished" ? 18 : 12,
			});
		}
	}
	await db.insert(schema.playerRegistrations).values(registrationRows);
	await db.insert(schema.playerSeasonStats).values(statRows);
	console.log(`✓ registrations:    ${registrationRows.length}  (cross-liga via shuffles)`);
	console.log(`✓ season stats:     ${statRows.length}`);

	// ── Snapshot history (Liga Lunes Apertura 2026 only) ─────────────────────
	// 3 jornadas × top 12 scorers → progression curve for the chart pages.
	const ligaLunes = leagues[0];
	const lunesStats = statRows.filter((s) => s.leagueId === ligaLunes.id);
	const sortedByGoals = [...lunesStats].sort((a, b) => b.goals - a.goals).slice(0, 12);
	const snapshotRows: schema.NewPlayerSeasonStatsSnapshot[] = [];
	for (const j of [5, 10, 15]) {
		for (const s of sortedByGoals) {
			const factor = j / 18; // partial accumulation
			snapshotRows.push({
				playerId: s.playerId,
				leagueId: s.leagueId,
				teamId: s.teamId,
				jornada: j,
				goals:        Math.round(s.goals * factor),
				assists:      Math.round((s.assists ?? 0) * factor),
				yellowCards:  Math.round((s.yellowCards ?? 0) * factor),
				redCards:     Math.round((s.redCards ?? 0) * factor),
				matchesPlayed: Math.round((s.matchesPlayed ?? 0) * factor),
			});
		}
	}
	await db.insert(schema.playerSeasonStatsSnapshot).values(snapshotRows);
	console.log(`✓ snapshots:        ${snapshotRows.length}  (3 jornadas × top 12 of Liga Lunes)`);

	// ── Standings snapshots (Liga Lunes top 10 at jornada 12) ────────────────
	const lunesTeams = teamsByLeague.get(ligaLunes.id)!;
	const standingRows: schema.NewTeamStandingsSnapshot[] = lunesTeams.map((t, i) => {
		const wins = 2 + det(i, 8, 41);
		const draws = det(i, 4, 42);
		const losses = 12 - wins - draws;
		const goalsFor = wins * 3 + draws + det(i, 12, 43);
		const goalsAgainst = losses * 2 + draws + det(i, 8, 44);
		return {
			teamId: t.id,
			leagueId: ligaLunes.id,
			jornada: 12,
			played: 12,
			wins,
			draws,
			losses,
			goalsFor,
			goalsAgainst,
			points: wins * 3 + draws,
			zone: i < 4 ? "LIGUILLA" : i >= 8 ? "DESCENSO" : null,
		};
	});
	await db.insert(schema.teamStandingsSnapshot).values(standingRows);
	console.log(`✓ team standings:   ${standingRows.length}  (jornada 12 of Liga Lunes)`);

	// ── Matches + match events (active leagues only) ─────────────────────────
	// 5 matches per active league × 6 = 30 matches. Each completed match
	// gets a deterministic but plausible event log (goals + cards) so the
	// narrator-analysis fallback path has data to read.
	const matchRows: schema.NewMatch[] = [];
	const matchPlanned: Array<{
		leagueId: string;
		homeTeamId: string;
		awayTeamId: string;
		matchday: number;
	}> = [];
	for (let li = 0; li < activeLeagues.length; li++) {
		const league = activeLeagues[li];
		const lt = teamsByLeague.get(league.id)!;
		for (let m = 0; m < 5; m++) {
			const homeIdx = m % lt.length;
			const awayIdx = (m + 3) % lt.length;
			if (homeIdx === awayIdx) continue;
			const home = det(li * 7 + m, 5);
			const away = det(li * 11 + m, 4);
			matchRows.push({
				leagueId: league.id,
				homeTeamId: lt[homeIdx].id,
				awayTeamId: lt[awayIdx].id,
				matchDate: new Date(2026, 3, 6 + m * 7).toISOString().split("T")[0],
				matchday: m + 1,
				status: "completed",
				homeScore: home,
				awayScore: away,
			});
			matchPlanned.push({
				leagueId: league.id,
				homeTeamId: lt[homeIdx].id,
				awayTeamId: lt[awayIdx].id,
				matchday: m + 1,
			});
		}
	}
	const matches = await db.insert(schema.matches).values(matchRows).returning();
	console.log(`✓ matches:          ${matches.length}  (completed, across 6 active leagues)`);

	// Events: pick scorers from registered players of the league for that team.
	const regsByLeagueTeam = new Map<string, schema.NewPlayerRegistration[]>();
	for (const r of registrationRows) {
		const key = `${r.leagueId}:${r.teamId}`;
		const arr = regsByLeagueTeam.get(key) ?? [];
		arr.push(r);
		regsByLeagueTeam.set(key, arr);
	}
	const eventRows: schema.NewMatchEvent[] = [];
	for (let mi = 0; mi < matches.length; mi++) {
		const m = matches[mi];
		const homeRoster = regsByLeagueTeam.get(`${m.leagueId}:${m.homeTeamId}`) ?? [];
		const awayRoster = regsByLeagueTeam.get(`${m.leagueId}:${m.awayTeamId}`) ?? [];
		// Goals
		for (let g = 0; g < m.homeScore && homeRoster.length > 0; g++) {
			const r = homeRoster[det(mi * 13 + g, homeRoster.length, 7)];
			eventRows.push({
				matchId: m.id,
				playerId: r.playerId,
				teamId: m.homeTeamId,
				eventType: "goal",
				minute: 5 + det(mi * 17 + g, 80, 8),
			});
		}
		for (let g = 0; g < m.awayScore && awayRoster.length > 0; g++) {
			const r = awayRoster[det(mi * 19 + g, awayRoster.length, 9)];
			eventRows.push({
				matchId: m.id,
				playerId: r.playerId,
				teamId: m.awayTeamId,
				eventType: "goal",
				minute: 5 + det(mi * 23 + g, 80, 10),
			});
		}
		// One yellow + occasional red
		if (homeRoster.length > 0) {
			const yc = homeRoster[det(mi, homeRoster.length, 12)];
			eventRows.push({
				matchId: m.id,
				playerId: yc.playerId,
				teamId: m.homeTeamId,
				eventType: "yellow_card",
				minute: 30 + det(mi, 50, 13),
			});
		}
		if (mi % 7 === 0 && awayRoster.length > 0) {
			const rc = awayRoster[det(mi, awayRoster.length, 14)];
			eventRows.push({
				matchId: m.id,
				playerId: rc.playerId,
				teamId: m.awayTeamId,
				eventType: "red_card",
				minute: 60 + det(mi, 30, 15),
			});
		}
	}
	if (eventRows.length > 0) {
		await db.insert(schema.matchEvents).values(eventRows);
	}
	console.log(`✓ match events:     ${eventRows.length}  (goals · yellows · reds)`);

	console.log("──────────────────────────────────────────");
	console.log("✅  Seed completo. Dataset MVP cubre:");
	console.log("    /ranking · /players · /player/[id] · /matchday · narrator");
	console.log("    Filtros por liga activa/finalizada y ciudad funcionando.");
	console.log("");
	console.log("👤  Logins (password: admin1234):");
	for (const u of userDefs) console.log(`    ${u.role.padEnd(10)} ${u.email}`);
	console.log("──────────────────────────────────────────");
}

run()
	.then(() => pool.end())
	.catch((e) => {
		console.error("──────────────────────────────────────────");
		console.error("❌  Error:", e);
		console.error("──────────────────────────────────────────");
		pool.end();
		process.exit(1);
	});
