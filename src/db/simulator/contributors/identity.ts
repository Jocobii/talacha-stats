/**
 * src/db/simulator/contributors/identity.ts
 *
 * Contribuidor "identity" — ver docs/ORGANIZATION-SIMULATOR.md §5 (Épica B1).
 * Escribe: organizations, organization_config, users, global_players.
 * Depende de: — (primer contribuidor del grafo).
 *
 * Dos modos, seleccionados por lo que ya haya en `ctx.data["targetOrganizations"]`
 * (lo puede pre-poblar el caller — CLI/API de la Épica E — para avanzar una org
 * existente en vez de crear una nueva):
 *   - Sin `targetOrganizations`: crea `ctx.params.orgs` organizaciones nuevas
 *     (primera corrida de un tier).
 *   - Con `targetOrganizations`: las reutiliza tal cual (corrida incremental).
 *
 * El pool de `global_players` se dimensiona exactamente a los cupos de
 * roster de esta corrida (orgs × ligas/org × equipos/liga × jugadores/equipo).
 * La reutilización cross-liga (un jugador en 2+ ligas) es responsabilidad de
 * `enrollment` (B4), no de este contribuidor.
 */

import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { organizations, organizationConfig, users, globalPlayers } from "@/db/schema";
import type { Organization, OrganizationConfig, User, GlobalPlayer } from "@/db/schema";
import { suggestOrgSlug, validateOrgSlug } from "@/shared/org-theme/slug";
import { IdentityGenerator } from "../identity";
import { pick, type Rng } from "../rng";
import { setData, requireData, type Contributor, type SimContext } from "../context";
import { insertInBatches } from "../chunk";

export const ORGANIZATIONS_KEY = "organizations";
export const ORGANIZATION_CONFIGS_KEY = "organizationConfigs";
export const ORGANIZATION_OWNERS_KEY = "organizationOwners";
export const GLOBAL_PLAYERS_KEY = "globalPlayers";

/** Dev-only: misma contraseña para todos los usuarios generados por el simulador. */
export const SIMULATOR_DEV_PASSWORD = "simulador1234";

