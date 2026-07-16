import type { OrganizationSchedulingConfigDto } from "./model";

/** Defaults del sistema cuando la organización nunca configuró su plantilla de sorteo. */
export function ORGANIZATION_SCHEDULING_CONFIG_DEFAULTS(
	organizationId: string,
): OrganizationSchedulingConfigDto {
	return {
		organizationId,
		regularMatchdays: null,
		regularFormat: "single",
		matchDurationMinutes: 50,
		bufferMinutes: 0,
		allowDuplicateMatchups: false,
		noRepeatWithin: 3,
	};
}
