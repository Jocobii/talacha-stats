"use client";

/**
 * ShareJornadaButton.tsx
 * Botón "Compartir tabla y goleadores" visible cuando la jornada está cerrada.
 * Genera la URL del asset y usa Web Share API / fallback a clipboard.
 */

import { useState } from "react";
import { Share2, Check, Download } from "lucide-react";

type Props = {
	leagueId: string;
	jornadaNumber: number;
};

type ShareState = "idle" | "sharing" | "copied";

function buildImageUrl(leagueId: string, jornada: number, type: string): string {
	return `/api/content/jornada-image?leagueId=${leagueId}&jornada=${jornada}&type=${type}`;
}

export function ShareJornadaButton({ leagueId, jornadaNumber }: Props) {
	const [state, setState] = useState<ShareState>("idle");

	async function handleShare() {
		setState("sharing");
		const imageUrl = buildImageUrl(leagueId, jornadaNumber, "both");

		if (typeof navigator !== "undefined" && navigator.share) {
			try {
				await navigator.share({
					title: `Jornada ${jornadaNumber} — TalachaStats`,
					text: "Mira la tabla y los goleadores de la jornada 👇",
					url: `${window.location.origin}${imageUrl}`,
				});
			} catch {
				// usuario canceló — no hacer nada
			}
			setState("idle");
			return;
		}

		// Fallback: copiar URL de la imagen al clipboard
		try {
			await navigator.clipboard.writeText(`${window.location.origin}${imageUrl}`);
			setState("copied");
			setTimeout(() => setState("idle"), 2200);
		} catch {
			setState("idle");
		}
	}

	const isCopied = state === "copied";

	return (
		<div className="flex items-center gap-2">
			{/* Descarga directa de imagen */}
			<a
				href={buildImageUrl(leagueId, jornadaNumber, "both")}
				download={`jornada-${jornadaNumber}.png`}
				className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-md border border-line bg-surface-2 text-ink-2 hover:text-brand hover:border-brand/40 transition-colors"
				title="Descargar imagen"
			>
				<Download size={13} strokeWidth={2} />
				<span className="hidden sm:inline">Descargar</span>
			</a>

			{/* Share (Web Share API o clipboard) */}
			<button
				onClick={handleShare}
				disabled={state === "sharing"}
				className={`inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-md transition-colors ${
					isCopied
						? "bg-brand/10 border border-brand/30 text-brand"
						: "bg-brand text-pitch hover:bg-brand-dim"
				}`}
			>
				{isCopied ? (
					<>
						<Check size={15} strokeWidth={2.5} />
						¡Copiado!
					</>
				) : (
					<>
						<Share2 size={15} strokeWidth={2} />
						Compartir jornada
					</>
				)}
			</button>
		</div>
	);
}
