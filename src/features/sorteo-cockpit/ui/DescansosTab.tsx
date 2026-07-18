"use client";

import { useState } from "react";
import { Trash2, Plus, Moon } from "lucide-react";
import { TeamBadge } from "@/shared/ui";
import { Stack, Inline, Center } from "@/shared/ui/layout";
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
		<Inline align="center" gap="md" className="surface-card-2 p-3">
			<Center
				className="h-[30px] w-[30px] rounded-md"
				style={{ background: "rgba(251,191,36,0.12)" }}
			>
				<Moon size={14} color="var(--color-amber)" />
			</Center>
			<TeamBadge
				teamId={team.id}
				name={team.name}
				color={team.color}
				short={team.short}
				size="sm"
			/>
			<div className="flex-1">
				<div style={{ fontSize: 13, color: "var(--color-ink)" }}>{team.name}</div>
				{team.restReason && (
					<div className="mt-0.5" style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
						{team.restReason}
					</div>
				)}
			</div>
			<button className="btn-ghost danger px-[7px] py-1" onClick={() => onRemove(team.id)}>
				<Trash2 size={11} />
			</button>
		</Inline>
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
		<div className="px-5 py-[18px]">
			<Inline align="start" justify="between" gap="md" className="mb-3.5">
				<div>
					<h3
						className="m-0"
						style={{
							fontFamily: "var(--font-display)",
							fontWeight: 800,
							fontSize: 16,
							letterSpacing: "-0.01em",
						}}
					>
						Descansos solicitados
					</h3>
					<div className="mt-1" style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
						Equipos que no jugaran esta jornada.
					</div>
				</div>
				<button
					className="btn-ghost px-2.5 py-1.5"
					style={{ fontSize: 12 }}
					onClick={() => setShowForm((v) => !v)}
				>
					<Plus size={11} /> Nuevo
				</button>
			</Inline>

			{showForm && (
				<Stack gap="sm" className="surface-card-2 mb-3 p-3">
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
					<Inline gap="sm">
						<button className="btn-primary" onClick={handleAdd} disabled={!teamId || submitting}>
							Agregar
						</button>
						<button className="btn-ghost" onClick={() => setShowForm(false)}>
							Cancelar
						</button>
					</Inline>
				</Stack>
			)}

			{absent.length === 0 ? (
				<div className="py-6 text-center" style={{ color: "var(--color-ink-3)", fontSize: 13 }}>
					No hay descansos para esta jornada.
				</div>
			) : (
				<Stack gap="sm">
					{absent.map((t) => (
						<AbsentCard key={t.id} team={t} onRemove={(id) => patch(id, "presente")} />
					))}
				</Stack>
			)}
		</div>
	);
}
