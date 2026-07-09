"use client";

/**
 * features/arranque-onboarding/ui/StepVenue.tsx
 * Paso 1 — cancha obligatoria (mínimo 1, se pueden agregar más).
 *
 * Campos plegables simples (ciudad/dirección/capacidad/color/notas): no se
 * reutiliza VenueFormFields.tsx porque vive en app/(shell)/admin/canchas y
 * §3.1 prohíbe `features → app`.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { WizardFooter } from "./WizardShared";
import { CreateVenueSchema, type CreateVenueInput } from "@/types";
import { useCreateVenueStep } from "../model/useCreateVenueStep";
import type { CreatedVenueView } from "../types";

type Props = {
	organizationId: string;
	createdVenues: CreatedVenueView[];
	onVenueCreated: (venue: CreatedVenueView) => void;
	onContinue: () => void;
};

export function StepVenue({ organizationId, createdVenues, onVenueCreated, onContinue }: Props) {
	const [showMore, setShowMore] = useState(false);
	const createVenue = useCreateVenueStep(organizationId);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateVenueInput>({
		resolver: zodResolver(CreateVenueSchema),
		mode: "onBlur",
		defaultValues: { organizationId, name: "", capacity: 1, color: "#60A5FA" },
	});

	function onValid(values: CreateVenueInput) {
		createVenue.mutate(values, {
			onSuccess: (venue) => {
				onVenueCreated(venue);
				reset({ organizationId, name: "", capacity: 1, color: "#60A5FA" });
			},
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-6">
				<h3 className="font-display text-[22px] text-ink font-bold tracking-tight mb-1">
					Registra tu primera cancha
				</h3>
				<p className="text-sm text-ink-2 mb-5">
					Aquí se jugarán los partidos y de aquí saldrán los horarios.
				</p>

				<form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
					<Field label="Nombre de la cancha" required error={errors.name?.message}>
						<Input autoFocus placeholder="Ej. Gamorin" {...register("name")} />
					</Field>

					{!showMore ? (
						<button
							type="button"
							onClick={() => setShowMore(true)}
							className="text-sm text-brand-ink hover:underline self-start"
						>
							+ Más opciones (ciudad, dirección, notas)
						</button>
					) : (
						<div className="grid grid-cols-2 gap-3">
							<Field label="Ciudad">
								<Input placeholder="Guadalajara" {...register("city")} />
							</Field>
							<Field label="Dirección">
								<Input placeholder="Av. Lázaro Cárdenas 1245" {...register("address")} />
							</Field>
							<Field label="Capacidad" hint="canchas paralelas">
								<Input
									type="number"
									min={1}
									max={6}
									{...register("capacity", { valueAsNumber: true })}
								/>
							</Field>
							<Field label="Color" hint="visible en el sorteo">
								<Input type="color" className="h-9 w-full p-1" {...register("color")} />
							</Field>
						</div>
					)}

					{createVenue.isError && (
						<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
							{createVenue.error.message}
						</p>
					)}

					<Button
						type="submit"
						variant="secondary"
						icon={Plus}
						disabled={createVenue.isPending}
						className="self-start"
					>
						{createVenue.isPending ? "Guardando…" : "Agregar cancha"}
					</Button>
				</form>
			</Card>

			{createdVenues.length > 0 && (
				<Card className="p-5">
					<p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-ink-3 mb-3">
						Canchas registradas
					</p>
					<ul className="flex flex-col gap-2">
						{createdVenues.map((venue) => (
							<li key={venue.id} className="flex items-center gap-2 text-sm text-ink">
								<Check size={16} strokeWidth={3} className="text-brand-ink shrink-0" />
								<span
									className="w-3 h-3 rounded-full shrink-0"
									style={{ background: venue.color }}
								/>
								{venue.name}
							</li>
						))}
					</ul>
				</Card>
			)}

			<WizardFooter
				leftHint={
					createdVenues.length === 0
						? "Registra al menos una cancha para continuar."
						: `${createdVenues.length} cancha${createdVenues.length !== 1 ? "s" : ""} lista${createdVenues.length !== 1 ? "s" : ""}`
				}
				primary={
					<Button variant="primary" onClick={onContinue} disabled={createdVenues.length === 0}>
						Continuar
					</Button>
				}
			/>
		</div>
	);
}
