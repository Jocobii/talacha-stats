import { describe, it, expect } from "vitest";
import { mapOrgDirectoryItemToView } from "./map-org-directory-view";
import { ORG_DIRECTORY_AVATAR_PALETTE } from "../constants";
import type { OrgDirectoryItem } from "@/entities/organization";

function buildItem(overrides: Partial<OrgDirectoryItem> = {}): OrgDirectoryItem {
	return {
		id: "org-1",
		name: "novofut",
		slug: "novofut",
		logoUrl: null,
		city: "Tijuana",
		leagueCount: 2,
		teamCount: 10,
		playerCount: 120,
		...overrides,
	};
}

describe("mapOrgDirectoryItemToView", () => {
	it("aplica titleCase al nombre y arma el href público", () => {
		const view = mapOrgDirectoryItemToView(buildItem());
		expect(view.name).toBe("Novofut");
		expect(view.href).toBe("/org/novofut");
	});

	it("deriva la inicial del nombre ya formateado", () => {
		const view = mapOrgDirectoryItemToView(buildItem({ name: "atlético del valle" }));
		expect(view.initial).toBe("A");
	});

	it("propaga conteos y ciudad sin transformarlos", () => {
		const view = mapOrgDirectoryItemToView(
			buildItem({ leagueCount: 3, teamCount: 24, playerCount: 300, city: "Mexicali" }),
		);
		expect(view.leagueCount).toBe(3);
		expect(view.teamCount).toBe(24);
		expect(view.playerCount).toBe(300);
		expect(view.city).toBe("Mexicali");
	});

	it("preserva logoUrl null", () => {
		const view = mapOrgDirectoryItemToView(buildItem({ logoUrl: null }));
		expect(view.logoUrl).toBeNull();
	});

	it("arma el preview del subdominio a partir del slug", () => {
		const view = mapOrgDirectoryItemToView(buildItem({ slug: "atletico-del-valle" }));
		expect(view.subdomainPreview).toMatch(/^atletico-del-valle\./);
	});

	it("asigna el mismo color de avatar de forma determinística para el mismo id", () => {
		const first = mapOrgDirectoryItemToView(buildItem({ id: "org-42" }));
		const second = mapOrgDirectoryItemToView(buildItem({ id: "org-42", name: "otro nombre" }));
		expect(second.avatarPalette).toEqual(first.avatarPalette);
	});

	it("siempre asigna un color perteneciente a la paleta definida", () => {
		const view = mapOrgDirectoryItemToView(buildItem({ id: "cualquier-id-123" }));
		expect(ORG_DIRECTORY_AVATAR_PALETTE).toContainEqual(view.avatarPalette);
	});
});
