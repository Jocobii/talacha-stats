"use client";

import { DayColumn } from "./WeeklyGridColumns";
import type { VenueTimeWindow } from "@/entities/venue";

const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DAYS_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const HOUR_PX = 28;

type WeeklyGridProps = {
	windows: VenueTimeWindow[];
	dayOfWeek: string;
	slotDuration: number;
	onSlotClick: (day: string, hour: number) => void;
	onWindowClick: (w: VenueTimeWindow) => void;
};

export function parseTime(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return (h ?? 0) + (m ?? 0) / 60;
}

export function slotCount(w: VenueTimeWindow, duration: number): number {
	const minutes = (parseTime(w.endTime) - parseTime(w.startTime)) * 60;
	return Math.max(0, Math.floor(minutes / duration));
}

function computeRange(windows: VenueTimeWindow[]): [number, number] {
	if (windows.length === 0) return [7, 23];
	const starts = windows.map((w) => Math.floor(parseTime(w.startTime)));
	const ends = windows.map((w) => Math.ceil(parseTime(w.endTime)));
	return [Math.max(0, Math.min(...starts) - 1), Math.min(24, Math.max(...ends) + 1)];
}

function groupByDay(windows: VenueTimeWindow[]): Record<number, VenueTimeWindow[]> {
	const byDay: Record<number, VenueTimeWindow[]> = {};
	for (const w of windows) {
		const idx = DAYS_FULL.indexOf(w.dayOfWeek);
		if (idx < 0) continue;
		if (!byDay[idx]) byDay[idx] = [];
		byDay[idx]!.push(w);
	}
	return byDay;
}

export function WeeklyGrid({
	windows,
	dayOfWeek,
	slotDuration,
	onSlotClick,
	onWindowClick,
}: WeeklyGridProps) {
	const activeDayIdx = DAYS_FULL.indexOf(dayOfWeek);
	const [rangeStart, rangeEnd] = computeRange(windows);
	const hours: number[] = [];
	for (let h = rangeStart; h < rangeEnd; h++) hours.push(h);
	const totalPx = hours.length * HOUR_PX;
	const byDay = groupByDay(windows);

	return (
		<div
			className="border border-line rounded-lg overflow-hidden"
			style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)" }}
		>
			<div className="h-7 border-b border-line bg-surface" />
			{DAYS_SHORT.map((d, i) => (
				<div
					key={d}
					className={`h-7 flex items-center justify-center text-[11px] font-semibold tracking-wide uppercase border-b border-l border-line ${i === activeDayIdx ? "text-brand-ink bg-brand/5" : "text-ink-3 bg-surface"}`}
				>
					{d}
				</div>
			))}
			<div className="bg-surface">
				{hours.map((h) => (
					<div
						key={h}
						className="flex items-start justify-end pr-1.5 pt-0.5 border-t border-line text-ink-3"
						style={{ height: HOUR_PX, fontFamily: "var(--font-mono)", fontSize: 9.5 }}
					>
						{String(h).padStart(2, "0")}:00
					</div>
				))}
			</div>
			{DAYS_SHORT.map((_, dayIdx) => (
				<DayColumn
					key={dayIdx}
					dayIdx={dayIdx}
					isActive={dayIdx === activeDayIdx}
					hours={hours}
					rangeStart={rangeStart}
					totalPx={totalPx}
					windows={byDay[dayIdx] ?? []}
					slotDuration={slotDuration}
					onSlotClick={onSlotClick}
					onWindowClick={onWindowClick}
				/>
			))}
		</div>
	);
}
