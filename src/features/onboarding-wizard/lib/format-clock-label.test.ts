import { describe, it, expect } from "vitest";
import { formatClockLabel } from "./format-clock-label";

describe("formatClockLabel", () => {
	it("formatea horas de la tarde/noche a PM", () => {
		expect(formatClockLabel("19:00")).toBe("7:00 PM");
		expect(formatClockLabel("21:30")).toBe("9:30 PM");
	});

	it("formatea horas de la mañana a AM", () => {
		expect(formatClockLabel("09:05")).toBe("9:05 AM");
	});

	it("mapea medianoche y mediodía a 12", () => {
		expect(formatClockLabel("00:00")).toBe("12:00 AM");
		expect(formatClockLabel("12:00")).toBe("12:00 PM");
	});

	it("devuelve el string original si no puede parsearlo", () => {
		expect(formatClockLabel("")).toBe("");
		expect(formatClockLabel("abc")).toBe("abc");
	});
});
