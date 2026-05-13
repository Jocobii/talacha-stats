"use client";

import { useState } from "react";

/**
 * ShareFooter — footer editorial del perfil de jugador.
 *
 * Dos partes:
 *  1. Línea de cierre: tagline izquierda · slug derecha
 *  2. Botón de compartir full-width — editorial, sin border-radius,
 *     tipografía del sistema (font-mono / uppercase / tracking).
 *     Usa navigator.share() si está disponible; si no, copia al portapapeles.
 */
export default function ShareFooter({ url, slug }: { url: string; slug: string }) {
	const [state, setState] = useState<"idle" | "copied">("idle");

	async function handleShare() {
		try {
			if (typeof navigator !== "undefined" && navigator.share) {
				await navigator.share({ title: "TalachaStats", url });
				return;
			}
			await navigator.clipboard.writeText(url);
			setState("copied");
			setTimeout(() => setState("idle"), 2500);
		} catch {
			// El usuario canceló el share sheet — no hacer nada
		}
	}

	const isCopied = state === "copied";

	return (
		<footer className="mt-5 border-t border-line">
			{/* Tagline + slug */}
			<div className="pt-3 flex justify-between items-center gap-2">
				<span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 shrink-0">
					Tu liga, en serio.
				</span>
				<span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3 truncate max-w-[160px]">
					{slug}
				</span>
			</div>

			{/* Botón de compartir — full-width, borde, hover brand */}
			<button
				onClick={handleShare}
				aria-label="Compartir perfil"
				className={[
					"mt-3 w-full flex items-center justify-center gap-2.5 py-3",
					"border transition-colors duration-150",
					isCopied
						? "border-brand text-brand"
						: "border-line text-ink-2 hover:border-brand hover:text-brand",
				].join(" ")}
			>
				{isCopied ? (
					<>
						{/* Dot parpadeante al copiar */}
						<span
							className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
							style={{ boxShadow: "0 0 6px var(--color-brand)" }}
						/>
						<span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold">
							¡Enlace copiado!
						</span>
					</>
				) : (
					<>
						{/* Flecha arriba — SVG limpia, sin emoji */}
						<svg
							width="11"
							height="11"
							viewBox="0 0 11 11"
							fill="none"
							aria-hidden
							className="shrink-0"
						>
							<path
								d="M5.5 10V1.5M1.5 5.5L5.5 1.5 9.5 5.5"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold">
							Compartir perfil
						</span>
					</>
				)}
			</button>
		</footer>
	);
}
