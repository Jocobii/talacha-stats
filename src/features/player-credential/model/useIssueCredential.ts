"use client";

/**
 * features/player-credential/model/useIssueCredential.ts
 * Emite/renueva un pase — POST /api/player-credentials. Usado por
 * IssueCredentialModal (roster/tabla de jugadores y perfil). No invalida
 * queries propias porque las vistas que la usan (players table, perfil) son
 * Server Components — el caller hace router.refresh() en onSuccess.
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import type { CreatePlayerCredential, PlayerCredential } from "@/entities/player-credential";
import { ISSUE_CREDENTIAL_URL } from "../urls";

export function useIssueCredential() {
	return useMutation<PlayerCredential, Error, CreatePlayerCredential>({
		mutationFn: async (input) => {
			const res = await apiFetch<PlayerCredential>(ISSUE_CREDENTIAL_URL, {
				method: "POST",
				body: input,
			});
			if (!res.ok) throw new Error(res.error);
			return res.data;
		},
	});
}
