import { describe, it, expect } from "vitest";
import { z } from "zod";
import { globalPlayers, leagueMembers } from "@/db/schema";
import { defineFilterMap } from "./registry";
import { buildWhere, buildOrderBy } from "./translate";
import type { FilterCondition, SortRule } from "./types";

const map = defineFilterMap({
	nombre: {
		column: globalPlayers.fullNameCanonical,
		ops: ["contains"],
		value: z.string(),
		sortable: true,
	},
	estado: {
		column: leagueMembers.status,
		ops: ["eq", "in"],
		value: z.string(),
	},
	dorsal: {
		column: leagueMembers.dorsal,
		ops: ["between", "gte"],
		value: z.number(),
		sortable: true,
	},
});

describe("buildWhere", () => {
	it("sin filtros → undefined (no WHERE)", () => {
		expect(buildWhere(map, [])).toBeUndefined();
	});

	it("con condiciones válidas → SQL definido", () => {
		const filters: FilterCondition[] = [
			{ field: "estado", op: "in", value: ["active", "suspended"] },
			{ field: "dorsal", op: "between", value: [1, 10] },
		];
		expect(buildWhere(map, filters)).toBeDefined();
	});

	it("descarta campo fuera de la allowlist", () => {
		const filters: FilterCondition[] = [{ field: "hackeo", op: "eq", value: "x" }];
		expect(buildWhere(map, filters)).toBeUndefined();
	});

	it("descarta operador no permitido para el campo", () => {
		const filters: FilterCondition[] = [{ field: "estado", op: "gte", value: "x" }];
		expect(buildWhere(map, filters)).toBeUndefined();
	});
});

describe("buildOrderBy", () => {
	it("ignora campos no ordenables", () => {
		const sort: SortRule[] = [
			{ field: "nombre", dir: "asc" },
			{ field: "estado", dir: "desc" }, // no sortable
		];
		expect(buildOrderBy(map, sort)).toHaveLength(1);
	});

	it("emite una cláusula por campo ordenable", () => {
		const sort: SortRule[] = [
			{ field: "dorsal", dir: "desc" },
			{ field: "nombre", dir: "asc" },
		];
		expect(buildOrderBy(map, sort)).toHaveLength(2);
	});
});
