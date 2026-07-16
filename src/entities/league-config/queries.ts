/**
 * entities/league-config/queries.ts
 * Acceso a DB para league_config. Sin validación de negocio (bloqueo por
 * locked_at, límites de refuerzos, etc.) — eso vive en
 * features/tournament-rules (§3.7).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagueConfig } from "@/db/schema";
import { DEFAULT_TIEBREAKERS, type LeagueConfigDto } from "./model";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | DbTx;

export const LEAGUE_CONFIG_DTO_COLUMNS = {
	leagueId: leagueConfig.leagueId,
	pointsWin: leagueConfig.pointsWin,
	pointsDraw: leagueConfig.pointsDraw,
	tiebreakers: leagueConfig.tiebreakers,
	yellowThreshold: leagueConfig.yellowThreshold,
	redCardMatches: leagueConfig.redCardMatches,
	blueCardMeaning: leagueConfig.blueCardMeaning,
	reinforcementLimit: leagueConfig.reinforcementLimit,
	financeLevel: leagueConfig.financeLevel,
	lockedAt: leagueConfig.lockedAt,
} as const;

/** Fila cruda de league_config, o null si la liga nunca la ha guardado. */
export async function findLeagueConfig(leagueId: string): Promise<LeagueConfigDto | null> {
	const rows = await db
		.select(LEAGUE_CONFIG_DTO_COLUMNS)
		.from(leagueConfig)
		.where(eq(leagueConfig.leagueId, leagueId))
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Config resuelta con defaults en memoria cuando la liga aún no tiene fila
 * (informal que nunca abrió "Reglamento del torneo"). Usar aquí, no en
 * `standings.ts`, para no repetir los defaults del schema por todo el código.
 */
export async function findLeagueConfigOrDefaults(leagueId: string): Promise<LeagueConfigDto> {
	const config = await findLeagueConfig(leagueId);
	if (config) return config;
	return {
		leagueId,
		pointsWin: 3,
		pointsDraw: 1,
		tiebreakers: DEFAULT_TIEBREAKERS,
		yellowThreshold: 5,
		redCardMatches: 1,
		blueCardMeaning: "temp",
		reinforcementLimit: null,
		financeLevel: 0,
		lockedAt: null,
	};
}

/**
 * Crea o actualiza la fila de league_config. No valida `locked_at`: quien
 * llame debe checar el bloqueo antes (features/tournament-rules).
 */
export async function upsertLeagueConfig(
	leagueId: string,
	values: Partial<
		Pick<
			LeagueConfigDto,
			| "pointsWin"
			| "pointsDraw"
			| "tiebreakers"
			| "yellowThreshold"
			| "redCardMatches"
			| "blueCardMeaning"
			| "reinforcementLimit"
			| "financeLevel"
		>
	>,
): Promise<LeagueConfigDto> {
	const [row] = await db
		.insert(leagueConfig)
		.values({ leagueId, ...values })
		.onConflictDoUpdate({
			target: leagueConfig.leagueId,
			set: { ...values, updatedAt: new Date() },
		})
		.returning(LEAGUE_CONFIG_DTO_COLUMNS);
	return row!;
}

/**
 * Inserta league_config para una liga que se acaba de crear (seed desde
 * organization_config — §4.5 docs/MODULOS-GESTION-LIGA.md). `onConflictDoNothing`
 * porque una liga nueva nunca debería tener fila previa; si la tiene, no la pisa.
 * Acepta `client` para poder correr dentro de la misma tx que crea la liga.
 */
export async function insertLeagueConfig(
	leagueId: string,
	values: Partial<
		Pick<
			LeagueConfigDto,
			| "pointsWin"
			| "pointsDraw"
			| "tiebreakers"
			| "yellowThreshold"
			| "redCardMatches"
			| "blueCardMeaning"
			| "reinforcementLimit"
			| "financeLevel"
		>
	>,
	client: DbOrTx = db,
): Promise<void> {
	await client
		.insert(leagueConfig)
		.values({ leagueId, ...values })
		.onConflictDoNothing();
}

/** Marca la config como congelada (se llama al resolver la 1a cédula). */
export async function lockLeagueConfig(leagueId: string): Promise<void> {
	await db
		.insert(leagueConfig)
		.values({ leagueId, lockedAt: new Date() })
		.onConflictDoUpdate({
			target: leagueConfig.leagueId,
			set: { lockedAt: new Date(), updatedAt: new Date() },
		});
}

/** Variante transaccional de `lockLeagueConfig` — usar dentro de la tx que resuelve la cédula. */
export async function lockLeagueConfigTx(tx: DbTx, leagueId: string): Promise<void> {
	await tx
		.insert(leagueConfig)
		.values({ leagueId, lockedAt: new Date() })
		.onConflictDoUpdate({
			target: leagueConfig.leagueId,
			set: { lockedAt: new Date(), updatedAt: new Date() },
		});
}
