"use client";

/**
 * shared/ui/LeagueMemberEditor.tsx
 *
 * Formulario inline para editar los campos privados de una inscripción (league_member).
 * Solo visible para organizers en sus propias ligas.
 *
 * Llama a PATCH /api/players/[globalPlayerId]/member y refresca la página al guardar.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GlobalPlayerLeagueMember } from "@/entities/player";
import { apiFetch } from "@/shared/api/client";

type Props = {
	globalPlayerId: string;
	member: GlobalPlayerLeagueMember;
};

const STATUS_OPTIONS = [
	{ value: "active", label: "Activo" },
	{ value: "suspended", label: "Suspendido" },
	{ value: "inactive", label: "Inactivo" },
] as const;

export function LeagueMemberEditor({ globalPlayerId, member }: Props) {
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Form state — inicializado con valores actuales
	const [status, setStatus] = useState<"active" | "suspended" | "inactive">(member.status);
	const [dorsal, setDorsal] = useState<string>(member.dorsal != null ? String(member.dorsal) : "");
	const [notes, setNotes] = useState<string>(member.internalNotes ?? "");
	const [photoUrl, setPhotoUrl] = useState<string>(member.institutionPhotoUrl ?? "");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(false);

		const dorsalNum = dorsal.trim() === "" ? null : Number(dorsal);
		if (dorsal.trim() !== "" && (isNaN(dorsalNum!) || dorsalNum! < 1 || dorsalNum! > 99)) {
			setError("El dorsal debe ser un número entre 1 y 99.");
			setSaving(false);
			return;
		}

		try {
			const result = await apiFetch(`/api/players/${globalPlayerId}/member`, {
				method: "PATCH",
				body: {
					leagueMemberId: member.memberId,
					status,
					dorsal: dorsalNum,
					internalNotes: notes.trim() || null,
					institutionPhotoUrl: photoUrl.trim() || null,
				},
			});

			if (!result.ok) {
				setError(result.error ?? "Error al guardar.");
				return;
			}

			setSuccess(true);
			// Refrescar datos del servidor sin recargar la página completa
			router.refresh();
			setTimeout(() => {
				setSuccess(false);
				setOpen(false);
			}, 1500);
		} catch (networkError) {
			console.error("[LeagueMemberEditor] save", networkError);
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setSaving(false);
		}
	}

	function handleCancel() {
		// Restaurar valores originales
		setStatus(member.status);
		setDorsal(member.dorsal != null ? String(member.dorsal) : "");
		setNotes(member.internalNotes ?? "");
		setPhotoUrl(member.institutionPhotoUrl ?? "");
		setError(null);
		setSuccess(false);
		setOpen(false);
	}

	const statusColor: Record<string, string> = {
		active: "text-brand-ink",
		suspended: "text-yellow-400",
		inactive: "text-ink-3",
	};
	const statusLabel: Record<string, string> = {
		active: "Activo",
		suspended: "Suspendido",
		inactive: "Inactivo",
	};

	return (
		<div className="border-t border-line pt-3 mt-1">
			{!open ? (
				<div className="flex items-center justify-between">
					{/* Resumen del estado actual */}
					<div className="flex items-center gap-3 text-xs text-ink-3">
						<span className={`font-semibold ${statusColor[member.status]}`}>
							{statusLabel[member.status]}
						</span>
						{member.dorsal != null && (
							<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand/15 text-brand-ink font-black text-[10px]">
								{member.dorsal}
							</span>
						)}
						{member.internalNotes && <span title={member.internalNotes}>📝 Nota</span>}
						{member.institutionPhotoUrl && <span>📷 Foto</span>}
					</div>
					<button
						onClick={() => setOpen(true)}
						className="text-xs px-2.5 py-1 rounded-lg border border-line text-ink-2 hover:bg-surface-2 hover:text-ink transition font-medium"
					>
						Editar inscripción
					</button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-3 bg-surface-2 rounded-xl p-4">
					<p className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-1">
						Editar inscripción
					</p>

					{/* Estado */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs text-ink-2 mb-1 font-medium">Estado</label>
							<select
								value={status}
								onChange={(e) => setStatus(e.target.value as typeof status)}
								className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand"
							>
								{STATUS_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* Dorsal */}
						<div>
							<label className="block text-xs text-ink-2 mb-1 font-medium">
								Dorsal <span className="text-ink-3 font-normal">(1–99)</span>
							</label>
							<input
								type="number"
								min={1}
								max={99}
								value={dorsal}
								onChange={(e) => setDorsal(e.target.value)}
								placeholder="—"
								className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
							/>
						</div>
					</div>

					{/* Notas internas */}
					<div>
						<label className="block text-xs text-ink-2 mb-1 font-medium">
							Notas internas{" "}
							<span className="text-ink-3 font-normal">(solo visible para tu organización)</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Ej: lesionado, inactivo por trabajo, renovó en febrero…"
							rows={2}
							maxLength={1000}
							className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
						/>
					</div>

					{/* Foto institucional */}
					<div>
						<label className="block text-xs text-ink-2 mb-1 font-medium">
							URL foto institucional
						</label>
						<input
							type="url"
							value={photoUrl}
							onChange={(e) => setPhotoUrl(e.target.value)}
							placeholder="https://…"
							className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
						/>
					</div>

					{/* Error / éxito */}
					{error && (
						<p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
							{error}
						</p>
					)}
					{success && (
						<p className="text-xs text-brand-ink bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
							✓ Guardado correctamente.
						</p>
					)}

					{/* Acciones */}
					<div className="flex items-center justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={handleCancel}
							disabled={saving}
							className="text-xs px-3 py-1.5 rounded-lg border border-line text-ink-2 hover:bg-surface hover:text-ink transition font-medium disabled:opacity-50"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={saving}
							className="text-xs px-3 py-1.5 rounded-lg bg-brand text-pitch font-semibold hover:bg-brand/90 transition disabled:opacity-50"
						>
							{saving ? "Guardando…" : "Guardar cambios"}
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
