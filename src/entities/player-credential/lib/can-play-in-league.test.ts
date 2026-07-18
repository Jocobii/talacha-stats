import { describe, it, expect } from "vitest";
import {
	canPlayInLeague,
	findCoveringCredential,
	type CredentialForAuthCheck,
	type LeagueForAuthCheck,
} from "./can-play-in-league";

const TODAY = "2026-07-16";

const activeLeague: LeagueForAuthCheck = {
	id: "league-1",
	organizationId: "org-1",
	status: "active",
};

const finishedLeague: LeagueForAuthCheck = {
	...activeLeague,
	status: "finished",
};

function buildOrgCredential(
	overrides: Partial<CredentialForAuthCheck> = {},
): CredentialForAuthCheck {
	return {
		organizationId: "org-1",
		leagueId: null,
		status: "active",
		scope: "organization",
		validFrom: "2026-01-01",
		validUntil: "2027-01-01",
		...overrides,
	};
}

function buildSingleLeagueCredential(
	overrides: Partial<CredentialForAuthCheck> = {},
): CredentialForAuthCheck {
	return {
		organizationId: "org-1",
		leagueId: "league-1",
		status: "active",
		scope: "single_league",
		validFrom: null,
		validUntil: null,
		...overrides,
	};
}

describe("canPlayInLeague", () => {
	it("sin pases, no autoriza", () => {
		expect(canPlayInLeague([], activeLeague, TODAY)).toBe(false);
	});

	it("pase organization vigente de la misma org, autoriza", () => {
		expect(canPlayInLeague([buildOrgCredential()], activeLeague, TODAY)).toBe(true);
	});

	it("pase organization vencido (valid_until < hoy), no autoriza", () => {
		const expired = buildOrgCredential({ validFrom: "2025-01-01", validUntil: "2026-01-01" });
		expect(canPlayInLeague([expired], activeLeague, TODAY)).toBe(false);
	});

	it("pase organization aún no vigente (valid_from > hoy), no autoriza", () => {
		const future = buildOrgCredential({ validFrom: "2027-01-01", validUntil: "2028-01-01" });
		expect(canPlayInLeague([future], activeLeague, TODAY)).toBe(false);
	});

	it("pase organization de otra org, no autoriza", () => {
		const otherOrg = buildOrgCredential({ organizationId: "org-2" });
		expect(canPlayInLeague([otherOrg], activeLeague, TODAY)).toBe(false);
	});

	it("liga sin organización asignada, el pase organization nunca cubre", () => {
		const leagueWithoutOrg: LeagueForAuthCheck = { ...activeLeague, organizationId: null };
		expect(canPlayInLeague([buildOrgCredential()], leagueWithoutOrg, TODAY)).toBe(false);
	});

	it("pase single_league de la misma liga con liga active, autoriza", () => {
		expect(canPlayInLeague([buildSingleLeagueCredential()], activeLeague, TODAY)).toBe(true);
	});

	it("pase single_league con liga finished, no autoriza (el desechable vence con la liga)", () => {
		expect(canPlayInLeague([buildSingleLeagueCredential()], finishedLeague, TODAY)).toBe(false);
	});

	it("pase single_league de otra liga, no autoriza", () => {
		const otherLeague = buildSingleLeagueCredential({ leagueId: "league-2" });
		expect(canPlayInLeague([otherLeague], activeLeague, TODAY)).toBe(false);
	});

	it("pase suspended, no autoriza aunque cubra alcance y vigencia", () => {
		const suspended = buildOrgCredential({ status: "suspended" });
		expect(canPlayInLeague([suspended], activeLeague, TODAY)).toBe(false);
	});

	it("pase cancelled, no autoriza", () => {
		const cancelled = buildSingleLeagueCredential({ status: "cancelled" });
		expect(canPlayInLeague([cancelled], activeLeague, TODAY)).toBe(false);
	});

	it("con varios pases, basta con que uno cubra", () => {
		const wrongOrg = buildOrgCredential({ organizationId: "org-2" });
		const covering = buildSingleLeagueCredential();
		expect(canPlayInLeague([wrongOrg, covering], activeLeague, TODAY)).toBe(true);
	});
});

describe("findCoveringCredential", () => {
	it("devuelve null si ningún pase cubre", () => {
		expect(findCoveringCredential([], activeLeague, TODAY)).toBeNull();
	});

	it("devuelve el pase (con su id) que cubre, no solo un booleano", () => {
		const covering = { ...buildSingleLeagueCredential(), id: "credential-123" };
		const result = findCoveringCredential([covering], activeLeague, TODAY);
		expect(result?.id).toBe("credential-123");
	});

	it("devuelve el primero que cubre cuando hay varios", () => {
		const first = { ...buildOrgCredential(), id: "credential-org" };
		const second = { ...buildSingleLeagueCredential(), id: "credential-league" };
		const result = findCoveringCredential([first, second], activeLeague, TODAY);
		expect(result?.id).toBe("credential-org");
	});
});
