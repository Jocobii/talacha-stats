/**
 * entities/match/model.ts
 * Tipos de dominio para la entidad Match.
 */

import type { Match } from "@/db/schema";

export type { Match };

/**
 * Match con relaciones del módulo de sorteo.
 * El tipo exacto se infiere desde los queries; este alias es para
 * documentar la forma esperada en el resto del codebase.
 */
export type MatchWithRelations = Match & {
	matchday: { id: string; number: number; phase: string; scheduledDate: string } | null;
	venue: { id: string; name: string; city: string | null } | null;
};
