"use client";

import { useState } from "react";
import { Clock, RefreshCw, Calendar } from "lucide-react";
import { ParamRow } from "./ParamRow";
import type { CockpitConfig } from "../types";

type ParametrosWizardProps = {
	leagueId: string;
	onSave: () => void;
};

const DEFAULTS: CockpitConfig = {
	matchDurationMinutes: 60,
	bufferMinutes: 0,
	noRepeatWithin: 3,
	regularMatchdays: 14,
};

export function ParametrosWizard({ leagueId, onSave }: ParametrosWizardProps) {
	const [form, setForm] = useState<CockpitConfig>(DEFAULTS);
	const [saving, setSaving] = useState(false);

	function patch(partial: Partial<CockpitConfig>) {
		setForm((prev) => ({ ...prev, ...partial }));
	}

	async function handleSave() {
		setSaving(true);
		try {
			const res = await fetch(`/api/leagues/${leagueId}/scheduling-config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					regularFormat: "single",
					allowDuplicateMatchups: false,
				}),
			});
			if (res.ok) onSave();
		} finally {
			setSaving(false);
		}
	}

	return (
		<div style={{ padding: "18px 20px 24px" }}>
			<div style={{ marginBottom: 16 }}>
				<h3
					style={{
						margin: 0,
						fontFamily: "var(--font-display)",
						fontWeight: 800,
						fontSize: 16,
						letterSpacing: "-0.01em",
					}}
				>
					Primera configuración
				</h3>
				<div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4, lineHeight: 1.45 }}>
					Define los parámetros del sorteo antes de continuar. Podrás ajustarlos después.
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
				<ParamRow
					icon={<Clock size={13} />}
					label="Duración del partido"
					help="Tiempo total del partido, incluyendo medio tiempo."
					value={form.matchDurationMinutes}
					unit="min"
					onChange={(v) => patch({ matchDurationMinutes: v })}
				/>
				<ParamRow
					icon={<Clock size={13} />}
					label="Buffer entre partidos"
					help="Tiempo de transición entre dos partidos en la misma cancha."
					value={form.bufferMinutes}
					unit="min"
					onChange={(v) => patch({ bufferMinutes: v })}
				/>
				<ParamRow
					icon={<RefreshCw size={13} />}
					label="Sin repetir rival en"
					help="El sorteo evitará enfrentar a los mismos dos equipos dentro de esta ventana."
					value={form.noRepeatWithin}
					unit="jornadas"
					highlight
					onChange={(v) => patch({ noRepeatWithin: v })}
				/>
				<ParamRow
					icon={<Calendar size={13} />}
					label="Jornadas regulares"
					help="Cuántas jornadas tiene esta temporada antes de playoffs."
					value={form.regularMatchdays}
					unit="jornadas"
					onChange={(v) => patch({ regularMatchdays: v })}
				/>
			</div>

			<button
				className="btn-primary"
				style={{ width: "100%", justifyContent: "center" }}
				onClick={handleSave}
				disabled={saving}
			>
				{saving ? "Guardando…" : "Guardar y continuar →"}
			</button>
		</div>
	);
}
