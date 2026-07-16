/**
 * app/(shell)/admin/leagues/LeaguesView.tsx
 *
 * Presentación pura de /admin/leagues (FilterBar + chips + tabla + estados
 * vacío-sin-datos / vacío-por-filtros). Recibe el view-model ya armado por
 * features/league-admin — no toca DB ni arma queries.
 * Espejo de app/admin/teams/OrgTeamsView.tsx.
 */

import Link from "next/link";
import { Inbox, Plus, Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ActiveChip } from "@/shared/ui/filters";
import { Button } from "@/shared/ui/Button";
import type { LeaguesViewModel } from "@/features/league-admin";
import { LeaguesFilterBar } from "./LeaguesFilterBar";
import { LeaguesTable } from "./LeaguesTable";

function NewLeagueButton() {
	return (
		<Link href="/admin/leagues/new">
			<Button icon={Plus}>Nueva liga</Button>
		</Link>
	);
}

export function LeaguesView({
	rows,
	total,
	unfilteredTotal,
	filtersActive,
	chips,
	countLabel,
	pagination,
	sort,
}: LeaguesViewModel) {
	const showEmptyNoData = rows.length === 0 && !filtersActive && unfilteredTotal === 0;
	const showEmptyFiltered = rows.length === 0 && filtersActive;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Ligas"
				meta={
					total > 0 ? (
						<span className="font-mono text-[13px] text-ink-2">{countLabel}</span>
					) : undefined
				}
				actions={<NewLeagueButton />}
			/>

			<div className="flex flex-col gap-3">
				<LeaguesFilterBar />
				{chips.length > 0 && <ChipsRow chips={chips} />}
			</div>

			{showEmptyNoData ? (
				<EmptyState
					icon={Inbox}
					title="Aún no hay ligas"
					description="Crea la primera liga para empezar a capturar jornadas."
					action={<NewLeagueButton />}
				/>
			) : showEmptyFiltered ? (
				<EmptyState
					icon={SearchIcon}
					title="No se encontraron resultados con estos filtros"
					description="Prueba a quitar alguno de los filtros activos."
					action={
						<Link
							href="/admin/leagues"
							className="h-9 px-4 inline-flex items-center rounded-md bg-surface-2 border border-line text-ink text-sm hover:border-ink-3 transition"
						>
							Limpiar filtros
						</Link>
					}
				/>
			) : (
				<LeaguesTable
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

function ChipsRow({ chips }: { chips: LeaguesViewModel["chips"] }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((c) => (
				<ActiveChip key={c.key} label={c.label} href={c.href} />
			))}
			<Link
				href="/admin/leagues"
				className="text-[12px] text-ink-3 hover:text-ink underline decoration-dotted underline-offset-2"
			>
				Limpiar todo
			</Link>
		</div>
	);
}
