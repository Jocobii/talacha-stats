/**
 * /admin/registro — Ventanilla de registro de jugadores
 *
 * Server Component: carga las ligas activas del organizador y las pasa
 * al RegistrationForm client component.
 *
 * Si la URL incluye ?leagueId=uuid, el form queda fijado a esa liga
 * (caso típico: el oficinista abre la página directamente para su liga).
 * Sin el param, el form muestra un selector con todas las ligas disponibles.
 */

import { redirect } from "next/navigation";
import { db, leagues } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { getSessionUser } from "@/shared/lib/auth";
import { RegistrationForm } from "@/features/admin-registration";

type Props = {
	searchParams: Promise<{ leagueId?: string }>;
};

export const metadata = { title: "Registro de jugadores · TalachaStats" };

export default async function RegistroPage({ searchParams }: Props) {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const { leagueId: fixedLeagueId } = await searchParams;

	// Cargar ligas según rol:
	//   owner     → todas las ligas activas
	//   organizer → solo las ligas de su organización
	const where =
		user.role === "organizer" && user.organizationId
			? and(eq(leagues.status, "active"), eq(leagues.organizationId, user.organizationId))
			: eq(leagues.status, "active");

	const allLeagues = await db
		.select({ id: leagues.id, name: leagues.name, season: leagues.season })
		.from(leagues)
		.where(where)
		.orderBy(desc(leagues.createdAt));

	// Si viene un leagueId en la URL, verificar que el usuario tenga acceso
	const fixedLeague = fixedLeagueId ? allLeagues.find((l) => l.id === fixedLeagueId) : undefined;

	// Si el param existe pero no pertenece al usuario, ignorarlo (no lanzar 404)
	// — el form simplemente mostrará el selector de ligas.

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-ink">Registro de jugadores</h1>
				<p className="text-ink-3 text-sm mt-1">
					Ingresa la CURP del jugador para buscarlo en el sistema o crear un nuevo registro.
				</p>
			</div>

			<RegistrationForm fixedLeague={fixedLeague} leagues={fixedLeague ? [] : allLeagues} />
		</div>
	);
}
