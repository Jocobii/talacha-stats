/**
 * src/db/simulator/contributors/discipline.ts
 *
 * Contribuidor "discipline" — ver docs/ORGANIZATION-SIMULATOR.md §5 y §7.4
 * (Épica C4). Escribe: suspensions.
 * Depende de: matchplay.
 *
 * Espeja la semántica de `features/discipline/apply-card-discipline.ts`
 * (roja directa → matchesTotal = redCardMatches; amarillas acumuladas →
 * mientras total >= (ciclosUsados+1) × yellowThreshold, crea una suspensión
 * más, contando ciclos ya sancionados aunque estén 'lifted'). NO importa
 * ese archivo directamente — depende de `db` como valor (vía
 * entities/suspension/queries.ts), lo que forzaría a abrir un Pool de
 * Postgres real en cuanto un test tocara este contribuidor (mismo problema
 * que se evitó en context.ts, ver commit de esa corrección). Si la regla de
 * negocio de esa función cambia, hay que actualizar esta también.
 *
 * Solo procesa las tarjetas de los `matches` que `matchplay` ACABA de crear
 * en esta corrida (ctx.data, no toda la liga) — un match nuevo nunca fue
 * procesado antes, así que no hace falta re-escanear la liga completa. La
 * acumulación de amarillas sí mira el total histórico (todas las jornadas).
 *
 * Límite conocido: NO sincroniza `league_members.status` — eso requiere un
 * UPDATE con condición dinámica que el fake de `db` usado en tests no
 * soporta (ver contributors/test-helpers.ts). En la app real ese campo se
 * mantiene consistente vía `syncLeagueMemberStatus` cuando la cédula se
 * resuelve por el flujo normal; el dato sintético del simulador queda con
 * `league_members.status` sin reflejar la suspensión hasta que se resuelva
 * este límite (fuera de alcance de la Épica C).
 */

import { suspensions, inscriptions, leagueMembers, matchPlayerStats, matches } from "@/db/schema";
import type {
	Suspension,
	League,
	MatchPlayerStat,
	Inscription,
	LeagueMember,
	Match,
} from "@/db/schema";
import type { LeagueConfig } from "@/db/schema";
import { setData, requireData, getData, type Contributor, type SimContext } from "../context";
import { insertInBatches } from "../chunk";
import { getLeagues, LEAGUE_CONFIGS_KEY } from "./structure";
import { getMatches, getMatchPlayerStats } from "./matchplay";

/**
 * A diferencia de getLeagueConfigByLeagueId (structure.ts, estricto), este
 * contribuidor tiene defaults razonables — no vale la pena reventar toda la
 * corrida si el caller no precargó league_config (p. ej. un test que solo
 * le interesan las suspensiones, no la configuración de la liga).
 */
function getLeagueConfigByLeagueIdLenient(ctx: SimContext): Map<string, LeagueConfig> {
	const configs = getData<LeagueConfig[]>(ctx, LEAGUE_CONFIGS_KEY) ?? [];
	return new Map(configs.map((c) => [c.leagueId, c]));
}

export const SUSPENSIONS_KEY = "suspensions";

const DEFAULT_YELLOW_THRESHOLD = 5;
const DEFAULT_RED_CARD_MATCHES = 1;

interface CardedPlayer {
	globalPlayerId: string;
	matchId: string;
	yellowCards: number;
	redCards: number;
}

function resolveGlobalPlayerId(
	stat: MatchPlayerStat,
	inscriptionById: Map<string, Inscription>,
	memberById: Map<string, LeagueMember>,
): string | null {
	const inscription = inscriptionById.get(stat.playerRegistrationId);
	if (!inscription) return null;
	return memberById.get(inscription.leagueMemberId)?.globalPlayerId ?? null;
}

async function fetchCardedPlayersThisRun(
	ctx: SimContext,
	leagueId: string,
	inscriptionById: Map<string, Inscription>,
	memberById: Map<string, LeagueMember>,
): Promise<CardedPlayer[]> {
	const newMatches = getMatches(ctx).filter((m) => m.leagueId === leagueId);
	const newMatchIds = new Set(newMatches.map((m) => m.id));
	const newStats = getMatchPlayerStats(ctx).filter((s) => newMatchIds.has(s.matchId));

	const result: CardedPlayer[] = [];
	for (const stat of newStats) {
		if (stat.yellowCards === 0 && stat.redCards === 0) continue;
		const globalPlayerId = resolveGlobalPlayerId(stat, inscriptionById, memberById);
		if (!globalPlayerId) continue;
		result.push({
			globalPlayerId,
			matchId: stat.matchId,
			yellowCards: stat.yellowCards,
			redCards: stat.redCards,
		});
	}
	return result;
}

/** Total histórico de amarillas del jugador en la liga (todas las jornadas, solo `played`). */
async function fetchCumulativeYellowsByPlayer(
	ctx: SimContext,
	leagueId: string,
	inscriptionById: Map<string, Inscription>,
	memberById: Map<string, LeagueMember>,
): Promise<Map<string, number>> {
	const allMatches = (await ctx.db.select().from(matches)) as Match[];
	const leagueMatchIds = new Set(
		allMatches.filter((m) => m.leagueId === leagueId && m.status === "played").map((m) => m.id),
	);
	const allStats = (await ctx.db.select().from(matchPlayerStats)) as MatchPlayerStat[];

	const totals = new Map<string, number>();
	for (const stat of allStats) {
		if (!leagueMatchIds.has(stat.matchId) || stat.yellowCards === 0) continue;
		const globalPlayerId = resolveGlobalPlayerId(stat, inscriptionById, memberById);
		if (!globalPlayerId) continue;
		totals.set(globalPlayerId, (totals.get(globalPlayerId) ?? 0) + stat.yellowCards);
	}
	return totals;
}

