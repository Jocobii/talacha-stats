import { describe, it, expect } from "vitest";
import { mapPlayerListItemToDirectoryView } from "./map-player-directory-view";

describe("mapPlayerListItemToDirectoryView", () => {
	it("mapea id y fullName a displayName", () => {
		const view = mapPlayerListItemToDirectoryView({
			id: "p1",
			fullName: "Juan de la Cruz",
			alias: null,
		});
		expect(view).toEqual({ id: "p1", displayName: "Juan de la Cruz", alias: null });
	});

	it("preserva el alias cuando existe", () => {
		const view = mapPlayerListItemToDirectoryView({
			id: "p2",
			fullName: "Pedro Ramírez",
			alias: "El Tanque",
		});
		expect(view.alias).toBe("El Tanque");
	});
});
