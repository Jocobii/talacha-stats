"use client";

import { Lock } from "lucide-react";
import { TeamBadge, CheckPill } from "@/shared/ui";
import type { TeamWithAttendance } from "../types";

type RosterPanelProps = {
	teams: TeamWithAttendance[];
	onToggleAttendance: (teamId: string, status: "presente" | "ausente") => void;
	pairingCount: number;
	disabled?: boolean;
};

function TeamRow({
	team,
	onToggle,
	disabled,
}: {
	team: TeamWithAttendance;
	onToggle: (teamId: string, status: "presente" | "ausente") => void;
	disabled: boolean;
}) {
	const isPresent = team.status === "presente";
	const isAbsent = team.status === "ausente";

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				padding: "8px 6px",
				borderRadius: 8,
				borderBottom: "1px solid rgba(255,255,255,0.02)",
				opacity: isAbsent ? 0.55 : 1,
			}}
		>
			<TeamBadge
				teamId={team.id}
				name={team.name}
				color={team.color}
				short={team.short}
				showName={false}
				size="sm"
			/>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: 13,
						fontWeight: 500,
						color: "var(--color-ink)",
						lineHeight: 1.2,
						textDecoration: isAbsent ? "line-through" : "none",
					}}
				>
					{team.name}
				</div>
				{isAbsent && team.restReason && (
					<div style={{ fontSize: 11, color: "var(--color-rose)", marginTop: 2 }}>
						{team.restReason}
					</div>
				)}
				{team.purchasedSlot && !isAbsent && (
					<div
						style={{
							fontSize: 11,
							color: "var(--color-blue)",
							marginTop: 2,
							display: "flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						<Lock size={10} />
						Slot fijo · {team.purchasedSlot.venueName} {team.purchasedSlot.startTime}
					</div>
				)}
			</div>
			<div style={{ display: "flex", gap: 4 }}>
				<CheckPill
					checked={isPresent}
					onChange={() => onToggle(team.id, isPresent ? "ausente" : "presente")}
					label="✓"
					disabled={disabled}
				/>
				<CheckPill
					checked={isAbsent}
					onChange={() => onToggle(team.id, isAbsent ? "presente" : "ausente")}
					label="✗"
					danger
					disabled={disabled}
				/>
			</div>
		</div>
	);
}

export function RosterPanel({
	teams,
	onToggleAttendance,
	pairingCount,
	disabled = false,
}: RosterPanelProps) {
	const presentCount = teams.filter((t) => t.status === "presente").length;
	const absentCount = teams.filter((t) => t.status === "ausente").length;

	return (
		<section
			className="surface-card"
			style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}
		>
			<div style={{ padding: "14px 14px 8px", borderBottom: "1px solid var(--color-line)" }}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<h2
						style={{
							margin: 0,
							fontFamily: "var(--font-display)",
							fontWeight: 800,
							fontSize: 18,
							letterSpacing: "-0.01em",
						}}
					>
						Roster de jornada
					</h2>
					<button className="btn-ghost" style={{ padding: "5px 9px" }} disabled={disabled}>
						+ Equipo
					</button>
				</div>
				<div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
					<span className="chip brand">
						<b style={{ fontWeight: 700 }}>{presentCount}</b> presente
					</span>
					<span className="chip rose">{absentCount} ausente</span>
					<span className="chip">{pairingCount} partidos</span>
				</div>
			</div>

			<div style={{ flex: 1, overflow: "auto", padding: "8px 10px" }}>
				{teams.map((team) => (
					<TeamRow key={team.id} team={team} onToggle={onToggleAttendance} disabled={disabled} />
				))}
			</div>
		</section>
	);
}
