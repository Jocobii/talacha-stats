"use client";

/**
 * features/team-management/ui/AddPlayerModal.tsx
 * Reutiliza el flujo CURP de admin-registration dentro de un Modal.
 * Al completarse el registro, llama onSuccess() y cierra.
 */

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Card } from "@/shared/ui/Card";
import { useRegistrationForm } from "@/features/admin-registration/model/useRegistrationForm";
import { CurpSearchCard } from "@/features/admin-registration/ui/CurpSearchCard";
import { PlayerFoundCard } from "@/features/admin-registration/ui/PlayerFoundCard";
import { NewPlayerCard } from "@/features/admin-registration/ui/NewPlayerCard";
import { RegistrationErrorCard } from "@/features/admin-registration/ui/RegistrationErrorCard";
import type { League } from "@/features/admin-registration/types";

type Props = {
	league: League;
	teamId: string;
	onSuccess: () => void;
	onClose: () => void;
};

export function AddPlayerModal({ league, teamId, onSuccess, onClose }: Props) {
	const form = useRegistrationForm(league, [league]);
	const { step, currentStage: _, reset, handleSubmit, curpInputRef } = form;

	// Pre-seleccionar el equipo actual cuando carguen los equipos de la liga
	useEffect(() => {
		if (form.teams.some((t) => t.id === teamId) && form.teamId !== teamId) {
			form.onTeamChange(teamId);
		}
	}, [form.teams, teamId]);

	// Al completar el registro, notificar al padre
	useEffect(() => {
		if (step.type === "success") onSuccess();
	}, [step.type]);

	return (
		<Modal onClose={onClose} title="Agregar jugador" size="lg">
			<div className="p-5 flex flex-col gap-4">
				{(step.type === "idle" || step.type === "searching") && (
					<CurpSearchCard
						ref={curpInputRef}
						curp={form.curp}
						onCurpChange={form.setCurpInput}
						leagueId={form.leagueId}
						leagues={[league]}
						fixedLeague={league}
						isSearching={step.type === "searching"}
						onLeagueChange={form.onLeagueChange}
					/>
				)}

				{step.type === "found" && (
					<PlayerFoundCard
						player={step.player}
						curp={form.curp}
						fixedLeague={league}
						leagues={[league]}
						leagueId={form.leagueId}
						league={form.selectedLeague}
						teams={form.teams}
						teamId={form.teamId}
						dorsal={form.dorsal}
						onLeagueChange={form.onLeagueChange}
						onTeamChange={form.onTeamChange}
						onDorsalChange={form.onDorsalChange}
						onSubmit={handleSubmit}
						onReset={reset}
						submitting={false}
					/>
				)}

				{step.type === "not_found" && (
					<NewPlayerCard
						curp={form.curp}
						fullName={form.fullName}
						birthDate={form.birthDate}
						fixedLeague={league}
						leagues={[league]}
						leagueId={form.leagueId}
						league={form.selectedLeague}
						teams={form.teams}
						teamId={form.teamId}
						dorsal={form.dorsal}
						onLeagueChange={form.onLeagueChange}
						onFullNameChange={form.onFullNameChange}
						onBirthDateChange={form.onBirthDateChange}
						onTeamChange={form.onTeamChange}
						onDorsalChange={form.onDorsalChange}
						onSubmit={handleSubmit}
						onCancel={reset}
						submitting={false}
					/>
				)}

				{step.type === "submitting" && (
					<Card className="p-8 flex items-center gap-4 text-ink-2">
						<Loader2 size={20} className="animate-spin text-brand" />
						<span className="text-sm">Registrando jugador...</span>
					</Card>
				)}

				{step.type === "error" && <RegistrationErrorCard message={step.message} onRetry={reset} />}
			</div>
		</Modal>
	);
}
