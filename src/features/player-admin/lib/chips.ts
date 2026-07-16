/**
 * features/player-admin/lib/chips.ts
 *
 * Traduce los filtros activos de ListQuery a chips removibles (label + href
 * sin ese filtro). Lógica pura, sin acceso a DB — vive en features/ porque
 * conoce la semántica específica de los campos de jugadores (nombre/estado/
 * liga/equipo/dorsal), no es un helper genérico de shared/.
 */

import type { FilterCondition } from "@/shared/lib/list-query";

export type PlayerFilterChip = { key: string; label: string; href: string };

const ESTADO_LABEL: Record<string, string> = {
	active: "Activo",
	suspended: "Suspendido",
	inactive: "Inactivo",
};

export function buildPlayerFilterChips(opts: {
	basePath: string;
	filters: FilterCondition[];
	searchParams: URLSearchParams;
	leagueNameById: Map<string, string>;
	equipoLabel: string;
}): PlayerFilterChip[] {
	const { basePath, filters, searchParams, leagueNameById, equipoLabel } = opts;
	const chips: PlayerFilterChip[] = [];

	for (const f of filters) {
		const result = chipForFilter(f, { basePath, searchParams, leagueNameById, equipoLabel });
		// "estado" puede devolver varios chips (uno por valor seleccionado) —
		// normalizar siempre a array antes de empujar, si no el array completo
		// termina como un solo "chip" sin key/href (→ <Link href={undefined}>).
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
		equipoLabel: string;
	},
): PlayerFilterChip | PlayerFilterChip[] | null {
	if (f.field === "nombre" && typeof f.value === "string") {
		return { key: "nombre", label: `“${f.value}”`, href: hrefWithout(ctx, ["nombre"]) };
	}
	if (f.field === "estado") return estadoChips(f, ctx);
	if (f.field === "liga" && typeof f.value === "string") {
		return {
			key: "liga",
			label: ctx.leagueNameById.get(f.value) ?? "Liga",
			href: hrefWithout(ctx, ["liga", "equipo"]),
		};
	}
	if (f.field === "equipo" && typeof f.value === "string") {
		return { key: "equipo", label: ctx.equipoLabel, href: hrefWithout(ctx, ["equipo"]) };
	}
	if (f.field === "dorsal") return dorsalChip(ctx);
	return null;
}

function estadoChips(
	f: FilterCondition,
	ctx: { basePath: string; searchParams: URLSearchParams },
): PlayerFilterChip[] {
	const values = Array.isArray(f.value) ? f.value : [f.value];
	return values.map((v) => ({
		key: `estado-${v}`,
		label: ESTADO_LABEL[String(v)] ?? String(v),
		href: hrefWithoutEstadoValue(ctx, String(v)),
	}));
}

function dorsalChip(ctx: { basePath: string; searchParams: URLSearchParams }): PlayerFilterChip {
	const gte = ctx.searchParams.get("dorsal__gte") || "0";
	const lte = ctx.searchParams.get("dorsal__lte") || "∞";
	return {
		key: "dorsal",
		label: `Dorsal ${gte}–${lte}`,
		href: hrefWithout(ctx, ["dorsal__gte", "dorsal__lte"]),
	};
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

function buildHref(basePath: string, params: URLSearchParams): string {
	const qs = params.toString();
	return qs ? `${basePath}?${qs}` : basePath;
}
