/**
 * org-nav.ts — construcción de la navegación del shell público de la org
 * (lógica pura, sin JSX, para mantener OrgShellHeader/OrgShellMobileMenu
 * bajo el límite de 150 líneas, §3.5 AGENTS.md).
 *
 * "Cablear a lo existente": con UNA liga activa, Ranking/Jornadas apuntan a
 * los tabs de esa liga (para una sola liga, el agregado y el tab individual
 * son lo mismo); con varias, Ligas ancla al grid del home, Ranking va a
 * `/ranking`, Jornadas va a `/jornadas`. Análisis y Reglamento siempre
 * "Pronto" (sin superficie pública aún). Ver docs/SUBDOMINIOS-MULTITENANT.md.
 */

import {
	Home,
	Trophy,
	Medal,
	CalendarDays,
	BarChart3,
	BookOpen,
	type LucideIcon,
} from "lucide-react";
import type { OrgShellLabels } from "./OrgPublicShell";

export type OrgNavItem = {
	id: string;
	label: string;
	icon: LucideIcon;
	/** ruta relativa dentro del subdominio, o null si está "Pronto" */
	href: string | null;
};

export function buildOrgNav(
	leagues: { slug: string; name: string }[],
	labels: OrgShellLabels["nav"],
): OrgNavItem[] {
	const single = leagues.length === 1 ? leagues[0] : null;

	return [
		{ id: "home", label: labels.home, icon: Home, href: "/" },
		{
			id: "ligas",
			label: labels.ligas,
			icon: Trophy,
			href: single ? `/${single.slug}` : "/#ligas",
		},
		{
			id: "ranking",
			label: labels.ranking,
			icon: Medal,
			href: single ? `/${single.slug}?tab=tabla` : "/ranking",
		},
		{
			id: "jornadas",
			label: labels.jornadas,
			icon: CalendarDays,
			href: single ? `/${single.slug}?tab=jornada` : "/jornadas",
		},
		{ id: "analisis", label: labels.analisis, icon: BarChart3, href: null },
		{ id: "reglamento", label: labels.reglamento, icon: BookOpen, href: null },
	];
}

/** "Home" activo solo en la raíz; "Ranking"/"Jornadas" en sus propias rutas;
 * "Ligas" en cualquier página de liga (nunca en /ranking, /jornadas ni
 * /player/...). El resto no marca activo (tabs vía searchParams, o "Pronto"). */
export function resolveActiveNavId(pathname: string): string {
	if (pathname === "/") return "home";
	if (pathname === "/ranking") return "ranking";
	if (pathname === "/jornadas") return "jornadas";
	const isLeaguePage =
		pathname !== "/" &&
		pathname !== "/ranking" &&
		pathname !== "/jornadas" &&
		!pathname.startsWith("/player/");
	return isLeaguePage ? "ligas" : "";
}
