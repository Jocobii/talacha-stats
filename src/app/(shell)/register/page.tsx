"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Check, X, Mail, ArrowLeft, Circle } from "lucide-react";
import { Field } from "@/shared/ui/Field";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { ResendVerification } from "@/shared/ui/ResendVerification";
import { cn } from "@/shared/lib/cn";
import { scorePasswordStrength, PASSWORD_STRENGTH_LABELS } from "@/shared/lib/password-strength";

type Step = 1 | 2 | 3;

const FEATURES = [
	{ b: "Sorteo y calendario", rest: "automáticos" },
	{ b: "Tabla de posiciones", rest: "que se actualiza sola" },
	{ b: "Página pública", rest: "de tu liga, con tus colores" },
];

const STRENGTH_BAR_COLOR: Record<number, string> = {
	1: "bg-rose",
	2: "bg-amber",
	3: "bg-blue",
	4: "bg-brand",
};

const STRENGTH_LABEL_COLOR: Record<number, string> = {
	0: "text-ink-3",
	1: "text-rose",
	2: "text-amber",
	3: "text-blue",
	4: "text-brand",
};

// ─────────────────────────── Panel de marca ───────────────────────────────

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
					Para organizadores · gratis
				</p>
				<h1 className="mb-4 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-black leading-[1.02] tracking-tight text-ink">
					Tu liga, con el look que se merece.
				</h1>
				<p className="mb-6 max-w-[340px] text-sm leading-relaxed text-ink-2">
					Crea tu cuenta de organizador en menos de un minuto. Sin tarjeta, sin límite de equipos.
				</p>
				<ul className="flex flex-col gap-3">
					{FEATURES.map((f) => (
						<li key={f.b} className="flex items-start gap-2.5 text-[13px] text-ink-2">
							<Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-brand-ink" />
							<span>
								<b className="font-semibold text-ink">{f.b}</b> {f.rest}
							</span>
						</li>
					))}
				</ul>
			</div>

			<div className="relative z-10 mt-8 border-t border-line pt-5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
				TalachaStats · Estadísticas para ligas locales
			</div>
		</aside>
	);
}

// ─────────────────────────── Progreso ─────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 }) {
	const pct = step === 1 ? 0 : 50;
	return (
		<div className="mb-7">
			<div className="mb-2.5 flex justify-between font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
				<span>Paso {step} de 2</span>
				<span>{pct}%</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
					<div className="h-full w-full bg-brand transition-all duration-500 ease-out" />
				</div>
				<div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
					<div
						className={cn(
							"h-full bg-brand transition-all duration-500 ease-out",
							step >= 2 ? "w-full" : "w-0",
						)}
					/>
				</div>
			</div>
		</div>
	);
}

// ─────────────────────────── Input de contraseña ──────────────────────────

