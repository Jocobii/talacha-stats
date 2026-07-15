"use client";

/**
 * app/admin/teams/TeamsFilterBar.tsx
 *
 * FilterBar de /admin/teams (organizador) — nombre y liga siempre visibles.
 * Todo el estado vive en la URL (contrato ListQuery, ver shared/lib/list-query):
 * aplicar cualquier control resetea a página 1. Espejo simplificado de
 * app/admin/players/PlayersFilterBar.tsx (sin estado/equipo/dorsal — no
 * aplican a equipos).
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SearchControl, ComboboxControl, type FilterOption } from "@/shared/ui/filters";

export function TeamsFilterBar({ leagueOptions }: { leagueOptions: FilterOption[] }) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const nombre = searchParams.get("nombre") ?? "";
	const liga = searchParams.get("liga") ?? "";

	const apply = useCallback(
		(entries: Record<string, string | null>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, value] of Object.entries(entries)) {
				if (value) params.set(key, value);
				else params.delete(key);
			}
			params.set("page", "1");
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[pathname, router, searchParams],
	);

	return (
		<div className="flex flex-wrap items-center gap-2.5">
			<SearchControl
				className="w-full sm:w-[240px]"
				value={nombre}
				onApply={(v) => apply({ nombre: v || null })}
				placeholder="Buscar equipo por nombre…"
			/>
			<ComboboxControl
				className="w-full sm:w-[190px]"
				value={liga}
				onApply={(v) => apply({ liga: v || null })}
				placeholder="Todas las ligas"
				options={leagueOptions}
			/>
		</div>
	);
}
