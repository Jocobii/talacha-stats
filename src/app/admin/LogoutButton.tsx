"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/shared/api/client";

export default function LogoutButton() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);

	async function handleLogout() {
		setBusy(true);
		try {
			await apiFetch("/api/auth/logout", { method: "POST" });
		} catch (networkError) {
			// §18.4 — aunque falle el logout en red, igual llevamos al usuario a /login.
			console.error("[LogoutButton] logout", networkError);
		}
		router.push("/login");
	}

	return (
		<button
			onClick={handleLogout}
			disabled={busy}
			className="text-xs text-white/60 hover:text-white transition disabled:opacity-50"
			title="Cerrar sesión"
		>
			{busy ? "…" : "Salir"}
		</button>
	);
}
