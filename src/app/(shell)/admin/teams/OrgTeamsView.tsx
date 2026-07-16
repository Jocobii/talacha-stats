/**
 * app/admin/teams/OrgTeamsView.tsx
 *
 * Presentación pura de la vista organizador (FilterBar + chips + tabla +
 * estados vacío-sin-datos / vacío-por-filtros). Recibe el view-model ya
 * armado por features/team-admin — no toca DB ni arma queries.
 * Espejo de app/admin/players/OrgPlayersView.tsx.
 */

import Link from "next/link";
import { Inbox, Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ActiveChip } from "@/shared/ui/filters";
import type { OrgTeamsView as OrgTeamsViewModel } from "@/features/team-admin";
import { TeamsFilterBar } from "./TeamsFilterBar";
import { TeamsTable } from "./TeamsTable";
import { NewTeamButton } from "./NewTeamButton";

export function OrgTeamsView({
	rows,
	total,
	unfilteredTotal,
	filtersActive,
	leagueOptions,
	chips,
	countLabel,
	pagination,
	sort,
}: OrgTeamsViewModel) {
	const showEmptyNoData = rows.length === 0 && !filtersActive && unfilteredTotal === 0;
	const showEmptyFiltered = rows.length === 0 && filtersActive;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Equipos"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
				actions={<NewTeamButton leagueOptions={leagueOptions} />}
			/>

			<div className="flex flex-col gap-3">
				<TeamsFilterBar leagueOptions={leagueOptions} />
				{chips.length > 0 && <ChipsRow chips={chips} />}
			</div>

			{showEmptyNoData ? (
				<EmptyState
					icon={Inbox}
					title="Aún no hay equipos en tu organización"
					description="Cuando se registren, aparecerán aquí."
					action={<NewTeamButton leagueOptions={leagueOptions} />}
				/>
			) : showEmptyFiltered ? (
				<EmptyState
					icon={SearchIcon}
					title="No se encontraron resultados con estos filtros"
					description="Prueba a quitar alguno de los filtros activos."
					action={
						<Link
							href="/admin/teams"
							className="h-9 px-4 inline-flex items-center rounded-md bg-surface-2 border border-line text-ink text-sm hover:border-ink-3 transition"
						>
							Limpiar filtros
						</Link>
					}
				/>
			) : (
				<TeamsTable
					variant="org"
					rows={rows}
					pagination={pagination}
					emptyMessage="No se encontraron resultados con estos filtros."
					countLabel={countLabel}
					sort={sort}
				/>
			)}
		</div>
	);
}

function ChipsRow({ chips }: { chips: OrgTeamsViewModel["chips"] }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((c) => (
				<ActiveChip key={c.key} label={c.label} href={c.href} />
			))}
			<Link
				href="/admin/teams"
				className="text-[12px] text-ink-3 hover:text-ink underline decoration-dotted underline-offset-2"
			>
				Limpiar todo
			</Link>
		</div>
	);
}
