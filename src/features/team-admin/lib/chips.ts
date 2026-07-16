/**
 * features/team-admin/lib/chips.ts
 *
 * Traduce los filtros activos de ListQuery a chips removibles (label + href
 * sin ese filtro). Lógica pura, sin acceso a DB — espejo de
 * features/player-admin/lib/chips.ts, acotado a nombre/liga.
 */

import type { FilterCondition } from "@/shared/lib/list-query";

export type TeamFilterChip = { key: string; label: string; href: string };

export function buildTeamFilterChips(opts: {
	basePath: string;
	filters: FilterCondition[];
	searchParams: URLSearchParams;
	leagueNameById: Map<string, string>;
}): TeamFilterChip[] {
	const { basePath, filters, searchParams, leagueNameById } = opts;
	const chips: TeamFilterChip[] = [];

	for (const f of filters) {
		const chip = chipForFilter(f, { basePath, searchParams, leagueNameById });
		if (chip && !chips.some((c) => c.key === chip.key)) chips.push(chip);
	}

	return chips;
}

function chipForFilter(
	f: FilterCondition,
	ctx: {
		basePath: string;
		searchParams: URLSearchParams;
		leagueNameById: Map<string, string>;
	},
): TeamFilterChip | null {
	if (f.field === "nombre" && typeof f.value === "string") {
		return { key: "nombre", label: `“${f.value}”`, href: hrefWithout(ctx, ["nombre"]) };
	}
	if (f.field === "liga" && typeof f.value === "string") {
		return {
			key: "liga",
			label: ctx.leagueNameById.get(f.value) ?? "Liga",
			href: hrefWithout(ctx, ["liga"]),
		};
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
