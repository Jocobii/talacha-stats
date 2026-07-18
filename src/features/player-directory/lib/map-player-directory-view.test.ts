import { describe, it, expect } from "vitest";
import { mapPlayerListItemToDirectoryView } from "./map-player-directory-view";

describe("mapPlayerListItemToDirectoryView", () => {
	it("mapea id y fullName a displayName", () => {
		const view = mapPlayerListItemToDirectoryView({
			id: "p1",
			fullName: "Juan de la Cruz",
		});
		expect(view).toEqual({ id: "p1", displayName: "Juan de la Cruz" });
	});
});
