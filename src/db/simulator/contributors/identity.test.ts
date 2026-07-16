import { describe, expect, it } from "vitest";
import { organizations, organizationConfig, users, globalPlayers } from "@/db/schema";
import { createRng } from "../rng";
import { createSimContext, type DbOrTx } from "../context";
import { createFakeDb } from "./test-helpers";
import {
	identityContributor,
	totalRosterSlots,
	getOrganizations,
	getGlobalPlayers,
	ORGANIZATION_CONFIGS_KEY,
	ORGANIZATION_OWNERS_KEY,
} from "./identity";

function makeCtx(seed: number, tier: "S" | "M" | "L" | "XL", fakeDb = createFakeDb()) {
	const ctx = createSimContext({
		rng: createRng(seed),
		seed,
		tier,
		db: fakeDb as unknown as DbOrTx,
	});
	return { ctx, fakeDb };
}

describe("identityContributor", () => {
	it("crea exactamente ctx.params.orgs organizaciones nuevas cuando no hay target", async () => {
		const { ctx, fakeDb } = makeCtx(1, "S");
		await identityContributor.contribute(ctx);

		const orgs = getOrganizations(ctx);
		expect(orgs).toHaveLength(1); // tier S → 1 org
		expect(fakeDb.rowsOf(organizations)).toHaveLength(1);
	});

	it("crea una organization_config 1:1 por organización", async () => {
		const { ctx } = makeCtx(2, "M");
		await identityContributor.contribute(ctx);

		const orgs = getOrganizations(ctx);
		const configs = ctx.data[ORGANIZATION_CONFIGS_KEY] as { organizationId: string }[];
		expect(configs).toHaveLength(orgs.length);
		expect(new Set(configs.map((c) => c.organizationId))).toEqual(new Set(orgs.map((o) => o.id)));
	});

	it("crea un usuario organizador por organización", async () => {
		const { ctx } = makeCtx(3, "S");
		await identityContributor.contribute(ctx);

		const orgs = getOrganizations(ctx);
		const owners = ctx.data[ORGANIZATION_OWNERS_KEY] as {
			organizationId: string | null;
			role: string;
		}[];
		expect(owners).toHaveLength(orgs.length);
		expect(owners.every((u) => u.role === "organizer")).toBe(true);
	});

	it("reutiliza organizations pre-cargadas en ctx.data en vez de crear nuevas", async () => {
		const { ctx, fakeDb } = makeCtx(4, "S");
		const preloaded = [{ id: "existing-org", slug: "existing-org", name: "Liga Existente" }];
		ctx.data.organizations = preloaded;

		await identityContributor.contribute(ctx);

		expect(fakeDb.rowsOf(organizations)).toHaveLength(0); // no insertó nada nuevo
		expect(getOrganizations(ctx)).toBe(preloaded);
	});

	it("no duplica el usuario organizador si ya existe uno para la org", async () => {
		const { ctx, fakeDb } = makeCtx(5, "S");
		const preloaded = [{ id: "existing-org", slug: "existing-org", name: "Liga Existente" }];
		ctx.data.organizations = preloaded;
		fakeDb.seed(users, [
			{ id: "u1", organizationId: "existing-org", role: "organizer", email: "a@b.com" },
		]);

		await identityContributor.contribute(ctx);

		expect(fakeDb.rowsOf(users)).toHaveLength(1);
	});

	it("genera exactamente totalRosterSlots(ctx) global_players", async () => {
		const { ctx, fakeDb } = makeCtx(6, "S");
		await identityContributor.contribute(ctx);

		const players = getGlobalPlayers(ctx);
		expect(players).toHaveLength(totalRosterSlots(ctx));
		expect(fakeDb.rowsOf(globalPlayers)).toHaveLength(totalRosterSlots(ctx));
	});

	it("nunca repite curp_hash ni nombre canónico entre los global_players generados", async () => {
		const { ctx } = makeCtx(7, "M");
		await identityContributor.contribute(ctx);

		const players = getGlobalPlayers(ctx) as { curpHash: string; fullNameCanonical: string }[];
		expect(new Set(players.map((p) => p.curpHash)).size).toBe(players.length);
		expect(new Set(players.map((p) => p.fullNameCanonical)).size).toBe(players.length);
	});

	it("respeta global_players ya existentes en DB al generar nuevos (no choca curp_hash)", async () => {
		const { ctx: ctxA } = makeCtx(8, "S");
		await identityContributor.contribute(ctxA);
		const firstBatch = getGlobalPlayers(ctxA) as { curpHash: string }[];

		// Segunda corrida contra la MISMA base (comparte fakeDb) — debe evitar
		// las curp_hash que ya insertó la primera.
		const { ctx: ctxB } = makeCtx(8, "S", ctxA.db as unknown as ReturnType<typeof createFakeDb>);
		await identityContributor.contribute(ctxB);
		const secondBatch = getGlobalPlayers(ctxB) as { curpHash: string }[];

		const firstHashes = new Set(firstBatch.map((p) => p.curpHash));
		for (const p of secondBatch) {
			expect(firstHashes.has(p.curpHash)).toBe(false);
		}
	});

	it("misma semilla produce el mismo dataset (organizaciones y jugadores)", async () => {
		const { ctx: ctxA } = makeCtx(42, "S");
		await identityContributor.contribute(ctxA);

		const { ctx: ctxB } = makeCtx(42, "S");
		await identityContributor.contribute(ctxB);

		const orgsA = getOrganizations(ctxA).map((o) => o.name);
		const orgsB = getOrganizations(ctxB).map((o) => o.name);
		expect(orgsA).toEqual(orgsB);

		const playersA = getGlobalPlayers(ctxA).map((p) => p.curpHash);
		const playersB = getGlobalPlayers(ctxB).map((p) => p.curpHash);
		expect(playersA).toEqual(playersB);
	});
});
