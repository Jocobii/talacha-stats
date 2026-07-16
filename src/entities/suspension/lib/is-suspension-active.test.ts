import { describe, expect, it } from "vitest";
import { isSuspensionActive } from "./is-suspension-active";

const TODAY = "2026-07-14";

describe("isSuspensionActive", () => {
	it("'matches' es vigente si matchesServed < matchesTotal", () => {
		expect(
			isSuspensionActive(
				{
					status: "active",
					durationType: "matches",
					matchesTotal: 1,
					matchesServed: 0,
					endsOn: null,
				},
				TODAY,
			),
		).toBe(true);
	});

	it("'matches' ya no es vigente al cumplir matchesTotal", () => {
		expect(
			isSuspensionActive(
				{
					status: "active",
					durationType: "matches",
					matchesTotal: 1,
					matchesServed: 1,
					endsOn: null,
				},
				TODAY,
			),
		).toBe(false);
	});

	it("'time' es vigente si hoy es antes o igual a endsOn", () => {
		expect(
			isSuspensionActive(
				{
					status: "active",
					durationType: "time",
					matchesTotal: null,
					matchesServed: 0,
					endsOn: "2026-07-14",
				},
				TODAY,
			),
		).toBe(true);
	});

	it("'time' ya no es vigente pasada endsOn, aunque status siga 'active' (sin cron)", () => {
		expect(
			isSuspensionActive(
				{
					status: "active",
					durationType: "time",
					matchesTotal: null,
					matchesServed: 0,
					endsOn: "2026-07-13",
				},
				TODAY,
			),
		).toBe(false);
	});

	it("'permanent' siempre vigente mientras status sea 'active'", () => {
		expect(
			isSuspensionActive(
				{
					status: "active",
					durationType: "permanent",
					matchesTotal: null,
					matchesServed: 0,
					endsOn: null,
				},
				TODAY,
			),
		).toBe(true);
	});

	it("'lifted' nunca es vigente, sin importar duration_type", () => {
		expect(
			isSuspensionActive(
				{
					status: "lifted",
					durationType: "permanent",
					matchesTotal: null,
					matchesServed: 0,
					endsOn: null,
				},
				TODAY,
			),
		).toBe(false);
	});

	it("'served' nunca es vigente", () => {
		expect(
			isSuspensionActive(
				{
					status: "served",
					durationType: "matches",
					matchesTotal: 1,
					matchesServed: 1,
					endsOn: null,
				},
				TODAY,
			),
		).toBe(false);
	});
});
