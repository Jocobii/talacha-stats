"use client";

/**
 * features/arranque-onboarding/ui/StepSchedule.tsx
 * Paso 3 — asigna la cancha a la liga y crea su ventana horaria. El día NO
 * se pide: se hereda de `league.dayOfWeek`. Validación start<end en cliente
 * antes de llamar al hook; el 409 de solapamiento lo muestra el server.
 */

import { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { WizardFooter } from "./WizardShared";
import { DAYS } from "../model/arranque-league-schema";
import { useAssignVenueWindow } from "../model/useAssignVenueWindow";
import type { CreatedLeagueView, CreatedVenueView } from "../types";

type Props = {
	league: CreatedLeagueView;
	venues: CreatedVenueView[];
	onScheduleReady: () => void;
};

export function StepSchedule({ league, venues, onScheduleReady }: Props) {
	const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
	const [startTime, setStartTime] = useState("19:00");
	const [endTime, setEndTime] = useState("21:00");
	const [clientError, setClientError] = useState("");
	const assignSchedule = useAssignVenueWindow();

	const dayLabel = DAYS.find((d) => d.value === league.dayOfWeek)?.label ?? league.dayOfWeek;

	function handleSubmit() {
		setClientError("");
		if (!venueId) {
			setClientError("Selecciona una cancha.");
			return;
		}
		if (startTime >= endTime) {
			setClientError("La hora de inicio debe ser anterior a la de fin.");
			return;
		}
		assignSchedule.mutate(
			{ leagueId: league.id, venueId, dayOfWeek: league.dayOfWeek, startTime, endTime },
			{ onSuccess: onScheduleReady },
		);
	}

	const error = clientError || assignSchedule.error?.message;

	return (
		<Card className="p-6">
			<h3 className="font-display text-[22px] text-ink font-bold tracking-tight mb-1">
				Asigna cancha y horario
			</h3>
			<p className="text-sm text-ink-2 mb-5">
				{league.name} · {dayLabel}
			</p>

			<div className="flex flex-col gap-4">
				<Field label="Cancha" required>
					<div className="flex flex-wrap gap-2">
						{venues.map((v) => {
							const active = v.id === venueId;
							return (
								<button
									key={v.id}
									type="button"
									onClick={() => setVenueId(v.id)}
									aria-pressed={active}
									className={[
										"flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
										active
											? "bg-brand/15 border-brand/40 text-brand-ink font-semibold"
											: "border-line text-ink-2 hover:border-brand/30",
									].join(" ")}
								>
									<span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
									{v.name}
								</button>
							);
						})}
					</div>
				</Field>

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
							{assignSchedule.isPending ? "Guardando…" : "Confirmar horario"}
						</Button>
					}
				/>
			</div>
		</Card>
	);
}
