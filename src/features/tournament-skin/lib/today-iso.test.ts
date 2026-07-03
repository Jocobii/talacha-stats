import { describe, expect, it } from "vitest";
import { todayIso } from "./today-iso";

describe("todayIso", () => {
	it('formatea como "YYYY-MM-DD"', () => {
		expect(todayIso(new Date("2026-06-15T20:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("usa la zona de Tijuana: pasada la medianoche UTC sigue siendo 'ayer' local", () => {
		// 05:00 UTC del 12 jun = 22:00 del 11 jun en Tijuana (UTC-7 en verano)
		expect(todayIso(new Date("2026-06-12T05:00:00Z"))).toBe("2026-06-11");
	});

	it("coincide con la fecha local cuando no hay cruce de medianoche", () => {
		// 20:00 UTC del 15 jun = 13:00 del 15 jun en Tijuana
		expect(todayIso(new Date("2026-06-15T20:00:00Z"))).toBe("2026-06-15");
	});
});
