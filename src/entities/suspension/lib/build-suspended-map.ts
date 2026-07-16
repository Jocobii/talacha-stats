/**
 * entities/suspension/lib/build-suspended-map.ts
 * Cruza las suspensiones "activas" (status) de una liga con la fecha de un
 * partido específico, usando `isSuspensionActive` para la vigencia real
 * (§3.2, §4 de docs/PLAN-CEDULA-IMPRESA.md). Pura, sin DB — el caller
 * (entities/match/queries.ts) trae `suspensions` con
 * `listActiveSuspensionsByLeague` una sola vez por liga.
 */
import { isSuspensionActive } from "./is-suspension-active";
import {
	formatSuspensionForCedula,
	type CedulaSuspensionLabel,
} from "./format-suspension-for-cedula";
import type { SuspensionDto } from "../model";

/** Map<globalPlayerId, {tag, why}> de quién no puede jugar el día `matchDateIso`. */
export function buildSuspendedMapForMatchDate(
	suspensions: SuspensionDto[],
	matchDateIso: string,
): Map<string, CedulaSuspensionLabel> {
	const map = new Map<string, CedulaSuspensionLabel>();
	for (const s of suspensions) {
		if (!isSuspensionActive(s, matchDateIso)) continue;
		map.set(s.globalPlayerId, formatSuspensionForCedula(s));
	}
	return map;
}
