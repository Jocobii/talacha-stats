"use client";

import { Share2, Check, Link } from "lucide-react";
import { useState } from "react";

type Variant = "icon" | "full";

type Props = {
	/** Título que se pasa al Web Share API / tab de WhatsApp */
	title: string;
	/** URL a compartir. Si se omite, usa window.location.href */
	url?: string;
	/** Texto opcional para el body del share */
	text?: string;
	/** "icon" → botón circular compacto | "full" → texto + ícono */
	variant?: Variant;
	className?: string;
};

/**
 * Botón reutilizable de compartir.
 * Usa el Web Share API nativo cuando está disponible (móvil, Android/iOS),
 * con fallback a clipboard en desktop.
 *
 * Coloca este componente en shared/ui — no tiene lógica de negocio.
 * Los datos (title, url, text) los construye el padre (page o server component).
 */
export default function ShareButton({ title, url, text, variant = "full", className = "" }: Props) {
	const [state, setState] = useState<"idle" | "copied">("idle");

	async function handleShare() {
		const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

		if (typeof navigator !== "undefined" && navigator.share) {
			try {
				await navigator.share({ title, url: shareUrl, ...(text ? { text } : {}) });
			} catch {
				// usuario canceló el share sheet — no hacer nada
			}
			return;
		}

		// Fallback: copiar al portapapeles
		try {
			await navigator.clipboard.writeText(shareUrl);
			setState("copied");
			setTimeout(() => setState("idle"), 2200);
		} catch {
			// navegador sin clipboard API (raro) — ignorar
		}
	}

	const isCopied = state === "copied";

	if (variant === "icon") {
		return (
			<button
				onClick={handleShare}
				aria-label="Compartir"
				className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
					isCopied
						? "border-brand/40 bg-brand/10 text-brand-ink"
						: "border-line bg-surface-2 text-ink-3 hover:text-brand-ink hover:border-brand/40"
				} ${className}`}
			>
				{isCopied ? <Check size={16} strokeWidth={2} /> : <Share2 size={16} strokeWidth={2} />}
			</button>
		);
	}

	// variant === "full"
	return (
		<button
			onClick={handleShare}
			className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
				isCopied ? "text-brand-ink" : "text-ink-2 hover:text-brand-ink"
			} ${className}`}
		>
			{isCopied ? (
				<>
					<Check size={16} strokeWidth={2} className="text-brand-ink" />
					<span>¡Copiado!</span>
				</>
			) : (
				<>
					<Share2 size={16} strokeWidth={2} />
					<span>Compartir</span>
				</>
			)}
		</button>
	);
}

/**
 * Variante compacta para usar donde solo necesitas el ícono de enlace.
 * Útil para listas de ligas, tarjetas, etc.
 */
export function CopyLinkButton({ url, className = "" }: { url?: string; className?: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		const target = url ?? (typeof window !== "undefined" ? window.location.href : "");
		try {
			await navigator.clipboard.writeText(target);
			setCopied(true);
			setTimeout(() => setCopied(false), 2200);
		} catch {
			// ignorar
		}
	}

	return (
		<button
			onClick={handleCopy}
			aria-label="Copiar enlace"
			className={`inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-brand-ink transition-colors ${className}`}
		>
			{copied ? (
				<Check size={12} strokeWidth={2} className="text-brand-ink" />
			) : (
				<Link size={12} strokeWidth={2} />
			)}
			{copied ? "¡Copiado!" : "Copiar enlace"}
		</button>
	);
}
