/**
 * OrgLeaguesGrid.tsx — Zona 3 (Directorio) del home del subdominio: lista de
 * las ligas activas de la organización. Formato lista (fiel al mockup
 * "Org Subdomain Home"), a diferencia de OrgLeagueCard (grid de tarjetas,
 * usado hoy en /organizaciones). Presentacional/server-safe.
 */

import { Stack } from "@/shared/ui/layout";
import { Typography } from "@/shared/ui";
import { OrgLeagueRow } from "./OrgLeagueRow";

export type OrgLeaguesGridLeague = {
	slug: string;
	name: string;
	/** null si la liga aún no tiene jornadas contadas */
	jornada: number | null;
	teamsCount: number;
};

export type OrgLeaguesGridLabels = {
	title: string;
	matchdayWord: string;
	teamsWord: string;
	viewTable: string;
	empty: string;
};

function statusLabel(league: OrgLeaguesGridLeague, labels: OrgLeaguesGridLabels): string {
	if (league.jornada != null) return `${labels.matchdayWord} ${league.jornada}`;
	return `${league.teamsCount} ${labels.teamsWord}`;
}

export function OrgLeaguesGrid({
	leagues,
	labels,
}: {
	leagues: OrgLeaguesGridLeague[];
	labels: OrgLeaguesGridLabels;
}) {
	return (
		<Stack gap="sm">
			<Typography variant="caption" weight="bold" tone="ink-3" className="uppercase tracking-wide">
				{labels.title}
			</Typography>

			{leagues.length === 0 ? (
				<Typography variant="bodySm" tone="ink-3" className="text-center py-6">
					{labels.empty}
				</Typography>
			) : (
				<Stack gap="sm" className="md:grid md:grid-cols-2 md:gap-3.5 md:flex-none">
					{leagues.map((league) => (
						<OrgLeagueRow
							key={league.slug}
							slug={league.slug}
							name={league.name}
							statusLabel={statusLabel(league, labels)}
							viewLabel={labels.viewTable}
						/>
					))}
				</Stack>
			)}
		</Stack>
	);
}
