/**
 * /admin/leagues — Lista de ligas
 *
 * Server Component "controlador delgado" (AGENTS.md §3.2/§3.7): resuelve la
 * sesión y delega TODA la carga de datos a features/league-admin (que a su
 * vez solo llama a entities/). Cero acceso a @/db aquí.
 * Espejo de app/admin/teams/page.tsx (sin split owner/organizador en la UI:
 * el scope de datos ya lo resuelve getLeaguesView según el rol).
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { getLeaguesView } from "@/features/league-admin";
import { LeaguesView } from "./LeaguesView";

export default async function LeaguesPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const [user, params] = await Promise.all([getSessionUser(), searchParams]);
	if (!user) redirect("/login");

	const view = await getLeaguesView(user, params);
	return <LeaguesView {...view} />;
}
