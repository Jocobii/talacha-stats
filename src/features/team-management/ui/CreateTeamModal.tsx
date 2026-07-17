"use client";

/**
 * features/team-management/ui/CreateTeamModal.tsx
 *
 * Modal de alta de equipo. Componente de presentación sobre el stack estándar:
 *   - React Hook Form + zodResolver(TeamFormSchema) → validación declarativa con
 *     el MISMO schema client-safe, sin `useState`-soup ni validación a mano.
 *   - useCreateTeam (TanStack Query) → mutación con loading/error/invalidación.
 * No hace `fetch` ni mapea: delega el POST y el estado al hook. Al éxito devuelve
 * control al padre con `onSuccess`.
 *
 * Liga: si el padre ya sabe a qué liga pertenece el equipo (`leagueId` fijo —
 * ej. onboarding de liga), se muestra de solo lectura. Si no (ej. NewTeamButton
 * cuando el filtro "Todas las ligas" está activo), se pasa `leagueOptions` y el
 * modal pide la liga con un selector — el botón que abre el modal ya no
 * necesita estar deshabilitado sin una liga preseleccionada.
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/shared/ui/Modal";
import type { FilterOption } from "@/shared/ui/filters";
import { COLOR_PRESETS } from "../constants";
import { TeamFormSchema, type TeamFormInput } from "../model/team-form-schema";
import { useCreateTeam } from "../model/useCreateTeam";

type Props = {
	/** Liga fija — si se pasa, se muestra de solo lectura (sin selector). */
	leagueId?: string;
	leagueName?: string;
	/** Opciones para el selector de liga — requerido si no hay `leagueId` fijo. */
	leagueOptions?: FilterOption[];
	onSuccess: () => void;
	onClose: () => void;
};

export function CreateTeamModal({
	leagueId,
	leagueName,
	leagueOptions,
	onSuccess,
	onClose,
}: Props) {
	const [pickedLeagueId, setPickedLeagueId] = useState("");
	const activeLeagueId = leagueId ?? pickedLeagueId;

	const createTeam = useCreateTeam(activeLeagueId);

	const {
		register,
		handleSubmit,
		control,
		watch,
		formState: { errors },
	} = useForm<TeamFormInput>({
		resolver: zodResolver(TeamFormSchema),
		mode: "onBlur",
		defaultValues: { name: "", color: "" },
	});

	function onValid(values: TeamFormInput) {
		if (!activeLeagueId) return;
		createTeam.mutate(values, { onSuccess });
	}

	const name = watch("name");
	const isSubmitting = createTeam.isPending;

	return (
		<Modal onClose={onClose} title="Nuevo equipo" size="sm">
			<form onSubmit={handleSubmit(onValid)} className="p-5 space-y-5">
				{/* Liga */}
				{leagueId ? (
					<div className="bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm">
						<span className="text-ink-3 text-xs">Liga</span>
						<p className="font-medium text-ink truncate">{leagueName}</p>
					</div>
				) : (
					<div className="space-y-1.5">
						<label htmlFor="team-league" className="block text-sm font-medium text-ink">
							Liga
						</label>
						<select
							id="team-league"
							value={pickedLeagueId}
							onChange={(e) => setPickedLeagueId(e.target.value)}
							disabled={isSubmitting}
							className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:opacity-50"
						>
							<option value="" disabled>
								Elige una liga…
							</option>
							{leagueOptions?.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Nombre */}
				<div className="space-y-1.5">
					<label htmlFor="team-name" className="block text-sm font-medium text-ink">
						Nombre del equipo
					</label>
					<input
						id="team-name"
						autoFocus
						type="text"
						maxLength={100}
						disabled={isSubmitting}
						placeholder="Ej. Deportivo FC"
						{...register("name")}
						className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:opacity-50"
					/>
					{errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
				</div>

				{/* Color (opcional) */}
				<div className="space-y-2">
					<p className="text-sm font-medium text-ink">
						Color del equipo <span className="text-ink-3 font-normal">(opcional)</span>
					</p>
					<Controller
						control={control}
						name="color"
						render={({ field }) => (
							<div className="flex flex-wrap gap-2 items-center">
								{COLOR_PRESETS.map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => field.onChange(field.value === c ? "" : c)}
										disabled={isSubmitting}
										className="w-7 h-7 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 disabled:opacity-50"
										style={{
											backgroundColor: c,
											borderColor: field.value === c ? "white" : "transparent",
											boxShadow: field.value === c ? `0 0 0 2px ${c}` : "none",
										}}
										aria-label={`Color ${c}`}
										aria-pressed={field.value === c}
									/>
								))}
								{field.value && (
									<button
										type="button"
										onClick={() => field.onChange("")}
										disabled={isSubmitting}
										className="text-xs text-ink-3 hover:text-ink transition px-2 py-1 rounded border border-line"
									>
										Quitar
									</button>
								)}
							</div>
						)}
					/>
				</div>

				{/* Error de la API */}
				{createTeam.isError && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{createTeam.error.message}
					</p>
				)}

				{/* Acciones */}
				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="flex-1 bg-surface-2 text-ink py-2.5 rounded-lg text-sm font-medium hover:bg-surface-2/80 transition disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSubmitting || !name.trim() || !activeLeagueId}
						className="flex-1 bg-brand text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand/90 transition disabled:opacity-40"
					>
						{isSubmitting ? "Creando…" : "Crear equipo"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
