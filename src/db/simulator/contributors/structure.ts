/**
 * src/db/simulator/contributors/structure.ts
 *
 * Contribuidor "structure" — ver docs/ORGANIZATION-SIMULATOR.md §5 (Épica B2).
 * Escribe: leagues, league_config, league_scheduling_config, teams,
 * league_playoff_zones.
 * Depende de: identity (necesita `organizations`).
 *
 * Por cada organización crea `ctx.params.leaguesPerOrg` ligas, cada una con
 * `ctx.params.teamsPerLeague` equipos. Bootstrap only — ver nota de
 * orquestación en contributors/identity.ts.
 */

import {
	leagues,
	leagueConfig,
	leagueSchedulingConfig,
	teams,
	leaguePlayoffZones,
	DAYS_OF_WEEK,
	type DayOfWeek,
} from "@/db/schema";
import type {
	League,
	LeagueConfig,
	LeagueSchedulingConfig,
	Team,
	LeaguePlayoffZone,
	Organization,
} from "@/db/schema";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import {
	generateLeagueCode,
	resolveUniqueCode,
} from "@/features/league-management/lib/generate-league-code";
import { pick, pickN, shuffle, type Rng } from "../rng";
import { setData, requireData, type Contributor, type SimContext } from "../context";
import { insertInBatches } from "../chunk";
import { getOrganizations } from "./identity";

export const LEAGUES_KEY = "leagues";
export const LEAGUE_CONFIGS_KEY = "leagueConfigs";
export const LEAGUE_SCHEDULING_CONFIGS_KEY = "leagueSchedulingConfigs";
export const LEAGUE_PLAYOFF_ZONES_KEY = "leaguePlayoffZones";
export const TEAMS_KEY = "teams";

const CATEGORY_POOL = ["Libre", "Libre", "Libre", "Libre Femenil", "Mixto"] as const;

const TEAM_NAME_POOL = [
	"Real Aztecas",
	"Deportivo Norte",
	"Los Carnales",
	"La Máquina FC",
	"Tigres del Valle",
	"Chivas Raza",
	"Los Guerreros",
	"Águilas FC",
	"Deportivo Coyotes",
	"Los Toros FC",
	"El Gallito FC",
	"Dinamita FC",
	"Los Compadres",
	"Santos del Norte",
	"Atlético Frontera",
	"Deportivo Raza",
	"Los Bravos FC",
	"Tecos Barrio",
	"Los Yaquis FC",
	"Club Independiente",
	"Los Charros FC",
	"El Toro Rojo FC",
	"Deportivo Azteca",
	"Los Valientes",
	"Real Frontera",
	"Furia Roja FC",
	"Halcones del Sur",
	"Rayos FC",
	"Unidos FC",
	"Cimarrones Barrio",
] as const;

const TEAM_COLOR_POOL = [
	"#EF4444",
	"#3B82F6",
	"#22C55E",
	"#F59E0B",
	"#A855F7",
	"#06B6D4",
	"#F97316",
];

function titleCaseDay(day: DayOfWeek): string {
	return day.charAt(0).toUpperCase() + day.slice(1);
}

/** Zonas de clasificación default, escaladas al tamaño de la liga. */
export function defaultPlayoffZones(
	teamsPerLeague: number,
): Omit<LeaguePlayoffZone, "id" | "leagueId" | "createdAt">[] {
	const zones: Omit<LeaguePlayoffZone, "id" | "leagueId" | "createdAt">[] = [];
	let pos = 1;
	let order = 0;

	const push = (name: string, size: number, color: string) => {
		if (pos > teamsPerLeague || size <= 0) return;
		const to = Math.min(pos + size - 1, teamsPerLeague);
		zones.push({ name, fromPosition: pos, toPosition: to, color, order: order++ });
		pos = to + 1;
	};

	push("Liguilla", Math.min(4, teamsPerLeague), "green");
	push("Copa", 2, "blue");
	push("Recopa", 2, "amber");

	return zones;
}

