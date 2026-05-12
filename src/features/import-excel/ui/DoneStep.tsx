"use client";

import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import type { ImportResult } from "../model";

type Props = {
	result: ImportResult;
	leagueId: string;
	copiedIdx: number | null;
	onCopy: (idx: number, text: string) => void;
	onReset: () => void;
};

export function DoneStep({ result, leagueId, copiedIdx, onCopy, onReset }: Props) {
	return (
		<div className="flex flex-col gap-5">
			{/* Success hero */}
			<div className="bg-brand/10 border-2 border-brand/20 rounded-3xl p-8 text-center">
				<div
					className="text-5xl mb-3"
					style={{ animation: "successBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
				>
					🎉
				</div>
				<h2
					className="text-2xl font-black text-brand mb-1"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					¡Importación completada{result.content ? ` · Jornada ${result.content.jornada}` : ""}!
				</h2>
				<p className="text-sm text-brand mb-6">
					{result.upserted} registros actualizados
					{result.created > 0 ? ` · ${result.created} nuevos` : ""}
				</p>
				<div className="flex justify-center gap-8 mb-6">
					{[
						{ label: "Actualizados", value: result.upserted, icon: "✏️" },
						{ label: "Nuevos", value: result.created, icon: "🆕" },
					].map((s) => (
						<div key={s.label} className="text-center">
							<div className="text-base mb-1">{s.icon}</div>
							<div
								className="text-3xl font-black text-brand"
								style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
							>
								{s.value}
							</div>
							<div className="text-xs text-ink-2">{s.label}</div>
						</div>
					))}
				</div>
				<button
					type="button"
					onClick={onReset}
					className="bg-brand hover:bg-brand-dim text-pitch px-6 py-3 rounded-2xl text-sm font-bold shadow-[0_4px_12px_rgba(22,163,74,0.4)] transition"
				>
					＋ Nueva importación
				</button>
			</div>

			{/* CTAs: siguiente paso + ver liga */}
			<div
				className="rounded-2xl overflow-hidden border border-brand/30"
				style={{ background: "var(--color-surface)" }}
			>
				<div className="px-4 py-3 border-b border-line">
					<p className="text-[13px] font-bold text-ink">¿Qué sigue?</p>
				</div>
				<div className="divide-y divide-line">
					{/* Paso 2 — acción primaria destacada con animación de pulso */}
					<Link
						href={
							leagueId ? `/admin/imports?leagueId=${leagueId}&tab=goleadores` : "/admin/imports"
						}
						className="relative flex items-center justify-between px-4 py-4 group overflow-hidden"
						style={{ background: "rgba(22,163,74,0.08)" }}
					>
						{/* Pulso de fondo que se enciende y apaga */}
						<span
							className="absolute inset-0 pointer-events-none"
							style={{
								background:
									"radial-gradient(ellipse at 30% 50%, rgba(22,163,74,0.18) 0%, transparent 70%)",
								animation: "nextStepGlow 2.4s ease-in-out infinite",
							}}
						/>
						<style>{`
							@keyframes nextStepGlow {
								0%, 100% { opacity: 0.2; }
								50%       { opacity: 1; }
							}
						`}</style>

						<div className="relative flex items-center gap-3 min-w-0">
							<span className="w-7 h-7 rounded-full bg-brand text-pitch text-[12px] font-black flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(22,163,74,0.5)]">
								2
							</span>
							<div className="min-w-0">
								<p className="text-sm font-bold text-brand leading-tight">Importar goleadores</p>
								<p className="text-xs text-brand/60 mt-0.5">
									Paso 2 — sube las estadísticas de jugadores
								</p>
							</div>
						</div>
						<Upload
							size={15}
							strokeWidth={2.5}
							className="relative text-brand shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform"
						/>
					</Link>

					{/* Ver liga — secundario */}
					{leagueId && (
						<Link
							href={`/admin/leagues/${leagueId}`}
							className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-2 transition group"
						>
							<div>
								<p className="text-sm font-semibold text-ink">Ver mi liga ahora</p>
								<p className="text-xs text-ink-3">Revisa cómo quedó la tabla de posiciones</p>
							</div>
							<ArrowRight
								size={14}
								strokeWidth={2}
								className="text-ink-3 group-hover:text-brand transition shrink-0"
							/>
						</Link>
					)}
				</div>
			</div>

			{result.content && (
				<>
					{/* Download matchday image */}
					<div className="bg-surface border border-line rounded-2xl p-5 flex items-center gap-4">
						<span className="text-3xl shrink-0">🖼️</span>
						<div className="flex-1">
							<h3 className="text-sm font-bold text-ink">Imagen de jornada lista</h3>
							<p className="text-xs text-ink-2 mt-0.5">
								1080×1080 · Lista para WhatsApp y Facebook
							</p>
						</div>
						<a
							href={result.content.imageUrl}
							download
							className="flex items-center gap-2 bg-surface hover:bg-surface-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shrink-0"
						>
							↓ Descargar
						</a>
					</div>

					{/* Copyable highlights */}
					{result.content.pills.length > 0 && (
						<div className="bg-surface border border-line rounded-2xl p-5">
							<h3 className="text-sm font-bold text-ink mb-1">Highlights de la jornada</h3>
							<p className="text-xs text-ink-3 mb-4">Toca para copiar y compartir en WhatsApp</p>
							<div className="flex flex-col gap-2">
								{result.content.pills.map((pill, i) => (
									<button
										key={i}
										type="button"
										onClick={() => onCopy(i, `${pill.headline} — ${pill.detail}`)}
										className={[
											"flex items-start justify-between gap-3 p-3 rounded-xl border text-left transition-all",
											copiedIdx === i
												? "bg-brand/10 border-brand/20"
												: "bg-surface-2 border-line hover:bg-surface-2",
										].join(" ")}
									>
										<div className="min-w-0">
											<p className="text-sm font-bold text-ink leading-snug">{pill.headline}</p>
											<p className="text-xs text-ink-2 mt-0.5 leading-snug">{pill.detail}</p>
										</div>
										<span className="shrink-0 text-xs font-semibold text-ink-3 mt-0.5">
											{copiedIdx === i ? "✓ Copiado" : "📋"}
										</span>
									</button>
								))}
							</div>
						</div>
					)}
				</>
			)}

			{/* Import warnings */}
			{result.warnings.length > 0 && (
				<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-2xl p-4">
					<p className="text-sm font-semibold text-yellow-300 mb-2">Avisos de la importación</p>
					<ul className="space-y-1">
						{result.warnings.map((w, i) => (
							<li key={i} className="text-xs text-yellow-300">
								⚠ {w}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
