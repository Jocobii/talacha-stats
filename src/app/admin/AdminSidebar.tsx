/**
 * AdminLayoutRedesign.tsx
 *
 * Drop-in para src/app/admin/layout.tsx
 *
 * Server component — mantiene EXACTAMENTE la misma lógica de auth que el original:
 *   • getActiveCity() + getSessionUser() en paralelo
 *   • redirect("/login") si no hay user
 *   • redirect("/onboarding") si organizer sin organizationId
 *
 * Solo cambia el shell visual — delega al nuevo <AdminShell> client component.
 * Mantiene <TrialBanner /> compatible.
 *
 * ── Pasos para integrar ─────────────────────────────────────────────────────
 *   1. Mueve este archivo a src/app/admin/layout.tsx (sobreescribe el original).
 *   2. Mueve AdminShell.tsx también a src/app/admin/AdminShell.tsx.
 *   3. Las rutas en el sidebar son las mismas que ya usas — no rompe links.
 *
 * Nota: el ítem "Partidos" (/admin/matches) está incluido en el sidebar pero la
 * ruta puede no existir aún. Si no la tienes, elimina ese item o crea la página.
 */

import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getActiveCity } from "@/shared/lib/active-city";
import { getSessionUser } from "@/shared/lib/auth";
import AdminShell from "./AdminShell";
import TrialBanner from "./TrialBanner";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const [activeCity, user] = await Promise.all([getActiveCity(), getSessionUser()]);

	// Second line of defense — middleware already checked cookie presence,
	// but full HMAC verification and DB lookup happen here.
	if (!user) redirect("/login");

	// Organizers must complete onboarding before accessing the admin panel.
	// Owners (superadmins) are exempt — they manage all orgs.
	if (user.role === "organizer" && !user.organizationId) redirect("/onboarding");

	return (
		<AdminShell
			user={{
				id: user.id,
				email: user.email,
				role: user.role,
				organizationId: user.organizationId ?? null,
				name: (user as { name?: string | null }).name ?? null,
			}}
			activeCity={activeCity}
			trialBanner={<TrialBanner user={user} />}
		>
			{children}
		</AdminShell>
	);
}
