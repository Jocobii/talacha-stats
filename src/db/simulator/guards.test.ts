import { describe, expect, it } from "vitest";
import {
	assertNotProductionDatabase,
	assertReasonableVolume,
	redactConnectionString,
	ProductionGuardError,
} from "./guards";

describe("assertNotProductionDatabase", () => {
	it("no lanza con una URL local", () => {
		expect(() =>
			assertNotProductionDatabase("postgres://user:pass@localhost:5432/talachastats"),
		).not.toThrow();
	});

	it("lanza si la URL está vacía", () => {
		expect(() => assertNotProductionDatabase("")).toThrow(ProductionGuardError);
	});

	it("lanza si la URL apunta a Supabase (.co)", () => {
		expect(() =>
			assertNotProductionDatabase("postgres://user:pass@db.abcxyz.supabase.co:5432/postgres"),
		).toThrow(ProductionGuardError);
	});

	it("lanza si la URL apunta a Supabase (.com)", () => {
		expect(() =>
			assertNotProductionDatabase("postgres://user:pass@aws.supabase.com:5432/postgres"),
		).toThrow(ProductionGuardError);
	});

	it("lanza si la URL apunta a Supabase (.io)", () => {
		expect(() =>
			assertNotProductionDatabase("postgres://user:pass@aws.supabase.io:5432/postgres"),
		).toThrow(ProductionGuardError);
	});
});

describe("redactConnectionString", () => {
	it("enmascara la contraseña", () => {
		const redacted = redactConnectionString("postgres://user:supersecret@host:5432/db");
		expect(redacted).not.toContain("supersecret");
		expect(redacted).toContain(":***@");
	});
});

describe("assertReasonableVolume", () => {
	it("no lanza dentro de límites razonables", () => {
		expect(() => assertReasonableVolume({ orgs: 3, leaguesPerOrg: 6 })).not.toThrow();
	});

	it("lanza si orgs excede el máximo", () => {
		expect(() => assertReasonableVolume({ orgs: 21, leaguesPerOrg: 6 })).toThrow(
			ProductionGuardError,
		);
	});

	it("lanza si leaguesPerOrg excede el máximo", () => {
		expect(() => assertReasonableVolume({ orgs: 1, leaguesPerOrg: 31 })).toThrow(
			ProductionGuardError,
		);
	});
});
