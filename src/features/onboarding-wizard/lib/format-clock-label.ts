/**
 * features/onboarding-wizard/lib/format-clock-label.ts
 * Formatea "HH:MM" (24h, como lo guarda CreateVenueWindowSchema) a una
 * etiqueta de 12h para la pantalla final ("19:00" → "7:00 PM"). Puro,
 * sin dependencia de Intl/locale — mismo criterio simple que usaba el mock.
 */

export function formatClockLabel(hhmm: string): string {
	const [hStr, mStr] = hhmm.split(":");
	const hours24 = Number(hStr);
	const minutes = Number(mStr);
	if (Number.isNaN(hours24) || Number.isNaN(minutes)) return hhmm;

	const period = hours24 >= 12 ? "PM" : "AM";
	const hours12 = hours24 % 12 || 12;
	return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}
