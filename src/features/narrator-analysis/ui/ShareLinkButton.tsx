"use client";

/**
 * features/narrator-analysis/ui/ShareLinkButton.tsx
 *
 * Botón "compartir" del reporte: copia la URL actual al portapapeles. Estado
 * de copiado encapsulado aquí — el padre no necesita saber de `copied` ni de
 * `navigator.clipboard` (§17.1: el frontend solo captura input y pinta UI).
 */

import { useState } from "react";

type Labels = { share: string; copied: string };

export function ShareLinkButton({ className, labels }: { className?: string; labels: Labels }) {
	const [copied, setCopied] = useState(false);

	async function handleShare() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (clipboardError) {
			// §18.4 — clipboard puede fallar (permisos/secure context); registrar, no romper la UI.
			console.error("[narrator-analysis] no se pudo copiar al portapapeles", clipboardError);
		}
	}

	return (
		<button onClick={handleShare} className={className}>
			{copied ? labels.copied : labels.share}
		</button>
	);
}
