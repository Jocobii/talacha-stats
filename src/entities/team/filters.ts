/**
 * entities/team/filters.ts
 *
 * Registro de campos filtrables para /admin/teams (organizador). Server-only
 * — referencia columnas de @/db. NO se re-exporta desde index.ts (rompería el
 * bundle cliente, ver regla del split barrel entity en AGENTS.md §3).
 *
 * Espejo de entities/player/filters.ts, acotado a los campos que aplican a
 * equipos: nombre (búsqueda), estado (active/pending/disbanded) y liga
 * (dependiente del FilterBar).
 *
 * "estado" es distinto al de jugadores: si el usuario NO manda ?estado= en la
 * URL, listOrgTeams/listAllTeams aplican un default de "active" a mano (ver
 * comentario en queries.ts) — a diferencia de jugadores, donde ausencia de
 * filtro significa "todos los estados".
 */

import { z } from "zod";
import { teams } from "@/db";
import { defineFilterMap } from "@/shared/lib/list-query";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

export const TEAM_STATUS_VALUES = ["active", "pending", "disbanded"] as const;

export const orgTeamFilters = defineFilterMap({
	nombre: {
		column: teams.nameCanonical,
		// containsWords: cada palabra tecleada debe aparecer en el nombre, en
		// cualquier orden — igual criterio que orgPlayerFilters.nombre.
		ops: ["containsWords", "contains"],
		defaultOp: "containsWords",
		value: z.string().min(1),
		transform: sanitizeToCanonical,
		sortable: true,
	},
	estado: {
		column: teams.status,
		ops: ["eq", "in"],
		defaultOp: "in",
		value: z.enum(TEAM_STATUS_VALUES),
	},
	liga: {
		column: teams.leagueId,
		ops: ["eq"],
		defaultOp: "eq",
		value: z.string().uuid(),
	},
});
