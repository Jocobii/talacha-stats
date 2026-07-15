/**
 * entities/suspension/filters.ts
 *
 * Registro de campos filtrables/ordenables para /admin/suspensiones
 * (organizador y owner) — contrato ListQuery (ver shared/lib/list-query y
 * docs/LIST-QUERY-FILTERS.md). Server-only — referencia columnas de @/db. NO
 * se re-exporta desde index.ts (rompería el bundle cliente, ver regla del
 * split barrel entity en AGENTS.md §3).
 *
 * "creadoEn" no es filtrable desde la URL (ops: []) — solo existe para que
 * parseListQuery acepte un defaultSort por fecha de alta, igual que el resto
 * de columnas no proyectadas directamente en un control de FilterBar.
 */

import { z } from "zod";
import { globalPlayers, suspensions } from "@/db";
import { defineFilterMap } from "@/shared/lib/list-query";
import { sanitizeToCanonical } from "@/shared/lib/normalize";
import { SUSPENSION_DURATION_TYPES, SUSPENSION_STATUSES } from "./model";

export const orgSuspensionFilters = defineFilterMap({
	jugador: {
		column: globalPlayers.fullNameCanonical,
		ops: ["containsWords", "contains"],
		defaultOp: "containsWords",
		value: z.string().min(1),
		transform: sanitizeToCanonical,
		sortable: true,
	},
	estado: {
		column: suspensions.status,
		ops: ["eq", "in"],
		defaultOp: "in",
		value: z.enum(SUSPENSION_STATUSES),
	},
	tipo: {
		column: suspensions.durationType,
		ops: ["eq", "in"],
		defaultOp: "in",
		value: z.enum(SUSPENSION_DURATION_TYPES),
	},
	liga: {
		column: suspensions.leagueId,
		ops: ["eq"],
		defaultOp: "eq",
		value: z.string().uuid(),
	},
	creadoEn: {
		column: suspensions.createdAt,
		ops: [],
		value: z.string(),
		sortable: true,
	},
});
