import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_FORM, dtoToThemeForm, themeFormToRowValues } from "./map-theme-form";
import type { OrgThemeDto } from "../types";

const dtoBase: OrgThemeDto = {
	id: "t1",
	organizationId: "o1",
	mode: "preset",
	presetId: "azul-rey",
	colorPrimary: null,
	colorAccent: null,
	colorSurface: null,
	colorInk: null,
	fontId: "marcador",
	updatedAt: "2026-07-02T00:00:00.000Z",
};

describe("themeFormToRowValues", () => {
	it("preset → limpia los colores custom", () => {
		expect(themeFormToRowValues({ mode: "preset", presetId: "tinto", fontId: "slab" })).toEqual({
			mode: "preset",
			presetId: "tinto",
			colorPrimary: null,
			colorAccent: null,
			colorSurface: null,
			colorInk: null,
			fontId: "slab",
		});
	});

	it("custom → limpia el presetId", () => {
		const row = themeFormToRowValues({
			mode: "custom",
			colorPrimary: "#ff5733",
			colorAccent: "#ffc300",
			colorSurface: "#101418",
			colorInk: "#f0f4f2",
			fontId: "brand",
		});
		expect(row.presetId).toBeNull();
		expect(row.colorPrimary).toBe("#ff5733");
	});
});

describe("dtoToThemeForm", () => {
	it("null → default (primer preset, fuente brand)", () => {
		expect(dtoToThemeForm(null)).toEqual(DEFAULT_THEME_FORM);
	});

	it("preset válido → form preset", () => {
		expect(dtoToThemeForm(dtoBase)).toEqual({
			mode: "preset",
			presetId: "azul-rey",
			fontId: "marcador",
		});
	});

	it("preset retirado → default conservando la fuente", () => {
		const form = dtoToThemeForm({ ...dtoBase, presetId: "retro-2020" });
		expect(form).toEqual({ ...DEFAULT_THEME_FORM, fontId: "marcador" });
	});

	it("fuente desconocida → brand", () => {
		expect(dtoToThemeForm({ ...dtoBase, fontId: "comic-sans" }).fontId).toBe("brand");
	});

	it("custom completo → form custom", () => {
		const form = dtoToThemeForm({
			...dtoBase,
			mode: "custom",
			presetId: null,
			colorPrimary: "#ff5733",
			colorAccent: "#ffc300",
			colorSurface: "#101418",
			colorInk: "#f0f4f2",
		});
		expect(form.mode).toBe("custom");
	});

	it("roundtrip form → row → form", () => {
		const form = dtoToThemeForm(dtoBase);
		const row = themeFormToRowValues(form);
		expect(dtoToThemeForm({ ...dtoBase, ...row })).toEqual(form);
	});
});
