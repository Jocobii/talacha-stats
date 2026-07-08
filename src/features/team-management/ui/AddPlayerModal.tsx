"use client";

/**
 * features/team-management/ui/AddPlayerModal.tsx
 *
 * Modal "Agregar jugador": busca por NOMBRE un jugador existente de la
 * organización y lo inscribe al equipo. NO crea jugadores nuevos — eso vive en
 * /admin/registro (shortcut en el panel de búsqueda). Orquestador ≤80 líneas
 * (§3.5): delega estado a useAddExistingPlayer y render a subcomponentes.
 */

import { Modal } from "@/shared/ui/Modal";
import { useAddExistingPlayer } from "../model/useAddExistingPlayer";
import { PlayerSearchPanel } from "./PlayerSearchPanel";
import { SelectedPlayerConfirm } from "./SelectedPlayerConfirm";

type LeagueLite = { id: string; name: string; season: string };

type Props = {
	league: LeagueLite;
	teamId: string;
	onSuccess: () => void;
	onClose: () => void;
};

export function AddPlayerModal({ league, teamId, onSuccess, onClose }: Props) {
	const s = useAddExistingPlayer(league.id, teamId, onSuccess);

	return (
		<Modal onClose={onClose} title="Agregar jugador" size="lg">
			<div className="p-5">
				{s.selected ? (
					<SelectedPlayerConfirm
						player={s.selected}
						dorsal={s.dorsal}
						onDorsalChange={s.setDorsal}
						onBack={() => s.setSelected(null)}
						onConfirm={s.submit}
						submitting={s.submitting}
						error={s.error}
					/>
				) : (
					<PlayerSearchPanel
						query={s.query}
						onQueryChange={s.setQuery}
						results={s.results}
						searching={s.searching}
						onSelect={s.setSelected}
						leagueId={league.id}
					/>
				)}
			</div>
		</Modal>
	);
}
