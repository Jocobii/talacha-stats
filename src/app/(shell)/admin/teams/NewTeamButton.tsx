"use client";

/**
 * app/admin/teams/NewTeamButton.tsx
 *
 * Botón "+ Nuevo equipo" del header — abre CreateTeamModal (features/
 * team-management) para la liga actualmente seleccionada en el FilterBar.
 * La creación de equipo requiere una liga (constraint de negocio: un equipo
 * pertenece a exactamente una liga) — con la lista ahora agregada por
 * organización (multi-liga), el botón se deshabilita hasta que el usuario
 * elija una liga en el filtro.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { CreateTeamModal } from "@/features/team-management";
import type { FilterOption } from "@/shared/ui/filters";

export function NewTeamButton({ leagueOptions }: { leagueOptions: FilterOption[] }) {
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(false);

	const ligaId = searchParams.get("liga") ?? "";
	const league = leagueOptions.find((l) => l.value === ligaId);

	return (
		<>
			<button
				type="button"
				onClick={() => league && setOpen(true)}
				disabled={!league}
				title={league ? undefined : "Elige una liga en el filtro para crear un equipo"}
				className="inline-flex items-center gap-1.5 bg-brand text-pitch text-sm font-semibold px-4 py-2 rounded-md hover:bg-brand-dim transition disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<Plus size={16} strokeWidth={2} /> Nuevo equipo
			</button>
			{open && league && (
				<CreateTeamModal
					leagueId={league.value}
					leagueName={league.label}
					onSuccess={() => {
						setOpen(false);
						window.location.reload();
					}}
					onClose={() => setOpen(false)}
				/>
			)}
		</>
	);
}
