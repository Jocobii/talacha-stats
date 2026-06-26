"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/shared/api/client";

function toSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

export default function NewOrganizationForm() {
	const router = useRouter();
	const [form, setForm] = useState({ name: "", slug: "", city: "Tijuana", logoUrl: "" });
	const [slugEdited, setSlugEdited] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	function handleNameChange(name: string) {
		setForm((prev) => ({
			...prev,
			name,
			slug: slugEdited ? prev.slug : toSlug(name),
		}));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim()) {
			setError("El nombre es obligatorio.");
			return;
		}
		if (!form.slug.trim()) {
			setError("El slug es obligatorio.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const result = await apiFetch<{ id: string }>("/api/organizations", {
				method: "POST",
				body: {
					name: form.name,
					slug: form.slug,
					city: form.city,
					logoUrl: form.logoUrl || undefined,
				},
			});
			if (!result.ok) {
				setError(result.error);
				return;
			}
			router.push(`/admin/organizations/${result.data.id}`);
		} catch (networkError) {
			console.error("[NewOrganizationForm] create", networkError);
			setError("Error de red. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-lg">
			<div className="mb-6">
				<Link href="/admin/organizations" className="text-sm text-ink-2 hover:underline">
					← Organizaciones
				</Link>
				<h1 className="text-2xl font-bold text-ink mt-1">Nueva organización</h1>
			</div>

			<form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow p-6 space-y-5">
				<div>
					<label className="block text-sm font-medium text-ink mb-1">
						Nombre <span className="text-red-500">*</span>
					</label>
					<input
						value={form.name}
						onChange={(e) => handleNameChange(e.target.value)}
						placeholder="Novofut, Casablanca FC…"
						className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-ink mb-1">
						Slug (URL pública) <span className="text-red-500">*</span>
					</label>
					<div className="flex items-center border border-line rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
						<span className="bg-surface-2 px-3 py-2 text-xs text-ink-3 border-r border-line">
							talachastats.com/
						</span>
						<input
							value={form.slug}
							onChange={(e) => {
								setSlugEdited(true);
								setForm({ ...form, slug: e.target.value });
							}}
							placeholder="novofut"
							className="flex-1 px-3 py-2 text-sm focus:outline-none"
						/>
					</div>
					<p className="text-xs text-ink-3 mt-1">
						Solo minúsculas, números y guiones. Se genera automáticamente del nombre.
					</p>
				</div>

				<div>
					<label className="block text-sm font-medium text-ink mb-1">Ciudad</label>
					<input
						value={form.city}
						onChange={(e) => setForm({ ...form, city: e.target.value })}
						placeholder="Tijuana"
						className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-ink mb-1">URL del logo</label>
					<input
						value={form.logoUrl}
						onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
						placeholder="https://..."
						className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
					/>
					<p className="text-xs text-ink-3 mt-1">Opcional. Puedes agregarlo después.</p>
				</div>

				{error && (
					<p className="text-red-600 text-sm bg-red-950/40 px-3 py-2 rounded-lg">{error}</p>
				)}

				<div className="flex gap-3 pt-1">
					<button
						type="submit"
						disabled={loading}
						className="bg-brand text-pitch px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-dim disabled:opacity-50"
					>
						{loading ? "Creando..." : "Crear organización"}
					</button>
					<Link
						href="/admin/organizations"
						className="bg-surface-2 text-ink px-4 py-2.5 rounded-lg text-sm hover:bg-surface-2"
					>
						Cancelar
					</Link>
				</div>
			</form>
		</div>
	);
}
