"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
			const res = await fetch("/api/organizations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: form.name,
					slug: form.slug,
					city: form.city,
					logoUrl: form.logoUrl || undefined,
				}),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error);
				return;
			}
			router.push(`/admin/organizations/${data.data.id}`);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-lg">
			<div className="mb-6">
				<Link href="/admin/organizations" className="text-sm text-gray-500 hover:underline">
					← Organizaciones
				</Link>
				<h1 className="text-2xl font-bold text-gray-800 mt-1">Nueva organización</h1>
			</div>

			<form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Nombre <span className="text-red-500">*</span>
					</label>
					<input
						value={form.name}
						onChange={(e) => handleNameChange(e.target.value)}
						placeholder="Novofut, Casablanca FC…"
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Slug (URL pública) <span className="text-red-500">*</span>
					</label>
					<div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
						<span className="bg-gray-50 px-3 py-2 text-xs text-gray-400 border-r border-gray-300">
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
					<p className="text-xs text-gray-400 mt-1">
						Solo minúsculas, números y guiones. Se genera automáticamente del nombre.
					</p>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
					<input
						value={form.city}
						onChange={(e) => setForm({ ...form, city: e.target.value })}
						placeholder="Tijuana"
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
					<input
						value={form.logoUrl}
						onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
						placeholder="https://..."
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
					<p className="text-xs text-gray-400 mt-1">Opcional. Puedes agregarlo después.</p>
				</div>

				{error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

				<div className="flex gap-3 pt-1">
					<button
						type="submit"
						disabled={loading}
						className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
					>
						{loading ? "Creando..." : "Crear organización"}
					</button>
					<Link
						href="/admin/organizations"
						className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-200"
					>
						Cancelar
					</Link>
				</div>
			</form>
		</div>
	);
}
