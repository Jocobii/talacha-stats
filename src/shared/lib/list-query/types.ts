/**
 * shared/lib/list-query/types.ts
 *
 * Contrato único para listar recursos con filtros/orden/paginación.
 *
 * El frontend manda filtros en la URL como params planos y el backend los
 * normaliza a este `ListQuery`. La forma es la misma para TODOS los módulos
 * (jugadores, equipos, …); cambia solo el registro de campos (`FilterMap`).
 *
 * Reglas fijas de este contrato:
 *  - Solo lógica AND (todas las condiciones se combinan con "y").
 *  - El operador de cada campo lo decide el registro, no el usuario.
 *  - `FilterMap` es la allowlist: lo único filtrable y lo único que la UI pinta.
 */

import type { Column } from "drizzle-orm";
import type { z } from "zod";

// ── Operadores soportados ──────────────────────────────────────────────────────

export type FilterOperator =
	| "eq" // igual
	| "ne" // distinto
	| "in" // pertenece a lista
	| "nin" // no pertenece a lista
	| "gt" // mayor
	| "gte" // mayor o igual
	| "lt" // menor
	| "lte" // menor o igual
	| "contains" // ilike %valor% (texto, tolerante a mayúsculas) — frase exacta y contigua
	| "containsWords" // cada palabra del valor debe aparecer en la columna, en cualquier orden
	| "between" // rango [min, max]
	| "isNull"; // es/no es null (valor booleano)

/** Operadores que consumen una lista de valores. */
export const LIST_OPERATORS = ["in", "nin", "between"] as const satisfies readonly FilterOperator[];

export type SortDir = "asc" | "desc";

export type FilterScalar = string | number | boolean;
export type FilterValue = FilterScalar | FilterScalar[];

// ── Contrato normalizado ───────────────────────────────────────────────────────

export type FilterCondition = {
	field: string;
	op: FilterOperator;
	value: FilterValue;
};

export type SortRule = {
	field: string;
	dir: SortDir;
};

export type ListQuery = {
	filters: FilterCondition[];
	sort: SortRule[];
	page: number;
	pageSize: number;
};

// ── Registro de campos filtrables (allowlist por recurso) ──────────────────────

export type FilterFieldDef = {
	/** Columna Drizzle sobre la que se aplica el filtro/orden. */
	column: Column;
	/** Operadores permitidos para este campo. */
	ops: readonly FilterOperator[];
	/** Schema Zod que valida/coacciona UN valor escalar (los rangos/listas lo aplican por elemento). */
	value: z.ZodTypeAny;
	/** Operador usado cuando la URL trae `campo=valor` sin sufijo `__op`. Default: "eq". */
	defaultOp?: FilterOperator;
	/** Transforma el valor string antes de validar (p.ej. canonicalizar acentos en `contains`). */
	transform?: (value: string) => string;
	/** Si el campo puede usarse en `sort`. Default: false. */
	sortable?: boolean;
};

export type FilterMap = Record<string, FilterFieldDef>;
