"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/navigation";
import { Home, Trophy, Building2, BarChart3, Info, Settings, Menu, X } from "lucide-react";

const NAV_ITEMS = [
	{ href: "/", key: "home", Icon: Home },
	{ href: "/organizaciones", key: "organizaciones", Icon: Building2 },
	{ href: "/ranking", key: "ranking", Icon: Trophy },
	{ href: "/analisis-excel", key: "analysis", Icon: BarChart3 },
	{ href: "/about", key: "about", Icon: Info },
] as const;

export default function PublicNav() {
	const t = useTranslations("common");
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
	const closeDrawer = () => setOpen(false);

	return (
		<>
			{/* ── Desktop: sidebar izquierdo ── */}
			<aside className="hidden sm:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-surface border-r border-line z-50">
				<div className="px-5 h-16 flex items-center border-b border-line shrink-0">
					<Link
						href="/"
						className="font-display font-black text-xl text-ink uppercase tracking-tight"
					>
						{t("nav.brandPrefix")}
						<span className="text-brand-ink">{t("nav.brandSuffix")}</span>
					</Link>
				</div>

				<nav className="flex flex-col gap-1 p-3 flex-1">
					{NAV_ITEMS.map(({ href, key, Icon }) => {
						const active = isActive(href);
						return (
							<Link
								key={href}
								href={href}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
									active
										? "bg-surface-2 text-brand-ink"
										: "text-ink-2 hover:bg-surface-2 hover:text-ink"
								}`}
							>
								<Icon size={20} strokeWidth={2} />
								{t(`nav.items.${key}`)}
							</Link>
						);
					})}
				</nav>

				<div className="px-3 pb-4 border-t border-line pt-3 shrink-0">
					<Link
						href="/login"
						className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
					>
						<Settings size={14} strokeWidth={2} className="shrink-0" />
						{t("nav.manageLeague")}
					</Link>
				</div>
			</aside>

			{/* ── Mobile: barra superior con hamburguesa ── */}
			<header className="sm:hidden fixed top-0 inset-x-0 z-50 h-14 bg-surface border-b border-line flex items-center gap-2 px-4">
				<button
					type="button"
					onClick={() => setOpen(true)}
					aria-label={t("nav.openMenu")}
					aria-expanded={open}
					className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
				>
					<Menu size={24} strokeWidth={2} />
				</button>
				<Link
					href="/"
					className="font-display font-black text-lg text-ink uppercase tracking-tight"
				>
					{t("nav.brandPrefix")}
					<span className="text-brand-ink">{t("nav.brandSuffix")}</span>
				</Link>
			</header>

			{/* ── Mobile: drawer ── */}
			{open && (
				<div className="sm:hidden fixed inset-0 z-[60]">
					<button
						type="button"
						aria-label={t("nav.closeMenu")}
						onClick={closeDrawer}
						className="absolute inset-0 bg-black/60"
					/>
					<div className="absolute top-0 left-0 bottom-0 w-72 max-w-[82%] bg-surface border-l border-line flex flex-col">
						<div className="h-14 flex items-center justify-between px-4 border-b border-line shrink-0">
							<span className="font-display font-black text-base text-ink uppercase tracking-tight">
								{t("nav.menuTitle")}
							</span>
							<button
								type="button"
								onClick={closeDrawer}
								aria-label={t("nav.closeMenu")}
								className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
							>
								<X size={24} strokeWidth={2} />
							</button>
						</div>

						<nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
							{NAV_ITEMS.map(({ href, key, Icon }) => {
								const active = isActive(href);
								return (
									<Link
										key={href}
										href={href}
										onClick={closeDrawer}
										className={`flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-semibold transition-colors ${
											active
												? "bg-surface-2 text-brand-ink"
												: "text-ink-2 hover:bg-surface-2 hover:text-ink"
										}`}
									>
										<Icon size={20} strokeWidth={2} />
										{t(`nav.items.${key}`)}
									</Link>
								);
							})}
						</nav>

						<div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-line pt-3 shrink-0">
							<Link
								href="/login"
								onClick={closeDrawer}
								className="flex items-center gap-2.5 px-3 min-h-[44px] rounded-xl text-xs text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
							>
								<Settings size={16} strokeWidth={2} className="shrink-0" />
								{t("nav.manageLeague")}
							</Link>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
