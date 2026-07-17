/**
 * entities/player-credential/queries.ts
 * Acceso a DB para el pase del jugador (AGENTS.md §3.7 paso 2). Solo server —
 * se importa por ruta directa (`@/entities/player-credential/queries`), nunca
 * desde el barrel `index.ts` (que es client-safe, solo model.ts).
 *
 * Todas las funciones reciben `executor` (db o una tx) como primer argumento
 * — mismo patrón que assignNextCredential (entities/player/lib/assign-credential.ts)
 * — para poder ejecutarse dentro de la misma transacción que crea/actualiza
 * el league_member (§5, §6).
 */

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { leagueMembers, leagues, playerCredentials } from "@/db/schema";
import {
	findCoveringCredential as findCoveringCredentialInList,
	isWithinValidity,
	type LeagueForAuthCheck,
} from "./lib/can-play-in-league";
import {
	computeCredentialDisplayStatus,
	type CredentialDisplayStatus,
} from "./lib/credential-status";
import { todayIsoDate } from "./lib/dates";

export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

type PlayerCredentialRow = Awaited<ReturnType<typeof db.query.playerCredentials.findMany>>[number];

/**
 * Busca el pase (si existe) que autoriza a este jugador a jugar en la liga
 * `leagueId` hoy (§5). Único punto que decide "derecho a jugar" — reusado al
 * inscribir y en cotejo/acta. Si la liga no existe, nunca autoriza.
 */
export async function findCoveringCredential(
	executor: Executor,
	globalPlayerId: string,
	leagueId: string,
	today: string = todayIsoDate(),
) {
	const league = await executor.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
	if (!league) return null;

	const credentials = await executor.query.playerCredentials.findMany({
		where: eq(playerCredentials.globalPlayerId, globalPlayerId),
	});

	const leagueForCheck: LeagueForAuthCheck = {
		id: league.id,
		organizationId: league.organizationId,
		status: league.status,
	};

	return findCoveringCredentialInList(credentials, leagueForCheck, today);
}

/** ¿Este jugador puede jugar en la liga `leagueId` hoy? Wrapper booleano de findCoveringCredential. */
export async function canPlayInLeague(
	executor: Executor,
	globalPlayerId: string,
	leagueId: string,
	today: string = todayIsoDate(),
): Promise<boolean> {
	return (await findCoveringCredential(executor, globalPlayerId, leagueId, today)) !== null;
}

export type CredentialStatusForLeague = {
	credential: PlayerCredentialRow | null;
	displayStatus: CredentialDisplayStatus;
};

/**
 * Resuelve el estado de credencial de un jugador para una liga (pantalla A
 * del paso de registro — A1 cubierto / A2 sin credencial / A3 recién
 * emitida). Si ningún pase cubre hoy, igual devuelve el pase más relevante
 * (de la misma org o liga) para poder explicar "vencida" en vez de solo
 * "pendiente" — insumo del modal de renovación (B3).
 */
export async function findCredentialStatusForLeague(
	executor: Executor,
	globalPlayerId: string,
	leagueId: string,
	today: string = todayIsoDate(),
): Promise<CredentialStatusForLeague | null> {
	const league = await executor.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
	if (!league) return null;

	const credentials = await executor.query.playerCredentials.findMany({
		where: eq(playerCredentials.globalPlayerId, globalPlayerId),
	});

	const leagueForCheck: LeagueForAuthCheck = {
		id: league.id,
		organizationId: league.organizationId,
		status: league.status,
	};

	const covering = findCoveringCredentialInList(credentials, leagueForCheck, today);
	if (covering) return { credential: covering, displayStatus: "vigente" };

	const relevant = credentials
		.filter((c) => c.organizationId === league.organizationId || c.leagueId === league.id)
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

	if (!relevant) return { credential: null, displayStatus: "pendiente" };

	return {
		credential: relevant,
		displayStatus: computeCredentialDisplayStatus(relevant, league.status, today),
	};
}

export type LeagueMemberCredentialStatus = {
	leagueMemberId: string;
	globalPlayerId: string;
	credential: PlayerCredentialRow | null;
	displayStatus: CredentialDisplayStatus;
};

