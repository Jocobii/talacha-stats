/**
 * features/league-onboarding/quick-create.ts
 *
 * Caso de uso: crear la liga (paso 1 del alta). Los equipos y jugadores se
 * crean después en el wizard de configuración (StepTeams → StepPlayers).
 *
 * Reusa las reglas defensivas que ya existen en el proyecto:
 *   - slug único por organización (chequeo proactivo + error 409 si existe)
 *   - código de cédula auto-generado y único dentro de la organización
 */

import { db, leagues } from "@/db";
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
};

export type QuickCreateError = {
	ok: false;
	code: "LEAGUE_EXISTS" | "DB_ERROR";
	error: string;
	existingLeagueId?: string;
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

	// 3. Código de cédula único dentro de la organización.
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

	// 4. Insertar la liga. Los equipos se crean después en el wizard (StepTeams).
	try {
		const [createdLeague] = await db
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
				// El módulo de sorteo siempre está activo: toda liga nueva nace habilitada.
				schedulingEnabled: true,
			})
			.returning({
				id: leagues.id,
				name: leagues.name,
				slug: leagues.slug,
				season: leagues.season,
				dayOfWeek: leagues.dayOfWeek,
			});

		if (!createdLeague) throw new Error("No se pudo crear la liga");

		return { ok: true, league: createdLeague };
	} catch (dbError) {
		// §18.4 — no tragar el error: registrarlo en server antes de devolver el código.
		console.error(
			"[league-onboarding/quick-create] fallo en la transacción de creación de liga",
			dbError,
		);
		return { ok: false, code: "DB_ERROR", error: "No se pudo crear la liga. Intenta de nuevo." };
	}
}
