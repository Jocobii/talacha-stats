/**
 * features/league-admin/lib/chips.ts
 *
 * Traduce los filtros activos de ListQuery a chips removibles (label + href
 * sin ese filtro). Lógica pura, sin acceso a DB — espejo de
 * features/team-admin/lib/chips.ts, acotado a nombre/estado/dia.
 */

import type { FilterCondition } from "@/shared/lib/list-query";

export type LeagueFilterChip = { key: string; label: string; href: string };

const ESTADO_LABELS: Record<string, string> = {
	active: "Activa",
	finished: "Terminada",
};

const DAY_LABELS: Record<string, string> = {
	lunes: "Lunes",
	martes: "Martes",
	miercoles: "Miércoles",
	jueves: "Jueves",
	viernes: "Viernes",
	sabado: "Sábado",
	domingo: "Domingo",
};

export function buildLeagueFilterChips(opts: {
	basePath: string;
	filters: FilterCondition[];
	searchParams: URLSearchParams;
}): LeagueFilterChip[] {
	const { basePath, filters, searchParams } = opts;
	const chips: LeagueFilterChip[] = [];

	for (const f of filters) {
		const chip = chipForFilter(f, { basePath, searchParams });
		if (chip && !chips.some((c) => c.key === chip.key)) chips.push(chip);
	}

	return chips;
}

function chipForFilter(
	f: FilterCondition,
	ctx: { basePath: string; searchParams: URLSearchParams },
): LeagueFilterChip | null {
	if (f.field === "nombre" && typeof f.value === "string") {
		return { key: "nombre", label: `“${f.value}”`, href: hrefWithout(ctx, ["nombre"]) };
	}
	if (f.field === "estado" && typeof f.value === "string") {
		return {
			key: "estado",
			label: ESTADO_LABELS[f.value] ?? f.value,
			href: hrefWithout(ctx, ["estado"]),
		};
	}
	if (f.field === "dia" && typeof f.value === "string") {
		return { key: "dia", label: DAY_LABELS[f.value] ?? f.value, href: hrefWithout(ctx, ["dia"]) };
	}
	return null;
}

function hrefWithout(
	ctx: { basePath: string; searchParams: URLSearchParams },
	keys: string[],
): string {
	const next = new URLSearchParams(ctx.searchParams);
	for (const k of keys) next.delete(k);
	next.set("page", "1");
	return buildHref(ctx.basePath, next);
}

function buildHref(basePath: string, params: URLSearchParams): string {
	const qs = params.toString();
	return qs ? `${basePath}?${qs}` : basePath;
}
