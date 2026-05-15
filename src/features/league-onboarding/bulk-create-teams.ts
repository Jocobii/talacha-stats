/**
 * features/league-onboarding/bulk-create-teams.ts
 *
 * Crea múltiples equipos para una liga en una sola transacción.
 * Usada desde el wizard de onboarding al avanzar del Paso 1 al Paso 2.
 */

import { db, teams } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

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

export type BulkCreateError = {
	type: "DUPLICATE_IN_BATCH" | "DUPLICATE_IN_LEAGUE";
	names: string[];
};

export type BulkCreateResult =
	| { ok: true; teams: CreatedTeam[] }
	| { ok: false; error: BulkCreateError };

export async function bulkCreateTeams(
	leagueId: string,
	input: BulkCreateTeamsInput,
): Promise<BulkCreateResult> {
	// ── Paso 1: calcular canonical de cada equipo del batch ────────────────────
	const enriched = input.teams.map((t) => ({
		name: t.name,
		nameCanonical: sanitizeToCanonical(t.name),
		color: t.color ?? null,
	}));

	// ── Paso 2: detectar duplicados dentro del batch ───────────────────────────
	const batchCanonicals = enriched.map((t) => t.nameCanonical);
	const batchDuplicates = batchCanonicals.filter((c, i) => batchCanonicals.indexOf(c) !== i);

	if (batchDuplicates.length > 0) {
		const duplicateNames = enriched
			.filter((t) => batchDuplicates.includes(t.nameCanonical))
			.map((t) => t.name);
		return {
			ok: false,
			error: { type: "DUPLICATE_IN_BATCH", names: [...new Set(duplicateNames)] },
		};
	}

	// ── Paso 3: verificar conflictos con equipos ya existentes en la liga ──────
	const existingTeams = await db.query.teams.findMany({
		where: eq(teams.leagueId, leagueId),
		columns: { name: true, nameCanonical: true },
	});

	const existingCanonicals = new Set(
		existingTeams
			.map((t) => t.nameCanonical)
			.filter((c): c is string => c !== null && c !== undefined),
	);

	const conflicting = enriched.filter((t) => existingCanonicals.has(t.nameCanonical));

	if (conflicting.length > 0) {
		return {
			ok: false,
			error: { type: "DUPLICATE_IN_LEAGUE", names: conflicting.map((t) => t.name) },
		};
	}

	// ── Paso 4: insertar en transacción ────────────────────────────────────────
	const inserted = await db.transaction(async (tx) => {
		return tx
			.insert(teams)
			.values(enriched.map((t) => ({ ...t, leagueId })))
			.returning({
				id: teams.id,
				name: teams.name,
				color: teams.color,
				leagueId: teams.leagueId,
			});
	});

	return { ok: true, teams: inserted };
}
