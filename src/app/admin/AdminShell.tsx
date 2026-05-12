"use client";

/**
 * AdminShell.tsx
 *
 * Client component que renderiza el sidebar + el área de contenido.
 * El layout (server component) hace la auth y le pasa el user/city como props.
 *
 * Características:
 *  • Sidebar oscuro fijo en desktop (210px / 64px colapsado)
 *  • Drawer con overlay en mobile (<768px)
 *  • Navegación agrupada (Principal / Gestión / Administración)
 *  • Footer con ciudad activa, usuario, y cerrar sesión
 *  • Iconos de lucide-react (ya en el proyecto)
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
	Upload,
	BarChart3,
	UserCog,
	CheckCircle2,
	MapPin,
	LogOut,
	Menu,
	X,
	ChevronLeft,
	ChevronRight,
	CalendarDays,
	Check,
	ChevronDown,
	Search,
	type LucideIcon,
} from "lucide-react";
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

	// Track viewport for mobile/desktop
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

	// Close mobile drawer on route change
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMobileOpen(false);
	}, [pathname]);

	const isOwner = user.role === "owner";

	const navGroups: NavGroup[] = [
		{
			label: "Principal",
			items: [
				{ href: "/admin", label: "Dashboard", icon: Home, exact: true },
				{ href: "/admin/import", label: "Importar jornada", icon: Upload },
			],
		},
		{
			label: "Gestión",
			items: [
				{ href: "/admin/organizations", label: "Organizaciones", icon: Building2 },
				{ href: "/admin/leagues", label: "Ligas", icon: Trophy },
				{ href: "/admin/teams", label: "Equipos", icon: Users },
				{ href: "/admin/players", label: "Jugadores", icon: UserCircle },
			],
		},
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

	const W = collapsed ? 64 : 210;

	// User display
	const initials =
		(user.name || user.email)
			.split(/[\s@.]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? "")
			.join("") || "U";
	const displayName = user.name || user.email.split("@")[0];

	return (
		<div className="flex h-screen overflow-hidden  bg-pitch">
			{/* Mobile overlay */}
			{isMobile && mobileOpen && (
				<div
					className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-40 animate-[fadeIn_0.2s_ease_both]"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={[
					"flex flex-col h-screen z-50 overflow-hidden shrink-0",
					"bg-gradient-to-b from-[#0f2318] to-[#0d1f14] text-slate-100",
					"shadow-[2px_0_24px_rgba(0,0,0,0.3)]",
					"transition-[width,transform] duration-250 ease-out",
					isMobile
						? `fixed left-0 top-0 bottom-0 w-[260px] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
						: "",
				].join(" ")}
				style={!isMobile ? { width: `${W}px` } : undefined}
			>
				{/* Header: Logo + collapse/close */}
				<div
					className={[
						"flex items-center border-b border-white/[0.06] shrink-0",
						collapsed && !isMobile
							? "justify-center py-[18px]"
							: "justify-between py-[18px] pl-4 pr-3.5",
					].join(" ")}
				>
					<Link href="/admin" className="flex items-center gap-2.5 min-w-0 overflow-hidden">
						<svg viewBox="0 0 54 44" fill="none" className="w-9 h-[30px] shrink-0">
							<rect x="0" y="29" width="7" height="12" rx="2" fill="#00E676" fillOpacity="0.35" />
							<rect x="11" y="19" width="7" height="22" rx="2" fill="#00E676" fillOpacity="0.55" />
							<rect x="22" y="10" width="7" height="31" rx="2" fill="#00E676" fillOpacity="0.75" />
							<rect x="33" y="3" width="7" height="38" rx="2" fill="#00E676" />
							<rect x="44" y="13" width="7" height="28" rx="2" fill="#00E676" fillOpacity="0.65" />
						</svg>
						{(!collapsed || isMobile) && (
							<span
								className="text-[22px] font-black text-slate-100 tracking-tight whitespace-nowrap"
								style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
							>
								Talacha<span className="text-[#00e676]">Stats</span>
							</span>
						)}
					</Link>

					{isMobile ? (
						<button
							onClick={() => setMobileOpen(false)}
							className="text-slate-100/50 hover:text-slate-100 p-1"
							aria-label="Cerrar menú"
						>
							<X size={20} />
						</button>
					) : (
						<button
							onClick={() => setCollapsed((c) => !c)}
							className="bg-white/[0.06] hover:bg-white/[0.12] text-slate-100/50 hover:text-slate-100 p-1.5 rounded-lg transition shrink-0"
							title={collapsed ? "Expandir menú" : "Colapsar menú"}
							aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
						>
							{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
						</button>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 admin-scrollbar">
					{navGroups.map((group) => (
						<div key={group.label}>
							{collapsed && !isMobile ? (
								<div className="h-px bg-white/[0.08] mx-3 my-1.5" />
							) : (
								<div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-100/30 px-3.5 pt-3 pb-1">
									{group.label}
								</div>
							)}
							{group.items.map((item) => {
								const active = isActive(item);
								return (
									<NavLink
										key={item.href}
										item={item}
										active={active}
										collapsed={collapsed && !isMobile}
									/>
								);
							})}
						</div>
					))}
				</nav>

				{/* Footer: City + User + Logout */}
				<div
					className={[
						"border-t border-white/[0.06] shrink-0 flex flex-col gap-0.5",
						collapsed && !isMobile ? "p-2" : "p-2.5",
					].join(" ")}
				>
					{/* City switcher */}
					<SidebarCitySwitcher activeCity={activeCity} collapsed={collapsed && !isMobile} />

					{/* User card */}
					<div
						className={[
							"flex items-center gap-2.5 rounded-[10px]",
							collapsed && !isMobile ? "justify-center py-2" : "px-2.5 py-2",
						].join(" ")}
					>
						<div
							className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[12px] font-extrabold text-[#0a0a0a]"
							style={{
								background: "linear-gradient(135deg, #00e676, #00c853)",
								fontFamily: "'Barlow Condensed', sans-serif",
							}}
						>
							{initials}
						</div>
						{(!collapsed || isMobile) && (
							<div className="flex-1 min-w-0">
								<div className="text-[13px] font-semibold text-slate-100 truncate">
									{displayName}
								</div>
								<div className="text-[11px] text-slate-100/40 truncate">{user.email}</div>
							</div>
						)}
					</div>

					{/* Logout */}
					<LogoutButton collapsed={collapsed && !isMobile} />
				</div>
			</aside>

			{/* Main area */}
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Mobile topbar */}
				{isMobile && (
					<div
						className="h-13 bg-[#0f2318] flex items-center px-4 gap-3 shadow-[0_1px_8px_rgba(0,0,0,0.3)] shrink-0"
						style={{ height: 52 }}
					>
						<button
							onClick={() => setMobileOpen(true)}
							className="text-slate-100 p-1"
							aria-label="Abrir menú"
						>
							<Menu size={22} />
						</button>
						<Link href="/admin" className="flex items-center gap-2 flex-1">
							<svg viewBox="0 0 54 44" fill="none" className="w-9 h-[30px]">
								<rect x="0" y="29" width="7" height="12" rx="2" fill="#00E676" fillOpacity="0.35" />
								<rect
									x="11"
									y="19"
									width="7"
									height="22"
									rx="2"
									fill="#00E676"
									fillOpacity="0.55"
								/>
								<rect
									x="22"
									y="10"
									width="7"
									height="31"
									rx="2"
									fill="#00E676"
									fillOpacity="0.75"
								/>
								<rect x="33" y="3" width="7" height="38" rx="2" fill="#00E676" />
								<rect
									x="44"
									y="13"
									width="7"
									height="28"
									rx="2"
									fill="#00E676"
									fillOpacity="0.65"
								/>
							</svg>
							<span
								className="text-[20px] font-black text-slate-100 tracking-tight"
								style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
							>
								Talacha<span className="text-[#00e676]">Stats</span>
							</span>
						</Link>
					</div>
				)}

				{/* Trial banner */}
				{trialBanner}

				{/* Page content */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden">
					<div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
				</main>
			</div>

			{/* Local styles */}
			<style jsx global>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				.admin-scrollbar::-webkit-scrollbar {
					width: 4px;
				}
				.admin-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.admin-scrollbar::-webkit-scrollbar-thumb {
					background: rgba(255, 255, 255, 0.15);
					border-radius: 2px;
				}
				.nav-item-link {
					position: relative;
				}
				.nav-item-link::before {
					content: "";
					position: absolute;
					left: -8px;
					top: 6px;
					bottom: 6px;
					width: 3px;
					border-radius: 0 3px 3px 0;
					background: #00e676;
					opacity: 0;
					transition: opacity 0.15s;
				}
				.nav-item-link.active::before {
					opacity: 1;
				}
				.nav-tooltip {
					position: absolute;
					left: calc(100% + 12px);
					top: 50%;
					transform: translateY(-50%);
					background: #1e293b;
					color: white;
					font-size: 12px;
					font-weight: 600;
					padding: 5px 10px;
					border-radius: 8px;
					white-space: nowrap;
					pointer-events: none;
					opacity: 0;
					transition: opacity 0.15s;
					z-index: 100;
				}
				.nav-tooltip::before {
					content: "";
					position: absolute;
					right: 100%;
					top: 50%;
					transform: translateY(-50%);
					border: 5px solid transparent;
					border-right-color: #1e293b;
				}
				.nav-item-link:hover .nav-tooltip,
				.sidebar-footer-btn:hover .nav-tooltip {
					opacity: 1;
				}
			`}</style>
		</div>
	);
}

