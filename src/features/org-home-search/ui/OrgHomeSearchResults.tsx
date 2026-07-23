/**
 * features/org-home-search/ui/OrgHomeSearchResults.tsx
 * Dropdown de resultados del buscador de equipos — extraído de OrgHomeSearch
 * para mantener ambos componentes bajo el límite de 150 líneas (§3.5 AGENTS.md).
 */

import type { OrgTeamSearchResult } from "@/entities/organization";

export function OrgHomeSearchResults({
	results,
	isFetching,
	noResultsLabel,
	loadingLabel,
	onSelect,
}: {
	results: OrgTeamSearchResult[];
	isFetching: boolean;
	noResultsLabel: string;
	loadingLabel: string;
	onSelect: (team: OrgTeamSearchResult) => void;
}) {
	return (
		<ul className="absolute z-30 top-[calc(100%+8px)] left-0 w-full max-h-72 overflow-auto bg-surface border border-line rounded-2xl shadow-xl shadow-black/40 p-2">
			{results.length === 0 ? (
				<li className="px-3 py-2.5 text-sm text-ink-3">
					{isFetching ? loadingLabel : noResultsLabel}
				</li>
			) : (
				results.map((team) => (
					<li
						key={team.teamId}
						onClick={() => onSelect(team)}
						className="px-3 py-2.5 rounded-xl text-sm cursor-pointer transition hover:bg-surface-2"
					>
						<span className="block font-semibold text-ink truncate">{team.teamName}</span>
						<span className="block text-xs text-ink-3 truncate">{team.leagueName}</span>
					</li>
				))
			)}
		</ul>
	);
}
