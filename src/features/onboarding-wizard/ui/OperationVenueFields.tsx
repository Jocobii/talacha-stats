"use client";

/**
 * features/onboarding-wizard/ui/OperationVenueFields.tsx
 * Campos de cancha del paso Operación. Componente tonto (recibe register +
 * errors de RHF por props); ciudad/dirección quedan plegadas para mantener
 * la fricción mínima (capacidad/color/notas se dejan en su default — no se
 * piden en el onboarding).
 */

import { useState } from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import type { CreateVenueInput } from "@/types";

type Props = {
	register: UseFormRegister<CreateVenueInput>;
	errors: FieldErrors<CreateVenueInput>;
};

export function OperationVenueFields({ register, errors }: Props) {
	const [showMore, setShowMore] = useState(false);

	return (
		<div className="flex flex-col gap-3">
			<Field label="Nombre de la cancha" required error={errors.name?.message}>
				<Input placeholder="Ej. Cancha Premier" {...register("name")} />
			</Field>

			{!showMore ? (
				<button
					type="button"
					onClick={() => setShowMore(true)}
					className="text-sm text-brand-ink hover:underline self-start"
				>
					+ Más opciones (ciudad, dirección)
				</button>
			) : (
				<div className="grid grid-cols-2 gap-3">
					<Field label="Ciudad">
						<Input placeholder="Tijuana" {...register("city")} />
					</Field>
					<Field label="Dirección">
						<Input placeholder="Blvd. …" {...register("address")} />
					</Field>
				</div>
			)}
		</div>
	);
}
