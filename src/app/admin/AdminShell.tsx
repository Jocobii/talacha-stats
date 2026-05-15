"use client";

/**
 * AdminShell.tsx
 *
 * Client component que renderiza el sidebar + el área de contenido.
 * El layout (server component) hace la auth y le pasa el user/city como props.
 *
 * Características:
 *  • Sidebar oscuro fijo en desktop (244px / 64px colapsado)
 *  • Drawer con overlay en mobile (<768px)
 *  • Navegación agrupada (Principal / Gestión / Administración)
 *  • Footer con ciudad activa, usuario, y cerrar sesión
 *  • Iconos de lucide-react
 *  • Estado activo basado en usePathname()
 *  • Tooltips automáticos en modo colapsado
 *  • Persiste el estado colapsado en localStorage
 */

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	Home,
	Building2,
	Trophy,
	Users,
	UserCircle,
	UserPlus,
	Upload,
	UserCog,
	CheckCircle2,
	MapPin,
	LogOut,
	Menu,
	X,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Search,
	Check,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { MEXICO_CITIES } from "@/shared/lib/cities";

type UserShape = {
	id: string;
	email: string;
	role: "owner" | "organizer" | string;
	organizationId?: string | null;
	name?: string | null;
};

type NavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
	badge?: string;
	exact?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

// ── Logo SVG ──────────────────────────────────────────────────────────────────

function LogoMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 28 28" className={cn("shrink-0", className)} fill="none">
			<rect x="3" y="17" width="4" height="8" rx="1" fill="#00E676" />
			<rect x="9" y="13" width="4" height="12" rx="1" fill="#00E676" />
			<rect x="15" y="8" width="4" height="17" rx="1" fill="#00E676" />
			<rect x="21" y="4" width="4" height="21" rx="1" fill="#00E676" />
		</svg>
	);
}

// ── Shell principal ───────────────────────────────────────────────────────────

