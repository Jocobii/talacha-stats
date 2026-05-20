"use client";

import { MapPin, MoreHorizontal, Calendar, Pencil, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { VenueWithStats } from "@/entities/venue";

type VenueCardProps = {
	venue: VenueWithStats;
	onEdit: (v: VenueWithStats) => void;
	onDelete: (v: VenueWithStats) => void;
	onDuplicate: (v: VenueWithStats) => void;
};

export function VenueCard({ venue, onEdit, onDelete, onDuplicate }: VenueCardProps) {
	const inUse = venue.ligasCount > 0;
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e: MouseEvent) => {
			if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	return (
		<article className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
			{/* Color stripe */}
			<div style={{ height: 6, background: venue.color, opacity: 0.85 }} />

			<div className="p-4 flex flex-col gap-0 flex-1">
				{/* Header */}
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<h3
							className="text-[22px] leading-none tracking-tight font-bold text-ink"
							style={{ fontFamily: "var(--font-display)" }}
						>
							{venue.name}
						</h3>
						{(venue.address ?? venue.city) && (
							<p className="flex items-center gap-1 mt-2 text-[12px] text-ink-2 truncate">
								<MapPin size={11} className="text-ink-3 shrink-0" />
								{venue.address ?? venue.city}
							</p>
						)}
					</div>
					<div className="relative shrink-0" ref={menuRef}>
						<button
							onClick={() => setMenuOpen((o) => !o)}
							className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition"
							aria-label="Acciones"
						>
							<MoreHorizontal size={16} />
						</button>
						{menuOpen && (
							<VenueMenu
								venue={venue}
								onEdit={onEdit}
								onDelete={onDelete}
								onDuplicate={onDuplicate}
								onClose={() => setMenuOpen(false)}
							/>
						)}
					</div>
				</div>

				{/* Divider */}
				<div className="h-px bg-line my-3.5" />

				{/* Stats row */}
				<div className="flex items-center gap-4">
					<StatNum label="Ligas" value={venue.ligasCount} accent={inUse} />
					<StatNum label="Ventanas" value={venue.totalWindows} accent={false} />
					<div className="ml-auto">
						{inUse ? (
							<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
								● En uso
							</span>
						) : (
							<span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-2 border border-line text-ink-3">
								Sin asignar
							</span>
						)}
					</div>
				</div>

				{/* League pills */}
				{inUse && (
					<div className="mt-3.5 flex flex-wrap gap-1.5">
						{venue.ligas.map((l) => (
							<span
								key={l.id}
								className="text-[11px] px-2 py-0.5 rounded bg-surface-2 border border-line text-ink-2"
							>
								{l.name}
							</span>
						))}
					</div>
				)}
			</div>
		</article>
	);
}

function StatNum({ label, value, accent }: { label: string; value: number; accent: boolean }) {
	return (
		<div>
			<p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">{label}</p>
			<div className="flex items-baseline gap-1 mt-1">
				<span
					className={`text-[22px] leading-none font-black ${accent ? "text-brand" : "text-ink"}`}
					style={{ fontFamily: "var(--font-display)" }}
				>
					{value}
				</span>
				<span className="text-[11px] text-ink-3">{label === "Ligas" ? "activas" : "slots"}</span>
			</div>
		</div>
	);
}

function VenueMenu({
	venue,
	onEdit,
	onDelete,
	onDuplicate,
	onClose,
}: VenueCardProps & { onClose: () => void }) {
	const actions = [
		{
			label: "Editar",
			icon: Pencil,
			onClick: () => {
				onEdit(venue);
				onClose();
			},
		},
		{
			label: "Duplicar",
			icon: Copy,
			onClick: () => {
				onDuplicate(venue);
				onClose();
			},
		},
		{ label: "Ver calendario", icon: Calendar, href: "/admin/venues/calendar" },
		{
			label: "Eliminar",
			icon: Trash2,
			onClick: () => {
				onDelete(venue);
				onClose();
			},
			danger: true,
		},
	];

	return (
		<div className="absolute right-0 top-full mt-1 w-44 bg-surface-2 border border-line rounded-xl shadow-2xl z-20 overflow-hidden py-1">
			{actions.map((a) =>
				a.href ? (
					<Link
						key={a.label}
						href={a.href}
						className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-2 hover:bg-surface hover:text-ink transition"
					>
						<a.icon size={13} /> {a.label}
					</Link>
				) : (
					<button
						key={a.label}
						onClick={a.onClick}
						className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition ${a.danger ? "text-red-400 hover:bg-red-500/10" : "text-ink-2 hover:bg-surface hover:text-ink"}`}
					>
						<a.icon size={13} /> {a.label}
					</button>
				),
			)}
		</div>
	);
}

/** Tile "Registrar cancha" al final del grid */
export function AddVenueTile({ onClick }: { onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className="bg-transparent border border-dashed border-line rounded-xl min-h-[200px] flex flex-col items-center justify-center gap-2.5 text-ink-2 hover:border-brand/40 hover:bg-brand/5 transition group"
		>
			<span className="w-10 h-10 rounded-full bg-brand/10 text-brand grid place-items-center group-hover:bg-brand/20 transition">
				<span className="text-xl font-bold leading-none">+</span>
			</span>
			<span className="text-[13.5px] font-semibold text-ink">Registrar cancha</span>
			<span className="text-[12px] text-ink-3">Nombre, dirección, notas</span>
		</button>
	);
}
