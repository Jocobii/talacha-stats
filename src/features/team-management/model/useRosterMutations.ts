"use client";

/**
 * features/team-management/model/useRosterMutations.ts
 *
 * Mutaciones del roster (baja, transferencia, edición) con TanStack Query.
 * Cada una invalida la caché afectada en `onSuccess` a través del registro
 * central (`shared/api/cache-invalidation.ts`, §4 del estándar de caché) —
 * nada de `invalidateQueries` suelto ni `router.refresh()`.
 *
 * Se usa `mutate` (no `mutateAsync`): el error se expone vía `error` y se evita
 * el `catch` que silencia (§18.4). Los handlers devuelven `Promise<void>` para
 * encajar con la firma que esperan los modales.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/client";
import { invalidate } from "@/shared/api/cache-invalidation";
import { ROSTER_MEMBER_URL, TRANSFER_URL } from "../constants";
import type { UpdateRosterMemberData } from "../types";

type TransferVars = { memberId: string; targetTeamId: string };
type UpdateVars = { memberId: string; data: UpdateRosterMemberData };

async function requestOrThrow(
	url: string,
	init: { method: string; body?: Record<string, unknown> },
): Promise<void> {
	const result = await apiFetch(url, init);
	if (!result.ok) throw new Error(result.error);
}

export type RosterMutationsOptions = { onSuccess: () => void };

export type UseRosterMutationsReturn = {
	removeMember: (memberId: string) => Promise<void>;
	transferMember: (memberId: string, targetTeamId: string) => Promise<void>;
	updateMember: (memberId: string, data: UpdateRosterMemberData) => Promise<void>;
	isMutating: boolean;
	error: string;
};

export function useRosterMutations(
	teamId: string,
	leagueId: string,
	{ onSuccess }: RosterMutationsOptions,
): UseRosterMutationsReturn {
	const queryClient = useQueryClient();

	const removeMutation = useMutation({
		mutationFn: (memberId: string) =>
			requestOrThrow(ROSTER_MEMBER_URL(teamId, memberId), { method: "DELETE" }),
		onSuccess: () => {
			invalidate.rosterMemberChanged(queryClient, { teamId });
			onSuccess();
		},
	});

	const transferMutation = useMutation({
		mutationFn: ({ memberId, targetTeamId }: TransferVars) =>
			requestOrThrow(TRANSFER_URL(teamId, memberId), { method: "POST", body: { targetTeamId } }),
		onSuccess: (_data, { targetTeamId }) => {
			invalidate.rosterTransferred(queryClient, {
				fromTeamId: teamId,
				toTeamId: targetTeamId,
				leagueId,
			});
			onSuccess();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ memberId, data }: UpdateVars) =>
			requestOrThrow(ROSTER_MEMBER_URL(teamId, memberId), { method: "PATCH", body: { ...data } }),
		onSuccess: () => {
			invalidate.rosterMemberChanged(queryClient, { teamId });
			onSuccess();
		},
	});

	const isMutating =
		removeMutation.isPending || transferMutation.isPending || updateMutation.isPending;

	const error =
		removeMutation.error?.message ??
		transferMutation.error?.message ??
		updateMutation.error?.message ??
		"";

	return {
		removeMember: (memberId) => {
			removeMutation.mutate(memberId);
			return Promise.resolve();
		},
		transferMember: (memberId, targetTeamId) => {
			transferMutation.mutate({ memberId, targetTeamId });
			return Promise.resolve();
		},
		updateMember: (memberId, data) => {
			updateMutation.mutate({ memberId, data });
			return Promise.resolve();
		},
		isMutating,
		error,
	};
}