export default function AdminShell({
	user,
	activeCity,
	trialBanner,
	children,
}: {
	user: UserShape;
	activeCity: string;
	trialBanner?: ReactNode;
	children: ReactNode;
}) {
	const pathname = usePathname();

	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Persist collapsed state
	useEffect(() => {
		const saved = localStorage.getItem("admin_sidebar_collapsed");
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (saved === "1") setCollapsed(true);
	}, []);

	useEffect(() => {
		localStorage.setItem("admin_sidebar_collapsed", collapsed ? "1" : "0");
	}, [collapsed]);

	// Track viewport
	useEffect(() => {
		const handler = () => {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);
			if (!mobile) setMobileOpen(false);
		};
		handler();
		window.addEventListener("resize", handler);
		return () => window.removeEventListener("resize", handler);
	}, []);

	// Close drawer on route change
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMobileOpen(false);
	}, [pathname]);

	const isOwner = user.role === "owner";

	const coreItems: NavItem[] = [
		{ href: "/admin", label: "Dashboard", icon: Home, exact: true },
		{ href: "/admin/import", label: "Importar jornada", icon: Upload },
	];

	const gestionItems: NavItem[] = isOwner
		? [
				{ href: "/admin/registro", label: "Registro", icon: UserPlus },
				{ href: "/admin/organizations", label: "Organizaciones", icon: Building2 },
				{ href: "/admin/leagues", label: "Ligas", icon: Trophy },
				{ href: "/admin/teams", label: "Equipos", icon: Users },
				{ href: "/admin/players", label: "Jugadores", icon: UserCircle },
			]
		: [
				{ href: "/admin/players", label: "Jugadores", icon: UserCircle },
				{ href: "/admin/leagues", label: "Ligas", icon: Trophy },
				{ href: "/admin/teams", label: "Equipos", icon: Users },
			];

	const navGroups: NavGroup[] = [
		{ label: "Principal", items: coreItems },
		{ label: "Gestión", items: gestionItems },
		...(isOwner
			? [
					{
						label: "Administración",
						items: [
							{ href: "/admin/users", label: "Usuarios", icon: UserCog },
							{ href: "/admin/verifications", label: "Verificaciones", icon: CheckCircle2 },
						],
					} as NavGroup,
				]
			: []),
	];

	const isActive = (item: NavItem) =>
		item.exact ? pathname === item.href : pathname.startsWith(item.href);

	const sidebarW = collapsed && !isMobile ? 64 : 244;

	const initials =
		(user.name || user.email)
			.split(/[\s@.]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? "")
			.join("") || "U";
	const displayName = user.name || user.email.split("@")[0];

	return (
		<div className="flex h-screen overflow-hidden bg-pitch">
			{/* Mobile overlay */}
			{isMobile && mobileOpen && (
				<div className="fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"flex flex-col h-screen z-50 shrink-0 overflow-hidden",
					"bg-surface/40 border-r border-line",
					"transition-[width,transform] duration-150 ease-out",
					isMobile
						? cn(
								"fixed left-0 top-0 bottom-0 w-[244px]",
								mobileOpen ? "translate-x-0" : "-translate-x-full",
							)
						: "",
				)}
				style={!isMobile ? { width: `${sidebarW}px` } : undefined}
			>
				{/* Logo header */}
				<div
					className={cn(
						"flex items-center h-14 border-b border-line shrink-0",
						collapsed && !isMobile ? "justify-center px-0" : "justify-between pl-4 pr-3",
					)}
				>
					<Link href="/admin" className="flex items-center gap-2 min-w-0 overflow-hidden">
						<LogoMark className="w-7 h-7" />
						{(!collapsed || isMobile) && (
							<span className="font-display font-black text-[18px] tracking-tight text-ink whitespace-nowrap">
								Talacha<span className="text-brand">Stats</span>
							</span>
						)}
					</Link>

					{isMobile ? (
						<button
							onClick={() => setMobileOpen(false)}
							className="w-8 h-8 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-surface transition"
							aria-label="Cerrar menú"
						>
							<X size={16} strokeWidth={2} />
						</button>
					) : (
						<button
							onClick={() => setCollapsed((c) => !c)}
							className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-surface transition shrink-0"
							title={collapsed ? "Expandir" : "Colapsar"}
						>
							{collapsed ? (
								<ChevronRight size={14} strokeWidth={2} />
							) : (
								<ChevronLeft size={14} strokeWidth={2} />
							)}
						</button>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5 admin-scrollbar">
					{navGroups.map((group) => (
						<div key={group.label} className="flex flex-col gap-1">
							{collapsed && !isMobile ? (
								<div className="h-px bg-line mx-1 mb-1" />
							) : (
								<p className="px-2 mb-1 text-[10.5px] font-semibold tracking-[0.18em] uppercase text-ink-3">
									{group.label}
								</p>
							)}
							{group.items.map((item) => (
								<NavLink
									key={item.href}
									item={item}
									active={isActive(item)}
									collapsed={collapsed && !isMobile}
								/>
							))}
						</div>
					))}
				</nav>

				{/* Footer */}
				<div
					className={cn(
						"border-t border-line shrink-0 flex flex-col gap-2",
						collapsed && !isMobile ? "p-2" : "p-3",
					)}
				>
					<SidebarCitySwitcher activeCity={activeCity} collapsed={collapsed && !isMobile} />

					{/* User card */}
					<div
						className={cn(
							"flex items-center gap-2.5",
							collapsed && !isMobile ? "justify-center py-1" : "px-1.5 py-2",
						)}
					>
						<span className="w-7 h-7 rounded-md bg-brand/15 text-brand font-display font-bold text-[11px] grid place-items-center shrink-0 tracking-tight">
							{initials}
						</span>
						{(!collapsed || isMobile) && (
							<div className="flex-1 min-w-0">
								<div className="text-[13px] font-semibold text-ink truncate leading-none">
									{displayName}
								</div>
								<div className="text-[11px] text-ink-3 truncate mt-0.5">{user.email}</div>
							</div>
						)}
					</div>

					<LogoutButton collapsed={collapsed && !isMobile} />
				</div>
			</aside>

			{/* Main area */}
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Mobile topbar */}
				{isMobile && (
					<header className="h-14 bg-pitch border-b border-line flex items-center px-4 gap-3 shrink-0 z-20">
						<button
							onClick={() => setMobileOpen(true)}
							className="w-9 h-9 grid place-items-center rounded-md text-ink-2 hover:text-ink hover:bg-surface"
							aria-label="Abrir menú"
						>
							<Menu size={18} strokeWidth={1.75} />
						</button>
						<Link href="/admin" className="flex items-center gap-2 flex-1">
							<LogoMark className="w-6 h-6" />
							<span className="font-display font-black text-[18px] tracking-tight text-ink">
								Talacha<span className="text-brand">Stats</span>
							</span>
						</Link>
					</header>
				)}

				{/* Trial banner */}
				{trialBanner}

				{/* Page content */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden">
					<div className="max-w-[1400px] w-full mx-auto px-5 sm:px-8 py-8 sm:py-10">{children}</div>
				</main>
			</div>

			<style jsx global>{`
				.admin-scrollbar::-webkit-scrollbar {
					width: 3px;
				}
				.admin-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.admin-scrollbar::-webkit-scrollbar-thumb {
					background: rgba(255, 255, 255, 0.08);
					border-radius: 2px;
				}
			`}</style>
		</div>
	);
}

// ── NavLink ───────────────────────────────────────────────────────────────────

function NavLink({
	item,
	active,
	collapsed,
}: {
	item: NavItem;
	active: boolean;
	collapsed: boolean;
}) {
	const Icon = item.icon;
	return (
		<Link
			href={item.href}
			title={collapsed ? item.label : undefined}
			className={cn(
				"relative group flex items-center gap-2.5 h-9 rounded-md transition-colors text-[13.5px]",
				collapsed ? "justify-center px-0 w-9 mx-auto" : "px-2.5",
				active
					? "bg-brand/10 text-brand font-semibold"
					: "text-ink-2 hover:text-ink hover:bg-surface font-medium",
			)}
		>
			{/* Barra activa vertical */}
			{active && !collapsed && (
				<span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-brand" />
			)}

			<Icon size={16} strokeWidth={active ? 2 : 1.75} className="shrink-0" />

			{!collapsed && <span className="flex-1 whitespace-nowrap truncate">{item.label}</span>}

			{!collapsed && item.badge && (
				<span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-brand text-pitch shrink-0">
					{item.badge}
				</span>
			)}

			{/* Tooltip colapsado */}
			{collapsed && (
				<span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-surface-2 border border-line text-ink text-[12px] font-semibold px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
					{item.label}
					{item.badge ? ` (${item.badge})` : ""}
				</span>
			)}
		</Link>
	);
}

// ── Logout ────────────────────────────────────────────────────────────────────

function LogoutButton({ collapsed }: { collapsed: boolean }) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);

	async function handleLogout() {
		setBusy(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.push("/login");
		} finally {
			setBusy(false);
		}
	}

	return (
		<button
			onClick={handleLogout}
			disabled={busy}
			className={cn(
				"group relative flex items-center gap-2.5 h-8 rounded-md transition-colors w-full",
				collapsed ? "justify-center px-0" : "px-2.5",
				"text-ink-3 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50",
			)}
			title="Cerrar sesión"
		>
			<LogOut size={14} strokeWidth={1.75} className="shrink-0" />
			{!collapsed && (
				<span className="text-[13px] font-medium">{busy ? "Saliendo…" : "Cerrar sesión"}</span>
			)}
			{collapsed && (
				<span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-surface-2 border border-line text-ink text-[12px] font-semibold px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
					Cerrar sesión
				</span>
			)}
		</button>
	);
}

