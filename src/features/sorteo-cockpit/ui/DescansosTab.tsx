"use client";

import { useState } from "react";
import { Trash2, Plus, Moon } from "lucide-react";
import { TeamBadge } from "@/shared/ui";
import type { TeamWithAttendance } from "../types";

type DescansosTabProps = {
	leagueId: string;
	matchdayNumber: number | null;
	teams: TeamWithAttendance[];
	onAttendanceChange?: (teamId: string, status: "presente" | "ausente") => void;
};

const inputStyle: React.CSSProperties = {
	background: "var(--color-pitch)",
	border: "1px solid var(--color-line)",
	color: "var(--color-ink)",
	borderRadius: 6,
	padding: "8px 10px",
	fontSize: 13,
	fontFamily: "inherit",
	width: "100%",
};

function AbsentCard({
	team,
	onRemove,
}: {
	team: TeamWithAttendance;
	onRemove: (id: string) => void;
}) {
	return (
		<div
			className="surface-card-2"
			style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}
		>
			<div
				style={{
					width: 30,
					height: 30,
					borderRadius: 6,
					background: "rgba(251,191,36,0.12)",
					display: "grid",
					placeItems: "center",
				}}
			>
				<Moon size={14} color="var(--color-amber)" />
			</div>
			<TeamBadge
				teamId={team.id}
				name={team.name}
				color={team.color}
				short={team.short}
				size="sm"
			/>
			<div style={{ flex: 1 }}>
				<div style={{ fontSize: 13, color: "var(--color-ink)" }}>{team.name}</div>
				{team.restReason && (
					<div style={{ fontSize: 11, color: "var(--color-ink-3)", marginTop: 2 }}>
						{team.restReason}
					</div>
				)}
			</div>
			<button
				className="btn-ghost danger"
				style={{ padding: "4px 7px" }}
				onClick={() => onRemove(team.id)}
			>
				<Trash2 size={11} />
			</button>
		</div>
	);
}

export function DescansosTab({
	leagueId,
	matchdayNumber,
	teams,
	onAttendanceChange,
}: DescansosTabProps) {
	const [showForm, setShowForm] = useState(false);
	const [teamId, setTeamId] = useState("");
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const absent = teams.filter((t) => t.status === "ausente");
	const present = teams.filter((t) => t.status === "presente");

	async function patch(id: string, status: "presente" | "ausente", r?: string) {
		if (!matchdayNumber) return;
		await fetch(`/api/leagues/${leagueId}/jornadas/${matchdayNumber}/attendance`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ teamId: id, status, reason: r }),
		});
		onAttendanceChange?.(id, status);
	}

	async function handleAdd() {
		if (!teamId) return;
		setSubmitting(true);
		try {
			await patch(teamId, "ausente", reason || undefined);
			setTeamId("");
			setReason("");
			setShowForm(false);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div style={{ padding: "18px 20px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 12,
					marginBottom: 14,
				}}
			>
				<div>
					<h3
						style={{
							margin: 0,
							fontFamily: "var(--font-display)",
							fontWeight: 800,
							fontSize: 16,
							letterSpacing: "-0.01em",
						}}
					>
						Descansos solicitados
					</h3>
					<div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4 }}>
						Equipos que no jugaran esta jornada.
					</div>
				</div>
				<button
					className="btn-ghost"
					style={{ padding: "6px 10px", fontSize: 12 }}
					onClick={() => setShowForm((v) => !v)}
				>
					<Plus size={11} /> Nuevo
				</button>
			</div>

			{showForm && (
				<div
					className="surface-card-2"
					style={{
						padding: 12,
						marginBottom: 12,
						display: "flex",
						flexDirection: "column",
						gap: 10,
					}}
				>
					<select style={inputStyle} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
						<option value="">Seleccionar equipo...</option>
						{present.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
					<input
						type="text"
						placeholder="Razon (opcional)"
						style={inputStyle}
						value={reason}
						onChange={(e) => setReason(e.target.value)}
					/>
					<div style={{ display: "flex", gap: 8 }}>
						<button className="btn-primary" onClick={handleAdd} disabled={!teamId || submitting}>
							Agregar
						</button>
						<button className="btn-ghost" onClick={() => setShowForm(false)}>
							Cancelar
						</button>
					</div>
				</div>
			)}

			{absent.length === 0 ? (
				<div
					style={{
						color: "var(--color-ink-3)",
						fontSize: 13,
						textAlign: "center",
						padding: "24px 0",
					}}
				>
					No hay descansos para esta jornada.
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					{absent.map((t) => (
						<AbsentCard key={t.id} team={t} onRemove={(id) => patch(id, "presente")} />
					))}
				</div>
			)}
		</div>
	);
}
