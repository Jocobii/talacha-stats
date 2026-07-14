/**
 * app/admin/suspensiones/page.tsx
 *
 * Vista global de suspensiones (B7b) — sidebar principal, grupo Gestión.
 * Todas las ligas visibles para el usuario (owner: todas; organizer: las de
 * su organización) en una sola pantalla, para operar sanciones de varias
 * ligas sin entrar una por una. SSR→props: la página baja el listado + ligas
 * inicial y delega a <GlobalSuspensionsScreen>.
 */
import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import {
	listLeaguesForScope,
	listSuspensionsForScope,
	scopeForUser,
} from "@/features/discipline/manage-suspensions";
import { GlobalSuspensionsScreen, type AdminSuspensionsData } from "@/features/discipline";

export const metadata = { title: "Suspensiones · TalachaStats" };

export default async function SuspensionesGlobalPage() {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const scope = scopeForUser(user);
	const initialData: AdminSuspensionsData = scope
		? await Promise.all([listSuspensionsForScope(scope), listLeaguesForScope(scope)]).then(
				([suspensions, leagues]) => ({ suspensions, leagues }),
			)
		: { suspensions: [], leagues: [] };

	return <GlobalSuspensionsScreen currentUserName={user.name} initialData={initialData} />;
}
