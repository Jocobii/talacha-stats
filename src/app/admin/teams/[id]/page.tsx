import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { getTeamWithLeague, getTeamRoster } from "@/entities/team";
import { TeamDetailView } from "@/features/team-management/ui/TeamDetailView";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export default async function TeamDetailPage({ params }: Props) {
	const { id } = await params;
	if (!UUID_REGEX.test(id)) notFound();

	const [team, roster] = await Promise.all([getTeamWithLeague(id), getTeamRoster(id)]);

	if (!team) notFound();

	const activeCount = roster.filter((p) => p.status === "active").length;

	return (
		<div className="max-w-3xl">
			<PageHeader
				breadcrumb={[
					{ label: "Equipos", href: "/admin/teams" },
					{ label: team.leagueName, href: `/admin/leagues/${team.leagueId}` },
					{ label: team.name },
				]}
				title={team.name}
				subtitle={`${team.leagueSeason} · ${team.leagueDayOfWeek} · ${activeCount} jugadores activos`}
			/>

			<Card className="overflow-hidden mt-6">
				<Suspense fallback={null}>
					<TeamDetailView team={team} initialRoster={roster} />
				</Suspense>
			</Card>
		</div>
	);
}
