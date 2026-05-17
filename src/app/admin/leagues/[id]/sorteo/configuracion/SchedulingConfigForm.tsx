"use client";

/**
 * SchedulingConfigForm — PUT /api/leagues/[id]/scheduling-config
 * Permite configurar jornadas, duración de partido, buffer y duplicados.
 */

import { useState } from "react";
import { Save, Loader2, Info } from "lucide-react";
import type { LeagueSchedulingConfig } from "@/db/schema";

type Props = {
	leagueId: string;
	teamCount: number;
	initialConfig: LeagueSchedulingConfig | null;
};

export function SchedulingConfigForm({ leagueId, teamCount, initialConfig }: Props) {
	const defaultMatchdays = teamCount > 1 ? teamCount - 1 : 1;

	const [matchdays, setMatchdays] = useState(initialConfig?.regularMatchdays ?? defaultMatchdays);
	const [duration, setDuration] = useState(initialConfig?.matchDurationMinutes ?? 50);
	const [buffer, setBuffer] = useState(initialConfig?.bufferMinutes ?? 0);
	const [allowDuplicates, setAllowDuplicates] = useState(
		initialConfig?.allowDuplicateMatchups ?? false,
	);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			const res = await fetch(`/api/leagues/${leagueId}/scheduling-config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					regularMatchdays: matchdays,
					regularFormat: "single",
					matchDurationMinutes: duration,
					bufferMinutes: buffer,
					allowDuplicateMatchups: allowDuplicates,
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Error al guardar");
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
		} finally {
			setSaving(false);
		}
	}

	return (
		<section className="bg-surface rounded-lg shadow">
			<div className="px-5 py-4 border-b border-line">
				<h2 className="font-semibold text-ink">Parámetros del sorteo</h2>
				<p className="text-xs text-ink-2 mt-0.5">
					{teamCount} equipo{teamCount !== 1 ? "s" : ""} registrados en la liga
				</p>
			</div>
			<form onSubmit={handleSubmit} className="p-5 space-y-5">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-ink">Jornadas regulares</label>
						<input
							type="number"
							min={1}
							max={99}
							value={matchdays}
							onChange={(e) => setMatchdays(Number(e.target.value))}
							className="border border-line rounded px-3 py-2 text-sm"
						/>
						<p className="text-xs text-ink-3">
							Round-robin simple: {defaultMatchdays} jornada{defaultMatchdays !== 1 ? "s" : ""}
						</p>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-ink">Duración del partido (min)</label>
						<input
							type="number"
							min={10}
							max={120}
							step={5}
							value={duration}
							onChange={(e) => setDuration(Number(e.target.value))}
							className="border border-line rounded px-3 py-2 text-sm"
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-ink">Buffer entre partidos (min)</label>
						<input
							type="number"
							min={0}
							max={60}
							step={5}
							value={buffer}
							onChange={(e) => setBuffer(Number(e.target.value))}
							className="border border-line rounded px-3 py-2 text-sm"
						/>
						<p className="text-xs text-ink-3">Tiempo de limpieza entre juegos</p>
					</div>
				</div>

				<div className="flex items-start gap-3 bg-surface-2 rounded-lg p-3">
					<Info size={16} className="text-ink-3 mt-0.5 shrink-0" />
					<div className="flex-1">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={allowDuplicates}
								onChange={(e) => setAllowDuplicates(e.target.checked)}
								className="rounded"
							/>
							<span className="text-sm font-medium text-ink">
								Permitir enfrentamientos repetidos en overrides
							</span>
						</label>
						<p className="text-xs text-ink-3 mt-1">
							Si está activo, los swaps manuales post-sorteo pueden crear pares ya jugados en fase
							regular.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="submit"
						disabled={saving}
						className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
					>
						{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
						Guardar configuración
					</button>
					{saved && <span className="text-sm text-green-600">✓ Guardado</span>}
					{error && <span className="text-sm text-red-500">{error}</span>}
				</div>
			</form>
		</section>
	);
}
