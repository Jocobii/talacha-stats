/**
 * features/league-onboarding/bulk-create-teams.ts
 *
 * Crea múltiples equipos para una liga en una sola transacción.
 * Usada desde el wizard de onboarding al avanzar del Paso 1 al Paso 2.
 */

import { db, teams } from "@/db";
import { z } from "zod";

export const BulkCreateTeamsSchema = z.object({
	teams: z
		.array(
			z.object({
				name: z.string().min(1).max(80),
				color: z
					.string()
					.regex(/^#[0-9A-Fa-f]{6}$/)
					.optional(),
			}),
		)
		.min(1)
		.max(50),
});

export type BulkCreateTeamsInput = z.infer<typeof BulkCreateTeamsSchema>;

export type CreatedTeam = {
	id: string;
	name: string;
	color: string | null;
	leagueId: string;
};

export async function bulkCreateTeams(
	leagueId: string,
	input: BulkCreateTeamsInput,
): Promise<CreatedTeam[]> {
	return db.transaction(async (tx) => {
		const inserted = await tx
			.insert(teams)
			.values(
				input.teams.map((t) => ({
					name: t.name,
					leagueId,
					color: t.color ?? null,
				})),
			)
			.returning({
				id: teams.id,
				name: teams.name,
				color: teams.color,
				leagueId: teams.leagueId,
			});
		return inserted;
	});
}
