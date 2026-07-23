"use client";

/**
 * features/global-search/ui/GlobalSearch.tsx
 * Buscador universal por organización — v1 funcional sin diseño de Jocobi
 * (Fase C, docs/UNIVERSAL-SEARCH.md §9: "no decide UI concreta"). Mismo
 * esqueleto que org-home-search/OrgHomeSearch (debounce, click-outside),
 * + navegación por teclado (↑/↓/Enter/Escape) porque el doc lo describe como
 * command-palette. Convive con OrgHomeSearch: no lo reemplaza (§8.2 sin
 * decidir) — este componente aún no está montado en ninguna página.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "@/shared/i18n/navigation";
import type { SearchHit, SearchHitKind } from "@/entities/search";
import { useUniversalSearch } from "../model/useUniversalSearch";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from "../constants";
import { GlobalSearchResults, type GlobalSearchLabels } from "./GlobalSearchResults";

export type GlobalSearchProps = {
	orgSlug: string;
	placeholder: string;
	minCharsLabel: string;
	labels: GlobalSearchLabels;
	types?: SearchHitKind[];
};

export function GlobalSearch({
	orgSlug,
	placeholder,
	minCharsLabel,
	labels,
	types,
}: GlobalSearchProps) {
	const router = useRouter();
	const [draft, setDraft] = useState("");
	const [debounced, setDebounced] = useState("");
	const [open, setOpen] = useState(false);
	const [highlighted, setHighlighted] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const q = debounced.trim();
	const { data, isFetching } = useUniversalSearch(orgSlug, q, types);
	const hits = useMemo(() => data ?? [], [data]);

	// Reset del índice resaltado cuando cambian los resultados — ajuste
	// durante el render (no en un efecto) para evitar el cascading render que
	// marca react-hooks/set-state-in-effect (regla AGENTS.md §7.2).
	const [prevHits, setPrevHits] = useState(hits);
	if (hits !== prevHits) {
		setPrevHits(hits);
		setHighlighted(0);
	}

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

	function handleSelect(hit: SearchHit) {
		setOpen(false);
		router.push(hit.url);
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (!open || hits.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlighted((i) => (i + 1) % hits.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlighted((i) => (i - 1 + hits.length) % hits.length);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const hit = hits[highlighted];
			if (hit) handleSelect(hit);
		} else if (e.key === "Escape") {
			setOpen(false);
		}
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
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					autoComplete="off"
					role="combobox"
					aria-expanded={open}
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
					{minCharsLabel}
				</p>
			)}

			{open && q.length >= SEARCH_MIN_CHARS && (
				<GlobalSearchResults
					hits={hits}
					isFetching={isFetching}
					labels={labels}
					highlightedIndex={highlighted}
					onSelect={handleSelect}
				/>
			)}
		</div>
	);
}
