/**
 * OrgTodaysMatches.tsx — Zona 2 (Valor y Ego) del home del subdominio:
 * "Jugando Hoy". Reutiliza OrgMatchFeed (variant="upcoming") en vez de
 * duplicar el render de partido — mismo criterio DRY que el resto de la
 * página (§3.5 AGENTS.md). Datos ya resueltos por `getOrgMatchesToday`.
 */

import { Inline, Stack } from "@/shared/ui/layout";
import { Typography } from "@/shared/ui";
import type { OrgFeedMatch } from "@/entities/organization";
import OrgMatchFeed from "./OrgMatchFeed";

export type OrgTodaysMatchesLabels = {
	title: string;
	vs: string;
	empty: string;
	countLabel: string;
};

export function OrgTodaysMatches({
	matches,
	labels,
}: {
	matches: OrgFeedMatch[];
	labels: OrgTodaysMatchesLabels;
}) {
	return (
		// min-w-0: mismo motivo que OrgWallOfFame — columna de un CSS grid;
		// sin esto, `truncate` en OrgMatchFeed no puede recortar nombres largos.
		<Stack gap="sm" className="min-w-0">
			<Inline justify="between" align="baseline">
				<Typography
					variant="caption"
					weight="bold"
					tone="ink-3"
					className="uppercase tracking-wide"
				>
					{labels.title}
				</Typography>
				{matches.length > 0 && (
					<Typography variant="caption" tone="ink-3">
						{labels.countLabel}
					</Typography>
				)}
			</Inline>

			<OrgMatchFeed
				variant="upcoming"
				matches={matches}
				vsWord={labels.vs}
				emptyLabel={labels.empty}
			/>
		</Stack>
	);
}
