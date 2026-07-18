"use client";

/**
 * features/sorteo-cockpit/ui/DatePickerDay.tsx
 * Celda de día para CockpitDatePicker — separada para mantener ese
 * componente corto (§AGENTS.md, componentes ≤150 líneas).
 */

import type { MonthDay } from "../lib/build-month-grid";

type DatePickerDayProps = {
	day: MonthDay;
	isSelected: boolean;
	isToday: boolean;
	onPick: (day: MonthDay) => void;
};

export function DatePickerDay({ day, isSelected, isToday, onPick }: DatePickerDayProps) {
	return (
		<button
			type="button"
			onClick={() => onPick(day)}
			style={{
				height: 28,
				borderRadius: 6,
				fontSize: 12,
				fontFamily: "inherit",
				border: isToday && !isSelected ? "1px solid var(--tint-brand-bd)" : "1px solid transparent",
				background: isSelected ? "var(--color-brand)" : "transparent",
				color: isSelected
					? "var(--color-pitch)"
					: day.inCurrentMonth
						? "var(--color-ink)"
						: "var(--color-ink-3)",
				fontWeight: isSelected ? 700 : 400,
				opacity: day.inCurrentMonth ? 1 : 0.4,
				cursor: "pointer",
			}}
		>
			{day.date.getDate()}
		</button>
	);
}