/**
 * Estado de credencial de cada league_member de una liga — badge por fila
 * del roster (pantalla C). Una sola query relacional (join vía
 * leagueMembersRelations.credential), sin N+1 por jugador.
 */
export async function listCredentialStatusesForLeague(
	executor: Executor,
	leagueId: string,
	today: string = todayIsoDate(),
): Promise<LeagueMemberCredentialStatus[]> {
	const league = await executor.query.leagues.findFirst({ where: eq(leagues.id, leagueId) });
	if (!league) return [];

	const members = await executor.query.leagueMembers.findMany({
		where: eq(leagueMembers.leagueId, leagueId),
		with: { credential: true },
	});

	return members.map((member) => ({
		leagueMemberId: member.id,
		globalPlayerId: member.globalPlayerId,
		credential: member.credential,
		displayStatus: computeCredentialDisplayStatus(member.credential, league.status, today),
	}));
}

export type PlayerCredentialWithContext = Omit<PlayerCredentialRow, "organization" | "league"> & {
	organizationName: string;
	leagueName: string | null;
	displayStatus: CredentialDisplayStatus;
};

/**
 * Todos los pases de un jugador, agrupados por organización — sección de
 * credenciales del perfil (pantalla D). Cada pase trae su estado calculado
 * y el nombre de org/liga para no obligar al caller a resolverlos aparte.
 */
export async function listCredentialsForPlayer(
	executor: Executor,
	globalPlayerId: string,
	today: string = todayIsoDate(),
): Promise<PlayerCredentialWithContext[]> {
	const rows = await executor.query.playerCredentials.findMany({
		where: eq(playerCredentials.globalPlayerId, globalPlayerId),
		with: {
			organization: { columns: { name: true } },
			league: { columns: { name: true, status: true } },
		},
		orderBy: (c, { desc }) => [desc(c.createdAt)],
	});

	return rows.map(({ organization, league, ...credential }) => ({
		...credential,
		organizationName: organization.name,
		leagueName: league?.name ?? null,
		displayStatus: computeCredentialDisplayStatus(credential, league?.status ?? "active", today),
	}));
}

/**
 * Busca un pase `organization` activo y vigente del jugador para una org
 * (hoy dentro de [valid_from, valid_until]). Usado en:
 *   - §6 Nueva Temporada — re-vincular el anual a la liga clonada.
 *   - §4.1 alta de pase — impedir duplicar el índice uq_org_credential_active.
 */
export async function findActiveOrganizationCredential(
	executor: Executor,
	globalPlayerId: string,
	organizationId: string,
) {
	const today = todayIsoDate();
	const candidates = await executor.query.playerCredentials.findMany({
		where: eq(playerCredentials.globalPlayerId, globalPlayerId),
	});

	const match = candidates.find(
		(credential) =>
			credential.scope === "organization" &&
			credential.organizationId === organizationId &&
			credential.status === "active" &&
			isWithinValidity(credential, today),
	);

	return match ?? null;
}

/**
 * Versión en lote de findActiveOrganizationCredential: para cada
 * global_player_id en `globalPlayerIds`, busca su pase `organization` activo
 * y vigente para `organizationId`. Evita N consultas (una por jugador
 * copiado) en Nueva Temporada (§6), que puede mover decenas de jugadores en
 * una sola transacción.
 */
export async function findActiveOrganizationCredentialsForPlayers(
	executor: Executor,
	globalPlayerIds: string[],
	organizationId: string,
) {
	const byPlayer = new Map<string, PlayerCredentialRow>();
	if (globalPlayerIds.length === 0) return byPlayer;

	const today = todayIsoDate();
	const candidates = await executor.query.playerCredentials.findMany({
		where: and(
			inArray(playerCredentials.globalPlayerId, globalPlayerIds),
			eq(playerCredentials.organizationId, organizationId),
			eq(playerCredentials.scope, "organization"),
			eq(playerCredentials.status, "active"),
		),
	});

	for (const credential of candidates) {
		if (isWithinValidity(credential, today)) byPlayer.set(credential.globalPlayerId, credential);
	}
	return byPlayer;
}
