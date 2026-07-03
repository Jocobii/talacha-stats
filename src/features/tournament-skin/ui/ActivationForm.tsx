"use client";

/**
 * features/tournament-skin/ui/ActivationForm.tsx
 *
 * Alta de una activación de tema. Stack estándar: RHF + zodResolver con el
 * schema client-safe; la escritura vive en useCreateSkinActivation.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { SKIN_IDS } from "@/shared/skins/registry";
import { ActivationFormSchema, type ActivationFormInput } from "../model/activation-form-schema";
import { useCreateSkinActivation } from "../model/useActivationMutations";
import { SkinPickerGrid } from "./SkinPickerGrid";

const INPUT_CLASS =
	"w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:opacity-50";

export function ActivationForm() {
	const createActivation = useCreateSkinActivation();
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<ActivationFormInput>({
		resolver: zodResolver(ActivationFormSchema),
		mode: "onBlur",
		defaultValues: { skinId: SKIN_IDS[0], name: "", startsOn: "", endsOn: "" },
	});

	function onValid(values: ActivationFormInput): void {
		createActivation.mutate(values, { onSuccess: () => reset() });
	}

	const isSubmitting = createActivation.isPending;

	return (
		<form onSubmit={handleSubmit(onValid)} className="surface-card p-5 space-y-4">
			<h2 className="section-label">Programar tema</h2>

			<div className="space-y-2">
				<p className="text-sm font-medium text-ink">Tema</p>
				<Controller
					control={control}
					name="skinId"
					render={({ field }) => (
						<SkinPickerGrid value={field.value} onChange={field.onChange} disabled={isSubmitting} />
					)}
				/>
				{errors.skinId && <p className="text-xs text-red-400">{errors.skinId.message}</p>}
			</div>

			<div className="space-y-1.5">
				<label htmlFor="activation-name" className="block text-sm font-medium text-ink">
					Nombre
				</label>
				<input
					id="activation-name"
					type="text"
					placeholder="Ej. Mundial 2026"
					disabled={isSubmitting}
					{...register("name")}
					className={INPUT_CLASS}
				/>
				{errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<label htmlFor="starts-on" className="block text-sm font-medium text-ink">
						Inicio
					</label>
					<input
						id="starts-on"
						type="date"
						disabled={isSubmitting}
						{...register("startsOn")}
						className={INPUT_CLASS}
					/>
					{errors.startsOn && <p className="text-xs text-red-400">{errors.startsOn.message}</p>}
				</div>
				<div className="space-y-1.5">
					<label htmlFor="ends-on" className="block text-sm font-medium text-ink">
						Fin
					</label>
					<input
						id="ends-on"
						type="date"
						disabled={isSubmitting}
						{...register("endsOn")}
						className={INPUT_CLASS}
					/>
					{errors.endsOn && <p className="text-xs text-red-400">{errors.endsOn.message}</p>}
				</div>
			</div>

			{createActivation.isError && (
				<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
					{createActivation.error.message}
				</p>
			)}

			<button type="submit" disabled={isSubmitting} className="btn-primary">
				{isSubmitting ? "Guardando…" : "Programar"}
			</button>
		</form>
	);
}
