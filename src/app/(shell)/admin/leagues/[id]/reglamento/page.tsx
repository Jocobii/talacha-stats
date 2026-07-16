/**
 * app/admin/leagues/[id]/reglamento/page.tsx
 *
 * Tab "Reglamento" — desempates, disciplina automática, refuerzos y nivel
 * financiero (A6, docs/MODULOS-GESTION-LIGA.md). Cabecera y tab bar viven en
 * el layout padre (leagues/[id]/layout.tsx); esta página solo baja el DTO
 * inicial (SSR→props, §7.3) y delega la interacción a <ReglamentoScreen>.
 */
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/shared/lib/auth";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { getLeagueRules } from "@/features/tournament-rules/rules";
import { mapLeagueConfigToRulesView, ReglamentoScreen } from "@/features/tournament-rules";

export const metadata = { title: "Reglamento · TalachaStats" };

type Params = { params: Promise<{ id: string }> };

export default async function ReglamentoPage({ params }: Params) {
	const [user, { id }] = await Promise.all([getSessionUser(), params]);
	if (!user) redirect("/login");

	const league = await db.query.leagues.findFirst({
		where: eq(leagues.id, id),
		columns: { id: true, name: true, season: true, organizationId: true },
	});
	if (!league) notFound();

	const canManage =
		user.role === "owner" ||
		(user.role === "organizer" && user.organizationId === league.organizationId);
	if (!canManage) redirect("/admin/leagues");

	const config = await getLeagueRules(id);
	const initialView = mapLeagueConfigToRulesView(config);

	return (
		<div className="max-w-[760px]">
			<ReglamentoScreen
				leagueId={id}
				leagueName={league.name}
				seasonLabel={league.season}
				initialView={initialView}
			/>
		</div>
	);
}
