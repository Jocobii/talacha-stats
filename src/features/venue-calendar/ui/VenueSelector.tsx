"use client";

/**
 * features/venue-calendar/ui/VenueSelector.tsx
 * Dropdown personalizado de selección de cancha — diseño nuevo.
 */

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import type { VenueSummary } from "../types";

type Props = {
	venues: VenueSummary[];
	selectedId: string;
	onChange: (id: string) => void;
	disabled?: boolean;
};

export function VenueSelector({ venues, selectedId, onChange, disabled }: Props) {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef<HTMLDivElement>(null);

	const selected = venues.find((v) => v.id === selectedId) ?? venues[0];

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	return (
		<div ref={wrapRef} className="relative min-w-[280px]">
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen((o) => !o)}
				className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-line text-sm text-left transition-colors hover:border-ink-3 disabled:opacity-50 disabled:cursor-not-allowed"
				style={{ background: "var(--color-surface-2)" }}
			>
				<span
					className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
					style={{ background: "rgba(0,230,118,0.1)" }}
				>
					<MapPin size={14} className="text-brand-ink" />
				</span>
				<span className="flex-1 min-w-0">
					<span className="block font-semibold text-ink truncate">{selected?.name ?? "—"}</span>
					{selected?.city && (
						<span className="block text-[11px] text-ink-2 truncate">{selected.city}</span>
					)}
				</span>
				<ChevronDown
					size={15}
					className="text-ink-2 shrink-0 transition-transform"
					style={{ transform: open ? "rotate(180deg)" : undefined }}
				/>
			</button>

			{open && (
				<div
					className="absolute left-0 right-0 top-full mt-1.5 rounded-[10px] border border-line overflow-hidden z-20"
					style={{ background: "var(--color-surface)", boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
				>
					{venues.map((v) => (
						<button
							key={v.id}
							type="button"
							className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-surface-2"
							style={{ background: v.id === selectedId ? "rgba(0,230,118,0.06)" : undefined }}
							onClick={() => {
								onChange(v.id);
								setOpen(false);
							}}
						>
							<span>
								<span className="block font-semibold text-ink">{v.name}</span>
								{v.city && <span className="block text-[11px] text-ink-2 mt-0.5">{v.city}</span>}
							</span>
							{v.id === selectedId && <Check size={14} className="text-brand-ink shrink-0" />}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
