"use client";

/**
 * features/admin-registration/ui/RegistrationForm.tsx
 * Orquestador — delega todo el estado al hook y renderiza el subcomponente
 * correcto según step.type. Máximo 80 líneas por regla SRP.
 */

import { Loader2, User } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
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
		<div className="flex flex-col gap-8 max-w-[920px] mx-auto">
			<PageHeader
				breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Registro de jugadores" }]}
				title="Registro de jugadores"
				subtitle="Ventanilla — captura uno por uno con el jugador frente a ti"
				actions={
					sessionCount > 0 ? (
						<Button variant="ghost" size="sm" icon={User}>
							{sessionCount} registrado{sessionCount !== 1 ? "s" : ""} hoy
						</Button>
					) : undefined
				}
			/>

			<StageIndicator current={currentStage} />

			{(step.type === "idle" || step.type === "searching") && (
				<CurpSearchCard
					ref={curpInputRef}
					curp={form.curp}
					onCurpChange={form.setCurpInput}
					leagueId={form.leagueId}
					leagues={leagues}
					fixedLeague={fixedLeague}
					isSearching={step.type === "searching"}
					onLeagueChange={form.onLeagueChange}
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
					birthDate={form.birthDate}
					fixedLeague={fixedLeague}
					leagues={leagues}
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
					<Loader2 size={22} className="animate-spin text-brand" />
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
						/* noop */
					}}
				/>
			)}

			{step.type === "error" && <RegistrationErrorCard message={step.message} onRetry={reset} />}
		</div>
	);
}
