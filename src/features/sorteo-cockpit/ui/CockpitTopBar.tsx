"use client";

import { Settings, Eye } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/shared/ui";
import { Inline } from "@/shared/ui/layout";
import type { CockpitMatchday } from "../types";

type CockpitTopBarProps = {
	leagueId: string;
	matchday: CockpitMatchday | null;
	totalMatchdays: number;
	onOpenSettings: () => void;
};

function daysLabel(scheduledDate: string): string {
	const diff = new Date(scheduledDate).getTime() - new Date().getTime();
	const d = Math.round(diff / 86400000);
	if (d < 0) return `Hace ${Math.abs(d)} días`;
	if (d === 0) return "Hoy";
	return `${d} días`;
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("es-MX", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function CockpitTopBar({
	matchday,
	totalMatchdays,
	onOpenSettings,
	leagueId,
}: CockpitTopBarProps) {
	return (
		<Inline
			as="header"
			align="center"
			gap="lg"
			className="px-5 pt-4 pb-3.5"
			style={{ borderBottom: "1px solid var(--color-line)" }}
		>
			<div className="min-w-0 flex-1">
				<Inline gap="md" className="min-w-0 flex-nowrap items-baseline">
					<h1
						className="m-0 whitespace-nowrap"
						style={{
							fontFamily: "var(--font-display)",
							fontSize: 38,
							fontWeight: 900,
							letterSpacing: "-0.02em",
							color: "var(--color-ink)",
						}}
					>
						{matchday ? `Jornada ${matchday.number}` : "Sin jornada"}
						{totalMatchdays > 0 && (
							<span
								className="ml-2 whitespace-nowrap"
								style={{ color: "var(--color-ink-3)", fontWeight: 500, fontSize: 22 }}
							>
								/ {totalMatchdays}
							</span>
						)}
					</h1>
					{matchday && (
						<div className="capitalize" style={{ fontSize: 14, color: "var(--color-ink-2)" }}>
							{formatDate(matchday.scheduledDate)}
						</div>
					)}
					{matchday && <StatusPill status={matchday.status} />}
				</Inline>
			</div>

			{matchday && (
				<div
					className="rounded-[10px] px-3.5 py-2 text-right"
					style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
				>
					<div
						className="uppercase"
						style={{ fontSize: 10, color: "var(--color-ink-3)", letterSpacing: "0.14em" }}
					>
						Faltan
					</div>
					<div
						className="leading-none"
						style={{
							fontFamily: "var(--font-display)",
							fontSize: 24,
							fontWeight: 800,
							color: "var(--color-brand)",
						}}
					>
						{daysLabel(matchday.scheduledDate)}
					</div>
				</div>
			)}

			<Inline align="center" gap="sm">
				<Link
					href={`/admin/leagues/${leagueId}/calendario`}
					className="btn-ghost inline-flex items-center gap-1.5"
					title="Ver vista pública del calendario"
				>
					<Eye size={13} /> Calendario
				</Link>
				<button className="btn-ghost" onClick={onOpenSettings} title="Ajustes del sorteo">
					<Settings size={13} /> Ajustes
				</button>
			</Inline>
		</Inline>
	);
}
