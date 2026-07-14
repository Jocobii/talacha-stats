/**
 * entities/suspension/lib/is-suspension-active.ts
 *
 * Vigencia según `duration_type` (§5.2 docs/MODULOS-GESTION-LIGA.md). `status`
 * por sí solo no basta para 'time': nada voltea automáticamente 'active' →
 * 'served' cuando pasa `ends_on` (no hay cron). Pura — sin DB, reusable en
 * server y cliente (mismo patrón que resolveThemeInput / resolveSkinId).
 */
import type { SuspensionDto } from "../model";

type VigenciaInput = Pick<
	SuspensionDto,
	"status" | "durationType" | "matchesTotal" | "matchesServed" | "endsOn"
>;

/** `todayIso` en formato "YYYY-MM-DD" — comparación lexicográfica válida para ISO date. */
export function isSuspensionActive(suspension: VigenciaInput, todayIso: string): boolean {
	if (suspension.status !== "active") return false;

	switch (suspension.durationType) {
		case "matches":
			return suspension.matchesServed < (suspension.matchesTotal ?? 0);
		case "time":
			return suspension.endsOn !== null && todayIso <= suspension.endsOn;
		case "permanent":
			return true;
		default:
			return false;
	}
}
