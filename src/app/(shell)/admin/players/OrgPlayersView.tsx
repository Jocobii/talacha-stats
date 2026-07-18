/**
 * app/admin/players/OrgPlayersView.tsx
 *
 * Presentación pura de la vista organizador (FilterBar + chips + tabla +
 * estados vacío-sin-datos / vacío-por-filtros). Recibe el view-model ya
 * armado por features/player-admin — no toca DB ni arma queries.
 */

import Link from "next/link";
import { Inbox, Plus, Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ActiveChip } from "@/shared/ui/filters";
import type { OrgPlayersView as OrgPlayersViewModel } from "@/features/player-admin";
import type { OrganizationCredentialConfigDto } from "@/entities/organization-credential-config";
import { PlayersFilterBar } from "./PlayersFilterBar";
import { PlayersTable } from "./PlayersTable";

const NEW_PLAYER_LINK = (
	<Link
		href="/admin/registro"
		className="inline-flex items-center gap-1.5 bg-brand text-pitch text-sm font-semibold px-4 py-2 rounded-md hover:bg-brand-dim transition"
	>
		<Plus size={16} strokeWidth={2} /> Nuevo jugador
	</Link>
);

export function OrgPlayersView({
	rows,
	total,
	unfilteredTotal,
	filtersActive,
	leagueOptions,
	chips,
	countLabel,
	pagination,
	sort,
	credentialConfig,
}: OrgPlayersViewModel & { credentialConfig: OrganizationCredentialConfigDto }) {
	const showEmptyNoData = rows.length === 0 && !filtersActive && unfilteredTotal === 0;
	const showEmptyFiltered = rows.length === 0 && filtersActive;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Jugadores"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
				actions={NEW_PLAYER_LINK}
			/>

			<div className="flex flex-col gap-3">
				<PlayersFilterBar leagueOptions={leagueOptions} />
				{chips.length > 0 && <ChipsRow chips={chips} />}
			</div>

			{showEmptyNoData ? (
				<EmptyState
					icon={Inbox}
					title="Aún no hay jugadores en tu organización"
					description="Cuando se registren, aparecerán aquí."
					action={NEW_PLAYER_LINK}
				/>
			) : showEmptyFiltered ? (
				<EmptyState
					icon={SearchIcon}
					title="No se encontraron resultados con estos filtros"
					description="Prueba a quitar alguno de los filtros activos."
					action={
						<Link
							href="/admin/players"
							className="h-9 px-4 inline-flex items-center rounded-md bg-surface-2 border border-line text-ink text-sm hover:border-ink-3 transition"
						>
							Limpiar filtros
						</Link>
					}
				/>
			) : (
				<PlayersTable
					variant="org"
					rows={rows}
					pagination={pagination}
					emptyMessage="No se encontraron resultados con estos filtros."
					countLabel={countLabel}
					sort={sort}
					orgConfig={credentialConfig}
				/>
			)}
		</div>
	);
}

function ChipsRow({ chips }: { chips: OrgPlayersViewModel["chips"] }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((c) => (
				<ActiveChip key={c.key} label={c.label} href={c.href} />
			))}
			<Link
				href="/admin/players"
				className="text-[12px] text-ink-3 hover:text-ink underline decoration-dotted underline-offset-2"
			>
				Limpiar todo
			</Link>
		</div>
	);
}
