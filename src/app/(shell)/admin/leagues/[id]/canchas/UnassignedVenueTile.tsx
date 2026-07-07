"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { Venue } from "@/entities/venue";

type UnassignedVenueTileProps = {
	venue: Venue;
	leagueId: string;
	onAssigned: (v: Venue) => void;
};

export function UnassignedVenueTile({ venue, leagueId, onAssigned }: UnassignedVenueTileProps) {
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleAssign() {
		setError(null);
		startTransition(async () => {
			const res = await fetch(`/api/leagues/${leagueId}/venues`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ venueId: venue.id }),
			});
			const json = await res.json();
			if (!json.ok) {
				setError(json.error ?? "Error al asignar");
				return;
			}
			onAssigned(venue);
		});
	}

	return (
		<div className="bg-surface border border-line rounded-lg px-3.5 py-3 flex items-center gap-3">
			<div className="w-1 h-7 rounded-sm shrink-0" style={{ background: venue.color }} />
			<div className="flex-1 min-w-0">
				<p className="text-[14px] font-semibold text-ink truncate">{venue.name}</p>
				{venue.address && (
					<p className="text-[11.5px] text-ink-3 truncate mt-0.5">{venue.address}</p>
				)}
				{error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
			</div>
			<button
				onClick={handleAssign}
				disabled={isPending}
				className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-brand-ink border border-brand/30 rounded-lg hover:bg-brand/10 disabled:opacity-60 transition shrink-0"
			>
				<Plus size={12} /> {isPending ? "…" : "Asignar"}
			</button>
		</div>
	);
}
