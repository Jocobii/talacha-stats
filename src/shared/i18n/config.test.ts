import { describe, expect, it } from "vitest";
import {
	defaultLocale,
	isAppLocale,
	localeDetection,
	locales,
	localePrefix,
	messageNamespaces,
} from "./config";

describe("i18n config", () => {
	it("expone es y en como locales soportados, con es de default", () => {
		expect(locales).toEqual(["es", "en"]);
		expect(defaultLocale).toBe("es");
	});

	it("usa localePrefix 'as-needed' para no romper URLs indexadas de es", () => {
		expect(localePrefix).toBe("as-needed");
	});

	it("no detecta locale por cookie/Accept-Language — el usuario elige (plan §0, §12)", () => {
		expect(localeDetection).toBe(false);
	});

	it("declara los namespaces de la superficie pública", () => {
		expect(messageNamespaces).toEqual([
			"common",
			"home",
			"ligas",
			"ranking",
			"player",
			"matchday",
			"org",
		]);
	});
});

describe("isAppLocale", () => {
	it("reconoce los locales soportados", () => {
		expect(isAppLocale("es")).toBe(true);
		expect(isAppLocale("en")).toBe(true);
	});

	it("rechaza locales no soportados o basura", () => {
		expect(isAppLocale("fr")).toBe(false);
		expect(isAppLocale("")).toBe(false);
		expect(isAppLocale("ES")).toBe(false);
	});
});
