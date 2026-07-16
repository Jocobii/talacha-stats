/**
 * entities/league/filters.ts
 *
 * Registro de campos filtrables para /admin/leagues. Server-only —
 * referencia columnas de @/db. NO se re-exporta desde index.ts (rompería el
 * bundle cliente, ver regla del split barrel entity en AGENTS.md §3).
 *
 * Espejo de entities/team/filters.ts. "estado" y "dia" son enums cerrados
 * (status/dayOfWeek en el schema) — sin transform, valor exacto.
 */

import { z } from "zod";
import { leagues } from "@/db";
import { defineFilterMap } from "@/shared/lib/list-query";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

const DAY_VALUES = [
	"lunes",
	"martes",
	"miercoles",
	"jueves",
	"viernes",
	"sabado",
	"domingo",
] as const;

export const leagueFilters = defineFilterMap({
	nombre: {
		column: leagues.nameCanonical,
		ops: ["containsWords", "contains"],
		defaultOp: "containsWords",
		value: z.string().min(1),
		transform: sanitizeToCanonical,
		sortable: true,
	},
	estado: {
		column: leagues.status,
		ops: ["eq", "in"],
		defaultOp: "eq",
		value: z.enum(["active", "finished"]),
		sortable: true,
	},
	dia: {
		column: leagues.dayOfWeek,
		ops: ["eq", "in"],
		defaultOp: "eq",
		value: z.enum(DAY_VALUES),
	},
});
