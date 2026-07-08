/**
 * features/narrator-analysis/ui/NarratorReportActions.tsx
 *
 * Barra de acciones del reporte (compartir + exportar PDF/PNG). Componente
 * tonto: recibe el `ConfirmedMatchup` ya resuelto y arma las URLs con los
 * constructores centralizados de `constants.ts` (§3.5 — nada de strings sueltos).
 */

import { NARRATOR_EXPORT_URL } from "../constants";
import { ShareLinkButton } from "./ShareLinkButton";
import type { ConfirmedMatchup } from "../types";

type Labels = { share: string; copied: string; pdf: string; png: string };

export function NarratorReportActions({
	matchup,
	labels,
}: {
	matchup: ConfirmedMatchup;
	labels: Labels;
}) {
	const actionBtnCls =
		"flex items-center gap-1.5 bg-surface-2 border border-line text-ink-2 hover:text-ink text-sm font-medium px-4 py-2 rounded-xl transition";

	return (
		<>
			<ShareLinkButton
				className={actionBtnCls}
				labels={{ share: labels.share, copied: labels.copied }}
			/>
			<a
				href={NARRATOR_EXPORT_URL("pdf", matchup.leagueId, matchup.teamA, matchup.teamB)}
				download
				className={actionBtnCls}
			>
				{labels.pdf}
			</a>
			<a
				href={NARRATOR_EXPORT_URL("png", matchup.leagueId, matchup.teamA, matchup.teamB)}
				download
				className={actionBtnCls}
			>
				{labels.png}
			</a>
		</>
	);
}
