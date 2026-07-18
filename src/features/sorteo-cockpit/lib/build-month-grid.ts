/**
 * features/sorteo-cockpit/lib/build-month-grid.ts
 * Helpers puros para armar la grilla de 6 semanas (42 días) que usa
 * CockpitDatePicker — sin dependencias de React, fáciles de testear.
 */

export type MonthDay = {
	date: Date;
	iso: string;
	inCurrentMonth: boolean;
};

export function toIsoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function buildMonthGrid(year: number, month: number): MonthDay[] {
	const firstOfMonth = new Date(year, month, 1);
	const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
	return Array.from({ length: 42 }, (_, i) => {
		const d = new Date(gridStart);
		d.setDate(gridStart.getDate() + i);
		return { date: d, iso: toIsoDate(d), inCurrentMonth: d.getMonth() === month };
	});
}

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const MONTH_LABELS = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

export function parseIsoDate(iso: string): Date | null {
	if (!iso) return null;
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return null;
	return new Date(y, m - 1, d);
}

export function formatDatePickerLabel(iso: string): string {
	const d = parseIsoDate(iso);
	if (!d) return "Selecciona fecha";
	return d.toLocaleDateString("es-MX", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
