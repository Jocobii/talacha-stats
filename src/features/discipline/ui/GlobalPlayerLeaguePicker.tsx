"use client";

/**
 * features/discipline/ui/GlobalPlayerLeaguePicker.tsx
 * Jugador + Liga de "Registrar sanción" en modo global (B7b) — flujo
 * invertido: se busca al jugador primero (org/owner-wide) y la liga se
 * deriva de sus membresías. Si juega en varias, se elige entre ellas; si
 * solo en una, se autoselecciona pero el campo "Liga" se muestra igual (para
 * que quede claro a qué liga pertenece la sanción, en vez de ocultarlo).
 *
 * Ligas donde el jugador ya tiene una sanción activa se muestran pero NO son
 * seleccionables (badge "Ya sancionado", fila deshabilitada) — no tiene
 * sentido duplicar la sanción. Si su única liga ya está sancionada, no hay
 * nada que elegir y se muestra un aviso explícito en vez de dejar el
 * selector vacío sin explicación.
 */

import { Ban } from "lucide-react";
import { Field } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { DisciplinePlayerSearchResult } from "@/entities/suspension";
import { PlayerSearchAutocomplete } from "./PlayerSearchAutocomplete";

export function GlobalPlayerLeaguePicker({
	selectedPlayer,
	onSelectPlayer,
	leagueId,
	onChooseLeague,
}: {
	selectedPlayer: DisciplinePlayerSearchResult | null;
	onSelectPlayer: (p: DisciplinePlayerSearchResult) => void;
	leagueId: string;
	onChooseLeague: (id: string) => void;
}) {
	const memberships = selectedPlayer?.memberships ?? [];
	const allSuspended = memberships.length > 0 && memberships.every((m) => m.hasActiveSuspension);

	return (
		<>
			<Field label="Jugador" required>
				<PlayerSearchAutocomplete selected={selectedPlayer} onSelect={onSelectPlayer} />
			</Field>

			{memberships.length > 0 && (
				<Field
					label="Liga"
					required
					hint={
						allSuspended
							? "Ya tiene una sanción activa en todas sus ligas — no se puede registrar otra."
							: memberships.length > 1
								? "Juega en varias ligas — elige en cuál aplica la sanción"
								: undefined
					}
				>
					<div className="flex flex-col gap-1.5">
						{memberships.map((m) => {
							const isSelected = m.leagueId === leagueId;
							return (
								<button
									key={m.leagueId}
									type="button"
									disabled={m.hasActiveSuspension}
									onClick={() => onChooseLeague(m.leagueId)}
									className={cn(
										"w-full flex items-center justify-between gap-3 h-9 px-3 rounded-md border text-sm text-left transition",
										m.hasActiveSuspension
											? "bg-surface-2/50 border-line text-ink-3 cursor-not-allowed opacity-70"
											: isSelected
												? "bg-brand/10 border-brand/50 text-ink"
												: "bg-surface-2 border-line text-ink hover:border-ink-3",
									)}
								>
									<span className="truncate">
										{m.leagueName} <span className="text-ink-3">— {m.teamName}</span>
									</span>
									{m.hasActiveSuspension && (
										<span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 shrink-0">
											<Ban size={12} strokeWidth={2.25} /> Ya sancionado
										</span>
									)}
								</button>
							);
						})}
					</div>
				</Field>
			)}
		</>
	);
}
