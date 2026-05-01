"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveButton({ orgId, orgName }: { orgId: string; orgName: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleApprove() {
		if (!confirm(`Verificar "${orgName}"? Se enviara un email de confirmacion al organizador.`))
			return;
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/organizations/${orgId}/approve`, { method: "POST" });
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "Error al aprobar");
				return;
			}
			router.refresh();
		} catch {
			setError("Error de conexion");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="shrink-0 flex flex-col items-end gap-1">
			<button
				onClick={handleApprove}
				disabled={loading}
				className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
			>
				{loading ? "Verificando..." : "Aprobar"}
			</button>
			{error && <p className="text-xs text-red-500">{error}</p>}
		</div>
	);
}
