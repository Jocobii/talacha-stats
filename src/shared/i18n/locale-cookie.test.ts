import { describe, expect, it } from "vitest";
import { LOCALE_COOKIE_NAME, parseLocaleCookie } from "./locale-cookie";

describe("LOCALE_COOKIE_NAME", () => {
	it("coincide con el cookie que setea el middleware de next-intl", () => {
		expect(LOCALE_COOKIE_NAME).toBe("NEXT_LOCALE");
	});
});

describe("parseLocaleCookie", () => {
	it("acepta locales soportados", () => {
		expect(parseLocaleCookie("es")).toBe("es");
		expect(parseLocaleCookie("en")).toBe("en");
	});

	it("degrada a 'es' cuando el valor es undefined, null o vacío", () => {
		expect(parseLocaleCookie(undefined)).toBe("es");
		expect(parseLocaleCookie(null)).toBe("es");
		expect(parseLocaleCookie("")).toBe("es");
	});

	it("degrada a 'es' ante un locale no soportado o corrupto", () => {
		expect(parseLocaleCookie("fr")).toBe("es");
		expect(parseLocaleCookie("es;drop table")).toBe("es");
		expect(parseLocaleCookie("EN")).toBe("es");
	});
});
