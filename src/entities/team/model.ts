/**
 * entities/team/model.ts
 * Tipos y schemas Zod del dominio Team.
 * Los tipos de DB (Team, NewTeam) se re-exportan desde @/db.
 */

import { z } from "zod";
import type { Team, LeagueMember } from "@/db";

export type { Team, LeagueMember };

// ── RosterEntry ───────────────────────────────────────────────────────────────
// Re-export semántico de TeamRosterEntry (entities/player/queries.ts)
export type RosterEntry = {
	inscriptionId: string;
	memberId: string;
	globalPlayerId: string;
	fullName: string;
	birthDate: string;
	avatarUrl: string | null;
	dorsal: number | null;
	status: "active" | "suspended" | "inactive";
	inscriptionDate: string;
};

export type TeamWithLeague = Team & {
	leagueName: string;
	leagueSeason: string;
	leagueDayOfWeek: string;
};

// ── Schemas ───────────────────────────────────────────────────────────────────

export const UpdateTeamSchema = z.object({
	name: z.string().min(1, "El nombre es requerido").max(100).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Color debe ser formato hex #rrggbb")
		.optional()
		.nullable(),
});

export const UpdateRosterMemberSchema = z.object({
	dorsal: z.number().int().min(1).max(99).nullable().optional(),
	status: z.enum(["active", "suspended", "inactive"]).optional(),
});

export const TransferPlayerSchema = z.object({
	targetTeamId: z.string().uuid("ID de equipo destino inválido"),
});

export type UpdateTeamData = z.infer<typeof UpdateTeamSchema>;
export type UpdateRosterMemberData = z.infer<typeof UpdateRosterMemberSchema>;
export type TransferPlayerData = z.infer<typeof TransferPlayerSchema>;
