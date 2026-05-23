"use client";

/**
 * features/venue-calendar/ui/CalendarGrid.tsx
 * Cuadrícula de calendario semana — CSS Grid puro, sin FullCalendar.
 * Drag-select sobre huecos vacíos para crear rentas.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { addDays } from "../lib/date-utils";
import { EVENT_COLORS } from "../constants";
import type { VenueEvent } from "../types";

// ── Constantes de geometría (sincronizadas con --vcal-slot-h en CSS) ─────────
const SLOT_H = 26; // px por slot de 30 min
const START_H = 6; // hora de inicio visible
const END_H = 24; // hora de fin visible
const TOTAL_SLOTS = (END_H - START_H) * 2;
const TOTAL_HEIGHT = TOTAL_SLOTS * SLOT_H; // 936 px

const DAY_NAMES = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

// ── Utilidades ────────────────────────────────────────────────────────────────

function minuteOffsetToY(minutesSinceStart: number): number {
	return (minutesSinceStart / 30) * SLOT_H;
}

function dateToY(d: Date): number {
	return minuteOffsetToY((d.getHours() - START_H) * 60 + d.getMinutes());
}

function pad2(n: number): string {
	return n.toString().padStart(2, "0");
}

function fmtTime(d: Date): string {
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// ── Layout de eventos solapados ───────────────────────────────────────────────

type LayoutItem = {
	ev: VenueEvent;
	colIdx: number;
	totalCols: number;
};

/**
 * Asigna columnas a eventos que se solapan en el tiempo.
 * Algoritmo greedy: cada evento ocupa la primera columna libre.
 * Para cada evento, `totalCols` refleja el máximo de columnas concurrentes
 * en su rango, para que todos los solapados tengan el mismo ancho.
 */
