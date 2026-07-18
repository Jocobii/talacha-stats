"use client";

import { useState } from "react";
import { Clock, RefreshCw, Calendar, Repeat } from "lucide-react";
import { ParamRow } from "./ParamRow";
import { ParamCheckboxRow } from "./ParamCheckboxRow";
import { useSaveSchedulingConfig } from "../model/useSaveSchedulingConfig";
import {
	DEFAULT_MATCH_DURATION_MINUTES,
	DEFAULT_BUFFER_MINUTES,
	DEFAULT_REGULAR_MATCHDAYS,
} from "@/features/scheduling/constants";
import type { CockpitConfig } from "../types";

type ParametrosWizardProps = {
	leagueId: string;
	onSave: () => void;
};

// Defaults del sistema — solo aplican cuando la liga no tiene organización o
// la organización nunca configuró su plantilla de sorteo (seedLeagueSchedulingConfig
// no-opeó). Con org configurada, la liga ya nace con fila propia y este wizard
// no se muestra (§ ParametrosTab).
const DEFAULTS: CockpitConfig = {
	matchDurationMinutes: DEFAULT_MATCH_DURATION_MINUTES,
	bufferMinutes: DEFAULT_BUFFER_MINUTES,
	noRepeatWithin: 3,
	regularMatchdays: DEFAULT_REGULAR_MATCHDAYS,
	allowDuplicateMatchups: false,
};

export function ParametrosWizard({ leagueId, onSave }: ParametrosWizardProps) {
	const [form, setForm] = useState<CockpitConfig>(DEFAULTS);
	const saveConfig = useSaveSchedulingConfig(leagueId);

	function patch(partial: Partial<CockpitConfig>) {
		setForm((prev) => ({ ...prev, ...partial }));
	}

	function handleSave() {
		saveConfig.mutate(form, { onSuccess: onSave });
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
				<ParamCheckboxRow
					icon={<Repeat size={13} />}
					label="Permitir rivales repetidos"
					help="Ignora el límite de jornadas según el número de equipos. Útil si el número de equipos crecerá durante la temporada."
					checked={form.allowDuplicateMatchups}
					onChange={(v) => patch({ allowDuplicateMatchups: v })}
				/>
			</div>

			<button
				className="btn-primary"
				style={{ width: "100%", justifyContent: "center" }}
				onClick={handleSave}
				disabled={saveConfig.isPending}
			>
				{saveConfig.isPending ? "Guardando…" : "Guardar y continuar →"}
			</button>
			{saveConfig.isError && (
				<p style={{ fontSize: 12, color: "var(--color-rose)", marginTop: 10 }}>
					{saveConfig.error.message}
				</p>
			)}
		</div>
	);
}
