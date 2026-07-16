/**
 * app/admin/teams/OwnerTeamsView.tsx
 *
 * Presentación pura de la vista owner (todos los equipos de la plataforma,
 * sin scope de organización). Recibe el view-model ya armado por
 * features/team-admin — no toca DB ni arma queries.
 * Espejo de app/admin/players/OwnerPlayersView.tsx.
 */

import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import type { OwnerTeamsView as OwnerTeamsViewModel } from "@/features/team-admin";
import { TeamsTable } from "./TeamsTable";

export function OwnerTeamsView({
	rows,
	total,
	search,
	pagination,
	countLabel,
}: OwnerTeamsViewModel) {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Todos los equipos"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
			/>

			<form method="get" action="/admin/teams" className="flex gap-2">
				<div className="relative flex-1 max-w-sm">
					<SearchIcon
						size={15}
						strokeWidth={1.75}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
					/>
					<input
						type="search"
						name="q"
						defaultValue={search}
						placeholder="Buscar equipo por nombre…"
						className="w-full h-9 rounded-md bg-surface-2 border border-line pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
					/>
				</div>
				<button
					type="submit"
					className="h-9 px-4 rounded-md bg-surface-2 border border-line text-ink-2 text-sm hover:bg-surface"
				>
					Buscar
				</button>
			</form>

			<TeamsTable
				variant="owner"
				rows={rows}
				pagination={pagination}
				emptyMessage={
					search
						? `No se encontraron equipos con "${search}".`
						: "No hay equipos registrados en el sistema."
				}
				countLabel={countLabel}
			/>
		</div>
	);
}
