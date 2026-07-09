"use client";

/**
 * app/admin/teams/LeagueFilter.tsx
 *
 * Select de liga que redirige al cambiar (URL param leagueId).
 * Es el único estado client-side en la página — el resto es Server Component.
 */

import { useRouter } from "next/navigation";

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

	function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const id = e.target.value;
		if (id) router.push(`/admin/teams?leagueId=${id}`);
		else router.push("/admin/teams");
	}

	return (
		<div className="bg-surface rounded-xl shadow p-5">
			<label className="block text-sm font-medium text-ink mb-2">Filtrar por liga</label>
			{leagues.length === 0 ? (
				<p className="text-sm text-yellow-600">No hay ligas registradas.</p>
			) : (
				<select
					value={selectedId}
					onChange={handleChange}
					className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:ring-2 focus:ring-brand focus:outline-none"
				>
					<option value="">— Todas las ligas —</option>
					{leagues.map((l) => (
						<option key={l.id} value={l.id}>
							{l.name} · {l.season} · {l.dayOfWeek}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
