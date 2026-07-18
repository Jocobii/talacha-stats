/**
 * features/season-rollover/lib/create-next-season.ts
 *
 * Orquesta el rollover de temporada: valida nombre/código único, crea la
 * liga nueva, clona equipos + roster (clone-team-roster.ts) y configuración
 * (clone-league-settings.ts), y marca la liga origen como terminada.
 *
 * Extraído de app/api/leagues/[id]/new-season/route.ts (AGENTS.md §3.2/§3.4 —
 * transacciones en features/, no en el route). Sin cambio funcional respecto
 * al comportamiento anterior: sigue clonando TODOS los equipos `active` de la
 * liga origen. El contrato de `confirmedTeamIds` (solo copiar los equipos que
 * el organizador confirma, dejar el resto en `pending`) llega en el siguiente
 * paso (NUEVA-TEMPORADA-V2.md §4.2).
 */

import { eq, and } from "drizzle-orm";
import { db, leagues, teams } from "@/db";
import { generateSlug } from "@/entities/organization";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import {
	generateLeagueCode,
	resolveUniqueCode,
} from "@/features/league-management/lib/generate-league-code";
import { cloneLeagueSettings } from "./clone-league-settings";
import { cloneTeamRoster } from "./clone-team-roster";
import type { NewSeasonInput, CreateNextSeasonResult } from "../types";

export type CreateNextSeasonError = { ok: false; error: string; status: 404 | 409 };
export type CreateNextSeasonSuccess = { ok: true; result: CreateNextSeasonResult };

type SourceLeague = {
	id: string;
	name: string;
	nameCanonical: string | null;
	category: string | null;
	dayOfWeek: string;
	city: string;
	organizationId: string | null;
	schedulingEnabled: boolean;
	code: string | null;
};

export async function createNextSeason(
	source: SourceLeague,
	input: NewSeasonInput,
): Promise<CreateNextSeasonError | CreateNextSeasonSuccess> {
	const { season } = input;
	const sourceId = source.id;

	// ── Verificar slug único (proactivo) ──────────────────────────────────────
	const newSlug = generateSlug(`${source.name} ${source.dayOfWeek} ${season}`);
	if (source.organizationId) {
		const conflict = await db.query.leagues.findFirst({
			where: and(eq(leagues.organizationId, source.organizationId), eq(leagues.slug, newSlug)),
			columns: { id: true, season: true },
		});
		if (conflict) {
			return {
				ok: false,
				error: `Ya existe una temporada "${conflict.season}" de esta liga. Elige otro nombre.`,
				status: 409,
			};
		}
	}

	// ── Generar código único para la nueva liga ───────────────────────────────
	const baseCode = generateLeagueCode(source.name);
	const existingCodes = source.organizationId
		? await db.query.leagues
				.findMany({
					where: eq(leagues.organizationId, source.organizationId),
					columns: { code: true },
				})
				.then((rows) => new Set(rows.map((r) => r.code).filter(Boolean) as string[]))
		: new Set<string>();
	const newCode = resolveUniqueCode(baseCode, existingCodes);

	// ── Equipos a copiar (todos los `active` de la liga origen) ───────────────
	const sourceTeams = await db.query.teams.findMany({
		where: and(eq(teams.leagueId, sourceId), eq(teams.status, "active")),
		columns: { id: true, name: true, nameCanonical: true, color: true },
	});

	// ── Transacción: crear todo o nada ────────────────────────────────────────
	const created = await db.transaction(async (tx) => {
		const [newLeague] = await tx
			.insert(leagues)
			.values({
				name: source.name,
				nameCanonical: source.nameCanonical ?? sanitizeToCanonical(source.name),
				slug: newSlug,
				category: source.category ?? null,
				dayOfWeek: source.dayOfWeek,
				season,
				city: source.city,
				organizationId: source.organizationId ?? null,
				schedulingEnabled: source.schedulingEnabled,
				code: newCode,
			})
			.returning();

		const newLeagueId = newLeague.id;

		// Equipos — se insertan todos de una vez para poder mapear
		// sourceTeamId → newTeamId por nameCanonical (único por liga).
		let playersCopied = 0;
		if (sourceTeams.length > 0) {
			const insertedTeams = await tx
				.insert(teams)
				.values(
					sourceTeams.map((t) => ({
						name: t.name,
						nameCanonical: t.nameCanonical,
						color: t.color,
						leagueId: newLeagueId,
						sourceTeamId: t.id,
					})),
				)
				.returning({ id: teams.id, nameCanonical: teams.nameCanonical });

			const newTeamIdByNameCanonical = new Map(insertedTeams.map((t) => [t.nameCanonical, t.id]));

			for (const sourceTeam of sourceTeams) {
				const newTeamId = newTeamIdByNameCanonical.get(sourceTeam.nameCanonical);
				if (!newTeamId) continue;
				const { playersCopied: copied } = await cloneTeamRoster(sourceTeam.id, newTeamId, tx);
				playersCopied += copied;
			}
		}

		const settings = await cloneLeagueSettings(sourceId, newLeagueId, tx);

		// Marcar liga origen como terminada
		await tx.update(leagues).set({ status: "finished" }).where(eq(leagues.id, sourceId));

		return { newLeague, playersCopied, settings };
	});

	const result: CreateNextSeasonResult = {
		id: created.newLeague.id,
		name: created.newLeague.name,
		season: created.newLeague.season,
		copied: {
			teams: sourceTeams.length,
			players: created.playersCopied,
			zones: created.settings.zonesCopied,
			venues: created.settings.venuesCopied,
			hasSchedulingConfig: created.settings.hasSchedulingConfig,
		},
	};

	return { ok: true, result };
}
