import { describe, expect, it } from "vitest";
import type { SkinActivationDto } from "@/entities/skin-activation";
import { mapSkinActivationToView } from "./map-activation-view";

const TODAY = "2026-07-03";

function buildDto(overrides: Partial<SkinActivationDto> = {}): SkinActivationDto {
	return {
		id: "a1",
		skinId: "mundial-2026",
		name: "Mundial 2026",
		startsOn: "2026-06-11",
		endsOn: "2026-07-19",
		isEnabled: true,
		...overrides,
	};
}

describe("mapSkinActivationToView", () => {
	it("usa la etiqueta del registry y marca isLive dentro del rango", () => {
		const view = mapSkinActivationToView(buildDto(), TODAY);
		expect(view.skinLabel).toBe("Mundial 2026");
		expect(view.isOrphan).toBe(false);
		expect(view.isLive).toBe(true);
	});

	it("no está live si está deshabilitada aunque la fecha caiga en rango", () => {
		const view = mapSkinActivationToView(buildDto({ isEnabled: false }), TODAY);
		expect(view.isLive).toBe(false);
		expect(view.isEnabled).toBe(false);
	});

	it("no está live fuera del rango de fechas", () => {
		const before = mapSkinActivationToView(buildDto(), "2026-06-10");
		const after = mapSkinActivationToView(buildDto(), "2026-07-20");
		expect(before.isLive).toBe(false);
		expect(after.isLive).toBe(false);
	});

	it("está live en los bordes del rango (inclusive)", () => {
		expect(mapSkinActivationToView(buildDto(), "2026-06-11").isLive).toBe(true);
		expect(mapSkinActivationToView(buildDto(), "2026-07-19").isLive).toBe(true);
	});

	it("marca huérfana una fila cuyo skin ya no existe en el registry y nunca está live", () => {
		const view = mapSkinActivationToView(buildDto({ skinId: "copa-vieja-2020" }), TODAY);
		expect(view.isOrphan).toBe(true);
		expect(view.skinLabel).toBe("copa-vieja-2020");
		expect(view.isLive).toBe(false);
	});

	it("formatea el rango de fechas legible en español", () => {
		const view = mapSkinActivationToView(buildDto(), TODAY);
		expect(view.dateRangeLabel).toContain("2026");
		expect(view.dateRangeLabel).toContain("–");
	});
});
