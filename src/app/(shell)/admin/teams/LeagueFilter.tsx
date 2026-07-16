"use client";

/**
 * app/admin/teams/LeagueFilter.tsx
 *
 * Select de liga que redirige al cambiar (URL param leagueId).
 * Es el único estado client-side en la página — el resto es Server Component.
 */

import { useRouter } from "next/navigation";
import { Listbox } from "@/shared/ui/Listbox";

export type LeagueOption = {
	id: string;
	name: string;
	season: string;
	dayOfWeek: string;
};

export function LeagueFilter({
	leagues,
	selectedId,
}: {
	leagues: LeagueOption[];
	selectedId: string;
}) {
	const router = useRouter();

	function handleChange(id: string) {
		if (id) router.push(`/admin/teams?leagueId=${id}`);
		else router.push("/admin/teams");
	}

	return (
		<div className="bg-surface rounded-xl shadow p-5">
			<label className="block text-sm font-medium text-ink mb-2">Filtrar por liga</label>
			{leagues.length === 0 ? (
				<p className="text-sm text-yellow-600">No hay ligas registradas.</p>
			) : (
				<Listbox
					value={selectedId}
					onChange={handleChange}
					options={leagues.map((l) => ({
						value: l.id,
						label: `${l.name} · ${l.season} · ${l.dayOfWeek}`,
					}))}
					placeholder="— Todas las ligas —"
					aria-label="Filtrar por liga"
				/>
			)}
		</div>
	);
}
