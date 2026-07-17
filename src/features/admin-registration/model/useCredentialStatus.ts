"use client";

/**
 * features/admin-registration/model/useCredentialStatus.ts
 *
 * Estado de credencial para la liga seleccionada en el paso 3 del registro
 * (docs/CREDENCIAL-PASE-JUGADOR.md, pantalla A). Se activa solo cuando hay
 * una liga elegida — sin liga no hay nada que emitir. globalPlayerId es null
 * mientras el jugador es "not_found" (aún no existe en la DB); el backend
 * igual resuelve scopeOptions para saber si hay que preguntar la modalidad.
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { CredentialStatusResponse } from "@/entities/player-credential";
import { CREDENTIAL_STATUS_URL } from "../constants";

export function useCredentialStatus(leagueId: string, globalPlayerId: string | null) {
	return useQuery<CredentialStatusResponse>({
		queryKey: queryKeys.credentialStatus(leagueId, globalPlayerId),
		queryFn: async () => {
			const res = await apiFetch<CredentialStatusResponse>(
				CREDENTIAL_STATUS_URL(leagueId, globalPlayerId),
			);
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
		enabled: !!leagueId,
	});
}
