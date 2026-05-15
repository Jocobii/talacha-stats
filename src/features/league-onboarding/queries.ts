/**
 * features/league-onboarding/queries.ts
 *
 * Queries de soporte para el flujo de onboarding de liga profesional.
 */

import { db, teams, importAuditLog } from "@/db";
import { eq, sql } from "drizzle-orm";

export type OnboardingState = {
	hasTeams: boolean;
	hasImports: boolean;
	totalPlayers: number;
};

/**
 * Devuelve el estado de onboarding de una liga:
 * - hasTeams: si tiene al menos 1 equipo registrado
 * - hasImports: si tiene al menos 1 importación de Excel completada
 * - totalPlayers: jugadores inscritos vía inscriptions (V2)
 */
export async function getLeagueOnboardingState(leagueId: string): Promise<OnboardingState> {
	const [teamCount, importCount] = await Promise.all([
		db
			.select({ count: sql<number>`COUNT(*)::int` })
			.from(teams)
			.where(eq(teams.leagueId, leagueId)),
		db
			.select({ count: sql<number>`COUNT(*)::int` })
			.from(importAuditLog)
			.where(eq(importAuditLog.leagueId, leagueId)),
	]);

	return {
		hasTeams: (teamCount[0]?.count ?? 0) > 0,
		hasImports: (importCount[0]?.count ?? 0) > 0,
		totalPlayers: 0, // se puede enriquecer con inscriptions en el futuro
	};
}
