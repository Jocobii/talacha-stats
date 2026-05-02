"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// ── Icons (Lucide-style, 24x24, strokeWidth=2) ──────────────────────────────

function Svg({ children }: { children: React.ReactNode }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-full h-full"
		>
			{children}
		</svg>
	);
}

const Icons = {
	home: (
		<Svg>
			<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
			<polyline points="9 22 9 12 15 12 15 22" />
		</Svg>
	),
	building: (
		<Svg>
			<rect width="16" height="20" x="4" y="2" rx="2" />
			<path d="M9 22v-4h6v4" />
			<path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
		</Svg>
	),
	trophy: (
		<Svg>
			<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
			<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
			<path d="M4 22h16" />
			<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
			<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
			<path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
		</Svg>
	),
	shield: (
		<Svg>
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
		</Svg>
	),
	users: (
		<Svg>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</Svg>
	),
	person: (
		<Svg>
			<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</Svg>
	),
	upload: (
		<Svg>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" x2="12" y1="3" y2="15" />
		</Svg>
	),
	chart: (
		<Svg>
			<line x1="18" x2="18" y1="20" y2="10" />
			<line x1="12" x2="12" y1="20" y2="4" />
			<line x1="6" x2="6" y1="20" y2="14" />
		</Svg>
	),
	checkCircle: (
		<Svg>
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 11.01" />
		</Svg>
	),
	menu: (
		<Svg>
			<line x1="4" x2="20" y1="6" y2="6" />
			<line x1="4" x2="20" y1="12" y2="12" />
			<line x1="4" x2="20" y1="18" y2="18" />
		</Svg>
	),
	x: (
		<Svg>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</Svg>
	),
	chevronLeft: (
		<Svg>
			<path d="m15 18-6-6 6-6" />
		</Svg>
	),
	chevronRight: (
		<Svg>
			<path d="m9 18 6-6-6-6" />
		</Svg>
	),
	logout: (
		<Svg>
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<polyline points="16 17 21 12 16 7" />
			<line x1="21" x2="9" y1="12" y2="12" />
		</Svg>
	),
	mapPin: (
		<Svg>
			<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
			<circle cx="12" cy="10" r="3" />
		</Svg>
	),
};

// ── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
	ownerOnly?: boolean;
};

const NAV: NavItem[] = [
	{ href: "/admin", label: "Dashboard", icon: Icons.home },
	{ href: "/admin/organizations", label: "Organizaciones", icon: Icons.building },
	{ href: "/admin/leagues", label: "Ligas", icon: Icons.trophy },
	{ href: "/admin/teams", label: "Equipos", icon: Icons.shield },
	{ href: "/admin/players", label: "Jugadores", icon: Icons.person },
	{ href: "/admin/import", label: "Importar", icon: Icons.upload },
	{ href: "/admin/analisis", label: "Analisis", icon: Icons.chart },
	{ href: "/admin/users", label: "Usuarios", icon: Icons.users, ownerOnly: true },
	{
		href: "/admin/verifications",
		label: "Verificaciones",
		icon: Icons.checkCircle,
		ownerOnly: true,
	},
];

// ── NavLinks sub-component ───────────────────────────────────────────────────

function NavLinks({
	items,
	collapsed,
	pathname,
	onNavigate,
}: {
	items: NavItem[];
	collapsed: boolean;
	pathname: string;
	onNavigate?: () => void;
}) {
	const active = (href: string) =>
		href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

	return (
		<nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
			{items.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					onClick={onNavigate}
					title={collapsed ? item.label : undefined}
					className={[
						"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
						active(item.href)
							? "bg-surface-2 text-brand"
							: "text-ink-2 hover:bg-surface-2 hover:text-ink",
						collapsed ? "justify-center" : "",
					].join(" ")}
				>
					<span className="w-[18px] h-[18px] shrink-0">{item.icon}</span>
					{!collapsed && <span className="truncate">{item.label}</span>}
				</Link>
			))}
		</nav>
	);
}

// ── SidebarBottom sub-component ──────────────────────────────────────────────

