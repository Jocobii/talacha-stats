/**
 * features/team-management/index.ts
 * Exportaciones publicas. App/ y otras capas solo importan desde aqui.
 */

export { TeamDetailView } from "./ui/TeamDetailView";
export { RosterTable } from "./ui/RosterTable";
export { TeamSettingsPanel } from "./ui/TeamSettingsPanel";
export { DeleteTeamSection } from "./ui/DeleteTeamSection";

export { useTeamRoster } from "./model/useTeamRoster";
export { useTeamForm } from "./model/useTeamForm";
export { useTransferModal } from "./model/useTransferModal";

export {
	updateTeamInfo,
	dissolveTeam,
	updateRosterMember,
	removeFromRoster,
	transferPlayer,
} from "./actions";

export type { RosterEntry, ModalType, TeamFormData, TransferFormData, TeamOption } from "./types";
