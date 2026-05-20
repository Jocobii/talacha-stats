"use client";

/**
 * features/venue-calendar/ui/EventPopover.tsx
 * Popover de detalle posicionado inteligentemente junto al evento clicado.
 * Torneos → solo lectura. Rentas → botones Editar / Eliminar.
 */

import { useEffect, useRef, useState } from "react";
import {
	Trophy,
	User,
	Clock,
	DollarSign,
	StickyNote,
	Lock,
	PencilLine,
	Trash2,
} from "lucide-react";
import { RENTAL_STATUS_LABELS } from "../constants";
import type { VenueEvent } from "../types";

type Props = {
	event: VenueEvent | null;
	anchorEl: HTMLElement | null;
	isOpen: boolean;
	onClose: () => void;
	onEdit: (event: VenueEvent) => void;
	onDelete: (id: string) => Promise<void>;
};

function fmtTime(iso: string): string {
	return new Date(iso).toLocaleTimeString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function fmtDate(iso: string): string {
	return new Date(iso).toLocaleDateString("es-MX", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}

const STATUS_BADGE: Record<string, string> = {
	confirmed: "bg-emerald-500/15 text-emerald-400",
	tentative: "bg-amber-500/15  text-amber-400",
	cancelled: "bg-surface-2 text-ink-3",
};

export function EventPopover({ event, anchorEl, isOpen, onClose, onEdit, onDelete }: Props) {
	const popRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<{ left: number; top: number }>({ left: -9999, top: -9999 });

	// Smart positioning: prefer right of anchor, fall back to left if off-screen
	useEffect(() => {
		if (!anchorEl || !popRef.current || !isOpen) return;
		const a = anchorEl.getBoundingClientRect();
		const p = popRef.current.getBoundingClientRect();
		let left = a.right + 8;
		let top = a.top;
		if (left + p.width > window.innerWidth - 12) left = a.left - p.width - 8;
		if (left < 12) left = Math.max(12, a.left);
		if (top + p.height > window.innerHeight - 12) top = window.innerHeight - p.height - 12;
		if (top < 12) top = 12;
		setPos({ left, top });
	}, [anchorEl, isOpen, event]);

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (
				popRef.current &&
				!popRef.current.contains(e.target as Node) &&
				anchorEl &&
				!anchorEl.contains(e.target as Node)
			)
				onClose();
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		if (isOpen) {
			document.addEventListener("mousedown", onDoc);
			document.addEventListener("keydown", onKey);
		}
		return () => {
			document.removeEventListener("mousedown", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, [isOpen, anchorEl, onClose]);

	if (!isOpen || !event) return null;

	const isTournament = event.type === "tournament";
	const statusLabel = event.status
		? (RENTAL_STATUS_LABELS[event.status] ?? event.status)
		: "Torneo";
	const badgeCls = STATUS_BADGE[event.status ?? ""] ?? "bg-blue-500/15 text-blue-300";
	const durationMin = Math.round(
		(new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000,
	);

	async function handleDelete() {
		if (!event?.rentalId) return;
		if (!confirm(`¿Eliminar la renta "${event.title}"? Esta acción no se puede deshacer.`)) return;
		await onDelete(event.rentalId);
	}

	const iconBg = isTournament
		? "bg-blue-500/15 text-blue-300"
		: event.status === "confirmed"
			? "bg-emerald-500/18 text-emerald-300"
			: event.status === "tentative"
				? "bg-amber-500/18 text-amber-300"
				: "bg-surface-2 text-ink-3";

	return (
		<div
			ref={popRef}
			className="fixed z-50 w-[280px] rounded-xl border border-line overflow-hidden vcal-popover-enter"
			style={{
				left: pos.left,
				top: pos.top,
				background: "var(--color-surface)",
				boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
			}}
		>
			{/* Head */}
			<div className="p-3.5 pb-2.5 flex items-start gap-2.5 border-b border-line">
				<span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${iconBg}`}>
					{isTournament ? <Trophy size={15} /> : <User size={15} />}
				</span>
				<div className="flex-1 min-w-0">
					<div className="font-semibold text-sm text-ink truncate">
						{isTournament ? (event.leagueName ?? event.title) : (event.clientName ?? event.title)}
					</div>
					<div className="text-[11px] text-ink-2 mt-0.5 truncate">
						{isTournament ? event.title : `Renta · ${fmtDate(event.startAt)}`}
					</div>
				</div>
				<span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeCls}`}>
					{statusLabel}
				</span>
			</div>

			{/* Body */}
			<div className="px-3.5 py-3 flex flex-col gap-2 text-[12px]">
				<div className="flex gap-2 items-center text-ink-2">
					<Clock size={13} className="shrink-0 text-ink-3" />
					<span className="text-ink">
						{fmtTime(event.startAt)} → {fmtTime(event.endAt)}
					</span>
					<span>· {durationMin} min</span>
				</div>
				{isTournament && event.matchInfo && (
					<div className="flex gap-2 items-start text-ink-2">
						<Trophy size={13} className="shrink-0 mt-0.5 text-ink-3" />
						<span className="text-ink">{event.matchInfo}</span>
					</div>
				)}
				{!isTournament && event.price != null && event.price > 0 && (
					<div className="flex gap-2 items-center text-ink-2">
						<DollarSign size={13} className="shrink-0 text-ink-3" />
						<span className="text-ink">${event.price.toLocaleString("es-MX")}</span>
						<span className="text-ink-3">MXN</span>
					</div>
				)}
				{!isTournament && event.notes && (
					<div className="flex gap-2 items-start text-ink-2">
						<StickyNote size={13} className="shrink-0 mt-0.5 text-ink-3" />
						<span className="text-ink whitespace-pre-wrap">{event.notes}</span>
					</div>
				)}
			</div>

			{/* Footer */}
			{isTournament ? (
				<div
					className="flex items-center gap-1.5 px-3.5 py-2.5 border-t border-line text-[11px] text-ink-3"
					style={{ background: "rgba(255,255,255,0.01)" }}
				>
					<Lock size={11} /> Bloqueado por torneo — edita desde la liga
				</div>
			) : (
				<div
					className="flex gap-2 px-3 py-2.5 border-t border-line"
					style={{ background: "rgba(255,255,255,0.01)" }}
				>
					<button
						onClick={() => onEdit(event)}
						className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] border border-line text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
					>
						<PencilLine size={13} /> Editar
					</button>
					<button
						onClick={handleDelete}
						className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] transition-colors"
						style={{
							border: "1px solid rgba(239,68,68,0.3)",
							color: "#f87171",
							background: "rgba(239,68,68,0.05)",
						}}
					>
						<Trash2 size={13} /> Eliminar
					</button>
				</div>
			)}
		</div>
	);
}
