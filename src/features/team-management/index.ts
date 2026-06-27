/**
 * features/team-management/index.ts
 * Exportaciones publicas. App/ y otras capas solo importan desde aqui.
 */

export { TeamDetailView } from "./ui/TeamDetailView";
export { RosterTable } from "./ui/RosterTable";
export { TeamSettingsPanel } from "./ui/TeamSettingsPanel";
export { DeleteTeamSection } from "./ui/DeleteTeamSection";
export { CreateTeamModal } from "./ui/CreateTeamModal";

export { useTeamRoster } from "./model/useTeamRoster";
export { useTeamForm } from "./model/useTeamForm";
export { useTransferModal } from "./model/useTransferModal";
export { useLeagueTeams } from "./model/useLeagueTeams";
export { useCreateTeam } from "./model/useCreateTeam";

// NOTA: las actions de escritura (./actions) importan @/db y son SOLO server.
// No se re-exportan aquí para que los Client Components que importan este barrel
// no arrastren `pg` al bundle del navegador. Los API routes las importan por
// ruta directa: `@/features/team-management/actions`.

export type { RosterEntry, ModalType, TeamFormData, TransferFormData, TeamOption } from "./types";
