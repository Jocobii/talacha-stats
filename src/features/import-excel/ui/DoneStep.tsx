"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Share2, Download, Check } from "lucide-react";
import type { ImportResult } from "../model";

type Props = {
	result: ImportResult;
	leagueId: string;
	copiedIdx: number | null;
	onCopy: (idx: number, text: string) => void;
	onReset: () => void;
};

type ShareState = "idle" | "sharing" | "shared";

export function DoneStep({ result, leagueId, copiedIdx, onCopy, onReset }: Props) {
	const [shareState, setShareState] = useState<ShareState>("idle");

	/**
	 * Comparte la imagen de jornada en un toque. Prioriza Web Share API con el
	 * archivo PNG real (se incrusta directo en WhatsApp/Stories); cae a Web Share
	 * sólo-URL en móviles sin soporte de archivos, y a descarga en desktop.
	 */
	async function handleShareImage() {
		const content = result.content;
		if (!content) return;
		const imageUrl = content.imageUrl;
		const filename = `jornada-${content.jornada}.png`;
		const title = `Jornada ${content.jornada} — TalachaStats`;
		const text = "Mira la tabla y los goleadores de la jornada 👇";
		const nav = typeof navigator !== "undefined" ? navigator : undefined;

		setShareState("sharing");

		// 1) Compartir la imagen real — se incrusta directo en WhatsApp/Stories.
		let file: File | null = null;
		try {
			const res = await fetch(imageUrl);
			const blob = await res.blob();
			file = new File([blob], filename, { type: "image/png" });
		} catch {
			file = null;
		}

		if (file && nav?.share && nav.canShare?.({ files: [file] })) {
			try {
				await nav.share({ files: [file], title, text });
				setShareState("shared");
				setTimeout(() => setShareState("idle"), 2200);
			} catch {
				setShareState("idle"); // usuario canceló
			}
			return;
		}

		// 2) Web Share sólo-URL (móvil sin soporte de archivos).
		if (nav?.share) {
			try {
				await nav.share({ title, text, url: `${window.location.origin}${imageUrl}` });
			} catch {
				/* usuario canceló */
			}
			setShareState("idle");
			return;
		}

		// 3) Desktop sin Web Share: descarga directa.
		const a = document.createElement("a");
		a.href = imageUrl;
		a.download = filename;
		a.click();
		setShareState("idle");
	}

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
					className="text-2xl font-black text-brand-ink mb-1"
					style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
				>
					¡Importación completada{result.content ? ` · Jornada ${result.content.jornada}` : ""}!
				</h2>
				<p className="text-sm text-brand-ink mb-6">
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
								className="text-3xl font-black text-brand-ink"
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
								<p className="text-sm font-bold text-brand-ink leading-tight">
									Importar goleadores
								</p>
								<p className="text-xs text-brand-ink/60 mt-0.5">
									Paso 2 — sube las estadísticas de jugadores
								</p>
							</div>
						</div>
						<Upload
							size={15}
							strokeWidth={2.5}
							className="relative text-brand-ink shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform"
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
								className="text-ink-3 group-hover:text-brand-ink transition shrink-0"
							/>
						</Link>
					)}
				</div>
			</div>

			{result.content && (
				<>
					{/* Imagen de jornada — compartir (la cuña) + descargar */}
					<div className="bg-surface border border-line rounded-2xl p-5 flex items-center gap-4">
						<span className="text-3xl shrink-0">🖼️</span>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-bold text-ink">Imagen de jornada lista</h3>
							<p className="text-xs text-ink-2 mt-0.5">
								1080×1920 · Lista para WhatsApp y Facebook
							</p>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<a
								href={result.content.imageUrl}
								download={`jornada-${result.content.jornada}.png`}
								className="h-10 w-10 flex items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-2 hover:text-brand-ink hover:border-brand/40 transition"
								title="Descargar imagen"
							>
								<Download size={16} strokeWidth={2} />
							</a>
							<button
								type="button"
								onClick={handleShareImage}
								disabled={shareState === "sharing"}
								className={[
									"inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold transition",
									shareState === "shared"
										? "bg-brand/10 border border-brand/30 text-brand-ink"
										: "bg-brand text-pitch hover:bg-brand-dim",
								].join(" ")}
							>
								{shareState === "shared" ? (
									<>
										<Check size={16} strokeWidth={2.5} />
										¡Listo!
									</>
								) : (
									<>
										<Share2 size={16} strokeWidth={2} />
										Compartir
									</>
								)}
							</button>
						</div>
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
