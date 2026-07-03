/**
 * /admin/temas — Temas por torneo (Mundial, Copa América, Liga MX…).
 * Solo rol "owner": es configuración global de la app, no por organización.
 */

import { redirect } from "next/navigation";
import { SkinAdminPanel } from "@/features/tournament-skin";
import { getSessionUser } from "@/shared/lib/auth";

export default async function TemasPage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");
	if (user.role !== "owner") redirect("/admin");

	return (
		<div className="p-6 space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-ink">Temas por torneo</h1>
				<p className="text-sm text-ink-2 mt-1">
					Programa el tema visual de los módulos públicos por rango de fechas. Sin tema activo, la
					app usa la paleta TalachaStats de siempre.
				</p>
			</header>
			<SkinAdminPanel />
		</div>
	);
}
