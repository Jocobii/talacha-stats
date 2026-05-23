"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get("from") ?? "/admin";

	const [form, setForm] = useState({ email: "", password: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...form, from }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "Credenciales incorrectas");
				return;
			}
			router.push(data.redirect ?? "/admin");
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-pitch flex items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-8">
				{/* Logo */}
				<div className="text-center">
					<img src="/logo-icon.svg" alt="TalachaStats" className="w-10 h-10 mx-auto mb-3" />
					<h1 className="font-display text-3xl font-black text-ink uppercase tracking-tight">
						Talacha<span className="text-brand-ink">Stats</span>
					</h1>
					<p className="text-ink-2 text-sm mt-1">Panel de administración</p>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="bg-surface border border-line rounded-2xl p-6 space-y-4"
				>
					<div>
						<label className="block text-sm font-medium text-ink-2 mb-2">Correo electrónico</label>
						<input
							type="email"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							placeholder="organizador@ejemplo.com"
							autoFocus
							required
							className="w-full bg-surface-2 border border-line text-ink placeholder-ink-3 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-ink-2 mb-2">Contraseña</label>
						<input
							type="password"
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
							placeholder="••••••••"
							required
							className="w-full bg-surface-2 border border-line text-ink placeholder-ink-3 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
						/>
					</div>

					{error && (
						<p className="text-red-400 text-sm bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading || !form.email || !form.password}
						className="w-full bg-brand hover:bg-brand-dim disabled:opacity-40 text-pitch font-bold py-3 rounded-xl transition text-sm"
					>
						{loading ? "Verificando…" : "Entrar"}
					</button>
				</form>

				<p className="text-center text-xs text-ink-3">
					No tienes cuenta?{" "}
					<a
						href="/register"
						className="text-brand-ink hover:text-brand-dim font-medium transition-colors"
					>
						Registrate gratis
					</a>
				</p>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense>
			<LoginForm />
		</Suspense>
	);
}
