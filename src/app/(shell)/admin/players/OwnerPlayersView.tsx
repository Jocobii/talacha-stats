/**
 * app/admin/players/OwnerPlayersView.tsx
 *
 * Presentación pura de la vista owner (todos los global_players, sin scope
 * de organización). Recibe el view-model ya armado por
 * features/player-admin — no toca DB ni arma queries.
 */

import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import type { OwnerPlayersView as OwnerPlayersViewModel } from "@/features/player-admin";
import { PlayersTable } from "./PlayersTable";

export function OwnerPlayersView({
	rows,
	total,
	search,
	pagination,
	countLabel,
}: OwnerPlayersViewModel) {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Todos los jugadores"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
			/>

			<form method="get" action="/admin/players" className="flex gap-2">
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
						placeholder="Buscar jugador por nombre…"
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

			<PlayersTable
				variant="owner"
				rows={rows}
				pagination={pagination}
				emptyMessage={
					search
						? `No se encontraron jugadores con "${search}".`
						: "No hay jugadores registrados en el sistema."
				}
				countLabel={countLabel}
			/>
		</div>
	);
}
