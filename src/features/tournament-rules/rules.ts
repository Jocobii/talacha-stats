/**
 * features/tournament-rules/rules.ts
 *
 * Lógica server de "Reglamento del torneo": leer la config resuelta (con
 * defaults) y editarla, validando el bloqueo por `locked_at` (§4.4 de
 * docs/MODULOS-GESTION-LIGA.md — la config se congela al arrancar el
 * torneo). Las escrituras viven en la feature, las lecturas base en
 * entities/league-config (mismo patrón que tournament-skin/activations).
 *
 * SOLO SERVER — importa @/db. No se re-exporta desde index.ts (§ nota abajo).
 */

import {
	findLeagueConfig,
	findLeagueConfigOrDefaults,
	upsertLeagueConfig,
} from "@/entities/league-config/queries";
import type { LeagueConfigDto, UpdateLeagueConfigInput } from "@/entities/league-config";

export type UpdateLeagueRulesResult =
	| { ok: true; config: LeagueConfigDto }
	| { ok: false; error: string; status: 404 | 409 };

/** Config resuelta con defaults — usarla para pintar el formulario de reglamento. */
export async function getLeagueRules(leagueId: string): Promise<LeagueConfigDto> {
	return findLeagueConfigOrDefaults(leagueId);
}

/**
 * Actualiza el reglamento de la liga. Rechaza si la config ya está
 * congelada (`locked_at` seteado al resolver la primera cédula) — en ese
 * punto cambiar desempates o disciplina rompería la confianza en la tabla.
 * El override explícito del owner con auditoría queda para una iteración
 * futura (§4.4, "cambio con acción explícita del owner registrada en
 * auditoría") — hoy simplemente se bloquea.
 */
export async function updateLeagueRules(
	leagueId: string,
	input: UpdateLeagueConfigInput,
): Promise<UpdateLeagueRulesResult> {
	const current = await findLeagueConfig(leagueId);

	if (current?.lockedAt) {
		return {
			ok: false,
			error:
				"El reglamento está congelado: la liga ya arrancó el torneo (primera cédula resuelta).",
			status: 409,
		};
	}

	// La UI solo reordena los 4 criterios deportivos (§ entities/league-config
	// USER_TIEBREAKER_CRITERIA); "name" es el desempate técnico final y se
	// agrega siempre al fondo para garantizar un orden total en standings.ts.
	const tiebreakers = input.tiebreakers ? [...input.tiebreakers, "name"] : undefined;

	const config = await upsertLeagueConfig(leagueId, {
		...input,
		...(tiebreakers && { tiebreakers }),
	});
	return { ok: true, config };
}
