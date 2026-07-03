"use client";

/**
 * features/tournament-skin/ui/SkinAdminPanel.tsx
 *
 * Orquestador del panel /admin/temas: cablea hooks RQ ↔ componentes tontos.
 * Solo lo monta la page de admin tras verificar rol "owner".
 */

import { useDeleteSkinActivation, useToggleSkinActivation } from "../model/useActivationMutations";
import { useSkinActivations } from "../model/useSkinActivations";
import { ActivationForm } from "./ActivationForm";
import { ActivationsTable } from "./ActivationsTable";

export function SkinAdminPanel() {
	const activations = useSkinActivations();
	const toggle = useToggleSkinActivation();
	const remove = useDeleteSkinActivation();

	const isBusy = toggle.isPending || remove.isPending;
	const mutationError = toggle.error ?? remove.error;

	return (
		<div className="space-y-6 max-w-2xl">
			<ActivationForm />

			<section className="space-y-2">
				<h2 className="section-label">Temas programados</h2>
				{activations.isPending && <p className="text-sm text-ink-2">Cargando…</p>}
				{activations.isError && <p className="text-sm text-rose">{activations.error.message}</p>}
				{mutationError && <p className="text-sm text-rose">{mutationError.message}</p>}
				{activations.isSuccess && (
					<ActivationsTable
						activations={activations.data}
						isBusy={isBusy}
						onToggle={(id, isEnabled) => toggle.mutate({ id, isEnabled })}
						onDelete={(id) => remove.mutate({ id })}
					/>
				)}
			</section>
		</div>
	);
}
