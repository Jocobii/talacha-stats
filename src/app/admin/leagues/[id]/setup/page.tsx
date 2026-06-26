/**
 * app/admin/leagues/[id]/setup/page.tsx
 *
 * Server Component — configuración post-creación de liga.
 * Entra directo al wizard: Equipos → Jugadores → Listo.
 */

import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, leagues } from "@/db";
import { getSessionUser } from "@/shared/lib/auth";
import { PathSelector } from "./PathSelector";

export const metadata = { title: "Configurar liga · TalachaStats" };

export default async function LeagueSetupPage({ params }: { params: Promise<{ id: string }> }) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
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

	return (
		<div className="py-2">
			<PathSelector
				league={{
					id: league.id,
					name: league.name,
					season: league.season,
					dayOfWeek: league.dayOfWeek,
				}}
			/>
		</div>
	);
}
