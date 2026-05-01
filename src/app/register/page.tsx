"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
	const router = useRouter();

	const [form, setForm] = useState({ name: "", email: "", password: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function updateField(field: keyof typeof form) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "No se pudo completar el registro.");
				return;
			}
			router.push("/verify-email");
		} catch {
			setError("Error de conexion. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	const canSubmit = form.name.trim().length >= 2 && form.email !== "" && form.password.length >= 8;

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-8">
				{/* Logo */}
				<div className="text-center">
					<p className="text-4xl mb-3">⚽</p>
					<h1 className="text-2xl font-black text-white">TalachaStats</h1>
					<p className="text-gray-400 text-sm mt-1">Crea tu cuenta de organizador</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">Tu nombre</label>
						<input
							type="text"
							value={form.name}
							onChange={updateField("name")}
							placeholder="Ej. Carlos Mendez"
							autoFocus
							required
							minLength={2}
							className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Correo electronico
						</label>
						<input
							type="email"
							value={form.email}
							onChange={updateField("email")}
							placeholder="organizador@ejemplo.com"
							required
							className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">Contrasena</label>
						<input
							type="password"
							value={form.password}
							onChange={updateField("password")}
							placeholder="Minimo 8 caracteres"
							required
							minLength={8}
							className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						/>
					</div>

					{error && (
						<p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading || !canSubmit}
						className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
					>
						{loading ? "Creando cuenta..." : "Crear cuenta"}
					</button>
				</form>

				<p className="text-center text-xs text-gray-500">
					Ya tienes cuenta?{" "}
					<Link href="/login" className="text-green-500 hover:text-green-400 font-medium">
						Inicia sesion
					</Link>
				</p>
			</div>
		</div>
	);
}
