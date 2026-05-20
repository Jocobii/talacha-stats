"use client";

import { DAYS_FULL, parseTime, slotCount } from "./WeeklyGrid";
import type { VenueTimeWindow } from "@/entities/venue";

const HOUR_PX = 28;

export type DayColumnProps = {
	dayIdx: number;
	isActive: boolean;
	hours: number[];
	rangeStart: number;
	totalPx: number;
	windows: VenueTimeWindow[];
	slotDuration: number;
	onSlotClick: (day: string, hour: number) => void;
	onWindowClick: (w: VenueTimeWindow) => void;
};

export function DayColumn({
	dayIdx,
	isActive,
	hours,
	rangeStart,
	totalPx,
	windows,
	slotDuration,
	onSlotClick,
	onWindowClick,
}: DayColumnProps) {
	function handleColumnClick(e: React.MouseEvent<HTMLDivElement>) {
		const target = e.target as HTMLElement;
		if (target.closest("[data-window]")) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const hour = Math.floor((e.clientY - rect.top) / HOUR_PX) + rangeStart;
		onSlotClick(DAYS_FULL[dayIdx] ?? "lunes", hour);
	}

	return (
		<div
			className={`relative border-l border-line cursor-pointer ${isActive ? "bg-brand/[0.02]" : ""}`}
			style={{ height: totalPx }}
			onClick={handleColumnClick}
		>
			{hours.map((h) => (
				<div
					key={h}
					className="absolute left-0 right-0 border-t border-line pointer-events-none"
					style={{ top: (h - rangeStart) * HOUR_PX }}
				/>
			))}
			{windows.map((w) => (
				<WindowBlock
					key={w.id}
					window={w}
					rangeStart={rangeStart}
					slotDuration={slotDuration}
					onWindowClick={onWindowClick}
				/>
			))}
		</div>
	);
}

type WindowBlockProps = {
	window: VenueTimeWindow;
	rangeStart: number;
	slotDuration: number;
	onWindowClick: (w: VenueTimeWindow) => void;
};

function WindowBlock({ window: w, rangeStart, slotDuration, onWindowClick }: WindowBlockProps) {
	const top = (parseTime(w.startTime) - rangeStart) * HOUR_PX;
	const height = (parseTime(w.endTime) - parseTime(w.startTime)) * HOUR_PX;
	const slots = slotCount(w, slotDuration);

	return (
		<button
			data-window
			onClick={(e) => {
				e.stopPropagation();
				onWindowClick(w);
			}}
			className="absolute left-1 right-1 rounded-[3px] text-left overflow-hidden hover:brightness-110 transition-[filter]"
			style={{
				top,
				height,
				background: "rgba(0,230,118,0.18)",
				border: "1px solid #00E676",
				borderLeft: "3px solid #00E676",
			}}
		>
			<span
				className="block px-1 pt-0.5 text-[10px] font-bold text-brand leading-none"
				style={{ fontFamily: "var(--font-mono)" }}
			>
				{w.startTime}
			</span>
			{height > 36 && <span className="block px-1 text-[9px] text-ink-2">{slots} slots</span>}
			{height > 48 && (
				<span
					className="absolute bottom-1 left-1 text-[10px] font-bold text-brand"
					style={{ fontFamily: "var(--font-mono)" }}
				>
					{w.endTime}
				</span>
			)}
		</button>
	);
}
