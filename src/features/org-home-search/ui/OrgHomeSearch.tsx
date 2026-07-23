"use client";

/**
 * features/org-home-search/ui/OrgHomeSearch.tsx
 * Zona 1 (Hero Search) del home del subdominio: "¿En qué equipo juegas?".
 * Debounce 300ms / mínimo 2 letras (mismo patrón que
 * discipline/PlayerSearchAutocomplete.tsx). Al elegir un equipo navega a la
 * página pública de su liga (`/{leagueSlug}`, relativa al subdominio).
 */

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "@/shared/i18n/navigation";
import type { OrgTeamSearchResult } from "@/entities/organization";
import { useOrgTeamSearch } from "../model/useOrgTeamSearch";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from "../constants";
import { OrgHomeSearchResults } from "./OrgHomeSearchResults";

export type OrgHomeSearchLabels = {
	placeholder: string;
	minChars: string;
	noResults: string;
	loading: string;
};

export function OrgHomeSearch({
	orgSlug,
	labels,
}: {
	orgSlug: string;
	labels: OrgHomeSearchLabels;
}) {
	const router = useRouter();
	const [draft, setDraft] = useState("");
	const [debounced, setDebounced] = useState("");
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const q = debounced.trim();
	const { data, isFetching } = useOrgTeamSearch(orgSlug, q);
	const results = data ?? [];

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	function handleChange(value: string) {
		setDraft(value);
		setOpen(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setDebounced(value), SEARCH_DEBOUNCE_MS);
	}

	function handleSelect(team: OrgTeamSearchResult) {
		setOpen(false);
		if (team.leagueSlug) router.push(`/${team.leagueSlug}`);
	}

	return (
		<div className="relative w-full max-w-[640px]" ref={ref}>
			<div className="relative">
				<Search
					size={18}
					strokeWidth={2}
					className="absolute left-[18px] top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
				/>
				<input
					value={draft}
					onFocus={() => setOpen(true)}
					onChange={(e) => handleChange(e.target.value)}
					placeholder={labels.placeholder}
					autoComplete="off"
					className="w-full h-14 md:h-[66px] rounded-2xl bg-surface-2 border border-line text-ink text-lg md:text-xl placeholder:text-ink-3 pl-12 pr-5 outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 transition"
				/>
				{isFetching && (
					<Loader2
						size={16}
						className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-ink-3"
					/>
				)}
			</div>

			{open && draft.length > 0 && q.length < SEARCH_MIN_CHARS && (
				<p className="absolute top-[calc(100%+8px)] left-0 text-xs text-ink-3 px-1">
					{labels.minChars}
				</p>
			)}

			{open && q.length >= SEARCH_MIN_CHARS && (
				<OrgHomeSearchResults
					results={results}
					isFetching={isFetching}
					noResultsLabel={labels.noResults}
					loadingLabel={labels.loading}
					onSelect={handleSelect}
				/>
			)}
		</div>
	);
}
