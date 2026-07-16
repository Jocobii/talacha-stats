/**
 * features/discipline/lib/chips.ts
 *
 * Traduce los filtros activos de ListQuery (vista organizador de
 * /admin/suspensiones) a chips removibles (label + href sin ese filtro).
 * Lógica pura, sin acceso a DB — espejo de features/player-admin/lib/chips.ts
 * y features/team-admin/lib/chips.ts, adaptado a los campos de suspensiones
 * (jugador/estado/tipo/liga).
 */

import type { FilterCondition } from "@/shared/lib/list-query";

export type SuspensionFilterChip = { key: string; label: string; href: string };

const ESTADO_LABEL: Record<string, string> = {
	active: "Activa",
	served: "Cumplida",
	lifted: "Levantada",
};

const TIPO_LABEL: Record<string, string> = {
	matches: "Por partidos",
	time: "Por tiempo",
	permanent: "Veto indefinido",
};

export function buildSuspensionFilterChips(opts: {
	basePath: string;
	filters: FilterCondition[];
	searchParams: URLSearchParams;
	leagueNameById: Map<string, string>;
}): SuspensionFilterChip[] {
	const { basePath, filters, searchParams, leagueNameById } = opts;
	const chips: SuspensionFilterChip[] = [];

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
	ctx: { basePath: string; searchParams: URLSearchParams; leagueNameById: Map<string, string> },
): SuspensionFilterChip | SuspensionFilterChip[] | null {
	if (f.field === "jugador" && typeof f.value === "string") {
		return { key: "jugador", label: `“${f.value}”`, href: hrefWithout(ctx, ["jugador"]) };
	}
	if (f.field === "estado") return listChips(f, ctx, "estado", ESTADO_LABEL);
	if (f.field === "tipo") return listChips(f, ctx, "tipo", TIPO_LABEL);
	if (f.field === "liga" && typeof f.value === "string") {
		return {
			key: "liga",
			label: ctx.leagueNameById.get(f.value) ?? "Liga",
			href: hrefWithout(ctx, ["liga"]),
		};
	}
	return null;
}

function listChips(
	f: FilterCondition,
	ctx: { basePath: string; searchParams: URLSearchParams },
	field: string,
	labels: Record<string, string>,
): SuspensionFilterChip[] {
	const values = Array.isArray(f.value) ? f.value : [f.value];
	return values.map((v) => ({
		key: `${field}-${v}`,
		label: labels[String(v)] ?? String(v),
		href: hrefWithoutListValue(ctx, field, String(v)),
	}));
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

function hrefWithoutListValue(
	ctx: { basePath: string; searchParams: URLSearchParams },
	field: string,
	value: string,
): string {
	const next = new URLSearchParams(ctx.searchParams);
	const remaining = (next.get(field) ?? "").split(",").filter((v) => v && v !== value);
	if (remaining.length > 0) next.set(field, remaining.join(","));
	else next.delete(field);
	next.set("page", "1");
	return buildHref(ctx.basePath, next);
}

function buildHref(basePath: string, params: URLSearchParams): string {
	const qs = params.toString();
	return qs ? `${basePath}?${qs}` : basePath;
}
