"use client";

/**
 * app/(public)/org/[slug]/[leagueSlug]/ScorersSearchBar.tsx
 *
 * Buscador de goleadores — el filtrado/paginado real vive en el servidor
 * (searchTopScorers, entities/organization/queries.ts) vía querystring
 * (?tab=goleadores&q=...&page=1). Este componente SOLO controla el input y
 * navega — nunca filtra en memoria (ver AGENTS.md §17.3 y el molde de
 * PlayersFilterBar.tsx en /admin/players).
 *
 * `usePathname`/`useRouter` vienen de @/shared/i18n/navigation (locale-aware)
 * — `useSearchParams` crudo de next/navigation porque el query string no
 * tiene variante por locale.
 */

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { SearchControl } from "@/shared/ui/filters";

export default function ScorersSearchBar() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const q = searchParams.get("q") ?? "";

	const apply = useCallback(
		(value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) params.set("q", value);
			else params.delete("q");
			params.set("tab", "goleadores");
			params.set("page", "1");
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[pathname, router, searchParams],
	);

	return (
		<SearchControl
			value={q}
			onApply={apply}
			placeholder="Buscar jugador por nombre..."
			className="w-full"
		/>
	);
}
