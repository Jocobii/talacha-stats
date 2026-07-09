import { describe, it, expect } from "vitest";
import { mapOrganizationToIdentity } from "./map-organization-to-identity";

describe("mapOrganizationToIdentity", () => {
	it("aplica titleCase al nombre y conserva slug sin transformar", () => {
		const view = mapOrganizationToIdentity({
			id: "o1",
			name: "liga jardines",
			slug: "liga-jardines",
		});
		expect(view).toEqual({ id: "o1", name: "Liga Jardines", slug: "liga-jardines" });
	});

	it("no expone campos privados de la organización (status, verificationRequestedAt, etc.)", () => {
		const view = mapOrganizationToIdentity({
			id: "o1",
			name: "liga jardines",
			slug: "liga-jardines",
		});
		expect(view).not.toHaveProperty("status");
		expect(view).not.toHaveProperty("createdAt");
	});
});
