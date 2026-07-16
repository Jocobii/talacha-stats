import { describe, it, expect } from "vitest";
import { z } from "zod";
import { globalPlayers, leagueMembers } from "@/db/schema";
import { defineFilterMap } from "./registry";
import { parseListQuery } from "./parse";

// Registro de prueba — mismo shape que usaría entities/player/filters.ts.
const map = defineFilterMap({
	nombre: {
		column: globalPlayers.fullNameCanonical,
		ops: ["contains"],
		defaultOp: "contains",
		value: z.string().min(1),
		transform: (v) => v.toLowerCase(),
		sortable: true,
	},
	estado: {
		column: leagueMembers.status,
		ops: ["eq", "in"],
		defaultOp: "eq",
		value: z.enum(["active", "suspended", "inactive"]),
	},
	dorsal: {
		column: leagueMembers.dorsal,
		ops: ["eq", "gte", "lte", "between"],
		defaultOp: "eq",
		value: z.coerce.number().int(),
		sortable: true,
	},
});

function parse(qs: string) {
	return parseListQuery(new URLSearchParams(qs), map);
}

describe("parseListQuery — filtros", () => {
	it("usa el defaultOp y aplica transform", () => {
		const { query, issues } = parse("nombre=José");
		expect(issues).toEqual([]);
		expect(query.filters).toEqual([{ field: "nombre", op: "contains", value: "josé" }]);
	});

	it("bare value usa eq", () => {
		const { query } = parse("estado=active");
		expect(query.filters).toEqual([{ field: "estado", op: "eq", value: "active" }]);
	});

	it("operador explícito con lista (in) parte por coma", () => {
		const { query } = parse("estado__in=active,suspended");
		expect(query.filters).toEqual([{ field: "estado", op: "in", value: ["active", "suspended"] }]);
	});

	it("between coacciona números", () => {
		const { query } = parse("dorsal__between=5,10");
		expect(query.filters).toEqual([{ field: "dorsal", op: "between", value: [5, 10] }]);
	});

	it("valor inválido de enum → issue, se descarta la condición", () => {
		const { query, issues } = parse("estado=xxx");
		expect(query.filters).toHaveLength(0);
		expect(issues).toHaveLength(1);
		expect(issues[0].field).toBe("estado");
	});

	it("operador no permitido → issue", () => {
		const { issues } = parse("nombre__gte=5");
		expect(issues).toHaveLength(1);
		expect(issues[0].message).toContain("no permitido");
	});

	it("between con cantidad incorrecta → issue", () => {
		const { query, issues } = parse("dorsal__between=5");
		expect(query.filters).toHaveLength(0);
		expect(issues).toHaveLength(1);
	});

	it("clave desconocida se ignora sin issue", () => {
		const { query, issues } = parse("foo=bar");
		expect(query.filters).toHaveLength(0);
		expect(issues).toHaveLength(0);
	});
});

describe("parseListQuery — sort", () => {
	it("parsea dirección y múltiples campos", () => {
		const { query } = parse("sort=-dorsal,nombre");
		expect(query.sort).toEqual([
			{ field: "dorsal", dir: "desc" },
			{ field: "nombre", dir: "asc" },
		]);
	});

	it("campo no ordenable → issue y cae al default", () => {
		const { query, issues } = parseListQuery(new URLSearchParams("sort=estado"), map, {
			defaultSort: [{ field: "nombre", dir: "asc" }],
		});
		expect(issues).toHaveLength(1);
		expect(query.sort).toEqual([{ field: "nombre", dir: "asc" }]);
	});
});

describe("parseListQuery — paginación", () => {
	it("aplica defaults cuando faltan params", () => {
		const { query } = parse("");
		expect(query.page).toBe(1);
		expect(query.pageSize).toBe(25);
	});

	it("clampa page y pageSize a rangos válidos", () => {
		const { query } = parse("page=0&pageSize=999");
		expect(query.page).toBe(1);
		expect(query.pageSize).toBe(100);
	});
});
