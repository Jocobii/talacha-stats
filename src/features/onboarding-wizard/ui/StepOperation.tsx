"use client";

/**
 * features/onboarding-wizard/ui/StepOperation.tsx
 * Paso 2 — cancha + liga en una sola pantalla (antes vivían en pasos
 * separados del wizard de Arranque). Un solo "Continuar" dispara ambas
 * mutaciones vía useOperationStep; si ya hay cancha (reanudación), se
 * muestra como chip en vez de repetir el form.
 */

import { Check } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { WizardFooter } from "./WizardShared";
import { OperationVenueFields } from "./OperationVenueFields";
import { OperationLeagueFields } from "./OperationLeagueFields";
import { useOperationStep } from "../model/useOperationStep";
import type { CreatedVenueView, CreatedLeagueView } from "../types";

type Props = {
	organizationId: string;
	initialVenue: CreatedVenueView | null;
	onOperationReady: (venue: CreatedVenueView, league: CreatedLeagueView) => void;
};

export function StepOperation({ organizationId, initialVenue, onOperationReady }: Props) {
	const { venueForm, leagueForm, submit, isPending, error } = useOperationStep({
		organizationId,
		initialVenue,
		onReady: onOperationReady,
	});

	return (
		<Card className="p-6">
			<h2 className="font-display text-2xl text-ink font-bold tracking-tight mb-1">
				Arranca tu operación
			</h2>
			<p className="text-sm text-ink-2 mb-5">
				La cancha donde se juega y la liga que vas a administrar. Equipos y jugadores se agregan
				después.
			</p>

			<div className="flex flex-col gap-5">
				<section>
					<p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-3 mb-3">
						Tu primera cancha
					</p>
					{initialVenue ? (
						<div className="flex items-center gap-2 text-sm text-ink">
							<Check size={16} strokeWidth={3} className="text-brand-ink shrink-0" />
							{initialVenue.name}
						</div>
					) : (
						<OperationVenueFields
							register={venueForm.register}
							errors={venueForm.formState.errors}
						/>
					)}
				</section>

				<section>
					<p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-3 mb-3">
						Tu primera liga
					</p>
					<OperationLeagueFields
						register={leagueForm.register}
						control={leagueForm.control}
						errors={leagueForm.formState.errors}
					/>
				</section>

				{error && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{error}
					</p>
				)}

				<WizardFooter
					leftHint="Equipos y jugadores se agregan después."
					primary={
						<Button variant="primary" onClick={submit} disabled={isPending}>
							{isPending ? "Guardando…" : "Continuar"}
						</Button>
					}
				/>
			</div>
		</Card>
	);
}