// ── NavLink ───────────────────────────────────────────────────────
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
			className={[
				"nav-item-link flex items-center gap-3 rounded-[10px] transition-colors mx-2",
				collapsed ? "py-2.5 justify-center" : "px-3.5 py-2",
				active
					? "active bg-[rgba(0,230,118,0.12)] text-[#00e676] font-semibold"
					: "text-slate-100/70 hover:bg-white/[0.07] hover:text-slate-100 font-medium",
			].join(" ")}
			style={{ fontSize: 14 }}
		>
			<Icon size={18} strokeWidth={2} className={active ? "" : "opacity-80"} />
			{!collapsed && <span className="flex-1 whitespace-nowrap text-left">{item.label}</span>}
			{!collapsed && item.badge && (
				<span
					className="text-[10px] font-bold px-1.5 py-px rounded-full shrink-0"
					style={{ background: "#00e676", color: "#0a0a0a" }}
				>
					{item.badge}
				</span>
			)}
			{collapsed && (
				<span className="nav-tooltip">
					{item.label}
					{item.badge ? ` (${item.badge})` : ""}
				</span>
			)}
		</Link>
	);
}

// ── Logout button ─────────────────────────────────────────────────
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
			className={[
				"sidebar-footer-btn flex items-center gap-2.5 rounded-[10px] transition-all w-full relative",
				collapsed ? "justify-center py-2" : "px-2.5 py-2",
				"text-slate-100/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50",
			].join(" ")}
			title="Cerrar sesión"
			aria-label="Cerrar sesión"
		>
			<LogOut size={16} />
			{!collapsed && (
				<span className="text-[13px] font-medium">{busy ? "Saliendo…" : "Cerrar sesión"}</span>
			)}
			{collapsed && <span className="nav-tooltip">Cerrar sesión</span>}
		</button>
	);
}

