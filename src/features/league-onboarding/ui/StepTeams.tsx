"use client";

/**
 * features/league-onboarding/ui/StepTeams.tsx
 * Paso de equipos del wizard — crear equipos en bloque con el campo de fichas.
 */

import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { useStepTeams } from "../model/useStepTeams";
import { TeamChipsInput } from "./TeamChipsInput";
import { WizardFooter } from "./WizardShared";
import type { CreatedTeam, League } from "../types";

type Props = {
	league: League;
	onNext: (teams: CreatedTeam[]) => void;
};

export function StepTeams({ league, onNext }: Props) {
	const { names, saving, error, setNames, handleNext } = useStepTeams(league, onNext);

	const leftHint =
		names.length < 2
			? "Agrega al menos 2 equipos para continuar."
			: `${names.length} equipo${names.length !== 1 ? "s" : ""} listos`;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
				{/* Main card */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-1">
						<h3 className="font-display text-[22px] text-ink font-bold tracking-tight">
							Crea los equipos
						</h3>
						<span className="text-[12px] text-ink-3">{names.length} equipos</span>
					</div>
					<p className="text-sm text-ink-2 mb-5">
						Escribe uno y Enter, o pega tu lista completa. Sugerimos al menos 4 para arrancar.
					</p>

					<TeamChipsInput value={names} onChange={setNames} />

					{error && (
						<p className="mt-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
							{error}
						</p>
					)}
				</Card>

				{/* Tips sidebar */}
				<div className="flex flex-col gap-4">
					<Card className="p-5">
						<SectionLabel className="mb-3">Consejos</SectionLabel>
						<ul className="flex flex-col gap-3 text-[13px] text-ink-2 leading-snug">
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">01</span>
								Usa el nombre real del equipo, sin abreviar.
							</li>
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">02</span>
								¿Ya tienes la lista? Pégala y la separamos por ti.
							</li>
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">03</span>
								Puedes agregar o quitar equipos después.
							</li>
						</ul>
					</Card>
				</div>
			</div>

			<WizardFooter
				leftHint={leftHint}
				primary={
					<Button
						variant="primary"
						size="md"
						iconRight={ArrowRight}
						onClick={handleNext}
						disabled={names.length < 2 || saving}
					>
						{saving ? "Guardando…" : "Siguiente: registrar jugadores"}
					</Button>
				}
			/>
		</div>
	);
}
