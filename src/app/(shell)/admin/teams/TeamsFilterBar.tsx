"use client";

/**
 * app/admin/teams/TeamsFilterBar.tsx
 *
 * FilterBar de /admin/teams (organizador) — nombre, estado y liga siempre
 * visibles. Todo el estado vive en la URL (contrato ListQuery, ver
 * shared/lib/list-query): aplicar cualquier control resetea a página 1.
 * Espejo de app/admin/players/PlayersFilterBar.tsx.
 *
 * "estado" (Activo/Disuelto) es un caso especial: sin ?estado= en la URL el
 * default es "solo activos" (aplicado en listOrgTeams, entities/team/queries.ts)
 * — a diferencia de jugadores, donde ausencia de filtro es "todos". Por eso
 * el control arranca en ["active"] en vez de vacío.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
	SearchControl,
	ComboboxControl,
	MultiSelectControl,
	type FilterOption,
} from "@/shared/ui/filters";

const ESTADO_OPTIONS: FilterOption[] = [
	{ value: "active", label: "Activo" },
	{ value: "disbanded", label: "Disuelto" },
];

export function TeamsFilterBar({ leagueOptions }: { leagueOptions: FilterOption[] }) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const nombre = searchParams.get("nombre") ?? "";
	// Sin ?estado= en la URL, el control muestra "Activo" seleccionado —
	// refleja el default real del backend, no un estado "vacío" engañoso.
	const estados = searchParams.has("estado")
		? searchParams.get("estado")!.split(",").filter(Boolean)
		: ["active"];
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
			<MultiSelectControl
				className="w-full sm:w-[160px]"
				label="Estado"
				options={ESTADO_OPTIONS}
				values={estados}
				onChange={(vals) => apply({ estado: vals.length ? vals.join(",") : null })}
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
