/**
 * entities/player/filters.ts
 *
 * Registro de campos filtrables para /admin/players (organizador). Server-only
 * — referencia columnas de @/db. NO se re-exporta desde index.ts (rompería el
 * bundle cliente, ver regla del split barrel entity en AGENTS.md §3).
 *
 * Ver docs/LIST-QUERY-FILTERS.md y el brief de diseño (BRIEF-DISENO-modulos-
 * data-heavy.md §5) para el mapeo campo → control que la UI debe respetar.
 *
 * Nota sobre "ligas" (Nº de ligas): es un valor agregado (COUNT ventana sobre
 * league_members), no una columna simple — no forma parte de este registro
 * como filtro. Su orden se resuelve a mano en listOrgPlayers (ver queries.ts).
 */

import { z } from "zod";
import { globalPlayers, leagueMembers, teams } from "@/db";
import { defineFilterMap } from "@/shared/lib/list-query";
import { sanitizeToCanonical } from "@/shared/lib/normalize";

export const LEAGUE_MEMBER_STATUS_VALUES = ["active", "suspended", "inactive"] as const;

export const orgPlayerFilters = defineFilterMap({
	nombre: {
		column: globalPlayers.fullNameCanonical,
		// containsWords: cada palabra tecleada debe aparecer en el nombre, en
		// cualquier orden — "pedro aguilar" matchea "Pedro Flores Aguilar".
		// contains (frase exacta y contigua) queda disponible por si algún
		// consumidor futuro la necesita explícita via `nombre__contains=`.
		ops: ["containsWords", "contains"],
		defaultOp: "containsWords",
		value: z.string().min(1),
		transform: sanitizeToCanonical,
		// sortable:true habilita que parseListQuery acepte `sort=nombre` en la
		// URL — pero el ORDER BY real lo resuelve buildOrgPlayersOrderBy a mano
		// en queries.ts (esta columna vive en una subquery, no en la tabla
		// original; buildOrderBy genérico no aplica aquí, ver nota de arriba).
		sortable: true,
	},
	estado: {
		column: leagueMembers.status,
		ops: ["eq", "in"],
		defaultOp: "in",
		value: z.enum(LEAGUE_MEMBER_STATUS_VALUES),
	},
	liga: {
		column: leagueMembers.leagueId,
		ops: ["eq"],
		defaultOp: "eq",
		value: z.string().uuid(),
	},
	equipo: {
		// Filtra por el equipo de la inscripción unida (teams.id) — dependiente de "liga".
		column: teams.id,
		ops: ["eq"],
		defaultOp: "eq",
		value: z.string().uuid(),
	},
	dorsal: {
		column: leagueMembers.dorsal,
		ops: ["gte", "lte", "between"],
		value: z.coerce.number().int().min(0).max(999),
		// Igual que "nombre": habilita `sort=dorsal` en la URL; el ORDER BY
		// real lo resuelve buildOrgPlayersOrderBy a mano en queries.ts.
		sortable: true,
	},
});
