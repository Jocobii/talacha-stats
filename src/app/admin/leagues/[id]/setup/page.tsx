/**
 * app/admin/leagues/[id]/setup/page.tsx
 *
 * Server Component — onboarding post-creación de liga.
 *
 * ?start=v2  → salta directo al wizard profesional (desde LeagueEmptyState)
 * (sin param) → muestra la pantalla de elección (desde NewLeagueForm)
 */

import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, leagues } from "@/db";
import { getSessionUser } from "@/shared/lib/auth";
import { PathSelector } from "./PathSelector";

export const metadata = { title: "Configurar liga · TalachaStats" };

export default async function LeagueSetupPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, { id }, sp] = await Promise.all([getSessionUser(), params, searchParams]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, season: true, dayOfWeek: true, organizationId: true },
	});

	if (!league) notFound();

	// Organizers solo pueden configurar ligas de su organización
	if (user.role === "organizer" && user.organizationId !== league.organizationId) {
		redirect("/admin/leagues");
	}

	const startV2 = sp.start === "v2";

	return (
		<div className="py-2">
			<PathSelector
				league={{
					id: league.id,
					name: league.name,
					season: league.season,
					dayOfWeek: league.dayOfWeek,
				}}
				initialPath={startV2 ? "v2" : "choosing"}
			/>
		</div>
	);
}