function PasswordInput({
	id,
	value,
	onChange,
	placeholder,
	autoComplete,
	error,
}: {
	id: string;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	autoComplete: string;
	error?: boolean;
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
				className={cn("pr-9", error && "border-rose focus:border-rose focus:ring-rose/30")}
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

// ─────────────────────────── Paso 1 — crear cuenta ─────────────────────────

function StepAccount({ onCreated }: { onCreated: (email: string, name: string) => void }) {
	const [form, setForm] = useState({ name: "", email: "", password: "", password2: "" });
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function updateField(field: keyof typeof form) {
		return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
	}

	const nameValid = form.name.trim().length >= 2;
	const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
	const passwordValid = form.password.length >= 8;
	const passwordsMatch = form.password2.length > 0 && form.password2 === form.password;
	const passwordsMismatch = form.password2.length > 0 && !passwordsMatch;
	const strength = scorePasswordStrength(form.password);

	const canSubmit =
		nameValid && emailValid && passwordValid && passwordsMatch && termsAccepted && !loading;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setError("");
		setLoading(true);
		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "No se pudo completar el registro.");
				return;
			}
			onCreated(form.email.trim(), form.name.trim());
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<h2 className="mb-2 font-display text-[30px] font-extrabold leading-none tracking-tight text-ink">
				Crea tu cuenta
			</h2>
			<p className="mb-7 text-sm leading-relaxed text-ink-2">
				Es gratis para organizadores. Configura tu liga en minutos.
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<Field label="Nombre completo" required>
					<Input
						value={form.name}
						onChange={(e) => updateField("name")(e.target.value)}
						placeholder="Ej. Carlos Méndez"
						autoFocus
						autoComplete="name"
					/>
				</Field>

				<Field label="Correo electrónico" required>
					<Input
						type="email"
						value={form.email}
						onChange={(e) => updateField("email")(e.target.value)}
						placeholder="organizador@ejemplo.com"
						autoComplete="email"
					/>
				</Field>

				<Field label="Contraseña" required hint="Mínimo 8 caracteres">
					<PasswordInput
						id="fPass"
						value={form.password}
						onChange={updateField("password")}
						placeholder="Mínimo 8 caracteres"
						autoComplete="new-password"
					/>
				</Field>

				{form.password.length > 0 && (
					<div className="-mt-2">
						<div className="flex gap-1">
							{[1, 2, 3, 4].map((i) => (
								<i
									key={i}
									className={cn(
										"h-1 flex-1 rounded-full transition-colors",
										i <= strength ? STRENGTH_BAR_COLOR[strength] : "bg-line",
									)}
								/>
							))}
						</div>
						<p
							className={cn(
								"mt-1.5 font-mono text-[10.5px] uppercase tracking-wider",
								STRENGTH_LABEL_COLOR[strength],
							)}
						>
							{PASSWORD_STRENGTH_LABELS[strength]}
						</p>
					</div>
				)}

				<Field label="Confirmar contraseña" required>
					<PasswordInput
						id="fPass2"
						value={form.password2}
						onChange={updateField("password2")}
						placeholder="Repite tu contraseña"
						autoComplete="new-password"
						error={passwordsMismatch}
					/>
				</Field>

				{form.password2.length > 0 && (
					<p
						className={cn(
							"-mt-3 flex items-center gap-1 text-xs",
							passwordsMatch ? "text-brand" : "text-rose",
						)}
					>
						{passwordsMatch ? (
							<Check size={12} strokeWidth={2.5} />
						) : (
							<X size={12} strokeWidth={2.5} />
						)}
						{passwordsMatch ? "Coinciden." : "Las contraseñas no coinciden."}
					</p>
				)}

				<label className="flex cursor-pointer items-start gap-2.5">
					<input
						type="checkbox"
						checked={termsAccepted}
						onChange={(e) => setTermsAccepted(e.target.checked)}
						className="sr-only"
					/>
					<span
						className={cn(
							"mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition-colors",
							termsAccepted ? "border-brand bg-brand" : "border-line-2 bg-surface-2",
						)}
					>
						{termsAccepted && <Check size={11} strokeWidth={3.5} className="text-pitch" />}
					</span>
					<span className="text-[12.5px] leading-relaxed text-ink-2">
						Acepto los{" "}
						<Link
							href="#"
							onClick={(e) => e.stopPropagation()}
							className="text-brand-ink hover:underline"
						>
							Términos de servicio
						</Link>{" "}
						y el{" "}
						<Link
							href="#"
							onClick={(e) => e.stopPropagation()}
							className="text-brand-ink hover:underline"
						>
							Aviso de privacidad
						</Link>{" "}
						de TalachaStats.
					</span>
				</label>

				{error && (
					<p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
						{error}
					</p>
				)}

				<Button
					type="submit"
					variant="primary"
					size="lg"
					disabled={!canSubmit}
					className={cn("w-full", canSubmit && "animate-glow-pulse")}
				>
					{loading ? "Creando cuenta..." : "Crear cuenta"}
				</Button>
			</form>

			<p className="mt-5 text-center text-xs text-ink-3">
				¿Ya tienes cuenta?{" "}
				<Link href="/login" className="font-medium text-brand-ink hover:text-brand">
					Inicia sesión
				</Link>
			</p>
		</>
	);
}

// ─────────────────────────── Paso 2 — revisa tu correo ─────────────────────

