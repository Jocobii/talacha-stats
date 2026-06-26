"use client";

/**
 * features/team-management/ui/CreateTeamModal.tsx
 *
 * Modal para registrar un nuevo equipo en una liga.
 * Llama POST /api/teams con { name, leagueId, color? }.
 * Devuelve control al padre mediante onSuccess / onClose.
 */

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/shared/ui/Modal";
import { apiFetch } from "@/shared/api/client";

// ── Constantes ────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
	"#e53e3e",
	"#dd6b20",
	"#d69e2e",
	"#38a169",
	"#3182ce",
	"#6b46c1",
	"#d53f8c",
	"#2d3748",
] as const;

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Props = {
	leagueId: string;
	leagueName: string;
	onSuccess: () => void;
	onClose: () => void;
};

// ── Componente ────────────────────────────────────────────────────────────────

export function CreateTeamModal({ leagueId, leagueName, onSuccess, onClose }: Props) {
	const [name, setName] = useState("");
	const [color, setColor] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const nameRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		nameRef.current?.focus();
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setError("El nombre del equipo es requerido.");
			return;
		}

		setSubmitting(true);
		setError("");

		try {
			const result = await apiFetch("/api/teams", {
				method: "POST",
				body: { name: trimmed, leagueId, color: color ?? undefined },
			});

			if (!result.ok) {
				setError(result.error ?? "Error al crear el equipo.");
				return;
			}

			onSuccess();
		} catch (networkError) {
			console.error("[CreateTeamModal] create", networkError);
			setError("Error de red. Intenta de nuevo.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Modal onClose={onClose} title="Nuevo equipo" size="sm">
			<form onSubmit={handleSubmit} className="p-5 space-y-5">
				{/* Liga */}
				<div className="bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm">
					<span className="text-ink-3 text-xs">Liga</span>
					<p className="font-medium text-ink truncate">{leagueName}</p>
				</div>

				{/* Nombre */}
				<div className="space-y-1.5">
					<label htmlFor="team-name" className="block text-sm font-medium text-ink">
						Nombre del equipo
					</label>
					<input
						id="team-name"
						ref={nameRef}
						type="text"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							setError("");
						}}
						placeholder="Ej. Deportivo FC"
						maxLength={100}
						disabled={submitting}
						className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:opacity-50"
					/>
				</div>

				{/* Color (opcional) */}
				<div className="space-y-2">
					<p className="text-sm font-medium text-ink">
						Color del equipo <span className="text-ink-3 font-normal">(opcional)</span>
					</p>
					<div className="flex flex-wrap gap-2 items-center">
						{COLOR_PRESETS.map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => setColor(color === c ? null : c)}
								disabled={submitting}
								className="w-7 h-7 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 disabled:opacity-50"
								style={{
									backgroundColor: c,
									borderColor: color === c ? "white" : "transparent",
									boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
								}}
								aria-label={`Color ${c}`}
							/>
						))}
						{color && (
							<button
								type="button"
								onClick={() => setColor(null)}
								disabled={submitting}
								className="text-xs text-ink-3 hover:text-ink transition px-2 py-1 rounded border border-line"
							>
								Quitar
							</button>
						)}
					</div>
				</div>

				{/* Error */}
				{error && (
					<p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
						{error}
					</p>
				)}

				{/* Acciones */}
				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
						className="flex-1 bg-surface-2 text-ink py-2.5 rounded-lg text-sm font-medium hover:bg-surface-2/80 transition disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={submitting || !name.trim()}
						className="flex-1 bg-brand text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand/90 transition disabled:opacity-40"
					>
						{submitting ? "Creando…" : "Crear equipo"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
