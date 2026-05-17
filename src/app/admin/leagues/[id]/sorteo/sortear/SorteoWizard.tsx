"use client";

/**
 * SorteoWizard — Genera preview del sorteo y permite confirmarlo.
 * T4.7: muestra matchdays, conflictos, partidos sin slot, y botón de confirmar.
 */

import { useState } from "react";
import Link from "next/link";
import { Shuffle, Eye, CheckCircle2, AlertTriangle, Loader2, Calendar } from "lucide-react";
import { PreviewMatchdayList } from "./PreviewMatchdayList";

type Pairing = {
	matchdayNumber: number;
	homeTeamId: string;
	awayTeamId: string | null | undefined;
};
type Matchday = { number: number; pairings: Pairing[] };
type Conflict = { teamId: string; message: string };

type PreviewResult = {
	seed: number;
	startDate: string;
	teamCount: number;
	matchdays: Matchday[];
	conflicts: Conflict[];
	unassigned: Pairing[];
};

type Config = {
	regularMatchdays: number;
	matchDurationMinutes: number;
	bufferMinutes: number;
};

type Props = {
	leagueId: string;
	defaultStartDate: string;
	calendarHref: string;
	teamMap: Record<string, string>;
	config: Config;
};

type Step = "idle" | "previewing" | "preview_done" | "confirming" | "confirmed";

export function SorteoWizard({ leagueId, defaultStartDate, calendarHref, teamMap, config }: Props) {
	const [startDate, setStartDate] = useState(defaultStartDate);
	const [step, setStep] = useState<Step>("idle");
	const [preview, setPreview] = useState<PreviewResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const teamName = (id: string | null | undefined) =>
		id ? (teamMap[id] ?? id.slice(0, 8) + "…") : "—";
	const busy = step === "previewing" || step === "confirming";

	async function handlePreview() {
		setStep("previewing");
		setError(null);
		setPreview(null);
		try {
			const res = await fetch(`/api/leagues/${leagueId}/schedule/preview`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ startDate }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Error al generar preview");
			setPreview(json.data);
			setStep("preview_done");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
			setStep("idle");
		}
	}

	async function handleConfirm() {
		if (!preview) return;
		setStep("confirming");
		setError(null);
		try {
			const res = await fetch(`/api/leagues/${leagueId}/schedule/confirm`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ startDate, seed: preview.seed }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Error al confirmar sorteo");
			setStep("confirmed");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error inesperado");
			setStep("preview_done");
		}
	}

	if (step === "confirmed") {
		return (
			<div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center space-y-4">
				<CheckCircle2 className="mx-auto text-green-500" size={40} />
				<div>
					<p className="text-lg font-semibold text-green-800">¡Sorteo confirmado!</p>
					<p className="text-sm text-green-700 mt-1">El calendario ha sido guardado.</p>
				</div>
				<Link
					href={calendarHref}
					className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2 rounded-lg font-medium hover:bg-brand/90"
				>
					<Calendar size={16} /> Ver calendario
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Config summary */}
			<div className="bg-surface rounded-lg shadow p-5">
				<h2 className="font-semibold text-ink mb-3">Parámetros activos</h2>
				<div className="flex gap-6 text-sm text-ink-2 flex-wrap">
					<span>
						<b className="text-ink">{config.regularMatchdays}</b> jornadas
					</span>
					<span>
						<b className="text-ink">{config.matchDurationMinutes}</b> min / partido
					</span>
					<span>
						<b className="text-ink">{config.bufferMinutes}</b> min buffer
					</span>
				</div>
			</div>

			{/* Date + actions */}
			<div className="bg-surface rounded-lg shadow p-5">
				<h2 className="font-semibold text-ink mb-4">Fecha de inicio</h2>
				<div className="flex items-end gap-3 flex-wrap">
					<div className="flex flex-col gap-1">
						<label className="text-sm text-ink-2">Primera jornada</label>
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							disabled={busy}
							className="border border-line rounded px-3 py-2 text-sm"
						/>
					</div>
					<button
						onClick={handlePreview}
						disabled={busy || !startDate}
						className="flex items-center gap-2 bg-surface-2 border border-line text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-3 disabled:opacity-50"
					>
						{step === "previewing" ? (
							<Loader2 size={15} className="animate-spin" />
						) : (
							<Eye size={15} />
						)}
						{step === "preview_done" ? "Regenerar preview" : "Generar preview"}
					</button>
					{step === "preview_done" && (
						<button
							onClick={handleConfirm}
							className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90"
						>
							{step === ("confirming" as Step) ? (
								<Loader2 size={15} className="animate-spin" />
							) : (
								<Shuffle size={15} />
							)}
							Confirmar sorteo
						</button>
					)}
				</div>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex gap-2">
					<AlertTriangle size={16} className="shrink-0 mt-0.5" />
					{error}
				</div>
			)}

			{/* Warnings */}
			{preview && preview.conflicts.length > 0 && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
					<p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
						<AlertTriangle size={15} />
						{preview.conflicts.length} conflicto{preview.conflicts.length !== 1 ? "s" : ""} de
						horario comprado
					</p>
					{preview.conflicts.map((c, i) => (
						<p key={i} className="text-xs text-amber-700 ml-5">
							{c.message}
						</p>
					))}
				</div>
			)}
			{preview && preview.unassigned.length > 0 && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
					<p className="text-sm text-amber-800">
						<b>{preview.unassigned.length}</b> partido{preview.unassigned.length !== 1 ? "s" : ""}{" "}
						sin slot asignado — agrega más ventanas horarias
					</p>
				</div>
			)}

			{/* Matchday list */}
			{preview && (
				<PreviewMatchdayList
					matchdays={preview.matchdays}
					teamCount={preview.teamCount}
					seed={preview.seed}
					teamName={teamName}
					initialExpanded={1}
				/>
			)}
		</div>
	);
}