interface ExistingSuspensionInfo {
	cyclesByReason: Map<string, number>; // `${globalPlayerId}::${reason}` -> count (incluye lifted)
	sourceMatchKeys: Set<string>; // `${matchId}::${globalPlayerId}::${reason}` — dedup idempotente
}

async function fetchExistingSuspensionInfo(
	ctx: SimContext,
	leagueId: string,
): Promise<ExistingSuspensionInfo> {
	const allSuspensions = (await ctx.db.select().from(suspensions)) as Suspension[];
	const leagueSuspensions = allSuspensions.filter((s) => s.leagueId === leagueId);

	const cyclesByReason = new Map<string, number>();
	const sourceMatchKeys = new Set<string>();
	for (const s of leagueSuspensions) {
		const cycleKey = `${s.globalPlayerId}::${s.reason}`;
		cyclesByReason.set(cycleKey, (cyclesByReason.get(cycleKey) ?? 0) + 1);
		if (s.sourceMatchId) {
			sourceMatchKeys.add(`${s.sourceMatchId}::${s.globalPlayerId}::${s.reason}`);
		}
	}
	return { cyclesByReason, sourceMatchKeys };
}

type SuspensionDraft = Omit<typeof suspensions.$inferInsert, "id" | "createdAt" | "updatedAt">;

function buildSuspensionDefs(
	league: League,
	cardedPlayers: CardedPlayer[],
	cumulativeYellows: Map<string, number>,
	existing: ExistingSuspensionInfo,
	redCardMatches: number,
	yellowThreshold: number,
): SuspensionDraft[] {
	const defs: SuspensionDraft[] = [];
	// Copia local — cada suspensión de amarillas nueva consume un ciclo, y un
	// jugador puede aparecer en varias cardedPlayers si tiene varias tarjetas
	// en la misma corrida (distintos matches).
	const cyclesByReason = new Map(existing.cyclesByReason);

	for (const player of cardedPlayers) {
		if (player.redCards > 0) {
			const key = `${player.matchId}::${player.globalPlayerId}::red_card`;
			if (!existing.sourceMatchKeys.has(key)) {
				defs.push({
					globalPlayerId: player.globalPlayerId,
					leagueId: league.id,
					reason: "red_card",
					reasonDetail: null,
					durationType: "matches",
					matchesTotal: redCardMatches,
					matchesServed: 0,
					durationValue: null,
					durationUnit: null,
					startsOn: null,
					endsOn: null,
					status: "active",
					sourceMatchId: player.matchId,
					recordedBy: null,
				});
			}
		}

		if (player.yellowCards > 0) {
			const dedupKey = `${player.matchId}::${player.globalPlayerId}::yellow_accumulation`;
			if (existing.sourceMatchKeys.has(dedupKey)) continue;

			const totalYellows = cumulativeYellows.get(player.globalPlayerId) ?? 0;
			const cycleKey = `${player.globalPlayerId}::yellow_accumulation`;
			let cyclesUsed = cyclesByReason.get(cycleKey) ?? 0;

			while (totalYellows >= (cyclesUsed + 1) * yellowThreshold) {
				defs.push({
					globalPlayerId: player.globalPlayerId,
					leagueId: league.id,
					reason: "yellow_accumulation",
					reasonDetail: null,
					durationType: "matches",
					matchesTotal: 1,
					matchesServed: 0,
					durationValue: null,
					durationUnit: null,
					startsOn: null,
					endsOn: null,
					status: "active",
					sourceMatchId: player.matchId,
					recordedBy: null,
				});
				cyclesUsed += 1;
			}
			cyclesByReason.set(cycleKey, cyclesUsed);
		}
	}

	return defs;
}

export const disciplineContributor: Contributor = {
	name: "discipline",
	dependsOn: ["matchplay"],
	async contribute(ctx: SimContext): Promise<void> {
		const leagueRows = getLeagues(ctx);
		const leagueConfigByLeagueId = getLeagueConfigByLeagueIdLenient(ctx);

		const allInscriptions = (await ctx.db.select().from(inscriptions)) as Inscription[];
		const allLeagueMembers = (await ctx.db.select().from(leagueMembers)) as LeagueMember[];
		const inscriptionById = new Map(allInscriptions.map((i) => [i.id, i]));

		const allDefs: SuspensionDraft[] = [];

		for (const league of leagueRows) {
			const memberById = new Map(
				allLeagueMembers.filter((m) => m.leagueId === league.id).map((m) => [m.id, m]),
			);

			const cardedPlayers = await fetchCardedPlayersThisRun(
				ctx,
				league.id,
				inscriptionById,
				memberById,
			);
			if (cardedPlayers.length === 0) continue;

			const cumulativeYellows = await fetchCumulativeYellowsByPlayer(
				ctx,
				league.id,
				inscriptionById,
				memberById,
			);
			const existing = await fetchExistingSuspensionInfo(ctx, league.id);
			const config = leagueConfigByLeagueId.get(league.id);

			allDefs.push(
				...buildSuspensionDefs(
					league,
					cardedPlayers,
					cumulativeYellows,
					existing,
					config?.redCardMatches ?? DEFAULT_RED_CARD_MATCHES,
					config?.yellowThreshold ?? DEFAULT_YELLOW_THRESHOLD,
				),
			);
		}

		const rows: Suspension[] = await insertInBatches(allDefs, (batch) =>
			ctx.db.insert(suspensions).values(batch).returning(),
		);
		setData(ctx, SUSPENSIONS_KEY, rows);
	},
};

export function getSuspensions(ctx: SimContext): Suspension[] {
	return requireData<Suspension[]>(ctx, SUSPENSIONS_KEY);
}
