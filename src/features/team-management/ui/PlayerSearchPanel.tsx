"use client";

/**
 * features/team-management/ui/PlayerSearchPanel.tsx
 * Buscador por nombre + resultados. Estados: pista inicial, cargando, lista,
 * y "sin resultados" con shortcut a la ventanilla de registro (crear nuevo).
 */

import Link from "next/link";
import { Search, Loader2, UserPlus, ArrowRight } from "lucide-react";
import { Input } from "@/shared/ui/Input";
import { Avatar } from "@/shared/ui/Avatar";
import { REGISTRO_URL } from "../constants";
import type { OrgPlayerSearchResult } from "../types";

type Props = {
	query: string;
	onQueryChange: (v: string) => void;
	results: OrgPlayerSearchResult[];
	searching: boolean;
	onSelect: (p: OrgPlayerSearchResult) => void;
	leagueId: string;
};

function initials(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return fullName.slice(0, 2).toUpperCase();
}

export function PlayerSearchPanel({
	query,
	onQueryChange,
	results,
	searching,
	onSelect,
	leagueId,
}: Props) {
	const q = query.trim();
	const showEmpty = q.length >= 2 && !searching && results.length === 0;

	return (
		<div className="flex flex-col gap-3">
			<Input
				autoFocus
				icon={Search}
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
				placeholder="Buscar jugador por nombre…"
				aria-label="Buscar jugador por nombre"
			/>

			{q.length < 2 && (
				<p className="text-xs text-ink-3 px-1">Escribe al menos 2 letras para buscar.</p>
			)}

			{searching && (
				<div className="flex items-center gap-2 text-sm text-ink-3 px-1 py-2">
					<Loader2 size={16} className="animate-spin text-brand-ink" />
					Buscando…
				</div>
			)}

			{results.length > 0 && (
				<ul className="flex flex-col divide-y divide-line rounded-lg border border-line overflow-hidden">
					{results.map((p) => (
						<ResultRow key={p.globalPlayerId} player={p} onSelect={onSelect} />
					))}
				</ul>
			)}

			{showEmpty && (
				<p className="text-sm text-ink-2 px-1">
					No se encontró ningún jugador registrado con ese nombre.
				</p>
			)}

			<CreateShortcut leagueId={leagueId} emphasized={showEmpty} />
		</div>
	);
}

function ResultRow({
	player,
	onSelect,
}: {
	player: OrgPlayerSearchResult;
	onSelect: (p: OrgPlayerSearchResult) => void;
}) {
	const disabled = player.alreadyInLeagueTeam;
	return (
		<li>
			<button
				type="button"
				disabled={disabled}
				onClick={() => onSelect(player)}
				className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-surface-2/40 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Avatar initials={initials(player.fullName)} size="sm" />
				<span className="flex-1 min-w-0">
					<span className="block text-[14px] font-medium text-ink truncate">{player.fullName}</span>
					<span className="block text-[11px] text-ink-3">{player.birthDate}</span>
				</span>
				{disabled && <span className="text-[11px] text-ink-3 shrink-0">Ya en un equipo</span>}
				{!disabled && player.hasAnyLeagueMembership && (
					<span className="text-[11px] text-ink-3 shrink-0">Ya jugó en otra liga</span>
				)}
			</button>
		</li>
	);
}

function CreateShortcut({ leagueId, emphasized }: { leagueId: string; emphasized: boolean }) {
	return (
		<Link
			href={REGISTRO_URL(leagueId)}
			className={`group flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm transition ${
				emphasized
					? "border-brand/40 bg-brand/5 text-ink"
					: "border-line text-ink-2 hover:border-ink-3 hover:text-ink"
			}`}
		>
			<UserPlus size={16} strokeWidth={2} className="text-brand-ink" />
			<span className="flex-1">¿No lo encuentras? Crear jugador nuevo</span>
			<ArrowRight
				size={15}
				strokeWidth={2}
				className="text-ink-3 group-hover:translate-x-0.5 transition"
			/>
		</Link>
	);
}
