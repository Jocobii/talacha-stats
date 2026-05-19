"use client";

import { useRef } from "react";
import { Clock, RefreshCw, Calendar, Info } from "lucide-react";
import { ParamRow } from "./ParamRow";
import { ParametrosWizard } from "./ParametrosWizard";
import { COCKPIT_DEBOUNCE_MS } from "../constants";
import type { CockpitConfig } from "../types";

type ParametrosTabProps = {
	leagueId: string;
	config: CockpitConfig | null;
	onConfigChange: (c: Partial<CockpitConfig>) => void;
	onSave?: () => void;
};

export function ParametrosTab({ leagueId, config, onConfigChange, onSave }: ParametrosTabProps) {
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	function handleChange(partial: Partial<CockpitConfig>) {
		onConfigChange(partial);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			if (!config) return;
			const updated = { ...config, ...partial };
			await fetch(`/api/leagues/${leagueId}/scheduling-config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					matchDurationMinutes: updated.matchDurationMinutes,
					bufferMinutes: updated.bufferMinutes,
					noRepeatWithin: updated.noRepeatWithin,
					regularMatchdays: updated.regularMatchdays,
					regularFormat: "single",
					allowDuplicateMatchups: false,
				}),
			});
		}, COCKPIT_DEBOUNCE_MS);
	}

	if (!config) {
		return <ParametrosWizard leagueId={leagueId} onSave={onSave ?? (() => {})} />;
	}

	return (
		<div style={{ padding: "18px 20px 24px" }}>
			<div style={{ marginBottom: 14 }}>
				<h3
					style={{
						margin: 0,
						fontFamily: "var(--font-display)",
						fontWeight: 800,
						fontSize: 16,
						letterSpacing: "-0.01em",
					}}
				>
					Parametros del sorteo
				</h3>
				<div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 4, lineHeight: 1.45 }}>
					Estos valores se aplican a todos los sorteos de la liga.
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				<ParamRow
					icon={<Clock size={13} />}
					label="Duracion del partido"
					help="Tiempo total del partido, incluyendo medio tiempo."
					value={config.matchDurationMinutes}
					unit="min"
					onChange={(v) => handleChange({ matchDurationMinutes: v })}
				/>
				<ParamRow
					icon={<Clock size={13} />}
					label="Buffer entre partidos"
					help="Tiempo de transicion entre dos partidos en la misma cancha."
					value={config.bufferMinutes}
					unit="min"
					onChange={(v) => handleChange({ bufferMinutes: v })}
				/>
				<ParamRow
					icon={<RefreshCw size={13} />}
					label="Sin repetir rival en"
					help="El sorteo evitara enfrentar a los mismos dos equipos dentro de esta ventana."
					value={config.noRepeatWithin}
					unit="jornadas"
					highlight
					onChange={(v) => handleChange({ noRepeatWithin: v })}
				/>
				<ParamRow
					icon={<Calendar size={13} />}
					label="Jornadas regulares"
					help="Cuantas jornadas tiene esta temporada antes de playoffs."
					value={config.regularMatchdays}
					unit="jornadas"
					onChange={(v) => handleChange({ regularMatchdays: v })}
				/>
			</div>

			<div
				style={{
					marginTop: 22,
					padding: "12px 14px",
					background: "rgba(96,165,250,0.06)",
					border: "1px solid rgba(96,165,250,0.25)",
					borderRadius: 8,
					display: "flex",
					gap: 10,
				}}
			>
				<Info size={14} color="var(--color-blue)" />
				<div style={{ fontSize: 11.5, color: "var(--color-ink-2)", lineHeight: 1.5 }}>
					Cambiar estos parametros{" "}
					<b style={{ color: "var(--color-ink)" }}>no afecta jornadas ya publicadas</b>. Solo aplica
					a partir del siguiente sorteo.
				</div>
			</div>
		</div>
	);
}
