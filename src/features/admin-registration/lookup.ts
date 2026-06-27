/**
 * features/admin-registration/lookup.ts
 *
 * Caso de uso: buscar un jugador global por CURP.
 *
 * Flujo:
 *   1. Validar formato CURP (Zod)
 *   2. Derivar curp_hash (nunca guardar/loguear el CURP raw)
 *   3. Buscar en global_players por hash
 *   4. Retornar LookupResponse ({ found: true, player } | { found: false })
 *
 * El curpHash NUNCA sale del servidor — se omite del objeto retornado.
 * El caller (API route) devuelve LookupResponse directamente al cliente.
 */

import { CurpSchema } from "@/entities/player/model";
import type { LookupResponse } from "@/entities/player/model";
import {
	findGlobalPlayerByHash,
	countGlobalPlayerLeagueMemberships,
} from "@/entities/player/queries";
import { hashCurp } from "./hash";

export type LookupInput = {
	curp: string;
};

export type LookupError = {
	ok: false;
	error: string;
	code: "INVALID_CURP" | "DB_ERROR";
};

export type LookupSuccess = {
	ok: true;
	data: LookupResponse;
};

export type LookupResult = LookupSuccess | LookupError;

/**
 * Busca un jugador global por CURP.
 *
 * Retorna LookupResult — nunca lanza. Los errores se codifican en
 * el discriminador `ok` para que el API route los maneje limpiamente.
 */
export async function lookupByCurp(input: LookupInput): Promise<LookupResult> {
	// 1. Validar formato CURP
	const parsed = CurpSchema.safeParse(input.curp);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "CURP inválida",
			code: "INVALID_CURP",
		};
	}

	// 2. Hash — a partir de aquí el CURP raw ya no se usa
	const curpHash = hashCurp(parsed.data);

	// 3. Buscar en DB
	try {
		const player = await findGlobalPlayerByHash(curpHash);

		if (!player) {
			return { ok: true, data: { found: false } };
		}

		// 4. Contar ligas previas para mostrar historial en ventanilla
		const previousLeaguesCount = await countGlobalPlayerLeagueMemberships(player.id);

		// 5. Retornar datos globales — curpHash excluido explícitamente
		return {
			ok: true,
			data: {
				found: true,
				player: {
					id: player.id,
					fullName: player.fullName,
					birthDate: player.birthDate,
					avatarUrl: player.avatarUrl,
					createdAt: player.createdAt,
					previousLeaguesCount,
				},
			},
		};
	} catch (dbError) {
		// §18.4 — no tragar el error: registrarlo en server antes de devolver el código.
		// No se loguea el CURP raw ni el hash; solo el error de DB.
		console.error("[admin-registration/lookup] fallo al consultar global_players", dbError);
		return {
			ok: false,
			error: "Error al consultar la base de datos",
			code: "DB_ERROR",
		};
	}
}
