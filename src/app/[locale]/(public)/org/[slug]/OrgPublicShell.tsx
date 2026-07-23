"use client";

/**
 * OrgPublicShell.tsx
 *
 * Shell del "sitio" público de una organización (docs/SUBDOMINIOS-MULTITENANT.md
 * §4, docs/ORG-THEMING.md §5). Reemplaza al viejo OrgPublicNav/OrgPublicFooter:
 * sidebar de escritorio + topbar con chips de ligas + drawer en mobile. Vive en
 * org/[slug]/layout.tsx, así que envuelve TODO el subárbol (home, liga, tabs).
 *
 * Client Component: necesita usePathname() para el estado activo y estado local
 * para el drawer mobile. Los datos scoped y los textos (i18n) llegan como props
 * desde el layout (server) — mismo espíritu "dato in, presentación out" que el
 * resto del mundo público.
 *
 * NAV — "cablear a lo existente": a nivel org solo existen el home (`/`) y las
 * páginas por liga (`/{leagueSlug}` con tabs tabla/goleadores/jornada). No hay
 * páginas org-level de Ranking/Jornadas/Análisis/Reglamento. Por eso:
 *   • con UNA liga activa, los ítems apuntan a los tabs de esa liga;
 *   • con varias, "Ligas" ancla al grid del home y Ranking/Jornadas quedan
 *     "Pronto" (no hay agregado cross-liga todavía);
 *   • Análisis y Reglamento siempre "Pronto" (sin superficie pública aún).
 *
 * LINKS — dentro del mundo de la org, `Link` (next-intl) solo navega a rutas
 * RELATIVAS del propio subdominio (home ↔ liga). El link "ver ligas de la
 * ciudad" SALE al apex, así que llega ya resuelto como URL absoluta y se pinta
 * como `<a>` (ver shared/tenant/apex-url.ts y el comentario del viejo nav).
 */

