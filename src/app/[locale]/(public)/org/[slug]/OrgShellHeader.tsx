/**
 * OrgShellHeader.tsx — header del shell público de la org, fiel al mockup
 * "Org Subdomain Home": logo + nombre a la izquierda, nav horizontal en
 * desktop, botón hamburguesa en mobile. Reemplaza el topbar de chips de
 * ligas (docs/SUBDOMINIOS-MULTITENANT.md §4 — decisión revisada, jul 2026).
 */

import { Menu, X } from "lucide-react";
import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import type { OrgNavItem } from "./org-nav";

type OrgShellData = {
	slug: string;
	name: string;
	logoUrl: string | null;
	city: string;
};

export function OrgShellHeader({
	org,
	nav,
	activeId,
	soonLabel,
	mobileOpen,
	onToggleMobile,
}: {
	org: OrgShellData;
	nav: OrgNavItem[];
	activeId: string;
	soonLabel: string;
	mobileOpen: boolean;
	onToggleMobile: () => void;
}) {
	const initial = org.name.charAt(0).toUpperCase();

	return (
		<header className="sticky top-0 z-40 bg-pitch/95 backdrop-blur border-b border-line">
			<div className="max-w-[1120px] mx-auto flex items-center justify-between gap-4 px-4 md:px-0 h-[64px]">
				<Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
					{org.logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={org.logoUrl}
							alt=""
							width={30}
							height={30}
							className="w-[30px] h-[30px] rounded-lg object-cover border border-brand/40 shrink-0"
						/>
					) : (
						<span className="w-[30px] h-[30px] rounded-lg shrink-0 grid place-items-center bg-brand/15 border border-brand/40 font-display font-black text-brand-ink text-sm">
							{initial}
						</span>
					)}
					<span className="font-display font-bold text-[14.5px] text-ink truncate">{org.name}</span>
				</Link>

				<nav className="hidden md:flex items-center gap-7">
					{nav.map((item) => (
						<NavLink
							key={item.id}
							item={item}
							active={activeId === item.id}
							soonLabel={soonLabel}
						/>
					))}
				</nav>

				<button
					onClick={onToggleMobile}
					className="md:hidden text-ink-2 p-1.5 shrink-0"
					aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
					aria-expanded={mobileOpen}
				>
					{mobileOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
				</button>
			</div>
		</header>
	);
}

function NavLink({
	item,
	active,
	soonLabel,
}: {
	item: OrgNavItem;
	active: boolean;
	soonLabel: string;
}) {
	const className = cn(
		"text-[13.5px] font-semibold transition-colors",
		active ? "text-brand-ink" : "text-ink-2 hover:text-ink",
	);

	if (item.href === null) {
		return (
			<span className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink-3 cursor-default select-none">
				{item.label}
				<span className="text-[9.5px] font-bold uppercase tracking-wide border border-line rounded-full px-1.5 py-px">
					{soonLabel}
				</span>
			</span>
		);
	}

	return (
		<Link href={item.href} className={className}>
			{item.label}
		</Link>
	);
}
