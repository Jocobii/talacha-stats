"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Users, MapPin, Trophy } from "lucide-react";
import { apiFetch } from "@/shared/api/client";

type Props = {
	leagueId: string;
	leagueName: string;
	teamCount: number;
	venueCount: number;
	zoneCount: number;
};

export default function NewSeasonButton({
	leagueId,
	leagueName,
	teamCount,
	venueCount,
	zoneCount,
}: Props) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [season, setSeason] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!season.trim()) {
			setError("Escribe el nombre de la temporada.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const result = await apiFetch<{ id: string }>(`/api/leagues/${leagueId}/new-season`, {
				method: "POST",
				body: { season: season.trim() },
			});
			if (!result.ok) {
				setError(result.error ?? "Error al crear la temporada.");
				return;
			}
			router.push(`/admin/leagues/${result.data.id}`);
		} catch (networkError) {
			console.error("[NewSeasonButton] new-season", networkError);
			setError("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	function handleCancel() {
		setOpen(false);
		setSeason("");
		setError("");
	}

	if (!open) {
		return (
			<button
				onClick={() => setOpen(true)}
				className="flex items-center gap-1.5 text-sm text-brand-ink hover:underline font-medium"
			>
				<Copy size={14} />
				Nueva temporada
			</button>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-brand/10 border border-brand/20 rounded-xl p-4 space-y-4"
		>
			<div>
				<p className="text-sm font-semibold text-ink">Nueva temporada de {leagueName}</p>
				<p className="text-xs text-ink-2 mt-1">
					Se copiará la configuración de la temporada actual. Los resultados y estadísticas
					anteriores se conservan bajo la liga actual.
				</p>
			</div>

			{/* Resumen de lo que se copia */}
			<div className="grid grid-cols-3 gap-2">
				<div className="bg-surface rounded-lg px-3 py-2 text-center">
					<Users size={14} className="mx-auto text-ink-2 mb-1" />
					<p className="text-sm font-bold text-ink">{teamCount}</p>
					<p className="text-[10px] text-ink-3 uppercase tracking-wide">Equipos</p>
				</div>
				<div className="bg-surface rounded-lg px-3 py-2 text-center">
					<MapPin size={14} className="mx-auto text-ink-2 mb-1" />
					<p className="text-sm font-bold text-ink">{venueCount}</p>
					<p className="text-[10px] text-ink-3 uppercase tracking-wide">Canchas</p>
				</div>
				<div className="bg-surface rounded-lg px-3 py-2 text-center">
					<Trophy size={14} className="mx-auto text-ink-2 mb-1" />
					<p className="text-sm font-bold text-ink">{zoneCount}</p>
					<p className="text-[10px] text-ink-3 uppercase tracking-wide">Zonas</p>
				</div>
			</div>

			<div>
				<label className="block text-xs font-medium text-ink-2 mb-1">
					Nombre de la temporada <span className="text-red-500">*</span>
				</label>
				<input
					autoFocus
					value={season}
					onChange={(e) => setSeason(e.target.value)}
					placeholder="Clausura 2025, Apertura 2026…"
					className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
				/>
			</div>

			{error && (
				<p className="text-red-500 text-xs bg-red-950/40 border border-red-800/30 px-3 py-2 rounded-lg">
					{error}
				</p>
			)}

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={loading || !season.trim()}
					className="bg-brand text-pitch px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Creando temporada…" : "Crear temporada"}
				</button>
				<button
					type="button"
					onClick={handleCancel}
					className="bg-surface-2 text-ink px-4 py-2 rounded-lg text-sm hover:bg-surface-3 border border-line"
				>
					Cancelar
				</button>
			</div>
		</form>
	);
}
