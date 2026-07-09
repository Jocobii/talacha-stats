"use client";

/**
 * features/arranque-onboarding/ui/StepLeague.tsx
 * Paso 2 — crear la liga. RHF + zodResolver(ArranqueLeagueSchema); el server
 * (/api/leagues/quick-create) es la fuente de verdad y su error (incluye
 * LEAGUE_EXISTS) se muestra tal cual (§7.2).
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { WizardFooter } from "./WizardShared";
import {
	ArranqueLeagueSchema,
	type ArranqueLeagueInput,
	DAYS,
	defaultSeason,
} from "../model/arranque-league-schema";
import { useCreateLeagueStep } from "../model/useCreateLeagueStep";
import type { CreatedLeagueView } from "../types";

type Props = { onLeagueReady: (league: CreatedLeagueView) => void };

export function StepLeague({ onLeagueReady }: Props) {
	const [showCategory, setShowCategory] = useState(false);
	const createLeague = useCreateLeagueStep();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<ArranqueLeagueInput>({
		resolver: zodResolver(ArranqueLeagueSchema),
		mode: "onBlur",
		defaultValues: { name: "", season: defaultSeason(), category: "" },
	});

	function onValid(values: ArranqueLeagueInput) {
		createLeague.mutate(values, { onSuccess: onLeagueReady });
	}

	return (
		<Card className="p-6">
			<h3 className="font-display text-[22px] text-ink font-bold tracking-tight mb-1">
				Crea tu primera liga
			</h3>
			<p className="text-sm text-ink-2 mb-5">Equipos y jugadores se agregan después.</p>

			<form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
				<Field label="Nombre de la liga" required error={errors.name?.message}>
					<Input autoFocus placeholder="Liga Brillante" {...register("name")} />
				</Field>

				<Field
					label="Día de juego"
					required
					error={errors.dayOfWeek ? "Elige el día de juego." : undefined}
				>
					<Controller
						control={control}
						name="dayOfWeek"
						render={({ field }) => (
							<div className="flex gap-1.5">
								{DAYS.map((d) => {
									const active = field.value === d.value;
									return (
										<button
											key={d.value}
											type="button"
											onClick={() => field.onChange(d.value)}
											aria-pressed={active}
											className={[
												"flex-1 text-sm py-2 rounded-lg border transition-colors",
												active
													? "bg-brand/15 border-brand/40 text-brand-ink font-semibold"
													: "border-line text-ink-2 hover:border-brand/30",
											].join(" ")}
										>
											{d.label}
										</button>
									);
								})}
							</div>
						)}
					/>
				</Field>

				<Field label="Temporada" required error={errors.season?.message} hint="Lo llenamos por ti.">
					<Input {...register("season")} />
				</Field>

				{!showCategory ? (
					<button
						type="button"
						onClick={() => setShowCategory(true)}
						className="text-sm text-brand-ink hover:underline self-start"
					>
						+ Agregar categoría
					</button>
				) : (
					<Field label="Categoría">
						<Input placeholder="Libre, Femenil, Mixto…" {...register("category")} />
					</Field>
				)}

				{createLeague.isError && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{createLeague.error.message}
					</p>
				)}

				<WizardFooter
					leftHint="Se crea junto con la cédula de la liga."
					primary={
						<Button type="submit" variant="primary" disabled={createLeague.isPending}>
							{createLeague.isPending ? "Creando…" : "Crear liga"}
						</Button>
					}
				/>
			</form>
		</Card>
	);
}
