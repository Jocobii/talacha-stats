/**
 * features/team-admin/lib/chips.ts
 *
 * Traduce los filtros activos de ListQuery a chips removibles (label + href
 * sin ese filtro). Lógica pura, sin acceso a DB — espejo de
 * features/player-admin/lib/chips.ts, acotado a nombre/estado/liga.
 *
 * "estado" solo genera chip cuando el usuario lo pidió explícito en la URL —
 * el default "solo activos" (sin ?estado=) es silencioso, no se muestra como
 * filtro activo (ver entities/team/queries.ts).
 */

import type { FilterCondition } from "@/shared/lib/list-query";

export type TeamFilterChip = { key: string; label: string; href: string };

const ESTADO_LABEL: Record<string, string> = {
	active: "Activo",
	disbanded: "Disuelto",
};

export function buildTeamFilterChips(opts: {
	basePath: string;
	filters: FilterCondition[];
	searchParams: URLSearchParams;
	leagueNameById: Map<string, string>;
}): TeamFilterChip[] {
	const { basePath, filters, searchParams, leagueNameById } = opts;
	const chips: TeamFilterChip[] = [];

	for (const f of filters) {
		const result = chipForFilter(f, { basePath, searchParams, leagueNameById });
		const newChips = (Array.isArray(result) ? result : result ? [result] : []).filter(
			(chip) => !chips.some((c) => c.key === chip.key),
		);
		chips.push(...newChips);
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
): TeamFilterChip | TeamFilterChip[] | null {
	if (f.field === "nombre" && typeof f.value === "string") {
		return { key: "nombre", label: `“${f.value}”`, href: hrefWithout(ctx, ["nombre"]) };
	}
	if (f.field === "estado") return estadoChips(f, ctx);
	if (f.field === "liga" && typeof f.value === "string") {
		return {
			key: "liga",
			label: ctx.leagueNameById.get(f.value) ?? "Liga",
			href: hrefWithout(ctx, ["liga"]),
		};
	}
	return null;
}

function estadoChips(
	f: FilterCondition,
	ctx: { basePath: string; searchParams: URLSearchParams },
): TeamFilterChip[] {
	const values = Array.isArray(f.value) ? f.value : [f.value];
	return values.map((v) => ({
		key: `estado-${v}`,
		label: ESTADO_LABEL[String(v)] ?? String(v),
		href: hrefWithoutEstadoValue(ctx, String(v)),
	}));
}

function hrefWithoutEstadoValue(
	ctx: { basePath: string; searchParams: URLSearchParams },
	value: string,
): string {
	const next = new URLSearchParams(ctx.searchParams);
	const remaining = (next.get("estado") ?? "").split(",").filter((v) => v && v !== value);
	if (remaining.length > 0) next.set("estado", remaining.join(","));
	else next.delete("estado");
	next.set("page", "1");
	return buildHref(ctx.basePath, next);
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
