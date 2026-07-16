import { describe, it, expect } from "vitest";
import { mapAdHocResultToDraft } from "./map-ad-hoc-draft";

const result = { registrationId: "r1", playerProfileId: "p1", credentialCode: 42 };

describe("mapAdHocResultToDraft", () => {
	it("combina la respuesta del API con el formulario y arma el draft", () => {
		const draft = mapAdHocResultToDraft(result, { fullName: "Juan García", shirtNumber: 7 });
		expect(draft).toEqual({
			registrationId: "r1",
			playerProfileId: "p1",
			fullName: "Juan García",
			jerseyNumber: 7,
			credentialCode: 42,
			isAdHoc: true,
			isPresent: true,
			shirtNumber: 7,
			goals: 0,
			assists: 0,
			yellowCards: 0,
			blueCards: 0,
			redCards: 0,
			dirty: false,
		});
	});

	it("recorta espacios del nombre", () => {
		const draft = mapAdHocResultToDraft(result, { fullName: "  Ana López  ", shirtNumber: 10 });
		expect(draft.fullName).toBe("Ana López");
	});

	it("inicializa los contadores en 0 y marca el draft como ad-hoc y presente", () => {
		const draft = mapAdHocResultToDraft(result, { fullName: "Beto", shirtNumber: 1 });
		expect(draft.goals).toBe(0);
		expect(draft.assists).toBe(0);
		expect(draft.isAdHoc).toBe(true);
		expect(draft.isPresent).toBe(true);
		expect(draft.dirty).toBe(false);
	});
});
