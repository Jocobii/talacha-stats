"use client";

/**
 * app/(shell)/admin/leagues/LeaguesFilterBar.tsx
 *
 * FilterBar de /admin/leagues — nombre, estado y día. Todo el estado vive en
 * la URL (contrato ListQuery, ver shared/lib/list-query): aplicar cualquier
 * control resetea a página 1. Espejo de app/admin/teams/TeamsFilterBar.tsx.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SearchControl, SelectControl, type FilterOption } from "@/shared/ui/filters";

const ESTADO_OPTIONS: FilterOption[] = [
	{ value: "active", label: "Activa" },
	{ value: "finished", label: "Terminada" },
];

const DIA_OPTIONS: FilterOption[] = [
	{ value: "lunes", label: "Lunes" },
	{ value: "martes", label: "Martes" },
	{ value: "miercoles", label: "Miércoles" },
	{ value: "jueves", label: "Jueves" },
	{ value: "viernes", label: "Viernes" },
	{ value: "sabado", label: "Sábado" },
	{ value: "domingo", label: "Domingo" },
];

export function LeaguesFilterBar() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const nombre = searchParams.get("nombre") ?? "";
	const estado = searchParams.get("estado") ?? "";
	const dia = searchParams.get("dia") ?? "";

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
				placeholder="Buscar liga por nombre…"
			/>
			<SelectControl
				className="w-full sm:w-[160px]"
				value={estado}
				onApply={(v) => apply({ estado: v || null })}
				placeholder="Todos los estados"
				options={ESTADO_OPTIONS}
			/>
			<SelectControl
				className="w-full sm:w-[160px]"
				value={dia}
				onApply={(v) => apply({ dia: v || null })}
				placeholder="Todos los días"
				options={DIA_OPTIONS}
			/>
		</div>
	);
}
