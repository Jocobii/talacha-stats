"use client";

import { Settings, Eye } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/shared/ui";
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
		<header
			style={{
				padding: "16px 20px 14px",
				borderBottom: "1px solid var(--color-line)",
				display: "flex",
				alignItems: "center",
				gap: 24,
			}}
		>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						gap: 14,
						flexWrap: "nowrap",
						minWidth: 0,
					}}
				>
					<h1
						style={{
							margin: 0,
							fontFamily: "var(--font-display)",
							fontSize: 38,
							fontWeight: 900,
							letterSpacing: "-0.02em",
							color: "var(--color-ink)",
							whiteSpace: "nowrap",
						}}
					>
						{matchday ? `Jornada ${matchday.number}` : "Sin jornada"}
						{totalMatchdays > 0 && (
							<span
								style={{
									color: "var(--color-ink-3)",
									fontWeight: 500,
									fontSize: 22,
									marginLeft: 8,
									whiteSpace: "nowrap",
								}}
							>
								/ {totalMatchdays}
							</span>
						)}
					</h1>
					{matchday && (
						<div style={{ fontSize: 14, color: "var(--color-ink-2)", textTransform: "capitalize" }}>
							{formatDate(matchday.scheduledDate)}
						</div>
					)}
					{matchday && <StatusPill status={matchday.status} />}
				</div>
			</div>

			{matchday && (
				<div
					style={{
						textAlign: "right",
						padding: "8px 14px",
						background: "var(--color-surface)",
						borderRadius: 10,
						border: "1px solid var(--color-line)",
					}}
				>
					<div
						style={{
							fontSize: 10,
							color: "var(--color-ink-3)",
							letterSpacing: "0.14em",
							textTransform: "uppercase",
						}}
					>
						Faltan
					</div>
					<div
						style={{
							fontFamily: "var(--font-display)",
							fontSize: 24,
							fontWeight: 800,
							color: "var(--color-brand)",
							lineHeight: 1,
						}}
					>
						{daysLabel(matchday.scheduledDate)}
					</div>
				</div>
			)}

			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<Link
					href={`/admin/leagues/${leagueId}/calendario`}
					className="btn-ghost"
					style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
					title="Ver vista pública del calendario"
				>
					<Eye size={13} /> Calendario
				</Link>
				<button className="btn-ghost" onClick={onOpenSettings} title="Ajustes del sorteo">
					<Settings size={13} /> Ajustes
				</button>
			</div>
		</header>
	);
}
