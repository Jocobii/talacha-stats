"use client";

import { useState, useTransition } from "react";
import { MapPin, X, Plus } from "lucide-react";
import {
	Field,
	CapacityStepper,
	ColorPicker,
	inputCls,
	DEFAULT_FORM,
	formFromVenue,
} from "./VenueFormFields";
import type { VenueWithStats } from "@/entities/venue";
import { apiFetch } from "@/shared/api/client";

type ModalMode = { mode: "create" } | { mode: "edit"; venue: VenueWithStats };

type NewVenueModalProps = {
	organizationId: string;
	modalMode: ModalMode;
	onClose: () => void;
	onSuccess: (v: VenueWithStats) => void;
};

export function NewVenueModal({
	organizationId,
	modalMode,
	onClose,
	onSuccess,
}: NewVenueModalProps) {
	const isEdit = modalMode.mode === "edit";
	const [form, setForm] = useState(isEdit ? formFromVenue(modalMode.venue) : DEFAULT_FORM);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		startTransition(async () => {
			const body = {
				name: form.name.trim(),
				address: form.address.trim() || undefined,
				city: form.city.trim() || undefined,
				capacity: form.capacity,
				color: form.color,
				notes: form.notes.trim() || undefined,
				...(!isEdit && { organizationId }),
			};
			const url = isEdit ? `/api/venues/${modalMode.venue.id}` : "/api/venues";
			try {
				const result = await apiFetch<VenueWithStats>(url, {
					method: isEdit ? "PATCH" : "POST",
					body,
				});
				if (!result.ok) {
					setError(result.error ?? "Error al guardar");
					return;
				}
				onSuccess(result.data);
			} catch (networkError) {
				console.error("[NewVenueModal] save", networkError);
				setError("Error de red. Intenta de nuevo.");
			}
		});
	}

	return (
		<div
			className="fixed inset-0 bg-pitch/90 z-50 flex items-center justify-center p-6"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-[520px] max-w-full bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
				<div style={{ height: 6, background: form.color }} />
				<div className="p-6">
					<div className="flex items-start gap-3 mb-5">
						<div className="w-10 h-10 rounded-lg bg-brand/10 text-brand-ink grid place-items-center shrink-0">
							<MapPin size={18} />
						</div>
						<div className="flex-1">
							<h2
								className="text-[26px] leading-none tracking-tight font-black"
								style={{ fontFamily: "var(--font-display)" }}
							>
								{isEdit ? "Editar cancha" : "Registrar cancha"}
							</h2>
							<p className="text-[12.5px] text-ink-3 mt-1.5">
								Disponible para todas las ligas de tu organización
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-ink-2 hover:text-ink text-xl leading-none p-1"
						>
							<X size={18} />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
						<Field label="Nombre" required>
							<input
								required
								minLength={2}
								maxLength={80}
								value={form.name}
								onChange={(e) => set("name", e.target.value)}
								className={inputCls}
								placeholder="Ej. Gamorin"
							/>
						</Field>
						<Field label="Dirección">
							<input
								maxLength={200}
								value={form.address}
								onChange={(e) => set("address", e.target.value)}
								className={inputCls}
								placeholder="Av. Lázaro Cárdenas 1245"
							/>
							<p className="text-[11px] text-ink-3 mt-1">Aparece en el sorteo y el calendario</p>
						</Field>
						<div className="grid grid-cols-2 gap-3">
							<Field label="Ciudad">
								<input
									maxLength={80}
									value={form.city}
									onChange={(e) => set("city", e.target.value)}
									className={inputCls}
									placeholder="Guadalajara"
								/>
							</Field>
							<Field label="Capacidad" sub="canchas paralelas">
								<CapacityStepper value={form.capacity} onChange={(v) => set("capacity", v)} />
							</Field>
						</div>
						<Field label="Color de identificación" sub="visible en el sorteo">
							<ColorPicker value={form.color} onChange={(c) => set("color", c)} />
						</Field>
						<Field label="Notas internas" optional>
							<textarea
								maxLength={500}
								value={form.notes}
								onChange={(e) => set("notes", e.target.value)}
								rows={2}
								className={`${inputCls} resize-none`}
								placeholder="Estacionamiento detrás. Llaves con Don Memo."
							/>
						</Field>
						{error && (
							<p className="text-[12.5px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
								{error}
							</p>
						)}
						<div className="flex justify-end gap-2 pt-1 border-t border-line mt-1">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-[13px] font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 rounded-lg transition"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isPending}
								className="flex items-center gap-1.5 px-4 py-2 bg-brand text-pitch text-[13px] font-bold rounded-lg hover:bg-brand-dim disabled:opacity-60 transition"
							>
								<Plus size={13} />{" "}
								{isPending ? "Guardando\u2026" : isEdit ? "Guardar cambios" : "Registrar cancha"}
							</button>
						</div>
					</form>

					<div className="mt-3.5 flex items-start gap-2.5 p-2.5 bg-blue-500/5 border border-blue-500/18 rounded-lg text-[11.5px] text-ink-2">
						<span className="text-blue-400 font-bold text-[12px] shrink-0">i</span>
						<span>
							Los horarios por liga (lunes 19:00\u201322:30, etc.) se configuran después, dentro del
							módulo de sorteo de cada liga.
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
