import { describe, expect, it } from "vitest";
import { isHexColor, mix, parseHex, rgbToHsl, hslToRgb, toHex, withAlpha } from "./color";

describe("parseHex / toHex", () => {
	it("hace roundtrip de un hex válido", () => {
		expect(toHex(parseHex("#2563eb"))).toBe("#2563eb");
		expect(toHex(parseHex("#000000"))).toBe("#000000");
		expect(toHex(parseHex("#ffffff"))).toBe("#ffffff");
	});

	it("acepta mayúsculas al parsear y emite minúsculas", () => {
		expect(toHex(parseHex("#FBBF24"))).toBe("#fbbf24");
	});

	it("lanza para formatos inválidos", () => {
		expect(() => parseHex("2563eb")).toThrow();
		expect(() => parseHex("#25e")).toThrow();
		expect(() => parseHex("#25e63ebf")).toThrow();
		expect(() => parseHex("rojo")).toThrow();
	});

	it("toHex clampa valores fuera de rango", () => {
		expect(toHex({ r: 300, g: -5, b: 128 })).toBe("#ff0080");
	});
});

describe("isHexColor", () => {
	it("valida #rrggbb estricto", () => {
		expect(isHexColor("#a1b2c3")).toBe(true);
		expect(isHexColor("#abc")).toBe(false);
		expect(isHexColor("abc123")).toBe(false);
	});
});

describe("mix", () => {
	it("weight=0 devuelve el primer color, weight=1 el segundo", () => {
		expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
		expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
	});

	it("weight=0.5 da el punto medio", () => {
		expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
	});

	it("clampa weight fuera de [0,1]", () => {
		expect(mix("#000000", "#ffffff", -2)).toBe("#000000");
		expect(mix("#000000", "#ffffff", 5)).toBe("#ffffff");
	});
});

describe("withAlpha", () => {
	it("emite rgba() con el alpha dado", () => {
		expect(withAlpha("#ff0000", 0.12)).toBe("rgba(255, 0, 0, 0.12)");
	});

	it("clampa alpha a [0,1]", () => {
		expect(withAlpha("#ff0000", 7)).toBe("rgba(255, 0, 0, 1)");
	});
});

describe("rgbToHsl / hslToRgb", () => {
	it("hace roundtrip aproximado", () => {
		for (const hex of ["#2563eb", "#ef4444", "#eab308", "#f6f5f0", "#0c1510"]) {
			const rgb = parseHex(hex);
			const back = hslToRgb(rgbToHsl(rgb));
			expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
			expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
			expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
		}
	});

	it("maneja grises (saturación 0)", () => {
		const hsl = rgbToHsl({ r: 128, g: 128, b: 128 });
		expect(hsl.s).toBe(0);
		expect(toHex(hslToRgb(hsl))).toBe("#808080");
	});
});
