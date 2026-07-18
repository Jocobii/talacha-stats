import { describe, it, expect } from "vitest";
import { addYearsIso, daysUntil } from "./dates";

describe("addYearsIso", () => {
	it("suma un año a una fecha regular", () => {
		expect(addYearsIso("2026-07-16", 1)).toBe("2027-07-16");
	});

	it("maneja el 29 de febrero de un año bisiesto (cae a 1 de marzo en año no bisiesto)", () => {
		expect(addYearsIso("2024-02-29", 1)).toBe("2025-03-01");
	});

	it("soporta 0 años (misma fecha)", () => {
		expect(addYearsIso("2026-01-01", 0)).toBe("2026-01-01");
	});
});

describe("daysUntil", () => {
	it("cuenta días hacia una fecha futura", () => {
		expect(daysUntil("2026-07-31", "2026-07-16")).toBe(15);
	});

	it("misma fecha -> 0", () => {
		expect(daysUntil("2026-07-16", "2026-07-16")).toBe(0);
	});

	it("fecha pasada -> negativo", () => {
		expect(daysUntil("2026-07-01", "2026-07-16")).toBe(-15);
	});
});
