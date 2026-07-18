"use client";

/**
 * app/admin/teams/NewTeamButton.tsx
 *
 * Botón "+ Nuevo equipo" del header — abre CreateTeamModal (features/
 * team-management). Si el filtro "liga" del FilterBar ya tiene una liga
 * elegida, el modal la muestra fija; si el filtro está en "Todas las ligas"
 * (o solo hay una liga disponible), el modal pide la liga con un selector —
 * el botón ya no se deshabilita esperando que el usuario filtre primero
 * (confundía: no hay razón de negocio para bloquear el alta, la liga se
 * puede elegir dentro del propio modal).
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
	const filteredLeague = leagueOptions.find((l) => l.value === ligaId);
	// Con una sola liga disponible no hace falta elegir: se fija directo.
	const onlyLeague = leagueOptions.length === 1 ? leagueOptions[0] : undefined;
	const fixedLeague = filteredLeague ?? onlyLeague;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				disabled={leagueOptions.length === 0}
				title={leagueOptions.length === 0 ? "Crea una liga primero" : undefined}
				className="inline-flex items-center gap-1.5 bg-brand text-pitch text-sm font-semibold px-4 py-2 rounded-md hover:bg-brand-dim transition disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<Plus size={16} strokeWidth={2} /> Nuevo equipo
			</button>
			{open && (
				<CreateTeamModal
					leagueId={fixedLeague?.value}
					leagueName={fixedLeague?.label}
					leagueOptions={leagueOptions}
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
