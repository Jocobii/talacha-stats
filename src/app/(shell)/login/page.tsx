"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Check } from "lucide-react";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { EASE_PREMIUM } from "@/shared/lib/motion";

// ─────────────────────────── Panel de marca ───────────────────────────────

function Scoreboard() {
	return (
		<div className="relative z-10 max-w-[380px] rounded-2xl border border-line bg-gradient-to-b from-surface/85 to-pitch/90 p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-[2px]">
			<div className="mb-3.5 flex items-center justify-between">
				<span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
					Jornada 7 · Cancha 2
				</span>
				<span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-ink">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
					En juego
				</span>
			</div>
			<div className="flex items-center justify-between gap-2.5">
				<div className="flex min-w-0 flex-1 items-center gap-2.5">
					<span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg border border-brand/25 bg-brand/10 font-display text-sm font-extrabold text-brand-ink">
						DP
					</span>
					<span className="truncate text-[13px] font-semibold text-ink">Deportivo Pino</span>
				</div>
				<div className="px-1 font-display text-3xl font-black leading-none tracking-wide text-ink">
					2<span className="px-1.5 text-xl text-ink-3">–</span>1
				</div>
				<div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2.5 text-right">
					<span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg border border-line-2 bg-surface-3 font-display text-sm font-extrabold text-ink">
						RC
					</span>
					<span className="truncate text-[13px] font-semibold text-ink">Real Cañada</span>
				</div>
			</div>
			<div className="mt-3.5 flex items-center justify-between border-t border-line pt-3 text-[11px] text-ink-3">
				<span>Actualizado en vivo</span>
				<span className="font-mono text-amber">67&apos;</span>
			</div>
		</div>
	);
}

function BrandPanel() {
	return (
		<aside className="auth-brand-glow relative hidden flex-col overflow-hidden border-r border-line p-11 md:flex">
			<div className="auth-brand-grid pointer-events-none absolute inset-0 opacity-50" />

			<Link href="/" className="group relative z-10 inline-flex w-fit items-center gap-2">
				<span className="font-display text-xl font-black tracking-tight text-ink">
					TALACHA<span className="text-brand-ink">STATS</span>
				</span>
				<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 opacity-0 transition group-hover:opacity-100">
					← inicio
				</span>
			</Link>

			<div className="relative z-10 mt-auto pb-2">
				<p className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-ink">
					Panel de administración
				</p>
				<h1 className="mb-4 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-black leading-[1.02] tracking-tight text-ink">
					Todo tu torneo,
					<br />
					en una sola pantalla.
				</h1>
				<p className="mb-6 max-w-[360px] text-sm leading-relaxed text-ink-2">
					Sorteo, calendario, resultados y tabla de posiciones. Inicia sesión y sigue armando tu
					liga donde la dejaste.
				</p>

				<Scoreboard />
			</div>

			<div className="relative z-10 mt-8 border-t border-line pt-5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
				TalachaStats · Estadísticas para ligas locales
			</div>
		</aside>
	);
}

// ─────────────────────────── Input de contraseña ──────────────────────────

function PasswordInput({
	id,
	value,
	onChange,
	placeholder,
	autoComplete,
}: {
	id: string;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	autoComplete: string;
}) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<Input
				id={id}
				type={visible ? "text" : "password"}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				autoComplete={autoComplete}
				className="pr-9"
			/>
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
				className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-ink-3 transition hover:bg-surface-2 hover:text-ink"
			>
				{visible ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
			</button>
		</div>
	);
}

// ─────────────────────────── Formulario de acceso ──────────────────────────

function LoginForm() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get("from") ?? "/admin";

	const [form, setForm] = useState({ email: "", password: "" });
	const [remember, setRemember] = useState(true);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	function updateField(field: keyof typeof form) {
		return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...form, remember, from }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "Credenciales incorrectas");
				return;
			}
			// El overlay premium se muestra ~700ms antes de navegar — tiempo suficiente
			// para que la animación de entrada (blur + check) se aprecie sin sentirse lenta.
			setSuccess(true);
			setTimeout(() => router.push(data.redirect ?? "/admin"), 700);
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	const canSubmit = form.email.length > 0 && form.password.length > 0 && !loading;

	return (
		<div className="w-full max-w-sm">
			{success && (
				<motion.div
					className="fixed inset-0 z-50 grid place-items-center bg-pitch/80 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.35, ease: EASE_PREMIUM }}
				>
					<motion.div
						className="flex flex-col items-center gap-3"
						initial={{ opacity: 0, y: 10, scale: 0.94 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.45, ease: EASE_PREMIUM, delay: 0.05 }}
					>
						<motion.div
							className="grid h-14 w-14 place-items-center rounded-full border border-brand/30 bg-brand/10"
							initial={{ scale: 0.6, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.5, ease: EASE_PREMIUM, delay: 0.15 }}
						>
							<Check size={26} strokeWidth={2.5} className="text-brand-ink" />
						</motion.div>
						<p className="font-display text-lg font-bold text-ink">Sesión iniciada</p>
						<p className="text-sm text-ink-2">Entrando al panel…</p>
					</motion.div>
				</motion.div>
			)}

			<h2 className="mb-2 font-display text-[32px] font-extrabold leading-none tracking-tight text-ink">
				Bienvenido de vuelta
			</h2>
			<p className="mb-7 text-sm leading-relaxed text-ink-2">
				Inicia sesión para administrar tu liga.
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<Field label="Correo electrónico">
					<Input
						type="email"
						value={form.email}
						onChange={(e) => updateField("email")(e.target.value)}
						placeholder="organizador@ejemplo.com"
						autoFocus
						autoComplete="email"
					/>
				</Field>

				<Field label="Contraseña">
					<PasswordInput
						id="fPass"
						value={form.password}
						onChange={updateField("password")}
						placeholder="Tu contraseña"
						autoComplete="current-password"
					/>
				</Field>

				<div className="-mt-1 flex items-center justify-between">
					<label className="inline-flex cursor-pointer select-none items-center gap-2">
						<input
							type="checkbox"
							checked={remember}
							onChange={(e) => setRemember(e.target.checked)}
							className="sr-only"
						/>
						<span
							className={cn(
								"grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition-colors",
								remember ? "border-brand bg-brand" : "border-line-2 bg-surface-2",
							)}
						>
							{remember && <Check size={11} strokeWidth={3.5} className="text-pitch" />}
						</span>
						<span className="text-[12.5px] text-ink-2">Mantener sesión iniciada</span>
					</label>
					<Link
						href="#"
						onClick={(e) => e.preventDefault()}
						className="text-xs font-medium text-brand-ink hover:text-brand-dim"
					>
						¿Olvidaste tu contraseña?
					</Link>
				</div>

				{error && (
					<p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
						{error}
					</p>
				)}

				<Button type="submit" variant="primary" size="lg" disabled={!canSubmit} className="w-full">
					{loading ? "Verificando…" : "Entrar"}
				</Button>
			</form>

			<p className="mt-6 text-center text-[13.5px] text-ink-2">
				¿No tienes cuenta?{" "}
				<Link href="/register" className="font-semibold text-brand-ink hover:text-brand-dim">
					Regístrate gratis
				</Link>
			</p>
		</div>
	);
}

export default function LoginPage() {
	return (
		<div className="grid min-h-screen bg-pitch md:grid-cols-[minmax(0,420px)_1fr]">
			<BrandPanel />
			<div className="flex items-center justify-center px-4 py-10">
				<Suspense>
					<LoginForm />
				</Suspense>
			</div>
		</div>
	);
}
