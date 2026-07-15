/**
 * shared/lib/list-query/parse.ts
 *
 * Convierte URLSearchParams (params planos) al contrato `ListQuery`, validando
 * contra el registro del recurso (`FilterMap`).
 *
 * Formato de URL (plano, compartible):
 *   ?estado=activo,suspendido&nombre=jose&goles__gte=5&sort=-goles,nombre&page=2
 *
 *   - `campo=valor`         → usa el `defaultOp` del campo (o "eq").
 *   - `campo__op=valor`     → operador explícito (debe estar en `ops` del campo).
 *   - valores separados por coma → lista (para in/nin/between).
 *   - `sort=-campo`         → desc; `sort=campo` → asc (solo campos `sortable`).
 *   - `page`, `pageSize`    → paginación.
 *
 * Es best-effort: descarta condiciones inválidas y las reporta en `issues`,
 * en vez de tumbar toda la request. La page puede ignorar `issues` (robusto);
 * un route de API puede decidir responder 400 si `issues.length > 0`.
 */

import type {
	FilterCondition,
	FilterFieldDef,
	FilterMap,
	FilterScalar,
	ListQuery,
	FilterOperator,
	SortDir,
	SortRule,
} from "./types";
import { LIST_OPERATORS } from "./types";

// ── Constantes ──────────────────────────────────────────────────────────────

export const DEFAULT_LIST_PAGE_SIZE = 25;
export const MAX_LIST_PAGE_SIZE = 100;

const RESERVED_KEYS = new Set(["page", "pageSize", "sort"]);

// ── Tipos de salida ───────────────────────────────────────────────────────────

export type FilterIssue = { field: string; message: string };
export type ParsedListQuery = { query: ListQuery; issues: FilterIssue[] };

export type ParseListQueryOptions = {
	defaultSort?: SortRule[];
	pageSize?: number;
	maxPageSize?: number;
};

// ── Entrada principal ──────────────────────────────────────────────────────────

export function parseListQuery(
	searchParams: URLSearchParams,
	map: FilterMap,
	opts: ParseListQueryOptions = {},
): ParsedListQuery {
	const pageSizeDefault = opts.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
	const maxPageSize = opts.maxPageSize ?? MAX_LIST_PAGE_SIZE;

	const { page, pageSize } = parsePagination(searchParams, pageSizeDefault, maxPageSize);
	const filters = parseFilters(searchParams, map);
	const sort = parseSort(searchParams, map, opts.defaultSort ?? []);

	return {
		query: { filters: filters.filters, sort: sort.sort, page, pageSize },
		issues: [...filters.issues, ...sort.issues],
	};
}

// ── Filtros ─────────────────────────────────────────────────────────────────

type FilterEntryResult = { condition?: FilterCondition; issue?: FilterIssue };

function parseFilters(
	searchParams: URLSearchParams,
	map: FilterMap,
): { filters: FilterCondition[]; issues: FilterIssue[] } {
	const filters: FilterCondition[] = [];
	const issues: FilterIssue[] = [];

	for (const key of new Set(searchParams.keys())) {
		if (RESERVED_KEYS.has(key)) continue;
		const [field, opToken] = splitKey(key);
		const def = map[field];
		if (!def) continue; // clave desconocida → se ignora (la allowlist manda)

		const result = parseFilterEntry(field, opToken, searchParams.getAll(key), def);
		if (result.condition) filters.push(result.condition);
		if (result.issue) issues.push(result.issue);
	}

	return { filters, issues };
}

function parseFilterEntry(
	field: string,
	opToken: string | undefined,
	rawValues: string[],
	def: FilterFieldDef,
): FilterEntryResult {
	const op = (opToken ?? def.defaultOp ?? "eq") as FilterOperator;
	if (!def.ops.includes(op)) {
		return { issue: { field, message: `operador "${op}" no permitido` } };
	}
	if (op === "isNull") return parseBoolCondition(field, op, rawValues);
	if (isListOperator(op)) return parseListCondition(field, op, rawValues, def);
	return parseScalarCondition(field, op, rawValues, def);
}

