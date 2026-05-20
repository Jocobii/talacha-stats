"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { VenueCard, AddVenueTile } from "./VenueCard";
import { CanchasToolbar } from "./CanchasToolbar";
import { NewVenueModal } from "./NewVenueModal";
import { DeleteVenueDialog } from "./DeleteVenueDialog";
import { VenueListView } from "./VenueListView";
import type { VenueWithStats } from "@/entities/venue";

type ViewMode = "cards" | "list";
type ModalState =
	| { type: "none" }
	| { type: "create" }
	| { type: "edit"; venue: VenueWithStats }
	| { type: "delete"; venue: VenueWithStats };

type CanchasClientProps = {
	venues: VenueWithStats[];
	organizationId: string;
};

export function CanchasClient({ venues: initial, organizationId }: CanchasClientProps) {
	const [venues, setVenues] = useState<VenueWithStats[]>(initial);
	const [query, setQuery] = useState("");
	const [view, setView] = useState<ViewMode>("cards");
	const [modal, setModal] = useState<ModalState>({ type: "none" });

	const filtered = useMemo(
		() =>
			venues.filter(
				(v) =>
					v.name.toLowerCase().includes(query.toLowerCase()) ||
					(v.address ?? "").toLowerCase().includes(query.toLowerCase()),
			),
		[venues, query],
	);
	console.log(venues);
	const inUseCount = venues.filter((v) => v.ligasCount > 0).length;
	const totalWindows = venues.reduce((s, v) => s + v.totalWindows, 0);
	const uniqueLeagues = new Set(venues.flatMap((v) => v.ligas?.map((l) => l.id)))?.size;

	function handleSuccess(updated: VenueWithStats) {
		setVenues((prev) => {
			const idx = prev.findIndex((v) => v.id === updated.id);
			return idx >= 0 ? prev.with(idx, updated) : [updated, ...prev];
		});
		setModal({ type: "none" });
	}

	function handleDeleted(id: string) {
		setVenues((prev) => prev.filter((v) => v.id !== id));
		setModal({ type: "none" });
	}

	return (
		<div>
			{/* Page header */}
			<div className="flex items-start justify-between gap-4 mb-6">
				<div>
					<h1
						className="text-[32px] leading-none font-black tracking-tight text-ink"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Canchas
					</h1>
					<p className="text-[13px] text-ink-2 mt-2">
						Pool de canchas de tu organización. Asígnalas a una liga desde el módulo de sorteo.
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Link
						href="/admin/venues/calendar"
						className="flex items-center gap-1.5 h-9 px-3 text-[13px] font-semibold text-ink-2 hover:text-ink border border-line rounded-lg hover:bg-surface transition"
					>
						<CalendarDays size={14} /> Ver calendario
					</Link>
					<button
						onClick={() => setModal({ type: "create" })}
						className="flex items-center gap-1.5 h-9 px-3 bg-brand text-pitch text-[13px] font-bold rounded-lg hover:bg-brand-dim transition"
					>
						+ Nueva cancha
					</button>
				</div>
			</div>

			{/* Stats strip */}
			<div className="grid grid-cols-4 gap-3 mb-5">
				<StatTile label="Canchas registradas" value={String(venues.length)} />
				<StatTile
					label="En uso"
					value={String(inUseCount)}
					sub={`activas en ${uniqueLeagues} ligas`}
					accent
				/>
				<StatTile
					label="Sin asignar"
					value={String(venues.length - inUseCount)}
					sub="no usadas hoy"
				/>
				<StatTile label="Ventanas totales" value={String(totalWindows)} sub="slots semanales" />
			</div>

			<CanchasToolbar query={query} view={view} onQueryChange={setQuery} onViewChange={setView} />

			{view === "cards" ? (
				<div className="grid grid-cols-3 gap-3.5">
					{filtered.map((v) => (
						<VenueCard
							key={v.id}
							venue={v}
							onEdit={(venue) => setModal({ type: "edit", venue })}
							onDelete={(venue) => setModal({ type: "delete", venue })}
							onDuplicate={() => setModal({ type: "create" })}
						/>
					))}
					<AddVenueTile onClick={() => setModal({ type: "create" })} />
				</div>
			) : (
				<VenueListView
					venues={filtered}
					onEdit={(v) => setModal({ type: "edit", venue: v })}
					onDelete={(v) => setModal({ type: "delete", venue: v })}
				/>
			)}

			{(modal.type === "create" || modal.type === "edit") && (
				<NewVenueModal
					organizationId={organizationId}
					modalMode={
						modal.type === "edit" ? { mode: "edit", venue: modal.venue } : { mode: "create" }
					}
					onClose={() => setModal({ type: "none" })}
					onSuccess={handleSuccess}
				/>
			)}
			{modal.type === "delete" && (
				<DeleteVenueDialog
					venue={modal.venue}
					onClose={() => setModal({ type: "none" })}
					onDeleted={handleDeleted}
				/>
			)}
		</div>
	);
}

function StatTile({
	label,
	value,
	sub,
	accent,
}: {
	label: string;
	value: string;
	sub?: string;
	accent?: boolean;
}) {
	return (
		<div className="bg-surface border border-line rounded-xl px-4 py-3.5">
			<p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-3">{label}</p>
			<p
				className={`text-[36px] leading-none font-black mt-2 ${accent ? "text-brand" : "text-ink"}`}
				style={{ fontFamily: "var(--font-display)" }}
			>
				{value}
			</p>
			{sub && <p className="text-[11.5px] text-ink-2 mt-1.5">{sub}</p>}
		</div>
	);
}
