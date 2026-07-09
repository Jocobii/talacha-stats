import { describe, expect, it } from "vitest";
import { scorePasswordStrength } from "./password-strength";

describe("scorePasswordStrength", () => {
	it("retorna 0 para vacio", () => {
		expect(scorePasswordStrength("")).toBe(0);
	});

	it("nunca retorna 0 para valores no vacios", () => {
		expect(scorePasswordStrength("a")).toBeGreaterThanOrEqual(1);
	});

	it("sube el score con mas senales de complejidad", () => {
		const debil = scorePasswordStrength("aaaaaaa"); // solo longitud casi (7 chars, no llega a 8)
		const aceptable = scorePasswordStrength("aaaaaaaa"); // longitud >= 8
		const buena = scorePasswordStrength("Aaaaaaaa1"); // + mayus/minus + digito
		const excelente = scorePasswordStrength("Aaaaaaa1!"); // + caracter especial

		expect(debil).toBeLessThan(aceptable);
		expect(aceptable).toBeLessThan(buena);
		expect(buena).toBeLessThan(excelente);
		expect(excelente).toBe(4);
	});
});