function layoutEvents(events: VenueEvent[]): LayoutItem[] {
	if (events.length === 0) return [];

	const sorted = [...events].sort(
		(a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
	);

	const colEnds: number[] = [];
	const assignments: number[] = [];

	for (const ev of sorted) {
		const start = new Date(ev.startAt).getTime();
		const end = new Date(ev.endAt).getTime();
		let placed = false;
		for (let c = 0; c < colEnds.length; c++) {
			if ((colEnds[c] ?? 0) <= start) {
				colEnds[c] = end;
				assignments.push(c);
				placed = true;
				break;
			}
		}
		if (!placed) {
			colEnds.push(new Date(ev.endAt).getTime());
			assignments.push(colEnds.length - 1);
		}
	}

	return sorted.map((ev, i) => {
		const start = new Date(ev.startAt).getTime();
		const end = new Date(ev.endAt).getTime();
		let maxCol = assignments[i]!;
		for (let j = 0; j < sorted.length; j++) {
			const os = new Date(sorted[j]!.startAt).getTime();
			const oe = new Date(sorted[j]!.endAt).getTime();
			if (os < end && oe > start) maxCol = Math.max(maxCol, assignments[j]!);
		}
		return { ev, colIdx: assignments[i]!, totalCols: maxCol + 1 };
	});
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
	events: VenueEvent[];
	weekStart: Date;
	today: Date;
	activeEventId?: string | null;
	onSelectRange: (start: string, end: string) => void;
	onEventClick: (event: VenueEvent, el: HTMLElement) => void;
};

// ── Componente ────────────────────────────────────────────────────────────────

export function CalendarGrid({
	events,
	weekStart,
	today,
	activeEventId,
	onSelectRange,
	onEventClick,
}: Props) {
	const days = useMemo(
		() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
		[weekStart],
	);
	const hours = useMemo(() => Array.from({ length: END_H - START_H }, (_, i) => START_H + i), []);

	// Drag-select state
	const [drag, setDrag] = useState<{ dayIdx: number; startSlot: number; endSlot: number } | null>(
		null,
	);
	const colRefs = useRef<(HTMLDivElement | null)[]>([]);

	// "Now" indicator
	const nowPos = useMemo(() => {
		const todayIdx = days.findIndex((d) => d.toDateString() === today.toDateString());
		if (todayIdx < 0 || today.getHours() < START_H || today.getHours() >= END_H) return null;
		return { col: todayIdx, y: dateToY(today) };
	}, [days, today]);

	function onMouseDownSlot(e: React.MouseEvent, dayIdx: number) {
		if (e.button !== 0) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const slot = Math.floor((e.clientY - rect.top) / SLOT_H);
		setDrag({ dayIdx, startSlot: slot, endSlot: slot });
		e.preventDefault();
	}

	function onMouseMoveCol(e: React.MouseEvent, dayIdx: number) {
		if (!drag || drag.dayIdx !== dayIdx) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const slot = Math.max(
			0,
			Math.min(TOTAL_SLOTS - 1, Math.floor((e.clientY - rect.top) / SLOT_H)),
		);
		setDrag((d) => d && { ...d, endSlot: slot });
	}

	useEffect(() => {
		if (!drag) return;
		function onUp() {
			if (!drag) return;
			const { dayIdx, startSlot, endSlot } = drag;
			const s = Math.min(startSlot, endSlot);
			const e = Math.max(startSlot, endSlot) + 1;
			const day = days[dayIdx];
			if (!day) {
				setDrag(null);
				return;
			}
			const startDate = new Date(day);
			startDate.setHours(START_H, 0, 0, 0);
			startDate.setMinutes(s * 30);
			const endDate = new Date(day);
			endDate.setHours(START_H, 0, 0, 0);
			endDate.setMinutes(e * 30);
			setDrag(null);
			if (e - s >= 1) onSelectRange(startDate.toISOString(), endDate.toISOString());
		}
		window.addEventListener("mouseup", onUp);
		return () => window.removeEventListener("mouseup", onUp);
	}, [drag, days, onSelectRange]);

	return (
		<div className="overflow-x-auto overflow-y-hidden">
			<div style={{ minWidth: 880 }}>
				{/* Day header row */}
				<div
					className="sticky top-0 z-10 grid border-b border-line"
					style={{
						gridTemplateColumns: `var(--vcal-time-w) repeat(7, 1fr)`,
						background: "var(--color-surface-2)",
						height: "var(--vcal-header-h)",
					}}
				>
					<div className="border-r border-line" style={{ background: "var(--color-surface)" }} />
					{days.map((d, i) => {
						const isToday = d.toDateString() === today.toDateString();
						return (
							<div
								key={i}
								className={`flex flex-col items-center justify-center gap-0.5 border-r border-line last:border-r-0 ${isToday ? "bg-brand/[0.06]" : ""}`}
							>
								<span className="text-[10px] uppercase tracking-[0.14em] text-ink-2">
									{DAY_NAMES[i]}
								</span>
								<span
									className={`font-display text-lg font-semibold leading-none ${isToday ? "text-brand-ink" : "text-ink"}`}
								>
									{d.getDate()}
								</span>
							</div>
						);
					})}
				</div>
				{/* Grid body */}
				<div
					className="grid relative"
					style={{ gridTemplateColumns: `var(--vcal-time-w) repeat(7, 1fr)` }}
				>
					{/* Time column */}
					<div
						className="border-r border-line relative"
						style={{ background: "var(--color-surface)" }}
					>
						{hours.map((h) => (
							<div
								key={h}
								className="text-right text-[10px] text-ink-3 tracking-[0.04em] border-b border-line pr-2 pt-0.5"
								style={{ height: SLOT_H * 2 }}
							>
								{pad2(h)}:00
							</div>
						))}
					</div>

					{/* Day columns */}
					{days.map((d, dayIdx) => {
						const isToday = d.toDateString() === today.toDateString();
						const isWeekend = dayIdx >= 5;
						const dayEvents = events.filter(
							(ev) => new Date(ev.startAt).toDateString() === d.toDateString(),
						);

						return (
							<div
								key={dayIdx}
								ref={(el) => {
									colRefs.current[dayIdx] = el;
								}}
								className={`relative border-r border-line last:border-r-0 select-none ${isToday ? "bg-brand/[0.025]" : isWeekend ? "bg-surface-2/40" : "bg-surface"}`}
								style={{ height: TOTAL_HEIGHT }}
								onMouseDown={(e) => onMouseDownSlot(e, dayIdx)}
								onMouseMove={(e) => onMouseMoveCol(e, dayIdx)}
							>
								{/* Slot lines */}
								{Array.from({ length: TOTAL_SLOTS }, (_, i) => (
									<div
										key={i}
										className={`absolute left-0 right-0 hover:bg-brand/[0.05] transition-colors ${i % 2 === 1 ? "border-b border-line/60" : "border-b border-line"}`}
										style={{ top: i * SLOT_H, height: SLOT_H }}
									/>
								))}

								{/* Drag-select mirror */}
								{drag &&
									drag.dayIdx === dayIdx &&
									(() => {
										const s = Math.min(drag.startSlot, drag.endSlot);
										const e = Math.max(drag.startSlot, drag.endSlot) + 1;
										const startDate = new Date(d);
										startDate.setHours(START_H, 0, 0, 0);
										startDate.setMinutes(s * 30);
										const endDate = new Date(d);
										endDate.setHours(START_H, 0, 0, 0);
										endDate.setMinutes(e * 30);
										return (
											<div
												className="absolute left-1 right-1 rounded-md pointer-events-none z-20"
												style={{
													top: s * SLOT_H,
													height: (e - s) * SLOT_H,
													background: "rgba(0,230,118,0.15)",
													border: "1px dashed var(--color-brand)",
												}}
											>
												<div className="px-2 pt-1 text-[11px] font-semibold text-brand-ink">
													{fmtTime(startDate)} → {fmtTime(endDate)}
												</div>
											</div>
										);
									})()}

								{/* Events — con columnas para solapados */}
								{layoutEvents(dayEvents).map(({ ev, colIdx, totalCols }) => {
									const start = new Date(ev.startAt);
									const end = new Date(ev.endAt);
									const top = dateToY(start);
									const height = Math.max(
										SLOT_H * 0.9,
										((end.getTime() - start.getTime()) / 60000 / 30) * SLOT_H - 2,
									);
									const colors = EVENT_COLORS[ev.type];
									const isActive = ev.id === activeEventId;
									const colW = 1 / totalCols;
									const leftPct = colIdx * colW * 100;
									const widthPct = colW * 100;
									return (
										<div
											key={ev.id}
											className="absolute rounded-md overflow-hidden cursor-pointer flex flex-col gap-0.5 p-1"
											style={{
												top,
												height,
												left: `calc(${leftPct}% + 2px)`,
												width: `calc(${widthPct}% - 4px)`,
												background: colors.background,
												borderLeft: `3px solid ${colors.border}`,
												color: colors.text,
												boxShadow: isActive
													? `0 0 0 2px var(--color-brand), 0 6px 18px rgba(0,0,0,0.4)`
													: undefined,
												zIndex: isActive ? 20 : 10,
											}}
											onMouseDown={(e) => e.stopPropagation()}
											onClick={(e) => {
												e.stopPropagation();
												onEventClick(ev, e.currentTarget as HTMLElement);
											}}
										>
											<div className="text-[10px] opacity-85 font-variant-numeric-tabular">
												{fmtTime(start)} → {fmtTime(end)}
											</div>
											<div className="text-[11px] font-semibold truncate">{ev.title}</div>
											{ev.type === "tournament" && ev.matchInfo && (
												<div className="text-[10px] opacity-85 truncate">{ev.matchInfo}</div>
											)}
											{ev.type.startsWith("rental") && ev.price != null && ev.price > 0 && (
												<div className="text-[10px] opacity-85">
													${ev.price.toLocaleString("es-MX")} MXN
												</div>
											)}
										</div>
									);
								})}

								{/* Now indicator */}
								{nowPos && nowPos.col === dayIdx && (
									<div
										className="absolute left-0 right-0 pointer-events-none z-30"
										style={{ top: nowPos.y }}
									>
										<div className="relative">
											<div
												className="absolute"
												style={{
													left: -4,
													top: -4,
													width: 9,
													height: 9,
													borderRadius: "50%",
													background: "var(--color-brand)",
													boxShadow: "0 0 0 3px rgba(0,230,118,0.25)",
												}}
											/>
											<div style={{ height: 1.5, background: "var(--color-brand)" }} />
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
