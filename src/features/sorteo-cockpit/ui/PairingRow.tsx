"use client";

import { ArrowLeftRight, Trash2 } from "lucide-react";
import { TeamPicker } from "@/shared/ui";
import type { CockpitPairing, VenueOption, TeamWithAttendance } from "../types";

const DEFAULT_TIME_SLOTS = ["19:00", "20:00", "21:00", "22:00"];

const tdStyle: React.CSSProperties = { padding: "9px 10px", verticalAlign: "middle" };

const selectStyle: React.CSSProperties = {
	background: "var(--color-pitch)",
	border: "1px solid var(--color-line)",
	color: "var(--color-ink)",
	borderRadius: 6,
	padding: "6px 10px",
	fontFamily: "inherit",
	fontSize: 12,
	cursor: "pointer",
};

type PairingRowProps = {
	pairing: CockpitPairing;
	idx: number;
	venues: VenueOption[];
	presentTeams: TeamWithAttendance[];
	allPairings: CockpitPairing[];
	recentPairKeys: Set<string>;
	onChangeTeam: (idx: number, role: "home" | "away", teamId: string) => void;
	onSwap: (idx: number) => void;
	onDelete: (idx: number) => void;
	onVenueChange: (idx: number, venueId: string) => void;
	onTimeChange: (idx: number, time: string) => void;
	disabled?: boolean;
	revealing?: boolean;
	revealDelayMs?: number;
};

function toPairingDraft(p: CockpitPairing) {
	return { homeTeamId: p.homeTeamId, awayTeamId: p.awayTeamId };
}

export function PairingRow({
	pairing,
	idx,
	venues,
	presentTeams,
	allPairings,
	recentPairKeys,
	onChangeTeam,
	onSwap,
	onDelete,
	onVenueChange,
	onTimeChange,
	disabled = false,
	revealing = false,
	revealDelayMs = 0,
}: PairingRowProps) {
	// Usar los slots del venue asignado; si no hay venue, unión de todos los venues
	const assignedVenue = venues.find((v) => v.id === pairing.venueId);
	const allVenueSlots = [...new Set(venues.flatMap((v) => v.slots))].sort();
	const fallbackSlots = allVenueSlots.length ? allVenueSlots : DEFAULT_TIME_SLOTS;
	const timeSlots = assignedVenue?.slots.length ? assignedVenue.slots : fallbackSlots;
	const draftPairings = allPairings.map(toPairingDraft);

	return (
		<tr
			style={{
				borderTop: "1px solid var(--color-line)",
				background: pairing.isConflict ? "rgba(248,113,113,0.04)" : "transparent",
				...(revealing
					? {
							opacity: 0,
							animation: "sorteoRowIn 0.5s cubic-bezier(0.2,0.8,0.2,1) forwards",
							animationDelay: `${revealDelayMs}ms`,
						}
					: undefined),
			}}
		>
			<td
				style={{
					...tdStyle,
					color: "var(--color-ink-3)",
					fontFamily: "var(--font-mono)",
					fontSize: 11,
				}}
			>
				{String(idx + 1).padStart(2, "0")}
			</td>
			<td style={{ ...tdStyle, textAlign: "right" }}>
				<TeamPicker
					value={pairing.homeTeamId}
					onChange={(tid) => onChangeTeam(idx, "home", tid)}
					presentTeams={presentTeams}
					pairings={draftPairings}
					currentPairingIdx={idx}
					recentPairKeys={recentPairKeys}
					opponentId={pairing.awayTeamId}
					slotIsEmpty={!pairing.homeTeamId}
					align="right"
					disabled={disabled}
				/>
			</td>
			<td style={{ ...tdStyle, textAlign: "center", color: "var(--color-ink-3)", fontSize: 10 }}>
				vs
			</td>
			<td style={tdStyle}>
				<TeamPicker
					value={pairing.awayTeamId ?? ""}
					onChange={(tid) => onChangeTeam(idx, "away", tid)}
					presentTeams={presentTeams}
					pairings={draftPairings}
					currentPairingIdx={idx}
					recentPairKeys={recentPairKeys}
					opponentId={pairing.homeTeamId}
					slotIsEmpty={!pairing.awayTeamId}
					disabled={disabled}
				/>
			</td>
			<td style={tdStyle}>
				<select
					style={selectStyle}
					value={pairing.venueId ?? ""}
					disabled={disabled}
					onChange={(e) => onVenueChange(idx, e.target.value)}
				>
					<option value="">Sin cancha</option>
					{venues.map((v) => (
						<option key={v.id} value={v.id}>
							{v.name}
						</option>
					))}
				</select>
			</td>
			<td style={tdStyle}>
				<select
					style={selectStyle}
					value={pairing.startTime ?? ""}
					disabled={disabled}
					onChange={(e) => onTimeChange(idx, e.target.value)}
				>
					<option value="">--</option>
					{timeSlots.map((h) => (
						<option key={h} value={h}>
							{h}
						</option>
					))}
				</select>
			</td>
			<td style={tdStyle}>
				<div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
					<button
						className="btn-ghost"
						onClick={() => onSwap(idx)}
						style={{ padding: "4px 7px" }}
						title="Intercambiar local/visita"
						disabled={disabled}
					>
						<ArrowLeftRight size={11} />
					</button>
					<button
						className="btn-ghost danger"
						onClick={() => onDelete(idx)}
						style={{ padding: "4px 7px" }}
						title="Eliminar partido"
						disabled={disabled}
					>
						<Trash2 size={11} />
					</button>
				</div>
			</td>
		</tr>
	);
}
