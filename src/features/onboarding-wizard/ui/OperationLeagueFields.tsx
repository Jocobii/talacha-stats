"use client";

/**
 * features/onboarding-wizard/ui/OperationLeagueFields.tsx
 * Campos de liga del paso Operación. Componente tonto (recibe
 * register/control/errors de RHF por props); categoría se omite del
 * onboarding (se agrega después en /admin).
 */

import { Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { DAYS, type OnboardingLeagueInput } from "../model/onboarding-league-schema";

type Props = {
	register: UseFormRegister<OnboardingLeagueInput>;
	control: Control<OnboardingLeagueInput>;
	errors: FieldErrors<OnboardingLeagueInput>;
};

export function OperationLeagueFields({ register, control, errors }: Props) {
	return (
		<div className="flex flex-col gap-3">
			<Field label="Nombre de la liga" required error={errors.name?.message}>
				<Input placeholder="Ej. Premier" {...register("name")} />
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
		</div>
	);
}
