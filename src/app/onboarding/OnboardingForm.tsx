"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/shared/api/client";

function buildSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 60);
}

export default function OnboardingForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// §7.2 — slug es un valor derivado: se calcula en render, no con un efecto + setState.
	const slug = buildSlug(name);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const result = await apiFetch("/api/organizations", {
				method: "POST",
				body: { name, slug },
			});
			if (!result.ok) {
				setError(result.error ?? "No se pudo crear la liga.");
				return;
			}
			router.push("/admin");
		} catch (networkError) {
			console.error("[OnboardingForm] create", networkError);
			setError("Error de conexion. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	const canSubmit = name.trim().length >= 2 && slug.length >= 2;

	return (
		<form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-5">
			<div>
				<label className="block text-sm font-medium text-gray-300 mb-2">
					Nombre de tu organización o nombre propio
				</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Ej. Talacha Stats"
					autoFocus
					required
					minLength={2}
					className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
				/>
			</div>

			{slug && (
				<div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
					<p className="text-xs text-gray-400 mb-1">Tu URL publica sera:</p>
					<p className="text-sm font-mono text-green-400">
						talachastats.com/<span className="text-white">{slug}</span>
					</p>
				</div>
			)}

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
				{loading ? "Creando tu organización..." : "Continuar al panel"}
			</button>

			<p className="text-xs text-gray-500 text-center">
				Puedes cambiar esto despues desde tu perfil.
			</p>
		</form>
	);
}
