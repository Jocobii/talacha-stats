"use client";

/**
 * features/sorteo-cockpit/model/useSaveSchedulingConfig.ts
 *
 * Mutación (TanStack Query) para guardar la config de sorteo desde el wizard de
 * primera configuración. Reemplaza el `useState(saving)` + `fetch()` desnudo del
 * componente (§7.2/§11). Transporte: `putSchedulingConfig` (apiFetch); el error
 * se expone vía `error`, sin `catch` que lo silencie (§18.4).
 */

import { useMutation } from "@tanstack/react-query";
import { putSchedulingConfig } from "../lib/cockpit-api";
import type { CockpitConfig } from "../types";

export function useSaveSchedulingConfig(leagueId: string) {
	return useMutation<void, Error, CockpitConfig>({
		mutationFn: (config) => putSchedulingConfig(leagueId, config),
	});
}
