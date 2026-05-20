"use client";

import { useEffect } from "react";
import { Settings, X, Check, MapPin, Moon, Lock } from "lucide-react";
import { CanchasTab } from "./CanchasTab";
import { ParametrosTab } from "./ParametrosTab";
import { DescansosTab } from "./DescansosTab";
import { SlotsFijosTab } from "./SlotsFijosTab";
import type { VenueOption, CockpitConfig, TeamWithAttendance } from "../types";

export type SettingsDrawerProps = {
	leagueId: string;
	leagueName: string;
	open: boolean;
	activeTab: string;
	onClose: () => void;
	onTabChange: (tab: string) => void;
	venues: VenueOption[];
	config: CockpitConfig | null;
	teams: TeamWithAttendance[];
	matchdayNumber: number | null;
	onConfigChange: (c: Partial<CockpitConfig>) => void;
	onSave?: () => void;
	onAttendanceChange?: (teamId: string, status: "presente" | "ausente") => void;
};

type TabDef = { id: string; label: string; icon: React.ReactNode; badge?: number };

function buildTabs(teams: TeamWithAttendance[]): TabDef[] {
	return [
		{ id: "canchas", label: "Canchas", icon: <MapPin size={13} /> },
		{ id: "parametros", label: "Parámetros", icon: <Settings size={13} /> },
		{
			id: "descansos",
			label: "Descansos",
			icon: <Moon size={13} />,
			badge: teams.filter((t) => t.status === "ausente").length || undefined,
		},
		{
			id: "slots",
			label: "Slots fijos",
			icon: <Lock size={13} />,
			badge: teams.filter((t) => t.purchasedSlot !== null).length || undefined,
		},
	];
}

function DrawerHeader({ leagueName, onClose }: { leagueName: string; onClose: () => void }) {
	return (
		<div
			style={{
				padding: "16px 20px 14px",
				borderBottom: "1px solid var(--color-line)",
				display: "flex",
				alignItems: "center",
				gap: 12,
			}}
		>
			<Settings size={18} color="var(--color-brand)" />
			<div style={{ flex: 1 }}>
				<h2
					style={{
						margin: 0,
						fontFamily: "var(--font-display)",
						fontWeight: 800,
						fontSize: 22,
						letterSpacing: "-0.01em",
					}}
				>
					Ajustes del sorteo
				</h2>
				<div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}>
					Aplica a todas las jornadas de <b style={{ color: "var(--color-ink-2)" }}>{leagueName}</b>
				</div>
			</div>
			<button
				onClick={onClose}
				style={{
					width: 32,
					height: 32,
					display: "grid",
					placeItems: "center",
					background: "transparent",
					border: "1px solid var(--color-line)",
					borderRadius: 8,
					color: "var(--color-ink-2)",
					cursor: "pointer",
				}}
			>
				<X size={14} />
			</button>
		</div>
	);
}

function DrawerTabs({
	tabs,
	activeTab,
	onTabChange,
}: {
	tabs: TabDef[];
	activeTab: string;
	onTabChange: (id: string) => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				borderBottom: "1px solid var(--color-line)",
				padding: "0 12px",
				gap: 2,
			}}
		>
			{tabs.map((t) => {
				const isActive = activeTab === t.id;
				return (
					<button
						key={t.id}
						onClick={() => onTabChange(t.id)}
						style={{
							padding: "11px 12px 12px",
							background: "transparent",
							border: "none",
							borderBottom: `2px solid ${isActive ? "var(--color-brand)" : "transparent"}`,
							color: isActive ? "var(--color-ink)" : "var(--color-ink-3)",
							fontFamily: "inherit",
							fontSize: 12.5,
							fontWeight: 600,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 6,
							marginBottom: -1,
						}}
					>
						{t.icon}
						{t.label}
						{t.badge !== undefined && (
							<span
								style={{
									fontSize: 9.5,
									fontFamily: "var(--font-mono)",
									background: isActive ? "var(--color-brand)" : "var(--color-surface-2)",
									color: isActive ? "#052e14" : "var(--color-ink-2)",
									padding: "1px 6px",
									borderRadius: 999,
									fontWeight: 700,
								}}
							>
								{t.badge}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

export function SettingsDrawer({
	leagueId,
	leagueName,
	open,
	activeTab,
	onClose,
	onTabChange,
	venues,
	config,
	teams,
	matchdayNumber,
	onConfigChange,
	onSave,
	onAttendanceChange,
}: SettingsDrawerProps) {
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
			<div
				onClick={onClose}
				style={{
					position: "absolute",
					inset: 0,
					background: "rgba(0,0,0,0.55)",
					backdropFilter: "blur(2px)",
				}}
			/>
			<aside
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					bottom: 0,
					width: 520,
					background: "var(--color-surface)",
					borderLeft: "1px solid var(--color-line)",
					boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<DrawerHeader leagueName={leagueName} onClose={onClose} />
				<DrawerTabs tabs={buildTabs(teams)} activeTab={activeTab} onTabChange={onTabChange} />
				<div style={{ flex: 1, overflow: "auto" }}>
					{activeTab === "canchas" && <CanchasTab leagueId={leagueId} venues={venues} />}
					{activeTab === "parametros" && (
						<ParametrosTab
							leagueId={leagueId}
							config={config}
							onConfigChange={onConfigChange}
							onSave={onSave}
						/>
					)}
					{activeTab === "descansos" && (
						<DescansosTab
							leagueId={leagueId}
							matchdayNumber={matchdayNumber}
							teams={teams}
							onAttendanceChange={onAttendanceChange}
						/>
					)}
					{activeTab === "slots" && <SlotsFijosTab leagueId={leagueId} teams={teams} />}
				</div>
				<div
					style={{
						padding: "12px 20px",
						borderTop: "1px solid var(--color-line)",
						display: "flex",
						alignItems: "center",
						gap: 12,
						background: "rgba(0,0,0,0.25)",
					}}
				>
					<div
						style={{
							flex: 1,
							fontSize: 11,
							color: "var(--color-ink-3)",
							display: "flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<Check size={11} color="var(--color-brand)" />
						Guardado automáticamente
					</div>
					<button className="btn-ghost" onClick={onClose}>
						Cerrar
					</button>
				</div>
			</aside>
		</div>
	);
}
