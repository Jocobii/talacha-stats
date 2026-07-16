/**
 * Cédula imprimible de UN partido.
 * Ruta: /cedula/partido/[matchId]
 */
import { notFound, redirect } from "next/navigation";
import { getSessionUser, canManageLeague } from "@/shared/lib/auth";
import { getMatchPermissionContext, getCedulaDataForMatch } from "@/entities/match/queries";
import { buildCedulaViewModel, CedulaSheet } from "@/features/cedula";
import { PrintButton } from "../../../PrintButton";

type Params = { params: Promise<{ matchId: string }> };

export default async function CedulaPartidoPage({ params }: Params) {
	const [user, { matchId }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const permission = await getMatchPermissionContext(matchId);
	if (!permission) notFound();
	if (!canManageLeague(user, permission.organizationId)) redirect("/admin/leagues");

	const data = await getCedulaDataForMatch(matchId);
	if (!data) notFound();

	const vm = buildCedulaViewModel(data);

	return (
		<>
			<PrintButton />
			<CedulaSheet vm={vm} />
		</>
	);
}
