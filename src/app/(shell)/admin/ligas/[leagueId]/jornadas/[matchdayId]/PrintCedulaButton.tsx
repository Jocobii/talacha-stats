"use client";

/**
 * PrintCedulaButton.tsx
 * Botón "Imprimir cédulas" del encabezado de la jornada — abre un picker con
 * checkboxes (decisión de Jocobi, docs/PLAN-CEDULA-IMPRESA.md §12.1) y manda
 * a `/cedula/jornada/[matchdayId]?matches=id1,id2` en pestaña nueva. Solo se
 * monta cuando la jornada ya está publicada (gate en page.tsx, §12.3).
 */

import { useState } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/shared/ui";

export type PrintableMatch = {
	id: string;
	cedula: string | null;
	homeTeamName: string;
	awayTeamName: string;
};

export function PrintCedulaButton({
	matchdayId,
	matches,
}: {
	matchdayId: string;
	matches: PrintableMatch[];
}) {
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<Set<string>>(() => new Set(matches.map((m) => m.id)));

	function toggle(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function handlePrint() {
		if (selected.size === 0) return;
		const url = `/cedula/jornada/${matchdayId}?matches=${Array.from(selected).join(",")}`;
		window.open(url, "_blank", "noopener,noreferrer");
		setOpen(false);
	}

	if (matches.length === 0) return null;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-md border border-line bg-surface-2 text-ink-2 hover:text-brand-ink hover:border-brand/40 transition-colors"
			>
				<Printer size={13} strokeWidth={2} />
				Imprimir cédulas
			</button>

			{open && (
				<Modal onClose={() => setOpen(false)} title="Imprimir cédulas de la jornada" size="sm">
					<div className="p-5 space-y-3">
						<p className="text-xs text-ink-3">
							Elige los partidos a imprimir. Se abren en una pestaña nueva, una hoja por partido,
							listas para Ctrl+P.
						</p>
						<div className="space-y-1 max-h-72 overflow-y-auto">
							{matches.map((m) => (
								<label
									key={m.id}
									className="flex items-center gap-2 text-sm text-ink-2 py-1.5 px-1 rounded hover:bg-surface-2 cursor-pointer"
								>
									<input
										type="checkbox"
										checked={selected.has(m.id)}
										onChange={() => toggle(m.id)}
										className="accent-brand"
									/>
									<span className="font-mono text-[11px] text-ink-3 w-16 shrink-0">
										{m.cedula ?? "—"}
									</span>
									<span className="truncate">
										{m.homeTeamName} <span className="text-ink-3">vs</span> {m.awayTeamName}
									</span>
								</label>
							))}
						</div>
						<div className="flex items-center justify-between pt-2 border-t border-line">
							<button
								type="button"
								onClick={() => setSelected(new Set(matches.map((m) => m.id)))}
								className="text-xs font-semibold text-brand-ink hover:text-brand-dim"
							>
								Elegir todos
							</button>
							<button
								type="button"
								onClick={handlePrint}
								disabled={selected.size === 0}
								className="bg-brand hover:bg-brand-dim disabled:opacity-40 disabled:cursor-not-allowed text-pitch text-sm font-bold px-4 py-2 rounded transition-colors"
							>
								Imprimir{selected.size > 0 ? ` (${selected.size})` : ""}
							</button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
}
