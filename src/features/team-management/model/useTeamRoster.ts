"use client";

/**
 * features/team-management/model/useTeamRoster.ts
 * Estado del roster + modales de gestion. Usa router.refresh() para sincronizar
 * datos del servidor despues de cada mutacion.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROSTER_MEMBER_URL, TRANSFER_URL } from "../constants";
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

export function useTeamRoster(teamId: string, initialRoster: RosterEntry[]): UseTeamRosterReturn {
	const [roster, setRoster] = useState<RosterEntry[]>(initialRoster);
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [selectedMember, setSelectedMember] = useState<RosterEntry | null>(null);
	const [mutating, setMutating] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const openModal = useCallback((type: ModalType, member?: RosterEntry) => {
		setError("");
		setSelectedMember(member ?? null);
		setActiveModal(type);
	}, []);

	const closeModal = useCallback(() => {
		setActiveModal(null);
		setSelectedMember(null);
		setError("");
	}, []);

	const handleRemove = useCallback(
		async (memberId: string) => {
			const prev = roster;
			setRoster((r) => r.filter((m) => m.memberId !== memberId));
			setMutating(true);
			try {
				const res = await fetch(ROSTER_MEMBER_URL(teamId, memberId), { method: "DELETE" });
				const data = (await res.json()) as { ok: boolean; error?: string };
				if (!data.ok) {
					setRoster(prev);
					setError(data.error ?? "Error al dar de baja");
					return;
				}
				router.refresh();
				closeModal();
			} finally {
				setMutating(false);
			}
		},
		[teamId, roster, router, closeModal],
	);

	const handleTransfer = useCallback(
		async (memberId: string, targetTeamId: string) => {
			const prev = roster;
			setRoster((r) => r.filter((m) => m.memberId !== memberId));
			setMutating(true);
			try {
				const res = await fetch(TRANSFER_URL(teamId, memberId), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ targetTeamId }),
				});
				const data = (await res.json()) as { ok: boolean; error?: string };
				if (!data.ok) {
					setRoster(prev);
					setError(data.error ?? "Error al transferir");
					return;
				}
				router.refresh();
				closeModal();
			} finally {
				setMutating(false);
			}
		},
		[teamId, roster, router, closeModal],
	);

	const handleEditMember = useCallback(
		async (memberId: string, data: UpdateRosterMemberData) => {
			setMutating(true);
			try {
				const res = await fetch(ROSTER_MEMBER_URL(teamId, memberId), {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				const json = (await res.json()) as { ok: boolean; error?: string };
				if (!json.ok) {
					setError(json.error ?? "Error al actualizar");
					return;
				}
				setRoster((r) =>
					r.map((m) =>
						m.memberId === memberId
							? { ...m, dorsal: data.dorsal ?? m.dorsal, status: data.status ?? m.status }
							: m,
					),
				);
				router.refresh();
				closeModal();
			} finally {
				setMutating(false);
			}
		},
		[teamId, router, closeModal],
	);

	const handlePlayerAdded = useCallback(() => {
		router.refresh();
		closeModal();
	}, [router, closeModal]);

	return {
		roster,
		activeModal,
		selectedMember,
		mutating,
		error,
		openModal,
		closeModal,
		handleRemove,
		handleTransfer,
		handleEditMember,
		handlePlayerAdded,
	};
}
