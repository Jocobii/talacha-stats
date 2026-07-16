"use client";

/**
 * features/discipline/ui/PlayerAutocompleteField.tsx
 *
 * Campo "Jugador" de "Registrar sanción" — autocomplete con búsqueda
 * server-side (useLeagueRosterForDiscipline): muestra los primeros 10
 * jugadores de la liga y filtra en vivo mientras el usuario escribe
 * (debounce 300ms, mismo patrón que
 * team-management/model/useAddExistingPlayer.ts). Reemplaza el Listbox con
 * TODO el roster cargado de una vez — impracticable de desplazar en ligas
 * grandes, y no dejaba claro que hay más jugadores fuera de la vista; el
 * hint fijo debajo del input soluciona justamente eso.
 */

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { SuspensionRosterPlayer } from "@/entities/suspension";
import { useLeagueRosterForDiscipline } from "../model/useLeagueRosterForDiscipline";

const DEBOUNCE_MS = 300;

export function PlayerAutocompleteField({
	leagueId,
	selected,
	onSelect,
	disabled,
}: {
	leagueId: string | null;
	selected: SuspensionRosterPlayer | null;
	onSelect: (p: SuspensionRosterPlayer) => void;
	disabled?: boolean;
}) {
	const [draft, setDraft] = useState("");
	const [debounced, setDebounced] = useState("");
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { data: roster, isFetching } = useLeagueRosterForDiscipline(leagueId, debounced);
	const results = roster ?? [];

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

	function select(p: SuspensionRosterPlayer) {
		onSelect(p);
		setDraft("");
		setDebounced("");
		setOpen(false);
	}

	const displayValue = open ? draft : selected ? `${selected.fullName} — ${selected.teamName}` : "";

	return (
		<div className={cn("relative", disabled && "opacity-50 pointer-events-none")} ref={ref}>
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
					disabled={disabled}
					className="w-full h-9 rounded-md bg-surface-2 border border-line pl-9 pr-8 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition"
				/>
				{isFetching && (
					<Loader2
						size={14}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-ink-3"
					/>
				)}
			</div>

			<p className="mt-1.5 text-[11.5px] text-ink-3 px-0.5">
				Se muestran los primeros 10 — si no aparece, escribe su nombre para buscarlo.
			</p>

			{open && (
				<ul className="absolute z-30 top-[calc(100%+2px)] left-0 w-full max-h-56 overflow-auto bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-1.5">
					{results.length === 0 ? (
						<li className="px-2.5 py-2 text-[13px] text-ink-3">
							{isFetching ? "Buscando…" : "Sin resultados"}
						</li>
					) : (
						results.map((p) => {
							const isSelected = selected?.globalPlayerId === p.globalPlayerId;
							return (
								<li
									key={p.globalPlayerId}
									onClick={() => select(p)}
									className={cn(
										"flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] cursor-pointer transition hover:bg-surface-2",
										isSelected ? "text-brand" : "text-ink",
									)}
								>
									<span className="w-4 h-4 grid place-items-center shrink-0">
										{isSelected && <Check size={13} strokeWidth={3} />}
									</span>
									<span className="truncate">
										{p.fullName} <span className="text-ink-3">— {p.teamName}</span>
									</span>
								</li>
							);
						})
					)}
				</ul>
			)}
		</div>
	);
}
