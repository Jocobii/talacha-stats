import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
	it("expone los locales y el default esperados", () => {
		expect(routing.locales).toEqual(["es", "en"]);
		expect(routing.defaultLocale).toBe("es");
	});

	it("usa localePrefix 'as-needed'", () => {
		// `defineRouting` puede normalizar el string a `{ mode: 'as-needed' }`
		// internamente — se acepta cualquiera de las dos formas.
		const prefix = routing.localePrefix;
		const mode = typeof prefix === "string" ? prefix : prefix?.mode;
		expect(mode).toBe("as-needed");
	});

	it("no detecta locale por cookie/Accept-Language", () => {
		expect(routing.localeDetection).toBe(false);
	});
});