async function fetchExistingLeagueSlugsByOrg(ctx: SimContext): Promise<Map<string, Set<string>>> {
	const rows = await ctx.db
		.select({ organizationId: leagues.organizationId, slug: leagues.slug })
		.from(leagues);
	const byOrg = new Map<string, Set<string>>();
	for (const row of rows as { organizationId: string | null; slug: string | null }[]) {
		if (!row.organizationId || !row.slug) continue;
		const set = byOrg.get(row.organizationId) ?? new Set<string>();
		set.add(row.slug);
		byOrg.set(row.organizationId, set);
	}
	return byOrg;
}

async function fetchExistingLeagueCodes(ctx: SimContext): Promise<Set<string>> {
	const rows = await ctx.db.select({ code: leagues.code }).from(leagues);
	return new Set(
		(rows as { code: string | null }[]).map((r) => r.code).filter((c): c is string => Boolean(c)),
	);
}

function slugForLeagueName(name: string, existing: Set<string>): string {
	const base = sanitizeToCanonical(name).replace(/\s+/g, "-") || "liga";
	if (!existing.has(base)) return base;
	let suffix = 2;
	while (existing.has(`${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

function buildLeagueDefs(rng: Rng, org: Organization, count: number) {
	// Rota días de la semana para minimizar choques dentro de la misma org
	// (no es una regla de negocio — solo evita ligas "gemelas" sin sentido).
	const shuffledDays = shuffle(rng, DAYS_OF_WEEK);

	return Array.from({ length: count }, (_, i) => {
		const dayOfWeek = shuffledDays[i % shuffledDays.length];
		const category = pick(rng, CATEGORY_POOL);
		const name = `Liga ${titleCaseDay(dayOfWeek)}${category !== "Libre" ? ` ${category}` : ""} — ${org.name}`;
		return { dayOfWeek, category, name, city: org.city };
	});
}

async function createLeaguesForOrg(
	ctx: SimContext,
	org: Organization,
	existingSlugsByOrg: Map<string, Set<string>>,
	existingCodes: Set<string>,
): Promise<League[]> {
	const defs = buildLeagueDefs(ctx.rng, org, ctx.params.leaguesPerOrg);
	const orgSlugs = existingSlugsByOrg.get(org.id) ?? new Set<string>();

	const rows = defs.map((def) => {
		const slug = slugForLeagueName(def.name, orgSlugs);
		orgSlugs.add(slug);

		const baseCode = generateLeagueCode(def.name);
		const code = resolveUniqueCode(baseCode, existingCodes);
		existingCodes.add(code);

		return {
			name: def.name,
			nameCanonical: sanitizeToCanonical(def.name),
			slug,
			category: def.category,
			dayOfWeek: def.dayOfWeek,
			season: "Temporada 1",
			city: def.city,
			organizationId: org.id,
			status: "active" as const,
			schedulingEnabled: true,
			code,
		};
	});

	existingSlugsByOrg.set(org.id, orgSlugs);
	return ctx.db.insert(leagues).values(rows).returning();
}

async function createLeagueConfigs(ctx: SimContext, leagueRows: League[]): Promise<LeagueConfig[]> {
	if (leagueRows.length === 0) return [];
	return ctx.db
		.insert(leagueConfig)
		.values(leagueRows.map((l) => ({ leagueId: l.id })))
		.returning();
}

async function createLeagueSchedulingConfigs(
	ctx: SimContext,
	leagueRows: League[],
): Promise<LeagueSchedulingConfig[]> {
	if (leagueRows.length === 0) return [];
	return ctx.db
		.insert(leagueSchedulingConfig)
		.values(
			leagueRows.map((l) => ({
				leagueId: l.id,
				regularMatchdays: Math.max(1, ctx.params.teamsPerLeague - 1),
			})),
		)
		.returning();
}

async function createLeaguePlayoffZones(
	ctx: SimContext,
	leagueRows: League[],
): Promise<LeaguePlayoffZone[]> {
	if (leagueRows.length === 0) return [];
	const rows = leagueRows.flatMap((l) =>
		defaultPlayoffZones(ctx.params.teamsPerLeague).map((zone) => ({ ...zone, leagueId: l.id })),
	);
	if (rows.length === 0) return [];
	return ctx.db.insert(leaguePlayoffZones).values(rows).returning();
}

/**
 * Exportada para el modo "avanzar liga existente" (Épica E): permite crear
 * equipos para UNA liga real (no generada por el simulador) sin pasar por
 * `createLeaguesForOrg`. El caller debe setear `ctx.params.teamsPerLeague`
 * antes de llamarla (ver /api/organization-simulator/advance).
 */
export async function createTeams(ctx: SimContext, leagueRows: League[]): Promise<Team[]> {
	if (leagueRows.length === 0) return [];
	const rows = leagueRows.flatMap((league) => {
		const names = pickN(ctx.rng, TEAM_NAME_POOL, ctx.params.teamsPerLeague);
		return names.map((name) => ({
			name,
			nameCanonical: sanitizeToCanonical(name),
			leagueId: league.id,
			color: pick(ctx.rng, TEAM_COLOR_POOL),
			status: "active" as const,
		}));
	});
	// Batched (ver chunk.ts) — un solo INSERT sin batch ya causó el error real
	// de Postgres "bind message has N parameter formats but 0 parameters" en
	// corridas tier L/XL para otras tablas; teams no tenía la misma protección.
	return insertInBatches(rows, (batch) => ctx.db.insert(teams).values(batch).returning());
}

export const structureContributor: Contributor = {
	name: "structure",
	dependsOn: ["identity"],
	async contribute(ctx: SimContext): Promise<void> {
		const orgs = getOrganizations(ctx);

		const [existingSlugsByOrg, existingCodes] = await Promise.all([
			fetchExistingLeagueSlugsByOrg(ctx),
			fetchExistingLeagueCodes(ctx),
		]);

		const leagueRows: League[] = [];
		// Secuencial (no Promise.all): cada org reutiliza y muta el mismo
		// existingCodes/existingSlugsByOrg para no chocar entre sí.
		for (const org of orgs) {
			const created = await createLeaguesForOrg(ctx, org, existingSlugsByOrg, existingCodes);
			leagueRows.push(...created);
		}

		const [configs, schedulingConfigs, zones, teamRows] = await Promise.all([
			createLeagueConfigs(ctx, leagueRows),
			createLeagueSchedulingConfigs(ctx, leagueRows),
			createLeaguePlayoffZones(ctx, leagueRows),
			createTeams(ctx, leagueRows),
		]);

		setData(ctx, LEAGUES_KEY, leagueRows);
		setData(ctx, LEAGUE_CONFIGS_KEY, configs);
		setData(ctx, LEAGUE_SCHEDULING_CONFIGS_KEY, schedulingConfigs);
		setData(ctx, LEAGUE_PLAYOFF_ZONES_KEY, zones);
		setData(ctx, TEAMS_KEY, teamRows);
	},
};

export function getLeagues(ctx: SimContext): League[] {
	return requireData<League[]>(ctx, LEAGUES_KEY);
}

export function getTeams(ctx: SimContext): Team[] {
	return requireData<Team[]>(ctx, TEAMS_KEY);
}

export function getTeamsByLeague(ctx: SimContext, leagueId: string): Team[] {
	return getTeams(ctx).filter((t) => t.leagueId === leagueId);
}

export function getLeagueConfigs(ctx: SimContext): LeagueConfig[] {
	return requireData<LeagueConfig[]>(ctx, LEAGUE_CONFIGS_KEY);
}

/** Mapa leagueId → league_config, para lookups O(1) (p. ej. desde discipline.ts). */
export function getLeagueConfigByLeagueId(ctx: SimContext): Map<string, LeagueConfig> {
	return new Map(getLeagueConfigs(ctx).map((c) => [c.leagueId, c]));
}
