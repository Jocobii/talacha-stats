// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createTestQueryClient } from "@/shared/test/react-query";
import { queryKeys } from "./query-keys";
import { invalidate } from "./cache-invalidation";

describe("invalidate.rosterTransferred", () => {
	it("invalida el roster de ambos equipos y la lista de la liga", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.rosterTransferred(client, { fromTeamId: "t1", toTeamId: "t2", leagueId: "L1" });

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.roster("t1") });
		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.roster("t2") });
		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.list("L1") });
		expect(spy).toHaveBeenCalledTimes(3);
	});
});

describe("invalidate.rosterMemberChanged", () => {
	it("invalida solo el roster del equipo (baja o edición sin transferencia)", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.rosterMemberChanged(client, { teamId: "t1" });

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.roster("t1") });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("invalidate.teamCreated", () => {
	it("invalida solo la lista de equipos de la liga", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.teamCreated(client, { leagueId: "L1" });

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.list("L1") });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe("invalidate.teamUpdated", () => {
	it("invalida la lista de la liga y el detalle del equipo", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.teamUpdated(client, { leagueId: "L1", teamId: "t1" });

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.list("L1") });
		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.teams.detail("t1") });
		expect(spy).toHaveBeenCalledTimes(2);
	});
});

describe("invalidate.skinChanged", () => {
	it("invalida activaciones y el skin activo", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.skinChanged(client);

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.skins.activations() });
		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.skins.active() });
		expect(spy).toHaveBeenCalledTimes(2);
	});
});

describe("invalidate.suspensionChangedGlobal", () => {
	it("invalida la vista admin y el tab de la liga", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.suspensionChangedGlobal(client, { leagueId: "L1" });

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suspensions.admin() });
		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suspensions.byLeague("L1") });
		expect(spy).toHaveBeenCalledTimes(2);
	});
});

describe("invalidate.suspensionChanged", () => {
	it("invalida solo el tab de la liga, sin tocar la vista admin", () => {
		const client = createTestQueryClient();
		const spy = vi.spyOn(client, "invalidateQueries");

		invalidate.suspensionChanged(client, { leagueId: "L1" });

		expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suspensions.byLeague("L1") });
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
