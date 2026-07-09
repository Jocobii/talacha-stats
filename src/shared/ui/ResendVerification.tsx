"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const COOLDOWN_SECONDS = 45;

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Botón de reenvío de correo de verificación con cooldown de 45s.
 * El cooldown arranca visualmente al montar (asumiendo que /register o el
 * enlace expirado ya disparó un envío) y se reinicia tras cada reenvío exitoso.
 * Deriva el countdown de un timestamp objetivo — nunca hace `setState` fuera
 * de callbacks de evento o del propio intervalo (AGENTS.md §7.2).
 * Usado por /register (paso 2 del wizard) y por /verify-email (fallback).
 */
export function ResendVerification({ email }: { email: string }) {
	const [cooldownUntil, setCooldownUntil] = useState(() => Date.now() + COOLDOWN_SECONDS * 1000);
	const [remaining, setRemaining] = useState(COOLDOWN_SECONDS);
	const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
	const [message, setMessage] = useState("");

	// Efecto legítimo: sincroniza el contador con el reloj real (sistema externo).
	// El setState vive dentro del callback del intervalo, nunca en el cuerpo del efecto.
	useEffect(() => {
		const interval = window.setInterval(() => {
			setRemaining(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
		}, 1000);
		return () => window.clearInterval(interval);
	}, [cooldownUntil]);

	async function handleResend() {
		setStatus("sending");
		setMessage("");
		try {
			const res = await fetch("/api/auth/resend-verification", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!data.ok) {
				setStatus("error");
				setMessage(data.error ?? "No se pudo reenviar el correo.");
				return;
			}
			setStatus("idle");
			setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
			setRemaining(COOLDOWN_SECONDS);
		} catch {
			setStatus("error");
			setMessage("Error de conexión. Intenta de nuevo.");
		}
	}

	const canResend = remaining <= 0 && status !== "sending";

	// Avoid narrowing issues in JSX branches by using a boolean flag
	const isSending = status === "sending";

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex items-center justify-center gap-2 text-sm text-ink-3">
				{canResend ? (
					<button
						type="button"
						onClick={handleResend}
						disabled={isSending}
						className="inline-flex items-center gap-1.5 text-brand-ink hover:text-brand font-semibold disabled:opacity-50"
					>
						<RefreshCw size={13} strokeWidth={2.25} className={cn(isSending && "animate-spin")} />
						{isSending ? "Enviando..." : "Reenviar correo"}
					</button>
				) : (
					<span>
						Reenviar en <b className="text-ink-2">{formatTime(remaining)}</b>
					</span>
				)}
			</div>
			{message && <p className="text-xs text-rose">{message}</p>}
		</div>
	);
}
