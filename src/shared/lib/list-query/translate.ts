/**
 * shared/lib/list-query/translate.ts
 *
 * Traduce el contrato `ListQuery` a cláusulas de Drizzle usando el registro
 * del recurso (`FilterMap`). Es el puente "Smart Backend": el WHERE/ORDER BY
 * se ejecuta en PostgreSQL, nunca en memoria.
 *
 * Uso en una query de entidad:
 *
 *   const where = buildWhere(orgPlayerFilters, query.filters);
 *   const orderBy = buildOrderBy(orgPlayerFilters, query.sort);
 *   const rows = await db.select().from(...).where(where).orderBy(...orderBy);
 *
 * `buildWhere` combina TODO con AND (regla del contrato). Cualquier condición
 * con campo/operador fuera de la allowlist se descarta en silencio — la
 * validación amigable ya la hizo `parseListQuery`; esto es la última guarda.
 */

import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	ne,
	notInArray,
	type Column,
	type SQL,
} from "drizzle-orm";
import type {
	FilterCondition,
	FilterMap,
	FilterOperator,
	FilterScalar,
	FilterValue,
	SortRule,
} from "./types";

// ── WHERE ─────────────────────────────────────────────────────────────────────

export function buildWhere(map: FilterMap, filters: FilterCondition[]): SQL | undefined {
	const conditions = filters
		.map((filter) => toCondition(map, filter))
		.filter((condition): condition is SQL => condition !== undefined);

	if (conditions.length === 0) return undefined;
	return and(...conditions);
}

function toCondition(map: FilterMap, cond: FilterCondition): SQL | undefined {
	const def = map[cond.field];
	if (!def) return undefined;
	if (!def.ops.includes(cond.op)) return undefined;
	return applyOperator(def.column, cond.op, cond.value);
}

function applyOperator(column: Column, op: FilterOperator, value: FilterValue): SQL | undefined {
	switch (op) {
		case "eq":
			return eq(column, value);
		case "ne":
			return ne(column, value);
		case "gt":
			return gt(column, value);
		case "gte":
			return gte(column, value);
		case "lt":
			return lt(column, value);
		case "lte":
			return lte(column, value);
		case "contains":
			return ilike(column, `%${String(value)}%`);
		case "containsWords":
			return containsWordsCondition(column, value);
		case "in":
			return inArray(column, asArray(value));
		case "nin":
			return notInArray(column, asArray(value));
		case "between":
			return betweenCondition(column, value);
		case "isNull":
			return value ? isNull(column) : isNotNull(column);
	}
}

function betweenCondition(column: Column, value: FilterValue): SQL | undefined {
	const [min, max] = asArray(value);
	if (min === undefined || max === undefined) return undefined;
	return and(gte(column, min), lte(column, max));
}

/**
 * Cada palabra del valor debe aparecer en la columna, en cualquier orden y
 * posición — a diferencia de "contains", que exige la frase completa
 * contigua. Ej: buscar "pedro aguilar" matchea "Pedro Flores Aguilar"
 * (contains no lo haría, porque "aguilar" no sigue inmediatamente a "pedro").
 */
function containsWordsCondition(column: Column, value: FilterValue): SQL | undefined {
	const words = String(value)
		.split(/\s+/)
		.filter((w) => w.length > 0);
	if (words.length === 0) return undefined;
	return and(...words.map((w) => ilike(column, `%${w}%`)));
}

// ── ORDER BY ────────────────────────────────────────────────────────────────

export function buildOrderBy(map: FilterMap, sort: SortRule[]): SQL[] {
	return sort
		.map((rule): SQL | undefined => {
			const def = map[rule.field];
			if (!def?.sortable) return undefined;
			return rule.dir === "desc" ? desc(def.column) : asc(def.column);
		})
		.filter((clause): clause is SQL => clause !== undefined);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function asArray(value: FilterValue): FilterScalar[] {
	return Array.isArray(value) ? value : [value];
}