// ── City switcher ─────────────────────────────────────────────────────────────

function SidebarCitySwitcher({
	activeCity,
	collapsed,
}: {
	activeCity: string;
	collapsed: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			const el = e.target as HTMLElement;
			if (!el.closest("[data-city-switcher]")) {
				setOpen(false);
				setQuery("");
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const filtered = query.trim()
		? MEXICO_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
		: MEXICO_CITIES;

	async function selectCity(city: string) {
		if (city === activeCity) {
			setOpen(false);
			return;
		}
		const res = await fetch("/api/auth/city", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ city }),
		});
		if (res.ok) window.location.reload();
	}

	if (collapsed) {
		return (
			<button
				title={activeCity}
				className="w-9 h-9 mx-auto grid place-items-center rounded-md text-brand hover:bg-surface transition"
			>
				<MapPin size={16} strokeWidth={1.75} />
			</button>
		);
	}

	return (
		<div data-city-switcher className="relative">
			<button
				onClick={() => {
					setOpen((v) => !v);
					setQuery("");
				}}
				className="w-full flex items-center gap-2.5 h-11 px-2.5 rounded-md bg-surface border border-line text-left hover:border-ink-3 transition"
				aria-expanded={open}
			>
				<MapPin size={14} strokeWidth={1.75} className="text-brand shrink-0" />
				<div className="flex-1 min-w-0">
					<div className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-3 leading-none">
						Ciudad activa
					</div>
					<div className="text-[13px] font-semibold text-ink mt-0.5 truncate">{activeCity}</div>
				</div>
				<ChevronDown
					size={14}
					strokeWidth={1.75}
					className={cn("text-ink-3 shrink-0 transition-transform", open && "rotate-180")}
				/>
			</button>

			{open && (
				<div className="absolute left-0 right-0 bottom-full mb-2 bg-surface-2 border border-line rounded-xl shadow-2xl z-60 overflow-hidden">
					<div className="p-2 border-b border-line">
						<div className="relative">
							<Search
								size={12}
								className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
							/>
							<input
								autoFocus
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Buscar ciudad…"
								className="w-full bg-surface border border-line text-ink text-sm placeholder:text-ink-3 rounded-md pl-7 pr-3 py-1.5 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
							/>
						</div>
					</div>
					<ul className="max-h-56 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<li className="px-3 py-2 text-sm text-ink-3 text-center">Sin resultados</li>
						) : (
							filtered.map((city) => (
								<li key={city}>
									<button
										onClick={() => selectCity(city)}
										className={cn(
											"w-full flex items-center justify-between px-3 py-2 text-[13px] text-left transition",
											city === activeCity
												? "bg-brand/10 text-brand"
												: "text-ink-2 hover:bg-surface hover:text-ink",
										)}
									>
										{city}
										{city === activeCity && <Check size={12} strokeWidth={2.5} />}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
