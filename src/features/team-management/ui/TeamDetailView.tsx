"use client";

/**
 * features/team-management/ui/TeamDetailView.tsx
 * Orquestador cliente: tabs Plantilla / Configuracion + modales N1-N3.
 * Max 80 lineas — delega todo a subcomponentes y hooks.
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTeamRoster } from "../model/useTeamRoster";
import { RosterTable } from "./RosterTable";
import { AddPlayerModal } from "./AddPlayerModal";
import { TransferModal } from "./TransferModal";
import { RemovePlayerModal } from "./RemovePlayerModal";
import { EditPlayerDrawer } from "./EditPlayerDrawer";
import { TeamSettingsPanel } from "./TeamSettingsPanel";
import { DeleteTeamSection } from "./DeleteTeamSection";
import type { RosterEntry } from "../types";
import type { TeamWithLeague } from "@/entities/team";

type Props = {
	team: TeamWithLeague;
	initialRoster: RosterEntry[];
};

type Tab = "roster" | "settings";

export function TeamDetailView({ team, initialRoster }: Props) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const activeTab = (searchParams.get("tab") as Tab) ?? "roster";

	const setTab = (tab: Tab) => router.push(`${pathname}?tab=${tab}`);

	const {
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
	} = useTeamRoster(team.id, team.leagueId, initialRoster);

	const league = { id: team.leagueId, name: team.leagueName, season: team.leagueSeason };

	return (
		<div className="flex flex-col gap-0">
			{/* Tab nav */}
			<div className="flex border-b border-line">
				{(["roster", "settings"] as Tab[]).map((tab) => (
					<button
						key={tab}
						onClick={() => setTab(tab)}
						className={`px-5 py-3 text-[13px] font-medium transition border-b-2 -mb-px ${
							activeTab === tab
								? "border-brand text-ink"
								: "border-transparent text-ink-3 hover:text-ink-2"
						}`}
					>
						{tab === "roster" ? "Plantilla" : "Configuracion"}
					</button>
				))}
			</div>

			{/* Tab content */}
			{activeTab === "roster" && <RosterTable roster={roster} onOpenModal={openModal} />}
			{activeTab === "settings" && (
				<div className="p-6 flex flex-col gap-0">
					<TeamSettingsPanel
						teamId={team.id}
						leagueId={team.leagueId}
						initial={{ name: team.name, color: team.color ?? "" }}
					/>
					<DeleteTeamSection teamId={team.id} teamName={team.name} leagueId={team.leagueId} />
				</div>
			)}

			{/* Modales N1 */}
			{activeModal === "add" && (
				<AddPlayerModal
					league={league}
					teamId={team.id}
					onSuccess={handlePlayerAdded}
					onClose={closeModal}
				/>
			)}
			{activeModal === "transfer" && selectedMember && (
				<TransferModal
					member={selectedMember}
					leagueId={team.leagueId}
					teamId={team.id}
					onTransfer={handleTransfer}
					onClose={closeModal}
					mutating={mutating}
					error={error}
				/>
			)}
			{activeModal === "remove" && selectedMember && (
				<RemovePlayerModal
					member={selectedMember}
					onConfirm={handleRemove}
					onClose={closeModal}
					mutating={mutating}
					error={error}
				/>
			)}
			{activeModal === "edit" && selectedMember && (
				<EditPlayerDrawer
					member={selectedMember}
					onSave={handleEditMember}
					onClose={closeModal}
					mutating={mutating}
					error={error}
				/>
			)}
		</div>
	);
}
