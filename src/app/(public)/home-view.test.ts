import { describe, it, expect } from "vitest";
import { DEFAULT_HOME_VIEW, resolveHomeView } from "./home-view";

describe("resolveHomeView", () => {
	it("el query param tiene prioridad sobre la cookie", () => {
		expect(resolveHomeView("organizador", "jugador")).toBe("organizador");
	});

	it("usa la cookie cuando no hay query param", () => {
		expect(resolveHomeView(undefined, "organizador")).toBe("organizador");
	});

	it("ignora un query param inválido y cae a la cookie", () => {
		expect(resolveHomeView("hacker", "organizador")).toBe("organizador");
	});

	it("ignora una cookie inválida y cae al default", () => {
		expect(resolveHomeView(undefined, "basura")).toBe(DEFAULT_HOME_VIEW);
	});

	it("sin param ni cookie devuelve el default (jugador)", () => {
		expect(resolveHomeView(undefined, undefined)).toBe("jugador");
	});
});
