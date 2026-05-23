"use client";

/**
 * features/venue-calendar/ui/RentalModal.tsx
 * Modal para crear o editar una renta de cancha.
 * Animación pop · backdrop oscuro · cierra con Escape.
 */

import { useState, useEffect } from "react";
import { X, Plus, PencilLine, Check, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import type { VenueEvent, CreateRentalPayload, UpdateRentalPayload } from "../types";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onSave: (payload: CreateRentalPayload) => Promise<void>;
	onUpdate: (id: string, payload: UpdateRentalPayload) => Promise<void>;
	defaultStart?: string | null;
	defaultEnd?: string | null;
	initialValues?: VenueEvent | null;
	isSaving: boolean;
	error: string | null;
};

function toLocal(iso: string | null | undefined): string {
	if (!iso) return "";
	// Slice to "YYYY-MM-DDTHH:MM"
	return iso.slice(0, 16);
}

export function RentalModal({
	isOpen,
	onClose,
	onSave,
	onUpdate,
	defaultStart,
	defaultEnd,
	initialValues,
	isSaving,
	error,
}: Props) {
	const isEdit = !!initialValues?.rentalId;

	const [title, setTitle] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [status, setStatus] = useState<"confirmed" | "tentative">("confirmed");
	const [price, setPrice] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (!isOpen) return;
		if (isEdit && initialValues) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setTitle(initialValues.clientName ?? initialValues.title);
			setStartAt(toLocal(initialValues.startAt));
			setEndAt(toLocal(initialValues.endAt));
			setStatus((initialValues.status as "confirmed" | "tentative") ?? "confirmed");
			setPrice(initialValues.price != null ? String(initialValues.price) : "");
			setNotes(initialValues.notes ?? "");
		} else {
			setTitle("");
			setPrice("");
			setNotes("");
			setStatus("confirmed");
			setStartAt(toLocal(defaultStart));
			setEndAt(toLocal(defaultEnd));
		}
	}, [isOpen, isEdit, initialValues, defaultStart, defaultEnd]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		if (isOpen) document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const startD = startAt ? new Date(startAt) : null;
	const endD = endAt ? new Date(endAt) : null;
	const durationMin = startD && endD ? Math.max(0, (endD.getTime() - startD.getTime()) / 60000) : 0;
	const durationHint =
		durationMin > 0
			? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ""}`
			: null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const payload = {
			title: title.trim(),
			startAt: new Date(startAt).toISOString(),
			endAt: new Date(endAt).toISOString(),
			status,
			price: price ? Number(price) : null,
			notes: notes.trim() || null,
		};
		if (isEdit && initialValues?.rentalId) {
			await onUpdate(initialValues.rentalId, payload);
		} else {
			await onSave(payload as CreateRentalPayload);
		}
	}

	function handleDelete() {
		if (!initialValues?.rentalId) return;
		if (!confirm("¿Eliminar esta renta? Esta acción no se puede deshacer.")) return;
		void onUpdate(initialValues.rentalId, { status: "cancelled" });
	}

	const inputCls =
		"w-full border border-line rounded-lg px-3 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors";
	const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2 mb-1.5";

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center px-4 vcal-backdrop-enter"
			style={{ background: "rgba(10,10,10,0.8)", backdropFilter: "blur(2px)" }}
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="w-full max-w-[520px] rounded-[14px] border border-line overflow-hidden vcal-modal-enter"
				style={{ background: "var(--color-surface)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}
			>
				<form onSubmit={handleSubmit}>
					{/* Header */}
					<div className="flex items-center justify-between px-5 py-4 border-b border-line">
						<h2 className="text-ink font-display font-semibold text-xl flex items-center gap-2">
							{isEdit ? (
								<PencilLine size={18} className="text-brand-ink" />
							) : (
								<Plus size={18} className="text-brand-ink" />
							)}
							{isEdit ? "Editar renta" : "Nueva renta"}
						</h2>
						<button
							type="button"
							onClick={onClose}
							className="text-ink-3 hover:text-ink transition-colors p-1.5 rounded-md hover:bg-surface-2"
						>
							<X size={16} />
						</button>
					</div>

					{/* Body */}
					<div className="px-5 py-4 flex flex-col gap-4">
						{error && (
							<div
								className="rounded-lg px-3 py-2.5 text-[12px] flex gap-2 items-start"
								style={{
									background: "rgba(239,68,68,0.1)",
									border: "1px solid rgba(239,68,68,0.3)",
									color: "#fca5a5",
								}}
							>
								<AlertTriangle size={14} className="shrink-0 mt-0.5" />
								{error}
							</div>
						)}

						<div>
							<label className={labelCls}>Cliente o equipo</label>
							<input
								className={inputCls}
								style={{ background: "var(--color-surface)" }}
								placeholder="Nombre del cliente o equipo"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className={labelCls}>Inicio</label>
								<input
									type="datetime-local"
									className={inputCls}
									style={{ background: "var(--color-surface)" }}
									value={startAt}
									onChange={(e) => setStartAt(e.target.value)}
									required
								/>
							</div>
							<div>
								<label className={labelCls}>Fin</label>
								<input
									type="datetime-local"
									className={inputCls}
									style={{ background: "var(--color-surface)" }}
									value={endAt}
									onChange={(e) => setEndAt(e.target.value)}
									required
								/>
								{durationHint && (
									<p className="text-[11px] text-ink-3 mt-1">Duración: {durationHint}</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className={labelCls}>Estado</label>
								<select
									className={inputCls}
									style={{ background: "var(--color-surface)" }}
									value={status}
									onChange={(e) => setStatus(e.target.value as typeof status)}
								>
									<option value="confirmed">Confirmada</option>
									<option value="tentative">Tentativa</option>
								</select>
							</div>
							<div>
								<label className={labelCls}>Precio</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-3">
										$
									</span>
									<input
										type="number"
										min="0"
										step="50"
										placeholder="0.00"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
										className={inputCls + " pl-6 pr-12"}
										style={{ background: "var(--color-surface)" }}
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-3 uppercase tracking-wide">
										MXN
									</span>
								</div>
							</div>
						</div>

						<div>
							<label className={labelCls}>Notas</label>
							<textarea
								rows={3}
								className={inputCls + " resize-none"}
								style={{ background: "var(--color-surface)" }}
								placeholder="Detalles de pago, contacto, indicaciones, etc."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>
					</div>

					{/* Footer */}
					<div
						className="flex items-center justify-between px-5 py-3.5 border-t border-line"
						style={{ background: "rgba(255,255,255,0.01)" }}
					>
						<div>
							{isEdit && (
								<button
									type="button"
									onClick={handleDelete}
									className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors"
									style={{
										background: "rgba(239,68,68,0.1)",
										border: "1px solid rgba(239,68,68,0.3)",
										color: "#f87171",
									}}
								>
									<Trash2 size={13} /> Eliminar
								</button>
							)}
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={onClose}
								className="px-3 py-1.5 rounded-lg text-[13px] text-ink-2 hover:text-ink border border-line hover:bg-surface-2 transition-colors"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving || !title || !startAt || !endAt}
								className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium text-pitch bg-brand hover:bg-brand-dim disabled:opacity-50 transition-colors"
							>
								{isSaving ? (
									<>
										<Loader2 size={13} className="vcal-spin" /> Guardando…
									</>
								) : (
									<>
										<Check size={13} /> {isEdit ? "Guardar cambios" : "Crear renta"}
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