function StepVerify({
	email,
	onBack,
	onVerified,
}: {
	email: string;
	onBack: () => void;
	onVerified: () => void;
}) {
	// Poll: detecta cuando el usuario hizo clic en el enlace desde otra
	// pestaña/dispositivo, sin recargar esta página. setState vive dentro
	// del callback del intervalo, no en el cuerpo del efecto (AGENTS.md §7.2).
	useEffect(() => {
		let cancelled = false;
		const interval = window.setInterval(async () => {
			try {
				const res = await fetch(`/api/auth/verification-status?email=${encodeURIComponent(email)}`);
				const data = await res.json();
				if (!cancelled && data.ok && data.data.verified) {
					onVerified();
				}
			} catch {
				// Red intermitente — se reintenta en el siguiente tick, sin bloquear la UI.
			}
		}, 3000);
		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [email, onVerified]);

	return (
		<>
			<button
				type="button"
				onClick={onBack}
				className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 transition hover:text-ink"
			>
				<ArrowLeft size={13} strokeWidth={2.5} />
				Editar datos
			</button>

			<div
				key="verify-icon"
				className="animate-pop-in mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-brand/20 bg-brand/10"
			>
				<Mail size={28} strokeWidth={2} className="text-brand-ink" />
			</div>

			<h2 className="mb-2 font-display text-[30px] font-extrabold leading-none tracking-tight text-ink">
				Revisa tu correo
			</h2>
			<p className="mb-6 text-sm leading-relaxed text-ink-2">
				Te enviamos un enlace de verificación. Haz clic para activar tu cuenta.
			</p>

			<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-3.5 pr-4 text-sm text-ink">
				<span className="h-2 w-2 rounded-full bg-brand" />
				{email}
			</div>

			<div className="mb-6 space-y-3 rounded-xl border border-line bg-surface p-4 text-left">
				<p className="text-[12.5px] leading-relaxed text-ink-2">
					Revisa también la carpeta de spam o promociones.
				</p>
				<p className="text-[12.5px] leading-relaxed text-ink-2">
					El enlace es válido por 24 horas.
				</p>
			</div>

			<ResendVerification email={email} />
		</>
	);
}

// ─────────────────────────── Paso 3 — cuenta creada ────────────────────────

function StepSuccess({ name }: { name: string }) {
	const firstName = name.split(" ")[0] || "organizador";

	return (
		<div className="text-center">
			<div className="relative mx-auto mb-6 grid h-[76px] w-[76px] place-items-center rounded-full border border-brand/30 bg-brand/15">
				<svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="overflow-visible">
					<circle
						className="animate-draw-circle"
						cx="20"
						cy="20"
						r="18"
						stroke="var(--color-brand)"
						strokeWidth="2.5"
					/>
					<path
						className="animate-draw-check"
						d="M12 20.5 17 26l11-13"
						stroke="var(--color-brand)"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>

			<h2 className="mb-2.5 font-display text-[30px] font-extrabold leading-none tracking-tight text-ink">
				¡Todo listo, {firstName}!
			</h2>
			<p className="mb-7 text-sm leading-relaxed text-ink-2">
				Tu cuenta quedó verificada. Ya puedes empezar a armar tu liga.
			</p>

			<div className="mb-6 divide-y divide-line rounded-xl border border-line bg-surface p-4 text-left">
				<div className="flex items-center gap-2.5 py-2 text-sm text-ink-2">
					<Check size={15} strokeWidth={2.5} className="shrink-0 text-brand-ink" />
					Cuenta de organizador <b className="text-ink">creada</b>
				</div>
				<div className="flex items-center gap-2.5 py-2 text-sm text-ink-2">
					<Check size={15} strokeWidth={2.5} className="shrink-0 text-brand-ink" />
					Correo <b className="text-ink">verificado</b>
				</div>
				<div className="flex items-center gap-2.5 py-2 text-sm text-ink-2">
					<Circle size={15} strokeWidth={2} className="shrink-0 text-ink-3" />
					Siguiente: <b className="text-ink">crea tu primera liga</b>
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<Link
					href="/onboarding"
					className="animate-glow-pulse w-full rounded-xl bg-brand py-3 text-center text-sm font-bold text-pitch transition hover:bg-brand-dim"
				>
					Crear mi primera liga →
				</Link>
				<Link
					href="/"
					className="w-full rounded-xl border border-line bg-surface-2 py-3 text-center text-sm font-semibold text-ink-2 transition hover:bg-surface-3 hover:text-ink"
				>
					Volver a la página principal
				</Link>
			</div>
		</div>
	);
}

// ─────────────────────────── Wizard ────────────────────────────────────────

export default function RegisterPage() {
	const [step, setStep] = useState<Step>(1);
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");

	const handleCreated = useCallback((newEmail: string, newName: string) => {
		setEmail(newEmail);
		setName(newName);
		setStep(2);
	}, []);

	const handleVerified = useCallback(() => setStep(3), []);
	const handleBack = useCallback(() => setStep(1), []);

	return (
		<div className="grid min-h-screen bg-pitch md:grid-cols-[minmax(0,420px)_1fr]">
			<BrandPanel />

			<div className="flex items-center justify-center px-4 py-10">
				<div className="w-full max-w-sm">
					{step < 3 && <ProgressBar step={step as 1 | 2} />}

					<div key={step} className="animate-fade-slide-up">
						{step === 1 && <StepAccount onCreated={handleCreated} />}
						{step === 2 && (
							<StepVerify email={email} onBack={handleBack} onVerified={handleVerified} />
						)}
						{step === 3 && <StepSuccess name={name} />}
					</div>
				</div>
			</div>
		</div>
	);
}
