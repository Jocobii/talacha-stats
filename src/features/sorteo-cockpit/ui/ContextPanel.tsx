"use client";

import Link from "next/link";
import { Info, ChevronRight, MapPin, Settings, Calendar } from "lucide-react";
import { StatusPill } from "@/shared/ui";
import type { CockpitMatchday, CockpitConfig, VenueOption } from "../types";

type ContextPanelProps = {
	matchday: CockpitMatchday | null;
	leagueId: string;
	onOpenSettings: (tab: string) => void;
	config: CockpitConfig | null;
	venues: VenueOption[];
};

type SetupRowProps = {
	icon: React.ReactNode;
	label: string;
	value: string;
	onClick?: () => void;
	href?: string;
	emphasize?: boolean;
};

function SetupRow({ icon, label, value, onClick, href, emphasize }: SetupRowProps) {
	const style: React.CSSProperties = {
		width: "100%",
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "6px 4px",
		background: "transparent",
		border: "none",
		borderTop: "1px solid var(--color-line)",
		color: "var(--color-ink-2)",
		fontFamily: "inherit",
		fontSize: 12,
		textAlign: "left",
		cursor: "pointer",
		textDecoration: "none",
	};
	const inner = (
		<>
			{icon}
			<span style={{ flex: 1 }}>{label}</span>
			<span
				style={{ color: emphasize ? "var(--color-brand)" : "var(--color-ink-3)", fontSize: 11 }}
			>
				{value}
			</span>
			<ChevronRight size={10} />
		</>
	);
	return href ? (
		<Link href={href} style={style}>
			{inner}
		</Link>
	) : (
		<button style={style} onClick={onClick}>
			{inner}
		</button>
	);
}

function MatchdayTimeline({ matchday }: { matchday: CockpitMatchday | null }) {
	return (
		<div className="surface-card" style={{ padding: 14 }}>
			<h3 className="section-label" style={{ margin: "0 0 10px" }}>
				Línea de jornadas
			</h3>
			<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
				{[3, 2, 1].map((offset) => {
					const n = matchday ? matchday.number - offset : null;
					if (!n || n < 1) return null;
					return (
						<div
							key={offset}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 10,
								padding: "5px 8px",
								borderRadius: 6,
								opacity: 0.45,
							}}
						>
							<div
								style={{
									width: 24,
									height: 24,
									display: "grid",
									placeItems: "center",
									fontFamily: "var(--font-display)",
									fontWeight: 800,
									fontSize: 13,
									color: "var(--color-ink-3)",
									background: "var(--color-surface-2)",
									borderRadius: 6,
								}}
							>
								{n}
							</div>
							<div style={{ flex: 1, fontSize: 12, color: "var(--color-ink-3)" }}>Jornada {n}</div>
						</div>
					);
				})}
				{matchday && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: "6px 8px",
							borderRadius: 7,
							background: "rgba(0,230,118,0.08)",
							border: "1px solid rgba(0,230,118,0.3)",
						}}
					>
						<div
							style={{
								width: 24,
								height: 24,
								display: "grid",
								placeItems: "center",
								fontFamily: "var(--font-display)",
								fontWeight: 800,
								fontSize: 13,
								color: "var(--color-brand)",
								background: "rgba(0,230,118,0.12)",
								borderRadius: 6,
							}}
						>
							{matchday.number}
						</div>
						<div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}>
							Jornada {matchday.number}
						</div>
						<StatusPill status={matchday.status} size="sm" />
					</div>
				)}
			</div>
		</div>
	);
}

export function ContextPanel({
	matchday,
	leagueId,
	onOpenSettings,
	config,
	venues,
}: ContextPanelProps) {
	const durationLabel = config
		? `${config.matchDurationMinutes} min · ${config.bufferMinutes} min buffer`
		: "—";

	return (
		<section
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 12,
				minHeight: 0,
				height: "100%",
				overflowY: "auto",
			}}
		>
			<MatchdayTimeline matchday={matchday} />

			<div className="surface-card" style={{ padding: 12 }}>
				<div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
					<Info size={13} color="var(--color-blue)" />
					<div style={{ flex: 1 }}>
						<div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}>
							Ventana de edición
						</div>
						<div
							style={{ fontSize: 11, color: "var(--color-ink-2)", marginTop: 3, lineHeight: 1.5 }}
						>
							Puedes editar hasta el mismo día de la jornada. Después se bloquea automáticamente.
						</div>
					</div>
				</div>
			</div>

			<div className="surface-card" style={{ padding: 12 }}>
				<h3 className="section-label" style={{ margin: 0, marginBottom: 8 }}>
					Configuración base
				</h3>
				<SetupRow
					icon={<MapPin size={12} />}
					label="Canchas"
					value={`${venues.length} activa${venues.length !== 1 ? "s" : ""}`}
					onClick={() => onOpenSettings("canchas")}
				/>
				<SetupRow
					icon={<Settings size={12} />}
					label="Parámetros"
					value={durationLabel}
					onClick={() => onOpenSettings("parametros")}
				/>
				<SetupRow
					icon={<Calendar size={12} />}
					label="Calendario"
					value="Ver completo"
					href={`/admin/leagues/${leagueId}/sorteo/calendario`}
					emphasize
				/>
			</div>
		</section>
	);
}
