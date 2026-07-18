import { describe, it, expect } from "vitest";
import { computeCredentialDisplayStatus } from "./credential-status";
import type { CredentialForAuthCheck } from "./can-play-in-league";

const TODAY = "2026-07-16";

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

describe("computeCredentialDisplayStatus", () => {
	it("sin pase (null) -> pendiente", () => {
		expect(computeCredentialDisplayStatus(null, "active", TODAY)).toBe("pendiente");
	});

	it("status suspended -> suspendida, sin importar alcance/vigencia", () => {
		const suspended = buildOrgCredential({ status: "suspended" });
		expect(computeCredentialDisplayStatus(suspended, "active", TODAY)).toBe("suspendida");
	});

	it("status cancelled -> cancelada", () => {
		const cancelled = buildSingleLeagueCredential({ status: "cancelled" });
		expect(computeCredentialDisplayStatus(cancelled, "active", TODAY)).toBe("cancelada");
	});

	it("status expired explícito -> vencida", () => {
		const expired = buildOrgCredential({ status: "expired" });
		expect(computeCredentialDisplayStatus(expired, "active", TODAY)).toBe("vencida");
	});

	it("organization dentro de vigencia -> vigente", () => {
		expect(computeCredentialDisplayStatus(buildOrgCredential(), "active", TODAY)).toBe("vigente");
	});

	it("organization con valid_until pasado -> vencida (aunque status siga 'active')", () => {
		const stale = buildOrgCredential({ validFrom: "2024-01-01", validUntil: "2025-01-01" });
		expect(computeCredentialDisplayStatus(stale, "active", TODAY)).toBe("vencida");
	});

	it("organization a 15 días o menos de vencer -> porvencer", () => {
		const soon = buildOrgCredential({ validUntil: "2026-07-31" }); // 15 días desde TODAY
		expect(computeCredentialDisplayStatus(soon, "active", TODAY)).toBe("porvencer");
	});

	it("organization a 16 días de vencer -> todavía vigente", () => {
		const notYet = buildOrgCredential({ validUntil: "2026-08-01" }); // 16 días desde TODAY
		expect(computeCredentialDisplayStatus(notYet, "active", TODAY)).toBe("vigente");
	});

	it("organization que vence hoy mismo -> porvencer, no vencida", () => {
		const today = buildOrgCredential({ validUntil: TODAY });
		expect(computeCredentialDisplayStatus(today, "active", TODAY)).toBe("porvencer");
	});

	it("single_league con liga active -> vigente", () => {
		expect(computeCredentialDisplayStatus(buildSingleLeagueCredential(), "active", TODAY)).toBe(
			"vigente",
		);
	});

	it("single_league con liga finished -> vencida", () => {
		expect(computeCredentialDisplayStatus(buildSingleLeagueCredential(), "finished", TODAY)).toBe(
			"vencida",
		);
	});
});