// ── City switcher (sidebar variant) ───────────────────────────────
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

	return (
		<div data-city-switcher className="relative">
			<button
				onClick={() => {
					setOpen((v) => !v);
					setQuery("");
				}}
				className={[
					"sidebar-footer-btn flex items-center gap-2.5 rounded-[10px] w-full transition-all relative",
					collapsed ? "justify-center py-2" : "px-2.5 py-2",
					"text-slate-100/60 hover:bg-white/[0.07]",
				].join(" ")}
				aria-expanded={open}
				title={`Ciudad: ${activeCity}`}
			>
				<MapPin size={16} className="text-[#00e676]/80 shrink-0" />
				{!collapsed && (
					<>
						<div className="flex-1 min-w-0 text-left">
							<div className="text-[11px] text-slate-100/35 font-medium">Ciudad activa</div>
							<div className="text-[13px] font-semibold text-slate-100 truncate">{activeCity}</div>
						</div>
						<ChevronDown
							size={12}
							className={`text-slate-100/40 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
						/>
					</>
				)}
				{collapsed && <span className="nav-tooltip">{activeCity}</span>}
			</button>

			{open && (
				<div
					className={[
						"absolute bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden",
						collapsed ? "left-full ml-2 bottom-0 w-60" : "left-0 right-0 bottom-full mb-2",
					].join(" ")}
				>
					<div className="p-2 border-b border-slate-700">
						<div className="relative">
							<Search
								size={12}
								className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
							/>
							<input
								autoFocus
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Buscar ciudad…"
								className="w-full bg-slate-800 text-white text-sm placeholder-slate-500 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
							/>
						</div>
					</div>
					<ul role="listbox" className="max-h-64 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<li className="px-3 py-2 text-sm text-slate-500 text-center">Sin resultados</li>
						) : (
							filtered.map((city) => (
								<li key={city}>
									<button
										onClick={() => selectCity(city)}
										className={[
											"w-full flex items-center justify-between px-3 py-2 text-sm text-left transition",
											city === activeCity
												? "bg-green-900/50 text-green-400"
												: "text-slate-200 hover:bg-slate-800",
										].join(" ")}
									>
										{city}
										{city === activeCity && <Check size={12} />}
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
