"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { VenueWithStats } from "@/entities/venue";

type DeleteVenueDialogProps = {
	venue: VenueWithStats;
	onClose: () => void;
	onDeleted: (id: string) => void;
};

type AffectedLeague = { id: string; name: string };

export function DeleteVenueDialog({ venue, onClose, onDeleted }: DeleteVenueDialogProps) {
	const [error, setError] = useState<string | null>(null);
	const [affected, setAffected] = useState<AffectedLeague[]>([]);
	const [isPending, startTransition] = useTransition();

	function handleDelete() {
		setError(null);
		startTransition(async () => {
			const res = await fetch(`/api/venues/${venue.id}`, { method: "DELETE" });
			const json = await res.json();
			if (!json.ok) {
				setError(json.error ?? "Error al eliminar");
				setAffected(json.affectedLeagues ?? []);
				return;
			}
			onDeleted(venue.id);
		});
	}

	return (
		<div
			className="fixed inset-0 bg-pitch/90 z-50 flex items-center justify-center p-6"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-[420px] max-w-full bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
				<div className="p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 grid place-items-center shrink-0">
							<Trash2 size={18} />
						</div>
						<div>
							<h2 className="text-[18px] font-bold text-ink">Eliminar cancha</h2>
							<p className="text-[12.5px] text-ink-3 mt-0.5">Esta acción no se puede deshacer.</p>
						</div>
					</div>

					<p className="text-[13.5px] text-ink-2 mb-4">
						¿Eliminar <strong className="text-ink">{venue.name}</strong>?
					</p>

					{error && (
						<div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg">
							<p className="text-[12.5px] text-red-400">{error}</p>
							{affected.length > 0 && (
								<ul className="mt-2 flex flex-col gap-0.5">
									{affected.map((l) => (
										<li
											key={l.id}
											className="text-[12px] text-red-300 before:content-['·_'] before:text-red-400"
										>
											{l.name}
										</li>
									))}
								</ul>
							)}
						</div>
					)}

					<div className="flex justify-end gap-2">
						<button
							onClick={onClose}
							className="px-4 py-2 text-[13px] font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 rounded-lg transition"
						>
							Cancelar
						</button>
						<button
							onClick={handleDelete}
							disabled={isPending}
							className="px-4 py-2 bg-red-500 text-white text-[13px] font-bold rounded-lg hover:bg-red-600 disabled:opacity-60 transition"
						>
							{isPending ? "Eliminando…" : "Sí, eliminar"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
