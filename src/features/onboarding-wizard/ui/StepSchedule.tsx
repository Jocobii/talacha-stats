"use client";

/**
 * features/onboarding-wizard/ui/StepSchedule.tsx
 * Paso 3 — asigna la cancha a la liga y crea su ventana horaria. El día NO
 * se pide: se hereda de league.dayOfWeek. Solo hay una cancha (decisión de
 * producto: el onboarding registra una, más se agregan después en
 * /admin/canchas), así que no hay selector — solo contexto.
 */

import { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { WizardFooter } from "./WizardShared";
import { DAYS } from "../model/onboarding-league-schema";
import { useAssignVenueWindow } from "../model/useAssignVenueWindow";
import type { CreatedLeagueView, CreatedVenueView, ScheduleDraft } from "../types";

type Props = {
	league: CreatedLeagueView;
	venue: CreatedVenueView;
	onScheduleReady: (schedule: ScheduleDraft) => void;
};

export function StepSchedule({ league, venue, onScheduleReady }: Props) {
	const [startTime, setStartTime] = useState("19:00");
	const [endTime, setEndTime] = useState("21:00");
	const [clientError, setClientError] = useState("");
	const assignSchedule = useAssignVenueWindow();

	const dayLabel = DAYS.find((d) => d.value === league.dayOfWeek)?.label ?? league.dayOfWeek;

	function handleSubmit() {
		setClientError("");
		if (startTime >= endTime) {
			setClientError("La hora de inicio debe ser anterior a la de fin.");
			return;
		}
		assignSchedule.mutate(
			{ leagueId: league.id, venueId: venue.id, dayOfWeek: league.dayOfWeek, startTime, endTime },
			{ onSuccess: () => onScheduleReady({ startTime, endTime }) },
		);
	}

	const error = clientError || assignSchedule.error?.message;

	return (
		<Card className="p-6">
			<h2 className="font-display text-2xl text-ink font-bold tracking-tight mb-1">
				Asigna cancha y horario
			</h2>
			<p className="text-sm text-ink-2 mb-5">
				{league.name} · {dayLabel} · {venue.name}
			</p>

			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-3">
					<Field label="Hora de inicio" required>
						<Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
					</Field>
					<Field label="Hora de fin" required>
						<Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
					</Field>
				</div>

				{error && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{error}
					</p>
				)}

				<WizardFooter
					leftHint={`Se asigna el ${dayLabel} de cada semana.`}
					primary={
						<Button variant="primary" onClick={handleSubmit} disabled={assignSchedule.isPending}>
							{assignSchedule.isPending ? "Guardando…" : "Crear liga"}
						</Button>
					}
				/>
			</div>
		</Card>
	);
}