const scryptAsync = promisify(scrypt);
async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const derived = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${derived.toString("hex")}`;
}

const ORG_NAME_POOL = [
	"Novofut",
	"Liga Casablanca",
	"Furati FC",
	"Liga Fut7 Sánchez Taboada",
	"Deportivo Zona Río",
	"Liga La Mesa",
	"Copa Otay",
	"Liga Playas de Tijuana",
	"Deportivo Cerro Colorado",
	"Liga Fraccionamiento Independencia",
	"Copa El Florido",
	"Liga Fut7 Presidentes",
	"Deportivo San Antonio de los Buenos",
	"Liga Camino Verde",
	"Fut7 Nueva Tijuana",
] as const;

/** Resuelve colisiones de slug agregando sufijo numérico ("novofut-2", …). */
function resolveUniqueSlug(base: string, existing: Set<string>): string {
	if (!existing.has(base)) return base;
	let suffix = 2;
	while (existing.has(`${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

function slugForOrgName(rng: Rng, name: string, existing: Set<string>): string {
	let base = suggestOrgSlug(name);
	if (!validateOrgSlug(base).ok) {
		// Nombre degenerado (todo símbolos) — cae a un slug genérico + número.
		base = `liga-${Math.floor(rng() * 100000)}`;
	}
	return resolveUniqueSlug(base, existing);
}

async function fetchExistingOrgSlugs(ctx: SimContext): Promise<Set<string>> {
	const rows = await ctx.db.select({ slug: organizations.slug }).from(organizations);
	return new Set(rows.map((r) => r.slug));
}

async function fetchExistingGlobalPlayerKeys(
	ctx: SimContext,
): Promise<{ fullNameCanonical: string | null; curpHash: string }[]> {
	return ctx.db
		.select({
			fullNameCanonical: globalPlayers.fullNameCanonical,
			curpHash: globalPlayers.curpHash,
		})
		.from(globalPlayers);
}

async function createOrganizations(
	ctx: SimContext,
	existingSlugs: Set<string>,
): Promise<Organization[]> {
	const names = new Set<string>();
	const chosenNames: string[] = [];
	let attempts = 0;
	while (chosenNames.length < ctx.params.orgs && attempts < ORG_NAME_POOL.length * 5) {
		attempts++;
		const name = pick(ctx.rng, ORG_NAME_POOL);
		if (names.has(name)) continue;
		names.add(name);
		chosenNames.push(name);
	}
	// Si el pool no alcanza (orgs > pool.length), completa con sufijo numérico.
	while (chosenNames.length < ctx.params.orgs) {
		chosenNames.push(`${pick(ctx.rng, ORG_NAME_POOL)} ${chosenNames.length + 1}`);
	}

	const rows = chosenNames.map((name) => ({
		name,
		slug: slugForOrgName(ctx.rng, name, existingSlugs),
		city: "Tijuana",
		// Verificada por default: el simulador existe para probar flujos reales
		// (públicos incluidos), no para poblar el estado "trial" del onboarding.
		status: "verified" as const,
	}));

	// Registra los slugs elegidos para no chocar entre sí dentro del mismo batch.
	for (const row of rows) existingSlugs.add(row.slug);

	return ctx.db.insert(organizations).values(rows).returning();
}

async function createOrganizationConfigs(
	ctx: SimContext,
	orgs: Organization[],
): Promise<OrganizationConfig[]> {
	if (orgs.length === 0) return [];
	return ctx.db
		.insert(organizationConfig)
		.values(orgs.map((org) => ({ organizationId: org.id })))
		.returning();
}

async function createOrganizationOwners(ctx: SimContext, orgs: Organization[]): Promise<User[]> {
	if (orgs.length === 0) return [];
	const passwordHash = await hashPassword(SIMULATOR_DEV_PASSWORD);

	// Una sola consulta para todos los usuarios existentes — evita N+1 y es
	// fácil de simular en tests con una tabla en memoria.
	const existingUsers = await ctx.db.select().from(users);
	const existingByOrgId = new Map<string, User>();
	for (const u of existingUsers as User[]) {
		if (u.organizationId) existingByOrgId.set(u.organizationId, u);
	}

	const toCreate = orgs.filter((org) => !existingByOrgId.has(org.id));

	if (toCreate.length === 0) {
		return orgs.map((org) => existingByOrgId.get(org.id)).filter((u): u is User => Boolean(u));
	}

	const inserted = await ctx.db
		.insert(users)
		.values(
			toCreate.map((org) => ({
				email: `organizador+${org.slug}@simulador.talachastats.dev`,
				passwordHash,
				name: `Organizador ${org.name}`,
				role: "organizer" as const,
				organizationId: org.id,
				emailVerified: true,
			})),
		)
		.returning();

	for (const u of inserted as User[]) {
		if (u.organizationId) existingByOrgId.set(u.organizationId, u);
	}

	return orgs.map((org) => existingByOrgId.get(org.id)).filter((u): u is User => Boolean(u));
}

/**
 * Cupos de roster totales para esta corrida (no cuenta reutilización cross-liga).
 *
 * `orgCount` debe ser el número REAL de organizaciones que va a procesar
 * `structure` en esta corrida — no siempre es igual a `ctx.params.orgs`.
 * En modo "avanzar org existente" (Épica E) el caller precarga
 * `ctx.data[ORGANIZATIONS_KEY]` con 1 sola org objetivo, pero `ctx.params`
 * sigue siendo el preset del tier (ej. XL trae `orgs: 3`). Si esta función
 * usa `ctx.params.orgs` en vez del conteo real, el pool de global_players
 * queda dimensionado para más (o menos) orgs de las que `structure`
 * realmente va a crear equipos — bug real detectado en producción: liga
 * reutilizada terminó con equipos sin ningún jugador inscrito porque el
 * pool se agotó a mitad de una liga.
 */
export function totalRosterSlots(ctx: SimContext, orgCount: number = ctx.params.orgs): number {
	return (
		orgCount * ctx.params.leaguesPerOrg * ctx.params.teamsPerLeague * ctx.params.playersPerTeam
	);
}

async function createGlobalPlayers(ctx: SimContext, orgCount: number): Promise<GlobalPlayer[]> {
	const slots = totalRosterSlots(ctx, orgCount);
	if (slots === 0) return [];

	const generator = new IdentityGenerator(ctx.rng);
	generator.seedExisting(await fetchExistingGlobalPlayerKeys(ctx));

	const identities = generator.nextN(slots);
	const defs = identities.map((identity) => ({
		curpHash: identity.curpHash,
		fullName: identity.fullName,
		fullNameCanonical: identity.fullNameCanonical,
		birthDate: identity.birthDate,
	}));

	return insertInBatches(defs, (batch) => ctx.db.insert(globalPlayers).values(batch).returning());
}

/**
 * Nota de orquestación (decisión de la Épica E, no de este archivo): este
 * contribuidor —y structure/venues/enrollment— solo debe correr en una
 * corrida de "bootstrap" (org/liga nueva). Para avanzar 1–5 jornadas dentro
 * de una temporada ya creada, el caller invoca solo calendar/matchplay/
 * aggregates/discipline (Épica C) y precarga `ctx.data` con lo que ya
 * existe (organizations, leagues, teams, leagueMembers…) en vez de volver
 * a correr esta cadena.
 */
export const identityContributor: Contributor = {
	name: "identity",
	dependsOn: [],
	async contribute(ctx: SimContext): Promise<void> {
		const target = ctx.data[ORGANIZATIONS_KEY] as Organization[] | undefined;

		const existingSlugs = await fetchExistingOrgSlugs(ctx);
		const orgs =
			target && target.length > 0 ? target : await createOrganizations(ctx, existingSlugs);

		const [configs, owners, players] = await Promise.all([
			createOrganizationConfigs(ctx, orgs),
			createOrganizationOwners(ctx, orgs),
			createGlobalPlayers(ctx, orgs.length),
		]);

		setData(ctx, ORGANIZATIONS_KEY, orgs);
		setData(ctx, ORGANIZATION_CONFIGS_KEY, configs);
		setData(ctx, ORGANIZATION_OWNERS_KEY, owners);
		setData(ctx, GLOBAL_PLAYERS_KEY, players);
	},
};

export function getOrganizations(ctx: SimContext): Organization[] {
	return requireData<Organization[]>(ctx, ORGANIZATIONS_KEY);
}

export function getGlobalPlayers(ctx: SimContext): GlobalPlayer[] {
	return requireData<GlobalPlayer[]>(ctx, GLOBAL_PLAYERS_KEY);
}
