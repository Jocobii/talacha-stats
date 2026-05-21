"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { pairKey } from "@/features/scheduling/lib/pair-key";
import type { TeamWithAttendance, CockpitPairing } from "../types";

type AddPairingModalProps = {
	presentTeams: TeamWithAttendance[];
	existingPairings: CockpitPairing[];
	recentPairKeys: Set<string>;
	regularMatchdays: number;
	onAdd: (homeTeamId: string, awayTeamId: string) => void;
	onClose: () => void;
};

function countCurrentMatches(pairings: CockpitPairing[], teamId: string): number {
	return pairings.filter(
		(p) => (p.homeTeamId === teamId && p.awayTeamId !== null) || p.awayTeamId === teamId,
	).length;
}

function validatePairing(
	homeId: string,
	awayId: string,
	teams: TeamWithAttendance[],
	pairings: CockpitPairing[],
	recentPairKeys: Set<string>,
	regularMatchdays: number,
): string | null {
	if (!homeId || !awayId) return null;
	if (homeId === awayId) return "Un equipo no puede jugar contra sí mismo.";

	const key = pairKey(homeId, awayId);
	const alreadyInJornada = pairings.some(
		(p) => p.awayTeamId !== null && pairKey(p.homeTeamId, p.awayTeamId) === key,
	);
	if (alreadyInJornada) return "Estos equipos ya se enfrentan en esta jornada.";
	if (recentPairKeys.has(key)) return "Estos equipos se enfrentaron en una jornada reciente.";

	const homeTeam = teams.find((t) => t.id === homeId);
	if (homeTeam) {
		const total = homeTeam.matchesPlayed + countCurrentMatches(pairings, homeId);
		if (total >= regularMatchdays)
			return `${homeTeam.name} ya alcanzó el máximo de ${regularMatchdays} partidos.`;
	}

	const awayTeam = teams.find((t) => t.id === awayId);
	if (awayTeam) {
		const total = awayTeam.matchesPlayed + countCurrentMatches(pairings, awayId);
		if (total >= regularMatchdays)
			return `${awayTeam.name} ya alcanzó el máximo de ${regularMatchdays} partidos.`;
	}

	return null;
}

const overlayStyle: React.CSSProperties = {
	position: "fixed",
	inset: 0,
	background: "rgba(0,0,0,0.65)",
	zIndex: 100,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
	background: "var(--color-surface)",
	border: "1px solid var(--color-line)",
	borderRadius: 12,
	padding: 24,
	width: 380,
	display: "flex",
	flexDirection: "column",
	gap: 16,
};

const labelStyle: React.CSSProperties = {
	fontSize: 11,
	color: "var(--color-ink-3)",
	textTransform: "uppercase",
	letterSpacing: "0.1em",
	marginBottom: 6,
	display: "block",
};

const selectStyle: React.CSSProperties = {
	background: "var(--color-pitch)",
	border: "1px solid var(--color-line)",
	color: "var(--color-ink)",
	borderRadius: 8,
	padding: "8px 12px",
	fontFamily: "inherit",
	fontSize: 13,
	width: "100%",
	cursor: "pointer",
};

export function AddPairingModal({
	presentTeams,
	existingPairings,
	recentPairKeys,
	regularMatchdays,
	onAdd,
	onClose,
}: AddPairingModalProps) {
	const [homeId, setHomeId] = useState("");
	const [awayId, setAwayId] = useState("");

	const error = useMemo(
		() =>
			validatePairing(
				homeId,
				awayId,
				presentTeams,
				existingPairings,
				recentPairKeys,
				regularMatchdays,
			),
		[homeId, awayId, presentTeams, existingPairings, recentPairKeys, regularMatchdays],
	);

	const bothSelected = homeId !== "" && awayId !== "";
	const canAdd = bothSelected && error === null;

	const handleAdd = () => {
		if (!canAdd) return;
		onAdd(homeId, awayId);
		onClose();
	};

	return (
		<div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div style={cardStyle}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<h3
						style={{
							margin: 0,
							fontFamily: "var(--font-display)",
							fontWeight: 800,
							fontSize: 16,
						}}
					>
						Agregar partido manual
					</h3>
					<button
						className="btn-ghost"
						onClick={onClose}
						style={{ padding: "4px 7px" }}
						title="Cerrar"
					>
						<X size={14} />
					</button>
				</div>

				<div>
					<label style={labelStyle}>Local</label>
					<select style={selectStyle} value={homeId} onChange={(e) => setHomeId(e.target.value)}>
						<option value="">Seleccionar equipo…</option>
						{presentTeams.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
								{t.matchesPlayed > 0 ? ` (${t.matchesPlayed} jornadas)` : ""}
							</option>
						))}
					</select>
				</div>

				<div>
					<label style={labelStyle}>Visita</label>
					<select style={selectStyle} value={awayId} onChange={(e) => setAwayId(e.target.value)}>
						<option value="">Seleccionar equipo…</option>
						{presentTeams.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
								{t.matchesPlayed > 0 ? ` (${t.matchesPlayed} jornadas)` : ""}
							</option>
						))}
					</select>
				</div>

				{bothSelected && error && (
					<div
						style={{
							fontSize: 12,
							color: "var(--color-rose)",
							background: "rgba(248,113,113,0.08)",
							border: "1px solid rgba(248,113,113,0.2)",
							borderRadius: 6,
							padding: "8px 10px",
						}}
					>
						⚠ {error}
					</div>
				)}

				{bothSelected && !error && (
					<div
						style={{
							fontSize: 12,
							color: "var(--color-brand)",
							background: "rgba(0,230,118,0.06)",
							border: "1px solid rgba(0,230,118,0.2)",
							borderRadius: 6,
							padding: "8px 10px",
						}}
					>
						✓ Partido válido — se puede agregar
					</div>
				)}

				<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
					<button className="btn-ghost" onClick={onClose}>
						Cancelar
					</button>
					<button className="btn-primary" onClick={handleAdd} disabled={!canAdd}>
						Agregar partido
					</button>
				</div>
			</div>
		</div>
	);
}
