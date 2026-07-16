"use client";

/**
 * features/admin-registration/ui/RegistrationForm.tsx
 * Orquestador — delega todo el estado al hook y renderiza el subcomponente
 * correcto según step.type. Máximo 80 líneas por regla SRP.
 */

import { Loader2, User } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { redirect } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { useRegistrationForm } from "../model/useRegistrationForm";
import { StageIndicator } from "./StageIndicator";
import { CurpSearchCard } from "./CurpSearchCard";
import { PlayerFoundCard } from "./PlayerFoundCard";
import { NewPlayerCard } from "./NewPlayerCard";
import { RegistrationSuccessCard } from "./RegistrationSuccessCard";
import { RegistrationErrorCard } from "./RegistrationErrorCard";
import type { League } from "../types";

type Props = {
	fixedLeague?: League;
	leagues?: League[];
};

export default function RegistrationForm({ fixedLeague, leagues = [] }: Props) {
	const form = useRegistrationForm(fixedLeague, leagues);
	const { step, currentStage, sessionCount, reset, handleSubmit, curpInputRef } = form;

	return (
		<div className="flex flex-col gap-8 max-w-full mx-auto">
			<StageIndicator current={currentStage} />

			{(step.type === "idle" || step.type === "searching") && (
				<CurpSearchCard
					ref={curpInputRef}
					curp={form.curp}
					onCurpChange={form.setCurpInput}
					isSearching={step.type === "searching"}
				/>
			)}

			{step.type === "found" && (
				<PlayerFoundCard
					player={step.player}
					curp={form.curp}
					fixedLeague={fixedLeague}
					leagues={leagues}
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
					lastName={form.lastName}
					birthDate={form.birthDate}
					gender={form.gender}
					fixedLeague={fixedLeague}
					leagues={leagues}
					leagueId={form.leagueId}
					league={form.selectedLeague}
					teams={form.teams}
					teamId={form.teamId}
					dorsal={form.dorsal}
					onLeagueChange={form.onLeagueChange}
					onFullNameChange={form.onFullNameChange}
					onLastNameChange={form.onLastNameChange}
					onBirthDateChange={form.onBirthDateChange}
					onGenderChange={form.onGenderChange}
					phone={form.phone}
					residenceArea={form.residenceArea}
					emergencyContactName={form.emergencyContactName}
					emergencyContactPhone={form.emergencyContactPhone}
					medicalNotes={form.medicalNotes}
					onPhoneChange={form.onPhoneChange}
					onResidenceAreaChange={form.onResidenceAreaChange}
					onEmergencyContactNameChange={form.onEmergencyContactNameChange}
					onEmergencyContactPhoneChange={form.onEmergencyContactPhoneChange}
					onMedicalNotesChange={form.onMedicalNotesChange}
					onTeamChange={form.onTeamChange}
					onDorsalChange={form.onDorsalChange}
					onSubmit={handleSubmit}
					onCancel={reset}
					submitting={false}
				/>
			)}

			{step.type === "submitting" && (
				<Card className="p-8 flex items-center gap-4 text-ink-2">
					<Loader2 size={22} className="animate-spin text-brand-ink" />
					<span className="text-sm">Registrando jugador&hellip;</span>
				</Card>
			)}

			{step.type === "success" && (
				<RegistrationSuccessCard
					data={step.data}
					teams={form.teams}
					league={form.selectedLeague}
					sessionCount={sessionCount}
					onNext={reset}
					onEnd={() => {
						redirect("/admin/players");
					}}
				/>
			)}

			{step.type === "error" && <RegistrationErrorCard message={step.message} onRetry={reset} />}
		</div>
	);
}
