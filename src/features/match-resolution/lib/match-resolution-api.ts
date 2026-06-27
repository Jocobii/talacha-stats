/**
 * features/match-resolution/lib/match-resolution-api.ts
 *
 * Transporte de la cédula sobre `apiFetch` (no `fetch()` desnudo, §11). Cada
 * función lanza `Error(res.error)` en `!ok` (§18.4) → aísla el HTTP del hook y es
 * testeable mockeando `@/shared/api/client`. Los contratos salen de los tipos
 * nombrados de la entidad `match` (§4.1/§7.4): nada de shapes inline.
 *
 * Nota: el autosave por campo se dispara con debounce desde `use-match-resolution`
 * (coalescing por campo), por eso esas escrituras no se envuelven en `useMutation`
 * — sería un anti-patrón con el debounce. La resolución final (`resolveMatch`) sí
 * es una acción discreta.
 */

import { apiFetch } from "@/shared/api/client";
import type {
	AutosaveStatInput,
	AutosaveMatchFieldsInput,
	ResolveMatchInput,
	ResolveMatchResult,
} from "@/entities/match";
import { MATCH_URL, MATCH_STAT_URL, MATCH_RESOLVE_URL } from "../constants";

export async function patchPlayerStat(
	matchId: string,
	registrationId: string,
	patch: AutosaveStatInput,
): Promise<void> {
	const res = await apiFetch(MATCH_STAT_URL(matchId, registrationId), {
		method: "PATCH",
		body: patch,
	});
	if (!res.ok) throw new Error(res.error);
}

export async function patchMatchFields(
	matchId: string,
	patch: AutosaveMatchFieldsInput,
): Promise<void> {
	const res = await apiFetch(MATCH_URL(matchId), { method: "PATCH", body: patch });
	if (!res.ok) throw new Error(res.error);
}

export async function resolveMatch(
	matchId: string,
	body: ResolveMatchInput,
): Promise<ResolveMatchResult> {
	const res = await apiFetch<ResolveMatchResult>(MATCH_RESOLVE_URL(matchId), {
		method: "POST",
		body,
	});
	if (!res.ok) throw new Error(res.error);
	return res.data;
}
