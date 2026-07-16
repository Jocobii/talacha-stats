/**
 * features/discipline/lib/add-duration.ts
 * Pura — suma días/semanas/meses a una fecha ISO ("YYYY-MM-DD"), en UTC para
 * no depender del timezone del server. Usada por el escalado manual (B6) y
 * el alta manual (B7) para calcular `ends_on` en suspensiones `duration_type: 'time'`.
 */
import type { SuspensionDurationUnit } from "@/entities/suspension/model";

export function addDurationIso(
	fromIso: string,
	amount: number,
	unit: SuspensionDurationUnit,
): string {
	const d = new Date(`${fromIso}T00:00:00Z`);
	if (unit === "days") d.setUTCDate(d.getUTCDate() + amount);
	else if (unit === "weeks") d.setUTCDate(d.getUTCDate() + amount * 7);
	else d.setUTCMonth(d.getUTCMonth() + amount);
	return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}
