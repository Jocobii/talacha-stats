import { describe, it, expect } from "vitest";
import { DEFAULT_HOME_VIEW, resolveHomeView } from "./home-view";

describe("resolveHomeView", () => {
	it("el query param tiene prioridad sobre la cookie", () => {
		expect(resolveHomeView("organizador", undefined, "jugador")).toBe("organizador");
	});

	it("usa la cookie cuando no hay query param", () => {
		expect(resolveHomeView(undefined, undefined, "organizador")).toBe("organizador");
	});

	it("ignora un query param inválido y cae a la cookie", () => {
		expect(resolveHomeView("hacker", undefined, "organizador")).toBe("organizador");
	});

	it("ignora una cookie inválida y cae al default", () => {
		expect(resolveHomeView(undefined, undefined, "basura")).toBe(DEFAULT_HOME_VIEW);
	});

	it("sin param ni cookie devuelve el default (jugador)", () => {
		expect(resolveHomeView(undefined, undefined, undefined)).toBe("jugador");
	});

	it("?ref=organizador activa la vista de organizador", () => {
		expect(resolveHomeView(undefined, "organizador", undefined)).toBe("organizador");
	});

	it("?vista= tiene prioridad sobre ?ref=", () => {
		expect(resolveHomeView("jugador", "organizador", undefined)).toBe("jugador");
	});

	it("ignora un ref inválido y cae a la cookie", () => {
		expect(resolveHomeView(undefined, "facebook_ads", "organizador")).toBe("organizador");
	});
});
