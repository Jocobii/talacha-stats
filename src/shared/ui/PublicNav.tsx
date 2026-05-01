"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Building2, Users, CalendarDays, BarChart3, Info } from "lucide-react";

const NAV_ITEMS = [
	{ href: "/", label: "Inicio", Icon: Home },
	{ href: "/ligas", label: "Ligas", Icon: Building2 },
	{ href: "/ranking", label: "Ranking", Icon: Trophy },
	{ href: "/players", label: "Jugadores", Icon: Users },
	{ href: "/matchday", label: "Jornada", Icon: CalendarDays },
	{ href: "/analysis", label: "Análisis", Icon: BarChart3 },
	{ href: "/about", label: "Nosotros", Icon: Info },
] as const;

export default function PublicNav() {
	const pathname = usePathname();

	const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

	return (
		<>
			{/* ── Desktop: sidebar izquierdo ── */}
			<aside className="hidden sm:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-surface border-r border-line z-50">
				<div className="px-5 h-16 flex items-center border-b border-line shrink-0">
					<Link
						href="/"
						className="font-display font-black text-xl text-ink uppercase tracking-tight"
					>
						Talacha<span className="text-brand">Stats</span>
					</Link>
				</div>

				<nav className="flex flex-col gap-1 p-3 flex-1">
					{NAV_ITEMS.map(({ href, label, Icon }) => {
						const active = isActive(href);
						return (
							<Link
								key={href}
								href={href}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
									active
										? "bg-surface-2 text-brand"
										: "text-ink-2 hover:bg-surface-2 hover:text-ink"
								}`}
							>
								<Icon size={20} strokeWidth={2} />
								{label}
							</Link>
						);
					})}
				</nav>
			</aside>

			{/* ── Mobile: bottom nav ── */}
			<nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-line">
				<div className="flex items-stretch">
					{NAV_ITEMS.map(({ href, label, Icon }) => {
						const active = isActive(href);
						return (
							<Link
								key={href}
								href={href}
								className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
									active ? "text-brand" : "text-ink-3 hover:text-ink-2"
								}`}
							>
								<Icon size={20} strokeWidth={2} />
								<span
									className={`text-[10px] font-semibold uppercase tracking-wide leading-none ${
										active ? "text-brand" : "text-ink-3"
									}`}
								>
									{label}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>
		</>
	);
}
