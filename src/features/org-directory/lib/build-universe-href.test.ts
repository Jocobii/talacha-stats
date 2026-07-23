// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { buildUniverseHref } from "./build-universe-href";

describe("buildUniverseHref", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("antepone el slug como subdominio del host actual", () => {
		vi.stubGlobal("location", { protocol: "https:", hostname: "talachastats.com", port: "" });
		expect(buildUniverseHref("novofut", "talachastats.com")).toBe(
			"https://novofut.talachastats.com",
		);
	});

	it("preserva el puerto del host actual si existe (dev)", () => {
		vi.stubGlobal("location", { protocol: "http:", hostname: "localhost", port: "3000" });
		expect(buildUniverseHref("novofut", "talachastats.com")).toBe("http://novofut.localhost:3000");
	});

	it("usa https y el dominio raíz de fallback fuera del navegador", () => {
		const original = globalThis.window;
		// @ts-expect-error borrar window a propósito para simular SSR
		delete globalThis.window;
		expect(buildUniverseHref("novofut", "talachastats.com")).toBe(
			"https://novofut.talachastats.com",
		);
		globalThis.window = original;
	});
});
