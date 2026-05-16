/**
 * features/scheduling/lib/time-overlap.ts
 * Utilidades puras de cálculo horario (sin dependencias de DB ni React).
 * Todos los tiempos en formato "HH:MM" de 24h, zona horaria local de la org.
 */

/** Convierte "HH:MM" a minutos desde medianoche. */
export function toMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Devuelve true si dos slots se solapan.
 * Los extremos son exclusivos: [19:40, 20:30) y [20:30, 21:20) NO se solapan.
 */
export function slotsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
	return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/** Suma `minutes` minutos a un tiempo "HH:MM". Resultado en "HH:MM". */
export function addMinutes(hhmm: string, minutes: number): string {
	const total = toMinutes(hhmm) + minutes;
	const h = Math.floor(total / 60) % 24;
	const m = total % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
