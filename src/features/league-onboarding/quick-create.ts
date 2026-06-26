/**
 * features/league-onboarding/quick-create.ts
 *
 * Caso de uso: crear una liga y sus equipos en una sola transacción atómica.
 * Es el corazón del alta rápida — "camino corto Excel→liga" (A2).
 *
 * Reusa exactamente las reglas defensivas que ya existen en el proyecto:
 *   - slug único por organización (chequeo proactivo + error 409 si existe)
 *   - código de cédula auto-generado y único dentro de la organización
 *   - dedup de equipos por forma canónica (sanitizeToCanonical), igual que el
 *     constraint UNIQUE(league_id, name_canonical) de la tabla teams
 *
 * Los JUGADORES no se crean aquí — requieren CURP y van por su flujo aparte
 * (features/admin-registration). Esto es intencional: evita basura y duplicados
 * imposibles de limpiar al permitir texto libre de jugadores.
 */

import { db, leagues, teams } from "@/db";
import { and, eq } from "drizzle-orm";
import { generateSlug } from "@/entities/organization";
import { getActiveCity } from "@/shared/lib/active-city";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import {
	generateLeagueCode,
	resolveUniqueCode,
} from "@/features/league-management/lib/generate-league-code";
import { QuickCreateLeagueSchema, type QuickCreateLeagueInput } from "./model/league-form-schema";

// El contrato (schema + tipo) vive en model/league-form-schema.ts — FUENTE
// ÚNICA compartida con el formulario (cliente). Se re-exporta para que el API
// route lo siga importando desde esta feature.
export { QuickCreateLeagueSchema };
export type { QuickCreateLeagueInput };

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type QuickCreatedLeague = {
	id: string;
	name: string;
	slug: string | null;
	season: string;
	dayOfWeek: string;
};

export type QuickCreateSuccess = {
	ok: true;
	league: QuickCreatedLeague;
	teams: { id: string; name: string }[];
};

export type QuickCreateError = {
	ok: false;
	code: "LEAGUE_EXISTS" | "NO_VALID_TEAMS" | "DUPLICATE_TEAMS" | "DB_ERROR";
	error: string;
	existingLeagueId?: string;
	duplicates?: string[];
};

export type QuickCreateResult = QuickCreateSuccess | QuickCreateError;

type SessionLike = {
	role: string;
	organizationId: string | null;
};

// ---------------------------------------------------------------------------
// Caso de uso
// ---------------------------------------------------------------------------

export async function quickCreateLeague(
	input: QuickCreateLeagueInput,
	session: SessionLike,
): Promise<QuickCreateResult> {
	// 1. Resolver organización: owner puede pasar una explícita; organizer usa la suya.
	const organizationId =
		session.role === "owner" && input.organizationId
			? input.organizationId
			: (session.organizationId ?? input.organizationId ?? null);

	// 2. Slug único por organización. Incluir día + temporada evita colisiones
	//    entre temporadas distintas de la misma liga.
	const slug = generateSlug(`${input.name} ${input.dayOfWeek} ${input.season}`);

	if (organizationId) {
		const existing = await db.query.leagues.findFirst({
			where: and(eq(leagues.organizationId, organizationId), eq(leagues.slug, slug)),
			columns: { id: true, name: true, season: true },
		});
		if (existing) {
			return {
				ok: false,
				code: "LEAGUE_EXISTS",
				error: `Ya existe una liga "${existing.name}" (${existing.season}) con ese nombre y día en tu organización.`,
				existingLeagueId: existing.id,
			};
		}
	}

	// 3. Dedup de equipos por forma canónica (misma regla que la DB).
	const enriched: { name: string; nameCanonical: string }[] = [];
	const seen = new Set<string>();
	const duplicates: string[] = [];
	for (const raw of input.teams) {
		const name = raw.replace(/\s+/g, " ").trim();
		if (!name) continue;
		const nameCanonical = sanitizeToCanonical(name);
		if (!nameCanonical) continue;
		if (seen.has(nameCanonical)) {
			duplicates.push(name);
			continue;
		}
		seen.add(nameCanonical);
		enriched.push({ name, nameCanonical });
	}

	if (enriched.length === 0) {
		return { ok: false, code: "NO_VALID_TEAMS", error: "No hay equipos válidos para crear." };
	}
	if (duplicates.length > 0) {
		const unique = [...new Set(duplicates)];
		return {
			ok: false,
			code: "DUPLICATE_TEAMS",
			error: `Equipos repetidos: ${unique.join(", ")}.`,
			duplicates: unique,
		};
	}

	// 4. Código de cédula único dentro de la organización.
	const baseCode = generateLeagueCode(input.name);
	const existingRows = organizationId
		? await db.query.leagues.findMany({
				where: eq(leagues.organizationId, organizationId),
				columns: { code: true },
			})
		: [];
	const existingCodes = new Set(existingRows.map((r) => r.code).filter(Boolean) as string[]);
	const code = resolveUniqueCode(baseCode, existingCodes);

	const city = await getActiveCity();

	// 5. Insertar liga + equipos en una sola transacción atómica.
	try {
		return await db.transaction(async (tx) => {
			const [createdLeague] = await tx
				.insert(leagues)
				.values({
					name: input.name,
					nameCanonical: sanitizeToCanonical(input.name),
					slug,
					category: input.category ?? null,
					dayOfWeek: input.dayOfWeek,
					season: input.season,
					city,
					organizationId: organizationId ?? null,
					code,
				})
				.returning({
					id: leagues.id,
					name: leagues.name,
					slug: leagues.slug,
					season: leagues.season,
					dayOfWeek: leagues.dayOfWeek,
				});

			if (!createdLeague) throw new Error("No se pudo crear la liga");

			const insertedTeams = await tx
				.insert(teams)
				.values(
					enriched.map((t) => ({
						name: t.name,
						nameCanonical: t.nameCanonical,
						leagueId: createdLeague.id,
					})),
				)
				.returning({ id: teams.id, name: teams.name });

			return { ok: true, league: createdLeague, teams: insertedTeams };
		});
	} catch (dbError) {
		// §18.4 — no tragar el error: registrarlo en server antes de devolver el código.
		console.error(
			"[league-onboarding/quick-create] fallo en la transacción de creación de liga",
			dbError,
		);
		return { ok: false, code: "DB_ERROR", error: "No se pudo crear la liga. Intenta de nuevo." };
	}
}
