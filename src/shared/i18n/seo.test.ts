import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildLocaleAlternates, localizedPathname, ogLocale } from "./seo";

const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

beforeEach(() => {
	process.env.NEXT_PUBLIC_BASE_URL = "https://www.talachastats.com";
});

afterEach(() => {
	process.env.NEXT_PUBLIC_BASE_URL = ORIGINAL_BASE_URL;
});

describe("localizedPathname", () => {
	it("no agrega prefijo para el locale default (es)", () => {
		expect(localizedPathname("es", "/ligas")).toBe("/ligas");
	});

	it("agrega el prefijo de locale para locales no-default", () => {
		expect(localizedPathname("en", "/ligas")).toBe("/en/ligas");
	});

	it("normaliza pathnames sin slash inicial", () => {
		expect(localizedPathname("es", "ligas")).toBe("/ligas");
		expect(localizedPathname("en", "ligas")).toBe("/en/ligas");
	});

	it("funciona con la raíz", () => {
		expect(localizedPathname("es", "/")).toBe("/");
		expect(localizedPathname("en", "/")).toBe("/en/");
	});
});

describe("ogLocale", () => {
	it("mapea es → es_MX y en → en_US", () => {
		expect(ogLocale("es")).toBe("es_MX");
		expect(ogLocale("en")).toBe("en_US");
	});
});

describe("buildLocaleAlternates", () => {
	it("construye canonical autorreferente para el locale activo", () => {
		const esAlternates = buildLocaleAlternates("es", "/ligas");
		expect(esAlternates.canonical).toBe("https://www.talachastats.com/ligas");

		const enAlternates = buildLocaleAlternates("en", "/ligas");
		expect(enAlternates.canonical).toBe("https://www.talachastats.com/en/ligas");
	});

	it("incluye una entrada hreflang por locale soportado más x-default → es", () => {
		const { languages } = buildLocaleAlternates("es", "/ligas");
		expect(languages).toEqual({
			es: "https://www.talachastats.com/ligas",
			en: "https://www.talachastats.com/en/ligas",
			"x-default": "https://www.talachastats.com/ligas",
		});
	});

	it("usa NEXT_PUBLIC_BASE_URL de entorno para construir URLs absolutas", () => {
		process.env.NEXT_PUBLIC_BASE_URL = "https://staging.talachastats.com";
		const { canonical } = buildLocaleAlternates("es", "/ranking");
		expect(canonical).toBe("https://staging.talachastats.com/ranking");
	});

	it("cae a localhost:3000 si no hay NEXT_PUBLIC_BASE_URL configurada", () => {
		delete process.env.NEXT_PUBLIC_BASE_URL;
		const { canonical } = buildLocaleAlternates("es", "/ligas");
		expect(canonical).toBe("http://localhost:3000/ligas");
	});
});
