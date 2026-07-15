"use client";

/**
 * app/admin/players/PlayersFilterBar.tsx
 *
 * FilterBar de /admin/players (organizador) — nombre, estado, liga, equipo
 * (dependiente de liga) siempre visibles; dorsal en "Más filtros". Todo el
 * estado vive en la URL (contrato ListQuery, ver shared/lib/list-query):
 * aplicar cualquier control resetea a página 1.
 *
 * Equipo depende de Liga: deshabilitado hasta elegir Liga; al cambiar Liga
 * se limpia y recarga sus opciones vía useLeagueTeams (TanStack Query, cachea
 * por liga — reusa el hook de team-management en vez de un fetch manual).
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
	SearchControl,
	SelectControl,
	ComboboxControl,
	MultiSelectControl,
	NumberRangeControl,
	type FilterOption,
} from "@/shared/ui/filters";
import { Button } from "@/shared/ui/Button";
import { useLeagueTeams } from "@/features/team-management";

const ESTADO_OPTIONS: FilterOption[] = [
	{ value: "active", label: "Activo" },
	{ value: "suspended", label: "Suspendido" },
	{ value: "inactive", label: "Inactivo" },
];

export function PlayersFilterBar({ leagueOptions }: { leagueOptions: FilterOption[] }) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const nombre = searchParams.get("nombre") ?? "";
	const estados = (searchParams.get("estado") ?? "").split(",").filter(Boolean);
	const liga = searchParams.get("liga") ?? "";
	const equipo = searchParams.get("equipo") ?? "";
	const dorsalMin = searchParams.get("dorsal__gte") ?? "";
	const dorsalMax = searchParams.get("dorsal__lte") ?? "";

	const [moreOpen, setMoreOpen] = useState(false);

	// enabled:false dentro de useLeagueTeams deja isPending=true en reposo (sin
	// liga elegida) — se acota a liga presente para no mostrar loading eterno.
	const { data: teams, isPending } = useLeagueTeams(liga);
	const equipoLoading = liga.length > 0 && isPending;
	const equipoOptions = useMemo<FilterOption[]>(
		() => (teams ?? []).map((t) => ({ value: t.id, label: t.name })),
		[teams],
	);

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

	const dorsalActive = dorsalMin !== "" || dorsalMax !== "";

	return (
		<div className="flex flex-wrap items-center gap-2.5">
			<SearchControl
				className="w-full sm:w-[240px]"
				value={nombre}
				onApply={(v) => apply({ nombre: v || null })}
				placeholder="Buscar jugador por nombre…"
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
				onApply={(v) => apply({ liga: v || null, equipo: null })}
				placeholder="Todas las ligas"
				options={leagueOptions}
			/>
			<SelectControl
				className="w-full sm:w-[190px]"
				value={equipo}
				onApply={(v) => apply({ equipo: v || null })}
				placeholder={liga ? "Todos los equipos" : "Elige una liga primero"}
				disabled={!liga}
				loading={equipoLoading}
				options={equipoOptions}
			/>
			<div className="relative">
				<Button
					variant="secondary"
					size="md"
					icon={SlidersHorizontal}
					onClick={() => setMoreOpen((o) => !o)}
				>
					Más filtros{dorsalActive ? " · 1" : ""}
				</Button>
				{moreOpen && (
					<div className="absolute z-30 top-[calc(100%+6px)] right-0 bg-surface border border-line rounded-md shadow-xl shadow-black/40 p-3 flex items-center gap-2">
						<NumberRangeControl
							className="w-[170px]"
							label="Dorsal"
							min={dorsalMin}
							max={dorsalMax}
							onApply={(lo, hi) => apply({ dorsal__gte: lo || null, dorsal__lte: hi || null })}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