function parseScalarCondition(
	field: string,
	op: FilterOperator,
	rawValues: string[],
	def: FilterFieldDef,
): FilterEntryResult {
	const parsed = validateScalar(def, rawValues[0] ?? "");
	if (!parsed.ok) return { issue: { field, message: parsed.message } };
	return { condition: { field, op, value: parsed.value } };
}

function parseListCondition(
	field: string,
	op: FilterOperator,
	rawValues: string[],
	def: FilterFieldDef,
): FilterEntryResult {
	const tokens = splitList(rawValues);
	if (tokens.length === 0) return { issue: { field, message: "sin valores" } };
	if (op === "between" && tokens.length !== 2) {
		return { issue: { field, message: "between requiere exactamente 2 valores" } };
	}

	const parsed = tokens.map((token) => validateScalar(def, token));
	const bad = parsed.find((p) => !p.ok);
	if (bad && !bad.ok) return { issue: { field, message: bad.message } };

	const values = parsed.map((p) => (p as { ok: true; value: FilterScalar }).value);
	return { condition: { field, op, value: values } };
}

function parseBoolCondition(
	field: string,
	op: FilterOperator,
	rawValues: string[],
): FilterEntryResult {
	const raw = (rawValues[0] ?? "true").toLowerCase();
	const truthy = raw === "true" || raw === "1";
	const falsy = raw === "false" || raw === "0";
	if (!truthy && !falsy) return { issue: { field, message: "isNull espera true/false" } };
	return { condition: { field, op, value: truthy } };
}

// ── Validación de valores escalares ────────────────────────────────────────────

type ScalarResult = { ok: true; value: FilterScalar } | { ok: false; message: string };

function validateScalar(def: FilterFieldDef, raw: string): ScalarResult {
	const input = def.transform ? def.transform(raw) : raw;
	const parsed = def.value.safeParse(input);
	if (!parsed.success) {
		return { ok: false, message: parsed.error.issues[0]?.message ?? "valor inválido" };
	}
	return { ok: true, value: parsed.data as FilterScalar };
}

// ── Orden ───────────────────────────────────────────────────────────────────

function parseSort(
	searchParams: URLSearchParams,
	map: FilterMap,
	defaultSort: SortRule[],
): { sort: SortRule[]; issues: FilterIssue[] } {
	const raw = searchParams.get("sort");
	if (!raw) return { sort: defaultSort, issues: [] };

	const issues: FilterIssue[] = [];
	const tokens = raw
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);

	const sort = tokens.flatMap((token): SortRule[] => {
		const dir: SortDir = token.startsWith("-") ? "desc" : "asc";
		const field = token.replace(/^[-+]/, "");
		if (!map[field]?.sortable) {
			issues.push({ field, message: "campo no ordenable" });
			return [];
		}
		return [{ field, dir }];
	});

	return { sort: sort.length > 0 ? sort : defaultSort, issues };
}

// ── Paginación ────────────────────────────────────────────────────────────────

function parsePagination(
	searchParams: URLSearchParams,
	pageSizeDefault: number,
	maxPageSize: number,
): { page: number; pageSize: number } {
	return {
		page: clampInt(searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER),
		pageSize: clampInt(searchParams.get("pageSize"), pageSizeDefault, 1, maxPageSize),
	};
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
	// raw === null (param ausente) o "" → usar fallback. Ojo: Number(null) es 0
	// (no NaN), así que sin este guard un pageSize ausente en la URL caía en
	// min(1) en vez del fallback real — bug que hacía que toda página sin
	// ?pageSize= explícito en la URL solo trajera 1 fila.
	if (raw === null || raw === "") return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

// ── Helpers de parsing ─────────────────────────────────────────────────────────

function splitKey(key: string): [string, string | undefined] {
	const idx = key.indexOf("__");
	if (idx < 0) return [key, undefined];
	return [key.slice(0, idx), key.slice(idx + 2)];
}

function splitList(rawValues: string[]): string[] {
	return rawValues
		.flatMap((v) => v.split(","))
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
}

function isListOperator(op: FilterOperator): boolean {
	return (LIST_OPERATORS as readonly FilterOperator[]).includes(op);
}
