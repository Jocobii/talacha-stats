"use client";

import { useState } from "react";
import { Plus, Loader2, RotateCcw, Check, AlertCircle } from "lucide-react";
import { PairingRow } from "./PairingRow";
import { AddPairingModal } from "./AddPairingModal";
import { ShuffleOverlay } from "./ShuffleOverlay";
import { ConfettiBurst } from "./ConfettiBurst";
import { useSorteoRevealEffects } from "../model/useSorteoRevealEffects";
import type {
	CockpitPairing,
	VenueOption,
	TeamWithAttendance,
	CockpitConfig,
	SaveStatus,
} from "../types";

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
	saveStatus: SaveStatus;
	onSortear: (seed?: number) => void;
	onAddManual: (homeTeamId: string, awayTeamId: string) => void;
	onOpenSettings: (tab: string) => void;
};

function ConfigSetupCard({ onOpenSettings }: { onOpenSettings: (tab: string) => void }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: 48,
				gap: 12,
				textAlign: "center",
			}}
		>
			<div style={{ fontSize: 14, color: "var(--color-ink-2)", maxWidth: 280, lineHeight: 1.5 }}>
				Antes de sortear, configura los parámetros de la liga: duración de partido, buffer y
				jornadas.
			</div>
			<button className="btn-primary" onClick={() => onOpenSettings("parametros")}>
				Configurar parámetros →
			</button>
		</div>
	);
}

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
			<button className="btn-primary pulse-cta" onClick={onSortear} disabled={disabled}>
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
	saveStatus,
	onSortear,
	onAddManual,
	onOpenSettings,
}: SorteoPanelProps) {
	const [addModalOpen, setAddModalOpen] = useState(false);
	const fixedSlotCount = presentTeams.filter((t) => t.purchasedSlot !== null).length;
	const { justRevealed, flashOn, confettiPieces, confettiBurstId } = useSorteoRevealEffects(
		loading,
		pairings.length,
	);
	const shuffleTotal = Math.max(1, Math.floor(presentTeams.length / 2));
	return (
		<>
			<section
				className="surface-card"
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					height: "100%",
					overflow: "hidden",
				}}
			>
				{flashOn && (
					<div
						className="animate-sorteo-flash"
						style={{
							position: "absolute",
							inset: 0,
							pointerEvents: "none",
							background: "rgba(0,230,118,0.16)",
							zIndex: 5,
						}}
					/>
				)}
				<ConfettiBurst pieces={confettiPieces} burstId={confettiBurstId} />
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
					<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
						{saveStatus === "saving" && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: 5,
									fontSize: 11,
									color: "var(--color-ink-3)",
								}}
							>
								<Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />
								Guardando…
							</span>
						)}
						{saveStatus === "saved" && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: 5,
									fontSize: 11,
									color: "var(--color-brand)",
								}}
							>
								<Check size={11} />
								Guardado
							</span>
						)}
						{saveStatus === "error" && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: 5,
									fontSize: 11,
									color: "var(--color-rose)",
								}}
							>
								<AlertCircle size={11} />
								Error al guardar
							</span>
						)}
						<button
							className="btn-ghost"
							onClick={() => onSortear()}
							disabled={loading || disabled}
							title="Generar un nuevo sorteo aleatorio"
							style={
								loading
									? { color: "var(--color-brand)", borderColor: "rgba(0,230,118,0.3)" }
									: undefined
							}
						>
							{loading ? (
								<Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
							) : (
								<RotateCcw size={13} />
							)}
							Regenerar
						</button>
					</div>
				</div>

				<div style={{ flex: 1, overflow: "auto" }}>
					{loading ? (
						<ShuffleOverlay total={shuffleTotal} />
					) : !config ? (
						<ConfigSetupCard onOpenSettings={onOpenSettings} />
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
										revealing={justRevealed}
										revealDelayMs={idx * 70}
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
						onClick={() => setAddModalOpen(true)}
					>
						<Plus size={11} /> Agregar partido manual
					</button>
				</div>
			</section>

			{addModalOpen && config && (
				<AddPairingModal
					presentTeams={presentTeams}
					existingPairings={pairings}
					recentPairKeys={recentPairKeys}
					regularMatchdays={config.regularMatchdays}
					onAdd={onAddManual}
					onClose={() => setAddModalOpen(false)}
				/>
			)}
		</>
	);
}
