/**
 * features/team-management/types.ts
 * Tipos compartidos de la feature. No duplicar en subcomponentes.
 */

import type { RosterEntry, UpdateTeamData, UpdateRosterMemberData } from "@/entities/team";

export type { RosterEntry, UpdateTeamData, UpdateRosterMemberData };

export type ModalType = "add" | "transfer" | "remove" | "edit" | null;

export type TeamFormData = {
	name: string;
	color: string;
};

export type TransferFormData = {
	targetTeamId: string;
	hasExitLetter: boolean;
};

/** Opcion simplificada de equipo para el selector de transferencia. */
export type TeamOption = {
	id: string;
	name: string;
	color: string | null;
};
