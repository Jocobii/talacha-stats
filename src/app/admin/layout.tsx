import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getActiveCity } from "@/shared/lib/active-city";
import { getSessionUser } from "@/shared/lib/auth";
import CitySwitcher from "./CitySwitcher";
import LogoutButton from "./LogoutButton";
import TrialBanner from "./TrialBanner";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const [activeCity, user] = await Promise.all([getActiveCity(), getSessionUser()]);

	// Second line of defense — middleware already checked cookie presence,
	// but full HMAC verification and DB lookup happen here.
	if (!user) redirect("/login");

	// Organizers must complete onboarding before accessing the admin panel.
	// Owners (superadmins) are exempt — they manage all orgs.
	if (user.role === "organizer" && !user.organizationId) redirect("/onboarding");

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-green-700 text-white shadow-md">
				<div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-1">
					<Link href="/admin" className="font-bold text-base tracking-tight shrink-0 mr-2">
						TalachaStats
					</Link>

					<div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1">
						<Link
							href="/admin/organizations"
							className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition"
						>
							Organizaciones
						</Link>
						<Link
							href="/admin/leagues"
							className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition"
						>
							Ligas
						</Link>
						<Link
							href="/admin/teams"
							className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition"
						>
							Equipos
						</Link>
						<Link
							href="/admin/players"
							className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition"
						>
							Jugadores
						</Link>
						<Link
							href="/admin/import"
							className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition"
						>
							Importar
						</Link>
						<Link
							href="/admin/analisis"
							className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg shrink-0 transition"
						>
							📊 Análisis
						</Link>
						{user.role === "owner" && (
							<Link
								href="/admin/users"
								className="hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg shrink-0 transition"
							>
								👥 Usuarios
							</Link>
						)}
					</div>

					<div className="shrink-0 ml-2 flex items-center gap-3">
						<CitySwitcher activeCity={activeCity} />
						<div className="hidden sm:flex items-center gap-2 border-l border-white/20 pl-3">
							<span className="text-xs text-white/70 truncate max-w-[120px]" title={user.email}>
								{user.email}
							</span>
						</div>
						<LogoutButton />
					</div>
				</div>
			</nav>
			<TrialBanner user={user} />
			<main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
		</div>
	);
}
