"use client";

import { RefreshCw, Plus, Loader2 } from "lucide-react";
import { PairingRow } from "./PairingRow";
import type { CockpitPairing, VenueOption, TeamWithAttendance, CockpitConfig } from "../types";

const thStyle: React.CSSProperties = {
	fontSize: 10,
	fontWeight: 600,
	color: "var(--color-ink-3)",
	letterSpacing: "0.12em",
	textTransform: "uppercase",
	padding: "8px 10px",
	textAlign: "left",
};

type SorteoPanelProps = {
	pairings: CockpitPairing[];
	venues: VenueOption[];
	presentTeams: TeamWithAttendance[];
	recentPairKeys: Set<string>;
	config: CockpitConfig | null;
	loading: boolean;
	disabled: boolean;
	onChangeTeam: (idx: number, role: "home" | "away", teamId: string) => void;
	onSwap: (idx: number) => void;
	onDelete: (idx: number) => void;
	onVenueChange: (idx: number, venueId: string) => void;
	onTimeChange: (idx: number, time: string) => void;
	onSortear: (seed?: number) => void;
};

function EmptyState({ onSortear, disabled }: { onSortear: () => void; disabled: boolean }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: 48,
				gap: 16,
			}}
		>
			<div style={{ fontSize: 14, color: "var(--color-ink-3)" }}>No hay partidos generados aun</div>
			<button className="btn-primary" onClick={onSortear} disabled={disabled}>
				Sortear Jornada
			</button>
		</div>
	);
}

export function SorteoPanel({
	pairings,
	venues,
	presentTeams,
	recentPairKeys,
	config,
	loading,
	disabled,
	onChangeTeam,
	onSwap,
	onDelete,
	onVenueChange,
	onTimeChange,
	onSortear,
}: SorteoPanelProps) {
	const fixedSlotCount = presentTeams.filter((t) => t.purchasedSlot !== null).length;
	return (
		<section
			className="surface-card"
			style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}
		>
			<div
				style={{
					padding: "14px 16px",
					borderBottom: "1px solid var(--color-line)",
					display: "flex",
					alignItems: "center",
					gap: 12,
					flexWrap: "wrap",
				}}
			>
				<h2
					style={{
						margin: 0,
						fontFamily: "var(--font-display)",
						fontWeight: 800,
						fontSize: 18,
						letterSpacing: "-0.01em",
					}}
				>
					Sorteo · Preview editable
				</h2>
				{config && (
					<span className="chip brand">Sin repetir ultimas {config.noRepeatWithin} jornadas</span>
				)}
				{fixedSlotCount > 0 && (
					<span className="chip">
						{fixedSlotCount} slot{fixedSlotCount !== 1 ? "s" : ""} fijo
						{fixedSlotCount !== 1 ? "s" : ""}
					</span>
				)}
				<span style={{ fontSize: 11, color: "var(--color-ink-3)", fontStyle: "italic" }}>
					Click en cualquier equipo, cancha u hora para editar
				</span>
				<div style={{ marginLeft: "auto" }}>
					<button className="btn-ghost" onClick={() => onSortear()} disabled={loading || disabled}>
						<RefreshCw size={13} /> Regenerar
					</button>
				</div>
			</div>

			<div style={{ flex: 1, overflow: "auto" }}>
				{loading ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							padding: 40,
							color: "var(--color-brand)",
						}}
					>
						<Loader2 size={24} />
					</div>
				) : pairings.length === 0 ? (
					<EmptyState onSortear={() => onSortear()} disabled={disabled} />
				) : (
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
						<thead>
							<tr style={{ background: "rgba(255,255,255,0.02)" }}>
								<th style={thStyle}>#</th>
								<th style={{ ...thStyle, textAlign: "right" }}>Local</th>
								<th style={{ ...thStyle, width: 28 }} />
								<th style={thStyle}>Visita</th>
								<th style={thStyle}>Cancha</th>
								<th style={thStyle}>Hora</th>
								<th style={{ ...thStyle, width: 80 }} />
							</tr>
						</thead>
						<tbody>
							{pairings.map((p, idx) => (
								<PairingRow
									key={p.uid}
									pairing={p}
									idx={idx}
									venues={venues}
									presentTeams={presentTeams}
									allPairings={pairings}
									recentPairKeys={recentPairKeys}
									onChangeTeam={onChangeTeam}
									onSwap={onSwap}
									onDelete={onDelete}
									onVenueChange={onVenueChange}
									onTimeChange={onTimeChange}
									disabled={disabled}
								/>
							))}
						</tbody>
					</table>
				)}
			</div>

			<div
				style={{
					borderTop: "1px solid var(--color-line)",
					padding: "10px 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					background: "rgba(0,0,0,0.2)",
				}}
			>
				<div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--color-ink-2)" }}>
					<span>
						<b style={{ color: "var(--color-ink)" }}>{pairings.length}</b> partidos generados
					</span>
					<span style={{ color: "var(--color-ink-3)" }}>·</span>
					<span>
						<b style={{ color: "var(--color-ink)" }}>{venues.length}</b> canchas
					</span>
				</div>
				<button
					className="btn-ghost"
					style={{ padding: "4px 10px", fontSize: 12 }}
					disabled={disabled}
				>
					<Plus size={11} /> Agregar partido manual
				</button>
			</div>
		</section>
	);
}
