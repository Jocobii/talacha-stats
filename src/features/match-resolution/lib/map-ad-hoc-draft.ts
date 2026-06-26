/**
 * features/match-resolution/lib/map-ad-hoc-draft.ts
 *
 * Mapper DTO → ViewModel (§19). Combina la respuesta del alta ad-hoc
 * (`AdHocPlayerResult`, DTO de entidad) con los datos del formulario para armar
 * el `PlayerStatDraft` que la cédula consume. Aquí vive la construcción del draft
 * (contadores en 0, banderas) — la UI no arma este objeto a mano.
 *
 * Función pura, sin imports de `@/db` ni ciclo de vida React → testeable directo.
 */

import type { AdHocPlayerResult } from "@/entities/match-player-stat";
import type { PlayerStatDraft } from "../types";
import type { AdHocPlayerFormInput } from "../model/ad-hoc-form-schema";

export function mapAdHocResultToDraft(
	result: AdHocPlayerResult,
	form: AdHocPlayerFormInput,
): PlayerStatDraft {
	return {
		registrationId: result.registrationId,
		playerProfileId: result.playerProfileId,
		fullName: form.fullName.trim(),
		jerseyNumber: form.shirtNumber,
		isAdHoc: true,
		isPresent: true,
		shirtNumber: form.shirtNumber,
		goals: 0,
		assists: 0,
		yellowCards: 0,
		blueCards: 0,
		redCards: 0,
		dirty: false,
	};
}
