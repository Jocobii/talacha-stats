"use client";

/**
 * features/tournament-skin/ui/ActivationsTable.tsx
 *
 * Tabla de activaciones. Componente tonto (§7.3): recibe ViewModels +
 * callbacks por props; cero fetch, cero mapeo, cero regla de negocio.
 */

import type { SkinActivationView } from "../types";
import { SkinPreview } from "./SkinPreview";

type ActivationsTableProps = {
	activations: SkinActivationView[];
	isBusy: boolean;
	onToggle: (id: string, isEnabled: boolean) => void;
	onDelete: (id: string) => void;
};

function LiveBadge() {
	return <span className="chip brand">EN VIVO</span>;
}

function ActivationRow({
	activation,
	isBusy,
	onToggle,
	onDelete,
}: { activation: SkinActivationView } & Omit<ActivationsTableProps, "activations">) {
	return (
		<li className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line last:border-b-0">
			<div className="min-w-0 flex items-center gap-3">
				<SkinPreview skinId={activation.skinId} compact className="shrink-0" />
				<div className="min-w-0">
					<p className="text-sm font-medium text-ink truncate">
						{activation.name} {activation.isLive && <LiveBadge />}
					</p>
					<p className="text-xs text-ink-2">
						{activation.skinLabel} · {activation.dateRangeLabel}
						{activation.isOrphan && (
							<span className="text-amber"> · skin ya no existe en el catálogo</span>
						)}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<button
					type="button"
					disabled={isBusy}
					onClick={() => onToggle(activation.id, !activation.isEnabled)}
					className="btn-ghost"
					aria-pressed={activation.isEnabled}
				>
					{activation.isEnabled ? "Apagar" : "Encender"}
				</button>
				<button
					type="button"
					disabled={isBusy}
					onClick={() => onDelete(activation.id)}
					className="btn-ghost text-rose"
				>
					Borrar
				</button>
			</div>
		</li>
	);
}

export function ActivationsTable({
	activations,
	isBusy,
	onToggle,
	onDelete,
}: ActivationsTableProps) {
	if (activations.length === 0) {
		return (
			<p className="text-sm text-ink-2 px-4 py-6 text-center">
				No hay temas programados. La app usa la paleta TalachaStats.
			</p>
		);
	}

	return (
		<ul className="surface-card overflow-hidden">
			{activations.map((activation) => (
				<ActivationRow
					key={activation.id}
					activation={activation}
					isBusy={isBusy}
					onToggle={onToggle}
					onDelete={onDelete}
				/>
			))}
		</ul>
	);
}
