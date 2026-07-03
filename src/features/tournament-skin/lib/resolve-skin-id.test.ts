import { describe, expect, it } from "vitest";
import { resolveSkinId } from "./resolve-skin-id";

describe("resolveSkinId", () => {
	it("devuelve el id cuando el skin existe en el registry", () => {
		expect(resolveSkinId("mundial-2026")).toBe("mundial-2026");
	});

	it("degrada a null cuando el skin ya no existe en el registry (fila vieja en DB)", () => {
		expect(resolveSkinId("copa-pirata-2019")).toBeNull();
	});

	it("devuelve null para null, undefined y string vacío", () => {
		expect(resolveSkinId(null)).toBeNull();
		expect(resolveSkinId(undefined)).toBeNull();
		expect(resolveSkinId("")).toBeNull();
	});
});
