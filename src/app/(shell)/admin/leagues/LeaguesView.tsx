"use client";

/**
 * app/(shell)/admin/leagues/LeaguesView.tsx
 *
 * Vista de Ligas rediseñada: tabla (AdminTable, antes tarjetas) con columnas
 * Liga · Día · Temporada · Equipos · Estado — espejo de OwnerTeamsView /
 * OwnerPlayersView. El buscador es solo UI por ahora (no filtra) — se conecta
 * cuando se defina el contrato de filtros de esta vista.
 *
 * Las "Temporadas anteriores" viven en un acordeón colapsado por default:
 * menos ruido visual cuando hay muchas temporadas cerradas en el histórico.
 */

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { AdminTable } from "@/shared/ui/AdminTable";
import { LEAGUE_COLUMNS } from "./leaguesColumns";

export type LeagueRow = {
	id: string;
	name: string;
	dayOfWeek: string;
	season: string;
	status: string;
	teams: unknown[];
	organization?: { name: string } | null;
};

function ViewAction({ leagueId }: { leagueId: string }) {
	return (
		<Link
			href={`/admin/leagues/${leagueId}`}
			className="text-xs px-2.5 py-1 rounded-lg border border-brand/30 text-brand-ink hover:bg-brand/10 font-medium transition"
		>
			Ver
		</Link>
	);
}

export function LeaguesView({
	city,
	active,
	finished,
}: {
	city: string;
	active: LeagueRow[];
	finished: LeagueRow[];
}) {
	const [showFinished, setShowFinished] = useState(false);
	const [search, setSearch] = useState("");

	const activeSeasons = new Set(active.map((l) => l.season));
	const currentSeason = activeSeasons.size === 1 ? active[0]?.season : null;
	const allSeasons = new Set([...active, ...finished].map((l) => l.season));

	if (active.length === 0 && finished.length === 0) {
		return (
			<div>
				<PageHeader title="Ligas" subtitle={city} />
				<div className="bg-surface rounded-xl shadow p-12 text-center border border-line mt-6">
					<p className="text-4xl mb-4">⚽</p>
					<p className="text-ink-2 font-medium mb-1">No hay ligas en {city}</p>
					<p className="text-ink-3 text-sm mb-6">Crea la primera liga para esta ciudad</p>
					<Link href="/admin/leagues/new">
						<Button icon={Plus}>Crear liga</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Ligas"
				subtitle={`${active.length} ligas activas · ${allSeasons.size} temporadas en el histórico`}
				meta={
					currentSeason ? (
						<span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
							<span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_6px_rgba(0,230,118,0.5)]" />
							Temporada {currentSeason}
						</span>
					) : undefined
				}
				actions={
					<>
						<Button variant="secondary" icon={SlidersHorizontal}>
							Filtrar
						</Button>
						<Link href="/admin/leagues/new">
							<Button icon={Plus}>Nueva liga</Button>
						</Link>
					</>
				}
			/>

			<section>
				<div className="flex items-center justify-between mb-2">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
						Ligas activas{currentSeason ? ` — ${currentSeason}` : ""}
					</p>
					<div className="relative w-[226px]">
						<Search
							size={15}
							strokeWidth={1.75}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
						/>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar liga…"
							aria-label="Buscar liga"
							className="w-full h-9 rounded-md bg-surface-2 border border-line pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition"
						/>
					</div>
				</div>

				{active.length === 0 ? (
					<div className="bg-surface rounded-xl shadow p-8 text-center border border-line">
						<p className="text-ink-2 font-medium mb-1">No hay ligas activas</p>
						<p className="text-ink-3 text-sm mb-4">Todas las ligas han terminado su temporada</p>
						<Link href="/admin/leagues/new">
							<Button icon={Plus}>Crear nueva liga</Button>
						</Link>
					</div>
				) : (
					<AdminTable
						columns={LEAGUE_COLUMNS}
						rows={active}
						getKey={(l) => l.id}
						actions={(l) => <ViewAction leagueId={l.id} />}
						emptyMessage="No hay ligas activas."
					/>
				)}
			</section>

			{finished.length > 0 && (
				<section>
					<button
						type="button"
						onClick={() => setShowFinished((v) => !v)}
						className="w-full flex items-center justify-between px-1 py-2 text-sm text-ink-2 hover:text-ink transition"
					>
						<span className="inline-flex items-center gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
							{finished.length} {finished.length === 1 ? "liga" : "ligas"} sin temporada activa
						</span>
						{showFinished ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
					</button>
					{showFinished && (
						<div className="mt-2">
							<AdminTable
								columns={LEAGUE_COLUMNS}
								rows={finished}
								getKey={(l) => l.id}
								actions={(l) => <ViewAction leagueId={l.id} />}
								emptyMessage="No hay temporadas anteriores."
							/>
						</div>
					)}
				</section>
			)}
		</div>
	);
}
