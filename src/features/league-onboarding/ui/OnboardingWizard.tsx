"use client";

/**
 * features/league-onboarding/ui/OnboardingWizard.tsx
 * Orquestador del wizard 3 pasos: Equipos → Jugadores → Listo.
 */

import Link from "next/link";
import { Card } from "@/shared/ui/Card";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Stepper } from "@/shared/ui/Stepper";
import { StepTeams } from "./StepTeams";
import { StepPlayers } from "./StepPlayers";
import { StepDone } from "./StepDone";
import { WIZARD_STEPS } from "../constants";
import type { CreatedTeam, League, WizardStep } from "../types";

type Props = {
	league: League;
	step: WizardStep;
	createdTeams: CreatedTeam[];
	onTeamsReady: (teams: CreatedTeam[]) => void;
	onPlayersReady: () => void;
	onBack: () => void;
};

export function OnboardingWizard({
	league,
	step,
	createdTeams,
	onTeamsReady,
	onPlayersReady,
	onBack,
}: Props) {
	return (
		<div className="flex flex-col gap-8 max-w-[920px] mx-auto">
			<PageHeader
				breadcrumb={[
					{ label: "Ligas", href: "/admin/leagues" },
					{ label: league.name, href: `/admin/leagues/${league.id}` },
					{ label: "Configurar" },
				]}
				title={`Configurar ${league.name}`}
				subtitle={`${league.season} · ${league.dayOfWeek}`}
				actions={
					<Link href={`/admin/leagues/${league.id}`} className="text-sm text-ink-2 hover:underline">
						← Salir
					</Link>
				}
			/>

			<Card className="p-6">
				<Stepper steps={WIZARD_STEPS} current={step} />
			</Card>

			{step === 0 && <StepTeams league={league} onNext={onTeamsReady} />}
			{step === 1 && (
				<StepPlayers league={league} teams={createdTeams} onBack={onBack} onNext={onPlayersReady} />
			)}
			{step === 2 && <StepDone league={league} teams={createdTeams} />}
		</div>
	);
}
