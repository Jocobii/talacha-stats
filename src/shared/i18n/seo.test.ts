import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildLocaleAlternates, buildOrgLocaleAlternates, buildOrgSiteUrl, localizedPathname, ogLocale } from "./seo";

const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const ORIGINAL_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

beforeEach(() => {
	process.env.NEXT_PUBLIC_BASE_URL = "https://www.talachastats.com";
	delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
});

afterEach(() => {
	process.env.NEXT_PUBLIC_BASE_URL = ORIGINAL_BASE_URL;
	process.env.NEXT_PUBLIC_ROOT_DOMAIN = ORIGINAL_ROOT_DOMAIN;
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

describe("buildOrgSiteUrl", () => {
	it("construye la URL del subdominio con el rootDomain configurado", () => {
		process.env.NEXT_PUBLIC_ROOT_DOMAIN = "talachastats.com";
		expect(buildOrgSiteUrl("miliga")).toBe("https://miliga.talachastats.com");
	});

	it("usa http cuando NEXT_PUBLIC_BASE_URL es http (dev)", () => {
		process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
		process.env.NEXT_PUBLIC_ROOT_DOMAIN = "localhost";
		expect(buildOrgSiteUrl("miliga")).toBe("http://miliga.localhost");
	});
});

describe("buildOrgLocaleAlternates", () => {
	it("la canónica es el subdominio, NUNCA /org/{slug} del apex", () => {
		process.env.NEXT_PUBLIC_ROOT_DOMAIN = "talachastats.com";
		const { canonical } = buildOrgLocaleAlternates("es", "miliga", "/ranking");
		expect(canonical).toBe("https://miliga.talachastats.com/ranking");
	});

	it("incluye hreflang por locale + x-default, todos bajo el subdominio", () => {
		process.env.NEXT_PUBLIC_ROOT_DOMAIN = "talachastats.com";
		const { languages } = buildOrgLocaleAlternates("es", "miliga", "/");
		expect(languages).toEqual({
			es: "https://miliga.talachastats.com/",
			en: "https://miliga.talachastats.com/en/",
			"x-default": "https://miliga.talachastats.com/",
		});
	});
});
