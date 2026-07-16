"use client";

/**
 * features/discipline/ui/PlayerSearchAutocomplete.tsx
 * Buscador de jugador por nombre, org/owner-wide (scope resuelto
 * server-side por sesión) — paso 1 de "Registrar sanción" en modo global
 * (B7b): invierte el flujo anterior (elegir liga → roster de esa liga) para
 * que escribir el nombre sea el primer paso, más rápido cuando ya se sabe a
 * quién se sanciona. Debounce 300ms, mínimo 2 letras — mismo patrón que
 * team-management/ui/PlayerSearchPanel.tsx.
 */

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Ban } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { DisciplinePlayerSearchResult } from "@/entities/suspension";
import { usePlayerSearchForDiscipline } from "../model/usePlayerSearchForDiscipline";

const DEBOUNCE_MS = 300;

export function PlayerSearchAutocomplete({
	selected,
	onSelect,
}: {
	selected: DisciplinePlayerSearchResult | null;
	onSelect: (p: DisciplinePlayerSearchResult) => void;
}) {
	const [draft, setDraft] = useState("");
	const [debounced, setDebounced] = useState("");
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const q = debounced.trim();
	const { data, isFetching } = usePlayerSearchForDiscipline(q);
	const results = data ?? [];

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	function handleChange(value: string) {
		setDraft(value);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
	}

	function select(p: DisciplinePlayerSearchResult) {
		onSelect(p);
		setDraft("");
		setDebounced("");
		setOpen(false);
	}

	const displayValue = open ? draft : (selected?.fullName ?? "");

	return (
		<div className="relative" ref={ref}>
			<div className="relative">
				<Search
					size={15}
					strokeWidth={1.75}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
				/>
				<input
					value={displayValue}
					onFocus={() => setOpen(true)}
					onChange={(e) => handleChange(e.target.value)}
					placeholder="Buscar jugador por nombre…"
					className="w-full h-9 rounded-md bg-surface-2 border border-line pl-9 pr-8 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition"
				/>
				{isFetching && (
					<Loader2
						size={14}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-ink-3"
					/>
				)}
			</div>

			{q.length < 2 && !selected && (
				<p className="mt-1.5 text-[11.5px] text-ink-3 px-0.5">
					Escribe al menos 2 letras para buscar.
				</p>
			)}

			{open && q.length >= 2 && (
				<ul className="absolute z-30 top-[calc(100%+2px)] left-0 w-full max-h-56 overflow-auto bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-1.5">
					{results.length === 0 ? (
						<li className="px-2.5 py-2 text-[13px] text-ink-3">
							{isFetching ? "Buscando…" : "Sin resultados"}
						</li>
					) : (
						results.map((p) => <ResultRow key={p.globalPlayerId} player={p} onSelect={select} />)
					)}
				</ul>
			)}
		</div>
	);
}

/**
 * Fila de resultado — resumen en vez de listar cada liga (con 4-5 ligas el
 * nombre completo de cada una + "(sancionado)" no cabe / no se lee).
 * "N ligas" a secas, o "sancionado en X de N" en rojo si aplica.
 */
function ResultRow({
	player,
	onSelect,
}: {
	player: DisciplinePlayerSearchResult;
	onSelect: (p: DisciplinePlayerSearchResult) => void;
}) {
	const total = player.memberships.length;
	const suspendedCount = player.memberships.filter((m) => m.hasActiveSuspension).length;
	const allSuspended = suspendedCount === total;

	return (
		<li
			onClick={() => onSelect(player)}
			className="px-2.5 py-2 rounded text-[13px] cursor-pointer transition hover:bg-surface-2 text-ink"
		>
			<span className="flex items-center gap-1.5 truncate">
				{player.fullName}
				{allSuspended && (
					<span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-red-400 shrink-0">
						<Ban size={11} strokeWidth={2.25} /> Ya sancionado
					</span>
				)}
			</span>
			<span className="block text-[11px] text-ink-3 truncate">
				{total} liga{total !== 1 ? "s" : ""}
				{suspendedCount > 0 && !allSuspended && (
					<span className={cn("text-red-400/80")}>
						{" "}
						· sancionado en {suspendedCount} de {total}
					</span>
				)}
			</span>
		</li>
	);
}
