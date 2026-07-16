/**
 * shared/lib/list-query/registry.ts
 *
 * `defineFilterMap` declara la allowlist de campos filtrables de un recurso.
 *
 * Es la ÚNICA fuente de verdad: lo que aquí no está, ni el backend lo filtra
 * ni la UI lo pinta. Vive en la capa `entities/[recurso]/filters.ts` porque
 * referencia columnas de `@/db` (server-only — no cruzarlo al bundle cliente,
 * ver regla del split barrel entity).
 *
 * Uso:
 *
 *   // entities/player/filters.ts
 *   export const orgPlayerFilters = defineFilterMap({
 *     nombre: {
 *       column: globalPlayers.fullNameCanonical,
 *       ops: ["contains"],
 *       defaultOp: "contains",
 *       value: z.string().min(1),
 *       transform: sanitizeToCanonical,
 *       sortable: true,
 *     },
 *     estado: {
 *       column: leagueMembers.status,
 *       ops: ["eq", "in"],
 *       defaultOp: "eq",
 *       value: z.enum(["active", "suspended", "inactive"]),
 *     },
 *   });
 */

import type { FilterMap } from "./types";

/**
 * Identidad tipada: preserva la inferencia de las keys del registro y valida
 * en tiempo de desarrollo que `defaultOp` esté dentro de `ops`.
 */
export function defineFilterMap<T extends FilterMap>(map: T): T {
	for (const [field, def] of Object.entries(map)) {
		if (def.defaultOp && !def.ops.includes(def.defaultOp)) {
			throw new Error(
				`defineFilterMap: campo "${field}" tiene defaultOp "${def.defaultOp}" fuera de sus ops [${def.ops.join(", ")}]`,
			);
		}
	}
	return map;
}
