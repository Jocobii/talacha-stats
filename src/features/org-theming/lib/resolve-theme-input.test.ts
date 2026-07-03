import { describe, expect, it } from "vitest";
import { ORG_PRESETS } from "@/shared/org-theme";
import { resolveThemeInput, type OrgThemeRow } from "./resolve-theme-input";

const base: OrgThemeRow = {
	mode: "preset",
	presetId: "azul-rey",
	colorPrimary: null,
	colorAccent: null,
	colorSurface: null,
	colorInk: null,
};

describe("resolveThemeInput", () => {
	it("null/undefined → null (org sin tema, fallback brand)", () => {
		expect(resolveThemeInput(null)).toBeNull();
		expect(resolveThemeInput(undefined)).toBeNull();
	});

	it("preset válido → colores del catálogo", () => {
		expect(resolveThemeInput(base)).toEqual(ORG_PRESETS["azul-rey"].colors);
	});

	it("preset eliminado del catálogo (fila vieja) → null, sin tronar", () => {
		expect(resolveThemeInput({ ...base, presetId: "paleta-retirada-2025" })).toBeNull();
		expect(resolveThemeInput({ ...base, presetId: null })).toBeNull();
	});

	it("custom completo → ThemeInput normalizado a minúsculas", () => {
		const row: OrgThemeRow = {
			mode: "custom",
			presetId: null,
			colorPrimary: "#FF5733",
			colorAccent: "#ffc300",
			colorSurface: "#101418",
			colorInk: "#F0F4F2",
		};
		expect(resolveThemeInput(row)).toEqual({
			primary: "#ff5733",
			accent: "#ffc300",
			surface: "#101418",
			ink: "#f0f4f2",
		});
	});

	it("custom incompleto o con hex corrupto → null", () => {
		const row: OrgThemeRow = {
			mode: "custom",
			presetId: null,
			colorPrimary: "#ff5733",
			colorAccent: null,
			colorSurface: "#101418",
			colorInk: "#f0f4f2",
		};
		expect(resolveThemeInput(row)).toBeNull();
		expect(resolveThemeInput({ ...row, colorAccent: "rojo" })).toBeNull();
	});

	it("modo desconocido → null", () => {
		expect(resolveThemeInput({ ...base, mode: "gradient" })).toBeNull();
	});
});
