"use client";

/**
 * features/team-management/model/useRosterModals.ts
 * Estado de UI de los modales del roster (cuál está abierto + jugador seleccionado).
 * Separado de los datos (query) y de las mutaciones para que cada pieza sea
 * testeable por sí sola.
 */

import { useState, useCallback } from "react";
import type { ModalType, RosterEntry } from "../types";

export type UseRosterModalsReturn = {
	activeModal: ModalType;
	selectedMember: RosterEntry | null;
	openModal: (type: ModalType, member?: RosterEntry) => void;
	closeModal: () => void;
};

export function useRosterModals(): UseRosterModalsReturn {
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [selectedMember, setSelectedMember] = useState<RosterEntry | null>(null);

	const openModal = useCallback((type: ModalType, member?: RosterEntry) => {
		setSelectedMember(member ?? null);
		setActiveModal(type);
	}, []);

	const closeModal = useCallback(() => {
		setActiveModal(null);
		setSelectedMember(null);
	}, []);

	return { activeModal, selectedMember, openModal, closeModal };
}
