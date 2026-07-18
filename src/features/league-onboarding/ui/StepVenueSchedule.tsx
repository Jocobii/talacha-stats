"use client";

/**
 * features/league-onboarding/ui/StepVenueSchedule.tsx
 *
 * Segundo paso al crear una liga desde el módulo de Liga (decisión Jocobi,
 * jul 2026): pregunta cancha + horario justo después de crear la liga, igual
 * que ya hace el onboarding real de la app (features/onboarding-wizard/ui/
 * StepSchedule.tsx) — mismo patrón de UI, hook propio por regla FSD §3.1.
 *
 * La cancha SIEMPRE se autoselecciona (la primera de la organización, orden
 * alfabético) — no hay selector, para ahorrar un paso. Si la organización no
 * tiene ninguna cancha registrada todavía, se explica y se deja para después
 * (tab Canchas), sin bloquear la creación de la liga.
 */

import { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { DAYS } from "../model/league-form-schema";
import { useFirstOrgVenue } from "../model/useFirstOrgVenue";
import { useAssignVenueWindow } from "../model/useAssignVenueWindow";

type Props = {
	league: { id: string; organizationId: string; name: string; dayOfWeek: string };
	onDone: () => void;
};

export function StepVenueSchedule({ league, onDone }: Props) {
	const [startTime, setStartTime] = useState("19:00");
	const [endTime, setEndTime] = useState("21:00");
	const [clientError, setClientError] = useState("");
	const { firstVenue, isLoading } = useFirstOrgVenue(league.organizationId);
	const assignSchedule = useAssignVenueWindow();

	const dayLabel = DAYS.find((d) => d.value === league.dayOfWeek)?.label ?? league.dayOfWeek;

	function handleSubmit() {
		if (!firstVenue) return;
		setClientError("");
		if (startTime >= endTime) {
			setClientError("La hora de inicio debe ser anterior a la de fin.");
			return;
		}
		assignSchedule.mutate(
			{
				leagueId: league.id,
				venueId: firstVenue.id,
				dayOfWeek: league.dayOfWeek,
				startTime,
				endTime,
			},
			{ onSuccess: onDone },
		);
	}

	const error = clientError || assignSchedule.error?.message;

	if (isLoading) {
		return (
			<Card className="p-6">
				<p className="text-sm text-ink-2">Buscando canchas de tu organización…</p>
			</Card>
		);
	}

	if (!firstVenue) {
		return (
			<Card className="p-6">
				<h2 className="font-display text-2xl text-ink font-bold tracking-tight mb-1">
					Aún no tienes canchas
				</h2>
				<p className="text-sm text-ink-2 mb-5">
					Crea tu primera cancha en el tab Canchas y ahí le asignas horario a {league.name}.
				</p>
				<Button variant="primary" onClick={onDone}>
					Continuar sin cancha
				</Button>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			<h2 className="font-display text-2xl text-ink font-bold tracking-tight mb-1">
				Asigna horario
			</h2>
			<p className="text-sm text-ink-2 mb-5">
				{league.name} · {dayLabel} · {firstVenue.name}
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

				<div className="flex items-center justify-between">
					<p className="text-xs text-ink-3">Se asigna el {dayLabel} de cada semana.</p>
					<Button variant="primary" onClick={handleSubmit} disabled={assignSchedule.isPending}>
						{assignSchedule.isPending ? "Guardando…" : "Guardar y continuar"}
					</Button>
				</div>
			</div>
		</Card>
	);
}
