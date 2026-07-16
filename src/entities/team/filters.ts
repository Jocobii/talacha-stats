/**
 * entities/team/filters.ts
 *
 * Registro de campos filtrables para /admin/teams (organizador). Server-only
 * — referencia columnas de @/db. NO se re-exporta desde index.ts (rompería el
 * bundle cliente, ver regla del split barrel entity en AGENTS.md §3).
 *
 * Espejo de entities/player/filters.ts, acotado a los campos que aplican a
 * equipos: nombre (búsqueda) y liga (dependiente del FilterBar). Sin "estado"
 * — a diferencia de jugadores, el estado del equipo (active/disbanded) no es
 * un filtro expuesto en esta pantalla (decisión de diseño, ver mockup).
 */

import { z } from "zod";
import { teams } from "@/db";
import { defineFilterMap } from "@/shared/lib/list-query";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

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
	liga: {
		column: teams.leagueId,
		ops: ["eq"],
		defaultOp: "eq",
		value: z.string().uuid(),
	},
});
