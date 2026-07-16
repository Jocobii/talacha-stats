/**
 * Cédulas imprimibles de una jornada (lote). Acepta `?matches=id1,id2,...`
 * con los partidos elegidos en el picker de checkboxes (docs/PLAN-CEDULA-IMPRESA.md
 * §12.1); sin el query param, imprime todos los partidos de la jornada.
 * Ruta: /cedula/jornada/[matchdayId]
 */
import { notFound, redirect } from "next/navigation";
import { getSessionUser, canManageLeague } from "@/shared/lib/auth";
import { getMatchdayPermissionContext } from "@/entities/matchday/queries";
import { getCedulaDataForMatchday } from "@/entities/match/queries";
import { buildCedulaViewModel, CedulaBatch } from "@/features/cedula";
import { PrintButton } from "../../../PrintButton";

type Params = {
	params: Promise<{ matchdayId: string }>;
	searchParams: Promise<{ matches?: string }>;
};

export default async function CedulaJornadaPage({ params, searchParams }: Params) {
	const [user, { matchdayId }, sp] = await Promise.all([getSessionUser(), params, searchParams]);
	if (!user) redirect("/login");

	const permission = await getMatchdayPermissionContext(matchdayId);
	if (!permission) notFound();
	if (!canManageLeague(user, permission.organizationId)) redirect("/admin/leagues");

	const allData = await getCedulaDataForMatchday(matchdayId);
	const selectedIds = sp.matches ? new Set(sp.matches.split(",").filter(Boolean)) : null;
	const data = selectedIds ? allData.filter((d) => selectedIds.has(d.matchId)) : allData;
	if (data.length === 0) notFound();

	const sheets = data.map(buildCedulaViewModel);

	return (
		<>
			<PrintButton />
			<CedulaBatch sheets={sheets} />
		</>
	);
}
