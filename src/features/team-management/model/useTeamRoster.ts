"use client";

/**
 * features/team-management/model/useTeamRoster.ts
 *
 * Compositor del roster: une la lectura (useTeamRosterQuery), las mutaciones
 * (useRosterMutations) y el estado de modales (useRosterModals) en la interfaz
 * que consume TeamDetailView. La data vive en la caché de TanStack Query; tras
 * cada mutación se invalida la key — ya no hay `router.refresh()` ni el
 * `setState` dentro de un `useEffect` que sincronizaba las props.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidate } from "@/shared/api/cache-invalidation";
import { useTeamRosterQuery } from "./useTeamRosterQuery";
import { useRosterMutations } from "./useRosterMutations";
import { useRosterModals } from "./useRosterModals";
import type { RosterEntry, ModalType, UpdateRosterMemberData } from "../types";

export type UseTeamRosterReturn = {
	roster: RosterEntry[];
	activeModal: ModalType;
	selectedMember: RosterEntry | null;
	mutating: boolean;
	error: string;
	openModal: (type: ModalType, member?: RosterEntry) => void;
	closeModal: () => void;
	handleRemove: (memberId: string) => Promise<void>;
	handleTransfer: (memberId: string, targetTeamId: string) => Promise<void>;
	handleEditMember: (memberId: string, data: UpdateRosterMemberData) => Promise<void>;
	handlePlayerAdded: () => void;
};

export function useTeamRoster(
	teamId: string,
	leagueId: string,
	initialRoster: RosterEntry[],
): UseTeamRosterReturn {
	const queryClient = useQueryClient();
	const { data: roster = [] } = useTeamRosterQuery(teamId, initialRoster);
	const { activeModal, selectedMember, openModal, closeModal } = useRosterModals();
	const { removeMember, transferMember, updateMember, isMutating, error } = useRosterMutations(
		teamId,
		leagueId,
		{ onSuccess: closeModal },
	);

	const handlePlayerAdded = useCallback(() => {
		invalidate.rosterMemberChanged(queryClient, { teamId });
		closeModal();
	}, [queryClient, teamId, closeModal]);

	return {
		roster,
		activeModal,
		selectedMember,
		mutating: isMutating,
		error,
		openModal,
		closeModal,
		handleRemove: removeMember,
		handleTransfer: transferMember,
		handleEditMember: updateMember,
		handlePlayerAdded,
	};
}
