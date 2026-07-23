/**
 * features/global-search/ui/GlobalSearchResults.tsx
 * Dropdown de resultados del buscador universal, agrupados por `kind` —
 * extraído de GlobalSearch para mantener ambos bajo 150 líneas (§3.5 AGENTS.md).
 * Versión v1 sin diseño de Jocobi (Fase C, docs/UNIVERSAL-SEARCH.md §9):
 * estilo mínimo reusando las clases de OrgHomeSearchResults, listo para
 * reemplazar cuando exista un mockup real.
 */

import { Users, Trophy, User, AlertTriangle, MapPin, type LucideIcon } from "lucide-react";
import type { SearchHit, SearchHitKind } from "@/entities/search";

const KIND_ICON: Record<SearchHitKind, LucideIcon> = {
	team: Users,
	league: Trophy,
	player: User,
	suspension: AlertTriangle,
	venue: MapPin,
};

export type GlobalSearchLabels = {
	noResults: string;
	loading: string;
	kindGroups: Record<SearchHitKind, string>;
};

export function GlobalSearchResults({
	hits,
	isFetching,
	labels,
	highlightedIndex,
	onSelect,
}: {
	hits: SearchHit[];
	isFetching: boolean;
	labels: GlobalSearchLabels;
	highlightedIndex: number;
	onSelect: (hit: SearchHit) => void;
}) {
	if (hits.length === 0) {
		return (
			<ul className="absolute z-30 top-[calc(100%+8px)] left-0 w-full max-h-96 overflow-auto bg-surface border border-line rounded-2xl shadow-xl shadow-black/40 p-2">
				<li className="px-3 py-2.5 text-sm text-ink-3">
					{isFetching ? labels.loading : labels.noResults}
				</li>
			</ul>
		);
	}

	// Agrupa preservando el orden de score que ya viene del backend.
	const groups = new Map<SearchHitKind, SearchHit[]>();
	for (const hit of hits) {
		const bucket = groups.get(hit.kind) ?? [];
		bucket.push(hit);
		groups.set(hit.kind, bucket);
	}

	let flatIndex = -1;

	return (
		<ul
			role="listbox"
			className="absolute z-30 top-[calc(100%+8px)] left-0 w-full max-h-96 overflow-auto bg-surface border border-line rounded-2xl shadow-xl shadow-black/40 p-2"
		>
			{[...groups.entries()].map(([kind, kindHits]) => {
				const Icon = KIND_ICON[kind];
				return (
					<li key={kind} className="mb-1 last:mb-0">
						<p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
							{labels.kindGroups[kind]}
						</p>
						<ul>
							{kindHits.map((hit) => {
								flatIndex++;
								const isHighlighted = flatIndex === highlightedIndex;
								return (
									<li
										key={`${hit.kind}-${hit.id}`}
										role="option"
										aria-selected={isHighlighted}
										onClick={() => onSelect(hit)}
										className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition ${
											isHighlighted ? "bg-surface-2" : "hover:bg-surface-2"
										}`}
									>
										<Icon size={16} strokeWidth={2} className="shrink-0 text-ink-3" />
										<span className="min-w-0">
											<span className="block font-semibold text-ink truncate">{hit.title}</span>
											{hit.subtitle && (
												<span className="block text-xs text-ink-3 truncate">{hit.subtitle}</span>
											)}
										</span>
									</li>
								);
							})}
						</ul>
					</li>
				);
			})}
		</ul>
	);
}
