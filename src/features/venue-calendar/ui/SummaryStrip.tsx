"use client";

/**
 * features/venue-calendar/ui/SummaryStrip.tsx
 * Franja de 4 tarjetas estadísticas sobre el panel de calendario.
 */

import { TrendingUp, CheckCircle2, Trophy, Activity } from "lucide-react";
import type { VenueEvent } from "../types";

type Props = { events: VenueEvent[] };

export function SummaryStrip({ events }: Props) {
	const rentals = events.filter((e) => e.type.startsWith("rental") && e.status !== "cancelled");
	const tournaments = events.filter((e) => e.type === "tournament");
	const confirmed = rentals.filter((r) => r.status === "confirmed");
	const tentative = rentals.filter((r) => r.status === "tentative");
	const income = confirmed.reduce((sum, e) => sum + (e.price ?? 0), 0);

	const usedHours = events
		.filter((e) => e.status !== "cancelled")
		.reduce(
			(sum, e) => sum + (new Date(e.endAt).getTime() - new Date(e.startAt).getTime()) / 3_600_000,
			0,
		);
	const occupancy = Math.min(100, Math.round((usedHours / 84) * 100)); // 12h×7d = 84h

	const stats = [
		{
			label: "Ingresos semana",
			value: `$${income.toLocaleString("es-MX")}`,
			unit: "MXN",
			delta: "",
			deltaPos: false,
			icon: TrendingUp,
			accent: true,
		},
		{
			label: "Rentas confirmadas",
			value: String(confirmed.length),
			delta: `${tentative.length} tentativas pendientes`,
			deltaPos: false,
			icon: CheckCircle2,
			accent: false,
		},
		{
			label: "Partidos de liga",
			value: String(tournaments.length),
			delta: "bloques de torneo",
			deltaPos: false,
			icon: Trophy,
			accent: false,
		},
		{
			label: "Ocupación",
			value: String(occupancy),
			unit: "%",
			delta: `${Math.round(usedHours)} hrs reservadas`,
			deltaPos: false,
			icon: Activity,
			accent: false,
		},
	] as const;

	return (
		<div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
			{stats.map((s) => (
				<div
					key={s.label}
					className="rounded-xl border border-line p-3.5 flex flex-col gap-1"
					style={{ background: "var(--color-surface)" }}
				>
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ink-2">
							{s.label}
						</span>
						<span
							className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
							style={{
								background: s.accent ? "rgba(0,230,118,0.1)" : "var(--color-surface-2)",
								color: s.accent ? "var(--color-brand)" : "var(--color-ink)",
							}}
						>
							<s.icon size={14} />
						</span>
					</div>
					<div className="text-ink font-display text-[26px] font-semibold leading-none">
						{s.value}
						{"unit" in s && s.unit && <span className="text-sm text-ink ml-1">{s.unit}</span>}
					</div>
					<div className={`text-[11px] ${s.deltaPos ? "text-brand-ink" : "text-ink"}`}>
						{s.deltaPos && "↗ "}
						{s.delta}
					</div>
				</div>
			))}
		</div>
	);
}
