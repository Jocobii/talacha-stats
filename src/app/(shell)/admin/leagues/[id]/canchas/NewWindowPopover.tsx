"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/shared/api/client";
import { notify } from "@/shared/lib/notify";
import { DAYS_FULL, parseTime } from "./WeeklyGrid";

const inputCls =
	"w-full bg-surface-2 border border-line rounded-md px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand/60";
import type { VenueTimeWindow } from "@/entities/venue";

type PopoverMode =
	| { type: "create"; venueId: string; defaultDay: string; defaultHour: number }
	| { type: "edit"; window: VenueTimeWindow };

type NewWindowPopoverProps = {
	leagueId: string;
	slotDuration: number;
	mode: PopoverMode;
	onClose: () => void;
	onSuccess: (w: VenueTimeWindow) => void;
	onDeleted?: (id: string) => void;
};

function padHour(h: number): string {
	return `${String(h).padStart(2, "0")}:00`;
}

export function NewWindowPopover({
	leagueId,
	slotDuration,
	mode,
	onClose,
	onSuccess,
	onDeleted,
}: NewWindowPopoverProps) {
	const isEdit = mode.type === "edit";
	const existingDay = isEdit ? mode.window.dayOfWeek : mode.defaultDay;
	const defaultStart = isEdit ? mode.window.startTime : padHour(mode.defaultHour);
	const defaultEnd = isEdit ? mode.window.endTime : padHour(Math.min(23, mode.defaultHour + 3));

	const [day, setDay] = useState(existingDay);
	const [start, setStart] = useState(defaultStart);
	const [end, setEnd] = useState(defaultEnd);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const slots =
		start < end
			? Math.max(0, Math.floor(((parseTime(end) - parseTime(start)) * 60) / slotDuration))
			: 0;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (start >= end) {
			setError("La hora de inicio debe ser anterior a la de fin.");
			return;
		}
		setError(null);
		startTransition(async () => {
			const requestBody = { dayOfWeek: day, startTime: start, endTime: end };
			try {
				let result;
				if (isEdit) {
					result = await apiFetch<VenueTimeWindow>(`/api/venue-windows/${mode.window.id}`, {
						method: "PATCH",
						body: requestBody,
					});
				} else {
					result = await apiFetch<VenueTimeWindow>(
						`/api/leagues/${leagueId}/venues/${mode.venueId}/windows`,
						{ method: "POST", body: requestBody },
					);
				}
				if (!result.ok) {
					const message = result.error ?? "Error al guardar";
					setError(message);
					notify.error(message);
					return;
				}
				notify.success(isEdit ? "Ventana actualizada" : "Ventana creada");
				onSuccess(result.data);
			} catch (networkError) {
				console.error("[NewWindowPopover] save", networkError);
				const message = "Error de red. Intenta de nuevo.";
				setError(message);
				notify.error(message);
			}
		});
	}

	function handleDelete() {
		if (!isEdit) return;
		startTransition(async () => {
			try {
				const result = await apiFetch(`/api/venue-windows/${mode.window.id}`, { method: "DELETE" });
				if (!result.ok) {
					const message = result.error ?? "Error al eliminar";
					setError(message);
					notify.error(message);
					return;
				}
				notify.success("Ventana eliminada");
				onDeleted?.(mode.window.id);
			} catch (networkError) {
				console.error("[NewWindowPopover] delete", networkError);
				const message = "Error de red. Intenta de nuevo.";
				setError(message);
				notify.error(message);
			}
		});
	}

	return (
		<div
			className="fixed inset-0 bg-pitch/80 z-50 flex items-center justify-center p-6"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-[380px] max-w-full bg-surface border border-line rounded-2xl shadow-2xl">
				<div className="p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-[17px] font-bold text-ink">
							{isEdit ? "Editar ventana" : "Nueva ventana horaria"}
						</h3>
						<button onClick={onClose} className="text-ink-3 hover:text-ink transition">
							<X size={16} />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
						{/* Day segmented control */}
						<div>
							<label className="block text-[12px] font-semibold text-ink mb-1.5">Día</label>
							<div className="flex flex-wrap gap-1">
								{DAYS_FULL.map((d) => (
									<button
										key={d}
										type="button"
										onClick={() => setDay(d)}
										className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold capitalize transition ${day === d ? "bg-brand text-pitch" : "bg-surface-2 border border-line text-ink-2 hover:text-ink"}`}
									>
										{d.slice(0, 3)}
									</button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-[12px] font-semibold text-ink mb-1.5">Inicio</label>
								<input
									type="time"
									value={start}
									onChange={(e) => setStart(e.target.value)}
									className={inputCls}
									required
								/>
							</div>
							<div>
								<label className="block text-[12px] font-semibold text-ink mb-1.5">Fin</label>
								<input
									type="time"
									value={end}
									onChange={(e) => setEnd(e.target.value)}
									className={inputCls}
									required
								/>
							</div>
						</div>

						{/* Live slot count */}
						{slots > 0 && (
							<div className="flex items-center gap-2 px-3 py-2 bg-brand/8 border border-brand/20 rounded-lg">
								<span
									className="text-brand-ink font-black text-[22px] leading-none"
									style={{ fontFamily: "var(--font-display)" }}
								>
									{slots}
								</span>
								<span className="text-[12px] text-ink-2">slots de {slotDuration} min</span>
							</div>
						)}

						{error && (
							<p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
								{error}
							</p>
						)}

						<div className="flex items-center justify-between pt-1 border-t border-line mt-1">
							{isEdit ? (
								<button
									type="button"
									onClick={handleDelete}
									disabled={isPending}
									className="text-[12.5px] text-red-400 hover:text-red-300 disabled:opacity-50 transition"
								>
									Eliminar ventana
								</button>
							) : (
								<span />
							)}
							<div className="flex gap-2">
								<button
									type="button"
									onClick={onClose}
									className="px-3 py-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink hover:bg-surface-2 rounded-lg transition"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={isPending}
									className="px-3 py-1.5 bg-brand text-pitch text-[13px] font-bold rounded-lg hover:bg-brand-dim disabled:opacity-60 transition"
								>
									{isPending ? "Guardando…" : "Guardar"}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
