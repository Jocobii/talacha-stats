"use client";

/**
 * app/admin/suspensiones/SuspensionesFilterBar.tsx
 *
 * FilterBar de /admin/suspensiones (organizador) — jugador, estado, tipo y
 * liga. Todo el estado vive en la URL (contrato ListQuery, ver
 * shared/lib/list-query): aplicar cualquier control resetea a página 1.
 * Espejo simplificado de app/admin/players/PlayersFilterBar.tsx.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
	SearchControl,
	SelectControl,
	ComboboxControl,
	MultiSelectControl,
	type FilterOption,
} from "@/shared/ui/filters";

const ESTADO_OPTIONS: FilterOption[] = [
	{ value: "active", label: "Activa" },
	{ value: "served", label: "Cumplida" },
	{ value: "lifted", label: "Levantada" },
];

const TIPO_OPTIONS: FilterOption[] = [
	{ value: "matches", label: "Por partidos" },
	{ value: "time", label: "Por tiempo" },
	{ value: "permanent", label: "Veto indefinido" },
];

export function SuspensionesFilterBar({ leagueOptions }: { leagueOptions: FilterOption[] }) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const jugador = searchParams.get("jugador") ?? "";
	const estados = (searchParams.get("estado") ?? "").split(",").filter(Boolean);
	const tipo = searchParams.get("tipo") ?? "";
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
				value={jugador}
				onApply={(v) => apply({ jugador: v || null })}
				placeholder="Buscar jugador por nombre…"
			/>
			<MultiSelectControl
				className="w-full sm:w-[160px]"
				label="Estado"
				options={ESTADO_OPTIONS}
				values={estados}
				onChange={(vals) => apply({ estado: vals.length ? vals.join(",") : null })}
			/>
			<SelectControl
				className="w-full sm:w-[180px]"
				value={tipo}
				onApply={(v) => apply({ tipo: v || null })}
				placeholder="Todos los tipos"
				options={TIPO_OPTIONS}
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