import { ReactNode, useState } from "react";
import { usePathname, Link } from "@/shared/i18n/navigation";
import {
	Home,
	Trophy,
	Medal,
	CalendarDays,
	BarChart3,
	BookOpen,
	MapPin,
	Menu,
	X,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import ShareButton from "@/shared/ui/ShareButton";

export type OrgShellLabels = {
	nav: {
		home: string;
		ligas: string;
		ranking: string;
		jornadas: string;
		analisis: string;
		reglamento: string;
	};
	soon: string;
	viewCityLeagues: string;
	poweredBy: string;
};

type OrgShellData = {
	slug: string;
	name: string;
	logoUrl: string | null;
	city: string;
	leagues: { slug: string; name: string }[];
};

type NavItem = {
	id: string;
	label: string;
	icon: LucideIcon;
	/** ruta relativa dentro del subdominio, o null si está "Pronto" */
	href: string | null;
};

function buildNav(leagues: OrgShellData["leagues"], labels: OrgShellLabels): NavItem[] {
	const single = leagues.length === 1 ? leagues[0] : null;

	return [
		{ id: "home", label: labels.nav.home, icon: Home, href: "/" },
		{
			id: "ligas",
			label: labels.nav.ligas,
			icon: Trophy,
			href: single ? `/${single.slug}` : "/#ligas",
		},
		{
			id: "ranking",
			label: labels.nav.ranking,
			icon: Medal,
			href: single ? `/${single.slug}?tab=tabla` : null,
		},
		{
			id: "jornadas",
			label: labels.nav.jornadas,
			icon: CalendarDays,
			href: single ? `/${single.slug}?tab=jornada` : null,
		},
		{ id: "analisis", label: labels.nav.analisis, icon: BarChart3, href: null },
		{ id: "reglamento", label: labels.nav.reglamento, icon: BookOpen, href: null },
	];
}

export default function OrgPublicShell({
	org,
	labels,
	viewCityLeaguesHref,
	children,
}: {
	org: OrgShellData;
	labels: OrgShellLabels;
	viewCityLeaguesHref: string;
	children: ReactNode;
}) {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	// Cerrar el drawer al navegar: se hace en el onClick de cada link, no en un
	// efecto sobre pathname (regla del proyecto: sin setState dentro de useEffect,
	// AGENTS.md §7.2).
	const closeDrawer = () => setMobileOpen(false);

	const nav = buildNav(org.leagues, labels);
	const initial = org.name.charAt(0).toUpperCase();

	// "Home" activo solo en la raíz del subdominio; "Ligas" activo en cualquier
	// página de liga. El resto no marca activo (tabs vía searchParams, o "Pronto").
	const isActive = (item: NavItem): boolean => {
		if (item.id === "home") return pathname === "/";
		if (item.id === "ligas") return pathname !== "/" && pathname.startsWith("/");
		return false;
	};

	return (
		<div className="flex h-screen overflow-hidden bg-pitch text-ink">
			{/* Overlay mobile */}
			{mobileOpen && (
				<div
					className="fixed inset-0 bg-black/55 z-40 md:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* ── Sidebar ── */}
			<aside
				className={cn(
					"flex flex-col h-screen shrink-0 w-[250px] md:w-56 bg-surface/95 border-r border-line",
					"fixed left-0 top-0 bottom-0 z-50 transition-transform duration-150 ease-out md:static md:translate-x-0",
					mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
				)}
			>
				{/* Header org */}
				<div className="flex items-center justify-between gap-2.5 px-4 pt-4 pb-3.5 border-b border-line">
					<Link href="/" onClick={closeDrawer} className="flex items-center gap-2.5 min-w-0">
						{org.logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={org.logoUrl}
								alt=""
								width={34}
								height={34}
								className="w-[34px] h-[34px] rounded-[9px] object-cover border border-brand/40 shrink-0"
							/>
						) : (
							<span className="w-[34px] h-[34px] rounded-[9px] shrink-0 grid place-items-center bg-brand/15 border border-brand/40 font-display font-black text-brand-ink text-base">
								{initial}
							</span>
						)}
						<span className="min-w-0">
							<span className="block font-display font-black text-[15.5px] text-ink tracking-tight truncate">
								{org.name}
							</span>
							<span className="flex items-center gap-1 text-[11px] text-ink-3">
								<MapPin size={10} strokeWidth={1.75} />
								{org.city}
							</span>
						</span>
					</Link>
					<button
						onClick={() => setMobileOpen(false)}
						className="md:hidden text-ink-3 hover:text-ink p-1 shrink-0"
						aria-label="Cerrar menú"
					>
						<X size={18} strokeWidth={1.75} />
					</button>
				</div>

				{/* Navegación */}
				<nav className="flex-1 overflow-y-auto px-2 py-2.5">
					<div className="flex flex-col gap-0.5">
						{nav.map((item) => {
							const Icon = item.icon;
							const active = isActive(item);
							const disabled = item.href === null;
							const inner = (
								<>
									{active && (
										<span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r bg-brand" />
									)}
									<Icon size={16.5} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
									<span className="flex-1 truncate">{item.label}</span>
									{disabled && (
										<span className="text-[9.5px] font-bold uppercase tracking-wide text-ink-3 border border-line rounded-full px-1.5 py-px shrink-0">
											{labels.soon}
										</span>
									)}
								</>
							);
							const base =
								"relative flex items-center gap-2.5 h-9 px-3 rounded-lg text-[14px] transition-colors";

							if (disabled) {
								return (
									<span
										key={item.id}
										className={cn(base, "text-ink-3 cursor-default select-none")}
										aria-disabled="true"
									>
										{inner}
									</span>
								);
							}
							return (
								<Link
									key={item.id}
									href={item.href as string}
									onClick={closeDrawer}
									className={cn(
										base,
										active
											? "bg-brand/10 text-brand-ink font-semibold"
											: "text-ink-2 hover:bg-white/[0.06] hover:text-ink font-medium",
									)}
								>
									{inner}
								</Link>
							);
						})}
					</div>
				</nav>

				{/* Footer sidebar */}
				<div className="border-t border-line px-4 py-3 flex flex-col gap-2.5">
					{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- cruza al apex a propósito (ver shared/tenant/apex-url.ts) */}
					<a
						href={viewCityLeaguesHref}
						className="text-[11.5px] text-ink-3 hover:text-ink transition"
					>
						{labels.viewCityLeagues}
					</a>
					<span className="flex items-center gap-1.5 text-[10.5px] text-ink-3 font-mono tracking-wide">
						{labels.poweredBy}
						<span className="font-display font-black text-[12px] text-ink-2 tracking-normal">
							Talacha<span className="text-brand">Stats</span>
						</span>
					</span>
				</div>
			</aside>

			{/* ── Columna principal ── */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Topbar: chips de ligas + share */}
				<div className="border-b border-line shrink-0">
					<div className="flex items-center justify-between gap-3 px-4 md:px-7 py-3">
						<div className="flex items-center gap-3 min-w-0">
							<button
								onClick={() => setMobileOpen(true)}
								className="md:hidden text-ink p-1 shrink-0"
								aria-label="Abrir menú"
							>
								<Menu size={20} strokeWidth={1.75} />
							</button>
							<div className="flex gap-2 overflow-x-auto no-scrollbar">
								{org.leagues.map((l) => (
									<Link
										key={l.slug}
										href={`/${l.slug}`}
										onClick={closeDrawer}
										className="shrink-0 text-[12.5px] font-semibold text-ink-2 hover:text-brand-ink bg-surface-2 border border-line rounded-full px-3.5 py-1.5 whitespace-nowrap transition-colors"
									>
										{l.name}
									</Link>
								))}
							</div>
						</div>
						<ShareButton title={org.name} variant="icon" className="shrink-0" />
					</div>
				</div>

				{/* Contenido */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
			</div>

			<style jsx global>{`
				.no-scrollbar {
					scrollbar-width: none;
				}
				.no-scrollbar::-webkit-scrollbar {
					display: none;
				}
			`}</style>
		</div>
	);
}
