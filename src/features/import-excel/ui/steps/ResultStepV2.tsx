"use client";

import Link from "next/link";
import { ArrowRight, BarChart2, Users, Upload } from "lucide-react";
import type { ConfirmImportResult } from "../../types";

type Props = {
	result: ConfirmImportResult;
	jornada?: number;
	leagueId: string;
	onReset: () => void;
};

export function ResultStepV2({ result, jornada, leagueId, onReset }: Props) {
	const { createdProfiles, updatedProfiles, claimsProposed, claimsAutoVerified, errors } = result;
	const total = updatedProfiles + createdProfiles;

	return (
		<div className="flex flex-col gap-5">
			{/* Hero */}
			<div className="bg-brand/10 border-2 border-brand/20 rounded-3xl p-8 text-center">
				<h2
					className="text-3xl font-black text-brand mb-1"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					{jornada != null ? `Jornada ${jornada} importada` : "¡Importación completada!"}
				</h2>
				<p className="text-sm text-brand/80">
					{total} jugador{total !== 1 ? "es" : ""} procesado{total !== 1 ? "s" : ""}
				</p>
			</div>

			{/* CTA principal — ver la liga */}
			{leagueId && (
				<Link
					href={`/admin/leagues/${leagueId}`}
					className="flex items-center justify-between bg-brand text-pitch px-6 py-4 rounded-2xl font-bold text-base hover:bg-brand-dim transition shadow-[0_4px_12px_rgba(22,163,74,0.3)]"
				>
					<span>Ver mi liga ahora</span>
					<ArrowRight size={20} strokeWidth={2.5} />
				</Link>
			)}

			{/* Qué sigue */}
			<div className="bg-surface rounded-2xl border border-line overflow-hidden">
				<div className="px-4 py-3 border-b border-line">
					<p className="text-[13px] font-bold text-ink">¿Qué sigue?</p>
				</div>
				<div className="divide-y divide-line">
					<Link
						href={leagueId ? `/admin/leagues/${leagueId}` : "/admin"}
						className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2 transition group"
					>
						<div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
							<BarChart2 size={16} strokeWidth={2} className="text-brand" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-ink">Ver tabla de posiciones</p>
							<p className="text-xs text-ink-3">Revisa cómo quedó la liga con tus datos</p>
						</div>
						<ArrowRight
							size={14}
							strokeWidth={2}
							className="text-ink-3 group-hover:text-brand transition shrink-0"
						/>
					</Link>

					<button
						type="button"
						onClick={onReset}
						className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2 transition group text-left"
					>
						<div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
							<Upload size={16} strokeWidth={2} className="text-ink-2" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-ink">Importar goleadores</p>
							<p className="text-xs text-ink-3">Sube las estadísticas de jugadores (Paso 2)</p>
						</div>
						<ArrowRight
							size={14}
							strokeWidth={2}
							className="text-ink-3 group-hover:text-brand transition shrink-0"
						/>
					</button>

					<Link
						href="/admin/players"
						className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2 transition group"
					>
						<div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
							<Users size={16} strokeWidth={2} className="text-ink-2" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-ink">Ver perfiles de jugadores</p>
							<p className="text-xs text-ink-3">{createdProfiles} perfiles nuevos creados</p>
						</div>
						<ArrowRight
							size={14}
							strokeWidth={2}
							className="text-ink-3 group-hover:text-brand transition shrink-0"
						/>
					</Link>
				</div>
			</div>

			{/* Stat blocks — detalle técnico, secundario */}
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-xl border border-brand/20 bg-brand/5 p-3 flex flex-col gap-0.5">
					<span className="text-2xl font-black text-brand">{updatedProfiles}</span>
					<p className="text-[12px] font-semibold text-ink leading-snug">Actualizados</p>
					<p className="text-[11px] text-ink-3 leading-snug">Ya registrados en la liga</p>
				</div>
				<div className="rounded-xl border border-line bg-surface-2 p-3 flex flex-col gap-0.5">
					<span className="text-2xl font-black text-ink">{createdProfiles}</span>
					<p className="text-[12px] font-semibold text-ink leading-snug">Perfiles nuevos</p>
					<p className="text-[11px] text-ink-3 leading-snug">Sin identidad global aún</p>
				</div>
				{claimsAutoVerified > 0 && (
					<div className="rounded-xl border border-brand/20 bg-brand/5 p-3 flex flex-col gap-0.5">
						<span className="text-2xl font-black text-brand">{claimsAutoVerified}</span>
						<p className="text-[12px] font-semibold text-ink leading-snug">Vinculados</p>
						<p className="text-[11px] text-ink-3 leading-snug">Verificados automáticamente</p>
					</div>
				)}
				{claimsProposed > 0 && (
					<div className="rounded-xl border border-orange-800/30 bg-orange-950/20 p-3 flex flex-col gap-0.5">
						<span className="text-2xl font-black text-orange-300">{claimsProposed}</span>
						<p className="text-[12px] font-semibold text-ink leading-snug">Propuestas</p>
						<p className="text-[11px] text-ink-3 leading-snug">Pendientes de otra org</p>
					</div>
				)}
			</div>

			{/* Errores parciales */}
			{errors.length > 0 && (
				<div className="rounded-xl bg-red-950/30 border border-red-800/50 p-4">
					<p className="text-sm font-semibold text-red-400 mb-2">
						{errors.length} fila{errors.length > 1 ? "s" : ""} con error
					</p>
					<ul className="flex flex-col gap-1">
						{errors.map((e, i) => (
							<li key={i} className="text-xs text-red-400">
								· {e}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
