"use client";

/**
 * features/sorteo-cockpit/ui/CockpitDatePicker.tsx
 *
 * Reemplazo del <input type="date"> nativo en CreateMatchdayForm — el picker
 * del navegador no respeta el idioma visual del cockpit (surface-card, chips,
 * tipografía).
 *
 * El panel se renderiza vía createPortal a document.body con position:fixed
 * calculado desde el trigger — mismo patrón que shared/ui/Listbox.tsx — para
 * no ser recortado por el contenedor raíz de CockpitPage, que tiene
 * overflow:hidden (necesario para que los paneles del cockpit manejen su
 * propio scroll). Sin el portal, el panel quedaba invisible: se abría (el
 * borde del botón cambiaba de color) pero el popover nunca aparecía porque
 * su caja vivía fuera de los límites del contenedor recortado.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Inline } from "@/shared/ui/layout";
import {
	buildMonthGrid,
	isSameDay,
	parseIsoDate,
	formatDatePickerLabel,
	WEEKDAY_LABELS,
	MONTH_LABELS,
	type MonthDay,
} from "../lib/build-month-grid";
import { DatePickerDay } from "./DatePickerDay";

type PanelRect = { top: number; left: number };

type CockpitDatePickerProps = {
	value: string;
	onChange: (iso: string) => void;
	disabled?: boolean;
};

export function CockpitDatePicker({ value, onChange, disabled }: CockpitDatePickerProps) {
	const selected = parseIsoDate(value);
	const today = new Date();
	const [open, setOpen] = useState(false);
	const [viewYear, setViewYear] = useState((selected ?? today).getFullYear());
	const [viewMonth, setViewMonth] = useState((selected ?? today).getMonth());
	const [rect, setRect] = useState<PanelRect | null>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!open || !triggerRef.current) return;
		function updateRect() {
			const r = triggerRef.current!.getBoundingClientRect();
			setRect({ top: r.bottom + 8, left: r.left });
		}
		updateRect();
		window.addEventListener("scroll", updateRect, true);
		window.addEventListener("resize", updateRect);
		return () => {
			window.removeEventListener("scroll", updateRect, true);
			window.removeEventListener("resize", updateRect);
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			const target = e.target as Node;
			if (triggerRef.current?.contains(target)) return;
			if (panelRef.current?.contains(target)) return;
			setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	function goToMonth(delta: number) {
		const next = new Date(viewYear, viewMonth + delta, 1);
		setViewYear(next.getFullYear());
		setViewMonth(next.getMonth());
	}

	function pick(day: MonthDay) {
		onChange(day.iso);
		setOpen(false);
	}

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => !disabled && setOpen((o) => !o)}
				disabled={disabled}
				className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2"
				style={{
					background: "var(--color-surface-2)",
					border: `1px solid ${open ? "var(--color-brand)" : "var(--color-line)"}`,
					color: value ? "var(--color-ink)" : "var(--color-ink-3)",
					fontSize: 14,
					fontFamily: "inherit",
					cursor: disabled ? "not-allowed" : "pointer",
				}}
			>
				<Calendar size={14} strokeWidth={2} color="var(--color-brand)" />
				{formatDatePickerLabel(value)}
			</button>

			{open &&
				rect &&
				createPortal(
					<div
						ref={panelRef}
						className="vcal-popover-enter z-[100] w-[260px] rounded-[10px] p-3"
						style={{
							position: "fixed",
							top: rect.top,
							left: rect.left,
							background: "var(--color-surface)",
							color: "var(--color-ink)",
							border: "1px solid var(--color-line)",
							boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
							fontFamily: "var(--font-body)",
						}}
					>
						<Inline align="center" justify="between" className="mb-2.5">
							<button type="button" className="btn-ghost px-2 py-1" onClick={() => goToMonth(-1)}>
								<ChevronLeft size={13} />
							</button>
							<span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>
								{MONTH_LABELS[viewMonth]} {viewYear}
							</span>
							<button type="button" className="btn-ghost px-2 py-1" onClick={() => goToMonth(1)}>
								<ChevronRight size={13} />
							</button>
						</Inline>

						<div className="mb-1 grid grid-cols-7 gap-0.5">
							{WEEKDAY_LABELS.map((w) => (
								<span
									key={w}
									className="text-center"
									style={{ fontSize: 10, color: "var(--color-ink-3)" }}
								>
									{w}
								</span>
							))}
						</div>

						<div className="grid grid-cols-7 gap-0.5">
							{buildMonthGrid(viewYear, viewMonth).map((day) => (
								<DatePickerDay
									key={day.iso}
									day={day}
									isSelected={!!selected && isSameDay(day.date, selected)}
									isToday={isSameDay(day.date, today)}
									onPick={pick}
								/>
							))}
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
