/**
 * OrgShellMobileMenu.tsx — panel de navegación mobile del shell público de la
 * org, desplegado bajo el header al tocar la hamburguesa (reemplaza el drawer
 * lateral anterior por un dropdown simple, fiel al header tipo mockup).
 */

import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import type { OrgNavItem } from "./org-nav";

export function OrgShellMobileMenu({
	nav,
	activeId,
	soonLabel,
	onNavigate,
}: {
	nav: OrgNavItem[];
	activeId: string;
	soonLabel: string;
	onNavigate: () => void;
}) {
	return (
		<nav className="md:hidden sticky top-[64px] z-30 bg-surface border-b border-line px-4 py-2">
			<div className="flex flex-col gap-0.5">
				{nav.map((item) => {
					const Icon = item.icon;
					const active = activeId === item.id;
					const disabled = item.href === null;
					const rowClass = cn(
						"flex items-center gap-2.5 h-10 px-2 rounded-lg text-[14px] transition-colors",
						disabled && "text-ink-3 cursor-default select-none",
						!disabled && active && "text-brand-ink font-semibold bg-brand/10",
						!disabled && !active && "text-ink-2 font-medium hover:bg-white/[0.06]",
					);

					if (disabled) {
						return (
							<span key={item.id} className={rowClass} aria-disabled="true">
								<Icon size={16.5} strokeWidth={1.75} className="shrink-0" />
								<span className="flex-1">{item.label}</span>
								<span className="text-[9.5px] font-bold uppercase tracking-wide border border-line rounded-full px-1.5 py-px">
									{soonLabel}
								</span>
							</span>
						);
					}

					return (
						<Link
							key={item.id}
							href={item.href as string}
							onClick={onNavigate}
							className={rowClass}
						>
							<Icon size={16.5} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
							<span className="flex-1">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