function SidebarBottom({
	user,
	activeCity,
	collapsed,
	onLogout,
}: {
	user: { email: string; role: string };
	activeCity: string | null;
	collapsed: boolean;
	onLogout: () => void;
}) {
	return (
		<div className="border-t border-line px-2 py-2 space-y-0.5 shrink-0">
			{activeCity && (
				<div
					title={collapsed ? activeCity : undefined}
					className={[
						"flex items-center gap-2 px-3 py-2 text-ink-3 text-xs",
						collapsed ? "justify-center" : "",
					].join(" ")}
				>
					<span className="w-[14px] h-[14px] shrink-0">{Icons.mapPin}</span>
					{!collapsed && <span className="truncate">{activeCity}</span>}
				</div>
			)}

			{!collapsed && (
				<div className="px-3 py-1.5">
					<p className="text-xs text-ink-2 truncate">{user.email}</p>
					<p className="text-[10px] text-ink-3 capitalize mt-0.5">{user.role}</p>
				</div>
			)}

			<button
				onClick={onLogout}
				title={collapsed ? "Cerrar sesion" : undefined}
				className={[
					"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
					"text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors",
					collapsed ? "justify-center" : "",
				].join(" ")}
			>
				<span className="w-[18px] h-[18px] shrink-0">{Icons.logout}</span>
				{!collapsed && <span>Cerrar sesion</span>}
			</button>
		</div>
	);
}

// ── Main export ──────────────────────────────────────────────────────────────

type Props = {
	user: { email: string; role: string };
	activeCity: string | null;
};

export default function AdminSidebar({ user, activeCity }: Props) {
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	const items = NAV.filter((n) => !n.ownerOnly || user.role === "owner");

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		window.location.href = "/login";
	};

	return (
		<>
			{/* ── Desktop sidebar ──────────────────────────────────────────────── */}
			<aside
				className={[
					"hidden md:flex flex-col h-screen bg-surface border-r border-line",
					"sticky top-0 shrink-0 transition-[width] duration-300 overflow-hidden",
					collapsed ? "w-[72px]" : "w-60",
				].join(" ")}
			>
				{/* Logo + collapse toggle */}
				<div className="flex items-center px-3 py-4 border-b border-line shrink-0 min-h-[60px]">
					{!collapsed && (
						<Link
							href="/admin"
							className="font-display font-black text-xl text-ink uppercase tracking-tight flex-1 min-w-0 truncate"
						>
							Talacha<span className="text-brand">Stats</span>
						</Link>
					)}
					{collapsed && (
						<Link href="/admin" className="mx-auto">
							<img src="/logo-icon.svg" alt="TalachaStats" className="w-7 h-7" />
						</Link>
					)}
					<button
						onClick={() => setCollapsed((c) => !c)}
						aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
						className={[
							"p-1.5 rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors shrink-0",
							collapsed ? "hidden" : "ml-auto",
						].join(" ")}
					>
						<span className="w-[18px] h-[18px] block">{Icons.chevronLeft}</span>
					</button>
				</div>

				<NavLinks items={items} collapsed={collapsed} pathname={pathname} />

				<SidebarBottom
					user={user}
					activeCity={activeCity}
					collapsed={collapsed}
					onLogout={handleLogout}
				/>
			</aside>

			{/* ── Mobile top bar ───────────────────────────────────────────────── */}
			<div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface border-b border-line flex items-center px-4">
				<button
					onClick={() => setMobileOpen(true)}
					aria-label="Abrir menu"
					className="p-1.5 rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink transition mr-3"
				>
					<span className="w-5 h-5 block">{Icons.menu}</span>
				</button>
				<Link
					href="/admin"
					className="font-display font-black text-xl text-ink uppercase tracking-tight"
				>
					Talacha<span className="text-brand">Stats</span>
				</Link>
			</div>

			{/* ── Mobile drawer + overlay ──────────────────────────────────────── */}
			{mobileOpen && (
				<div
					className="md:hidden fixed inset-0 z-40 bg-black/50"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			<div
				className={[
					"md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-surface border-r border-line",
					"transition-transform duration-300",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
				].join(" ")}
			>
				{/* Drawer header */}
				<div className="flex items-center justify-between px-4 py-4 border-b border-line shrink-0 min-h-[60px]">
					<Link
						href="/admin"
						className="font-display font-black text-xl text-ink uppercase tracking-tight"
						onClick={() => setMobileOpen(false)}
					>
						Talacha<span className="text-brand">Stats</span>
					</Link>
					<button
						onClick={() => setMobileOpen(false)}
						aria-label="Cerrar menu"
						className="p-1.5 rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink transition"
					>
						<span className="w-5 h-5 block">{Icons.x}</span>
					</button>
				</div>

				<NavLinks
					items={items}
					collapsed={false}
					pathname={pathname}
					onNavigate={() => setMobileOpen(false)}
				/>

				<SidebarBottom
					user={user}
					activeCity={activeCity}
					collapsed={false}
					onLogout={handleLogout}
				/>
			</div>
		</>
	);
}
