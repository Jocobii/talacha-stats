/**
 * entities/matchday/model.ts
 * Tipos de dominio para la entidad Matchday.
 */

import type { Matchday } from "@/db/schema";

export type { Matchday };

export type NewMatchday = {
	leagueId: string;
	number: number;
	phase: MatchdayPhase;
	scheduledDate: string;
	status?: MatchdayStatus;
	notes?: string;
};

export const MATCHDAY_PHASES = ["regular", "playoff"] as const;
export type MatchdayPhase = (typeof MATCHDAY_PHASES)[number];

export const MATCHDAY_STATUSES = ["draft", "published", "in_progress", "completed"] as const;
export type MatchdayStatus = (typeof MATCHDAY_STATUSES)[number];

/** Matchday con conteo de partidos (útil para listados) */
export type MatchdaySummary = Matchday & {
	matchCount: number;
};

/** Lo mínimo para resolver `canManageLeague` desde una page (§3.3 AGENTS.md). */
export type MatchdayPermissionContext = {
	leagueId: string;
	organizationId: string | null;
};
