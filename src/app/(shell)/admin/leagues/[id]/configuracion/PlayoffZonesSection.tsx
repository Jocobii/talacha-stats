"use client";
/**
 * configuracion/PlayoffZonesSection.tsx
 *
 * Sección de configuración de zonas de clasificación (Liguilla, Copa…).
 * Permite agregar, visualizar y eliminar zonas. ≤ 150 líneas.
 */
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { getZoneTokens } from "@/shared/lib/zone-colors";

export type ZoneRow = {
	id: string;
	name: string;
	fromPosition: number;
	toPosition: number;
	color: string;
	order: number;
};

type Props = {
	leagueId: string;
	initialZones: ZoneRow[];
};

const COLOR_OPTIONS = [
	{ value: "green", label: "Verde" },
	{ value: "blue", label: "Azul" },
	{ value: "amber", label: "Dorado" },
	{ value: "rose", label: "Rojo" },
	{ value: "purple", label: "Morado" },
	{ value: "orange", label: "Naranja" },
	{ value: "cyan", label: "Cyan" },
] as const;

const EMPTY_FORM = { name: "", fromPosition: "", toPosition: "", color: "green" };

export function PlayoffZonesSection({ leagueId, initialZones }: Props) {
	const [zones, setZones] = useState<ZoneRow[]>(initialZones);
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleAdd = async () => {
		setError(null);
		const from = parseInt(form.fromPosition, 10);
		const to = parseInt(form.toPosition, 10);

		if (!form.name.trim() || isNaN(from) || isNaN(to)) {
			setError("Completa todos los campos.");
			return;
		}
		if (from > to) {
			setError("La posición inicial debe ser menor o igual a la final.");
			return;
		}

		setLoading(true);
		const res = await fetch(`/api/leagues/${leagueId}/playoff-zones`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: form.name.trim(),
				fromPosition: from,
				toPosition: to,
				color: form.color,
				order: zones.length,
			}),
		});

		const json = await res.json();
		setLoading(false);

		if (!res.ok) {
			setError(json.error ?? "Error al crear zona.");
			return;
		}

		setZones((prev) => [...prev, json.data]);
		setForm(EMPTY_FORM);
	};

	const handleDelete = async (id: string) => {
		setError(null);
		const res = await fetch(`/api/leagues/${leagueId}/playoff-zones/${id}`, {
			method: "DELETE",
		});
		if (!res.ok) {
			setError("Error al eliminar zona.");
			return;
		}
		setZones((prev) => prev.filter((z) => z.id !== id));
	};

	return (
		<div className="bg-surface rounded-lg shadow p-4 space-y-4">
			<div>
				<h2 className="text-sm font-semibold text-ink">Zonas de clasificación</h2>
				<p className="text-xs text-ink-2 mt-1">
					Define grupos de posiciones con nombre y color (Liguilla, Copa, Descenso…). Aparecerán
					visibles en la tabla pública.
				</p>
			</div>

			{/* Lista de zonas existentes */}
			{zones.length > 0 && (
				<ul className="space-y-1.5">
					{zones.map((z) => {
						const tokens = getZoneTokens(z.color);
						return (
							<li
								key={z.id}
								className="flex items-center gap-2 bg-surface-2 border border-line rounded px-3 py-2"
							>
								<span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tokens.dot}`} />
								<span className="text-sm font-medium text-ink flex-1">{z.name}</span>
								<span className="text-xs text-ink-3 tabular-nums">
									{z.fromPosition === z.toPosition
										? `Pos. ${z.fromPosition}`
										: `Pos. ${z.fromPosition}–${z.toPosition}`}
								</span>
								<button
									onClick={() => handleDelete(z.id)}
									className="ml-1 text-ink-3 hover:text-rose transition-colors"
									aria-label="Eliminar zona"
								>
									<Trash2 size={14} />
								</button>
							</li>
						);
					})}
				</ul>
			)}

			{/* Formulario para nueva zona */}
			<div className="space-y-2">
				<p className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Nueva zona</p>
				<div className="flex gap-2 flex-wrap">
					<input
						type="text"
						placeholder="Nombre (ej. Liguilla)"
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						className="flex-1 min-w-[130px] text-sm bg-surface-2 border border-line rounded px-2.5 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
					/>
					<input
						type="number"
						min={1}
						placeholder="De"
						value={form.fromPosition}
						onChange={(e) => setForm((f) => ({ ...f, fromPosition: e.target.value }))}
						className="w-16 text-sm bg-surface-2 border border-line rounded px-2 py-1.5 text-ink text-center focus:outline-none focus:ring-2 focus:ring-brand/30"
					/>
					<input
						type="number"
						min={1}
						placeholder="A"
						value={form.toPosition}
						onChange={(e) => setForm((f) => ({ ...f, toPosition: e.target.value }))}
						className="w-16 text-sm bg-surface-2 border border-line rounded px-2 py-1.5 text-ink text-center focus:outline-none focus:ring-2 focus:ring-brand/30"
					/>
					<select
						value={form.color}
						onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
						className="text-sm bg-surface-2 border border-line rounded px-2 py-1.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
					>
						{COLOR_OPTIONS.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</select>
					<button
						onClick={handleAdd}
						disabled={loading}
						className="flex items-center gap-1.5 bg-brand hover:bg-brand-dim text-pitch text-sm font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
					>
						<Plus size={14} />
						Agregar
					</button>
				</div>
				{error && <p className="text-xs text-rose">{error}</p>}
			</div>
		</div>
	);
}
